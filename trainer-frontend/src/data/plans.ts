import { addDays, mondayOf, toKey } from '@/utils/date'
import type { WorkoutLocation } from '@/data'

export type PlanId = 'rebuild' | 'build' | 'custom'

export interface PlanInfo {
  id: PlanId
  name: string
  tagline: string
  description: string
  /** Description when the plan is set up without runs */
  descriptionNoRuns?: string
}

export const PLANS: PlanInfo[] = [
  {
    id: 'rebuild',
    name: 'Rebuild',
    tagline: 'Coming back after a break',
    description: '8 weeks: easy full-body sessions and run/walk intervals, then split workouts. Continues as Build.',
    descriptionNoRuns: '4 weeks: four easy strength days and a weekly cardio session, then 4 lighter base weeks. Continues as Build.',
  },
  {
    id: 'build',
    name: 'Build',
    tagline: 'Already training consistently',
    description: 'Chest / legs / back in the gym (or push / pull / legs at home), two easy runs and a weekly long run, with an easier week every 4th week.',
    descriptionNoRuns: 'Five days: chest / back / legs / shoulders / arms in the gym (or push / pull / legs / core / arms at home) and a weekly cardio session, with an easier week every 4th week.',
  },
  {
    id: 'custom',
    name: 'Custom',
    tagline: 'Plan it yourself',
    description: 'Start with an empty calendar and add workouts, runs and rest days yourself.',
  },
]

/** Run/walk intervals. A continuous run is one repeat with walkSeconds 0. */
export interface JogSpec {
  runSeconds: number
  walkSeconds: number
  repeats: number
}

export type EntryType = 'workout' | 'jog' | 'rest'

export interface CalendarEntry {
  id: string
  /** "YYYY-MM-DD" */
  date: string
  type: EntryType
  workoutId?: string
  jog?: JogSpec
  /** Manually marked done (jogs; workouts also auto-complete from history) */
  done?: boolean
  /** Logged run time in minutes */
  doneMinutes?: number
}

export function jogMinutes(j: JogSpec): number {
  return Math.round(((j.runSeconds + j.walkSeconds) * j.repeats) / 60)
}

export function jogLabel(j: JogSpec): string {
  if (j.walkSeconds === 0 && j.repeats === 1) return `Easy run · ${Math.round(j.runSeconds / 60)} min`
  const fmt = (s: number) => (s % 60 === 0 ? `${s / 60} min` : `${s}s`)
  return `Run ${fmt(j.runSeconds)} / walk ${fmt(j.walkSeconds)} × ${j.repeats}`
}

const continuous = (minutes: number): JogSpec => ({ runSeconds: minutes * 60, walkSeconds: 0, repeats: 1 })

/** Rebuild weeks 0–7: run/walk progression → 20 min continuous, via 10 min blocks so the last step isn't a jump */
function rebuildJog(week: number, long: boolean): JogSpec {
  if (week < 2) return { runSeconds: 60, walkSeconds: 120, repeats: long ? 10 : 8 }
  if (week < 4) return { runSeconds: 120, walkSeconds: 60, repeats: long ? 10 : 8 }
  if (week < 6) return { runSeconds: 300, walkSeconds: 60, repeats: long ? 5 : 4 }
  if (week < 7) return { runSeconds: long ? 720 : 600, walkSeconds: 60, repeats: 2 }
  return continuous(long ? 25 : 20)
}

/** Rebuild length: the run/walk progression needs 8 weeks; without runs, strength comes back faster */
const REBUILD_WEEKS = 8
const REBUILD_WEEKS_NO_RUNS = 4
export const WEEKS_PER_BLOCK = 12

function rebuildWeeks(plan: PlanId, includeRuns: boolean): number {
  if (plan !== 'rebuild') return 0
  return includeRuns ? REBUILD_WEEKS : REBUILD_WEEKS_NO_RUNS
}

/** Coming from Rebuild, the gym plan spends its first Build weeks on the Base workouts before the A/B rotation */
const BASE_WEEKS = 4
/** Every 4th Build week is an easier week: shorter runs and fewer working sets */
const EASY_WEEK_EVERY = 4
const EASY_WEEK_MAX_SETS = 2
const LONG_RUN_MAX = 60

function isEasyWeek(buildWeek: number): boolean {
  return buildWeek >= 0 && (buildWeek + 1) % EASY_WEEK_EVERY === 0
}

/**
 * Build: 30 min easy runs (25 min while still on the Base workouts after Rebuild).
 * The long run grows 2 min a week up to an hour; easy weeks cut every run back.
 */
function buildJog(week: number, long: boolean, fromRebuild: boolean): JogSpec {
  const easyWeek = isEasyWeek(week)
  if (!long) return continuous(easyWeek ? 20 : fromRebuild && week < BASE_WEEKS ? 25 : 30)
  const start = fromRebuild ? 28 : 35
  const minutes = Math.min(LONG_RUN_MAX, start + week * 2)
  return continuous(easyWeek ? Math.max(start, minutes - 10) : minutes)
}

/** Strength workouts for Mon / Wed / Fri (each day may have more than one) */
function rebuildStrength(week: number, location: WorkoutLocation): string[][] {
  if (location === 'home') {
    if (week < 4) return [['w1'], ['w1'], week >= 2 ? ['w1', 'w5'] : ['w1']]
    return [['w2'], ['w3'], ['w4']]
  }
  if (week < 4) return week % 2 === 0 ? [['gym6'], ['gym7'], ['gym6']] : [['gym7'], ['gym6'], ['gym7']]
  // lower body midweek only, so it never lands just before the Sunday long run
  return [['gym8'], ['gym9'], ['gym8']]
}

/** Mon chest · Wed legs (furthest from the Sunday long run) · Fri back */
function buildStrength(week: number, location: WorkoutLocation, fromRebuild: boolean): string[][] {
  if (location === 'home') {
    // every other week, swap pull day for a circuit: arms (W6) or conditioning (W9)
    const wed = week % 4 === 1 ? 'w6' : week % 4 === 3 ? 'w9' : 'w3'
    return [['w2'], [wed], ['w4']]
  }
  const [mon, wed, fri] = fromRebuild && week < BASE_WEEKS
    ? ['gym11', 'gym13', 'gym12']
    : isWeekA(week, fromRebuild) ? ['gym2', 'gym4', 'gym1'] : ['gym10', 'gym5', 'gym3']
  // easy weeks have time to spare: a short arm add-on after chest and back day
  const pump = isEasyWeek(week) ? ['gym20'] : []
  return [[mon, ...pump], [wed], [fri, ...pump]]
}

/**
 * A = heavy (Chest A, Legs A, …), B = lighter and higher-rep (Chest B, Legs B, …).
 * An easy week repeats the previous rotation week, so easy weeks alternate between A and B.
 */
function isWeekA(week: number, fromRebuild: boolean): boolean {
  const easyWeeks = (w: number) => Math.floor((w + 1) / EASY_WEEK_EVERY)
  const firstHardWeek = fromRebuild ? BASE_WEEKS : 0
  const rotation = week - firstHardWeek - (easyWeeks(week) - easyWeeks(firstHardWeek - 1))
  return rotation % 2 === 0
}

/** Without runs, Rebuild (4 weeks): strength Mon / Tue / Thu / Fri, two weeks full body then two weeks split */
function rebuildStrengthNoRuns(week: number, location: WorkoutLocation): string[][] {
  if (location === 'home') {
    if (week < 2) return [['w1'], ['w3'], ['w1'], ['w5']]
    return [['w2'], ['w4'], ['w3'], ['w7']]
  }
  if (week < 2) return [['gym6'], ['gym7'], ['gym6'], ['gym7']]
  return [['gym8'], ['gym9'], ['gym8'], ['gym9']]
}

/** Without runs, Build: Mon chest · Tue back · Wed legs · Thu shoulders · Fri arms */
function buildStrengthNoRuns(week: number, location: WorkoutLocation, fromRebuild: boolean): string[][] {
  if (location === 'home') return [['w2'], ['w3'], ['w4'], ['w7'], ['w6']]
  // Base weeks after Rebuild: the lighter B shoulder and arm days
  if (fromRebuild && week < BASE_WEEKS) return [['gym11'], ['gym12'], ['gym13'], ['gym15'], ['gym17']]
  return isWeekA(week, fromRebuild)
    ? [['gym2'], ['gym1'], ['gym4'], ['gym14'], ['gym16']]
    : [['gym10'], ['gym3'], ['gym5'], ['gym15'], ['gym17']]
}

/**
 * Without runs, the Saturday cardio: steady during Rebuild, the Base weeks after it, easy weeks and heavy A weeks;
 * intervals on lighter B weeks
 */
function cardioWorkout(location: WorkoutLocation, inRebuild: boolean, buildWeek: number, fromRebuild: boolean): string {
  const steady = location === 'home' ? 'w11' : 'gym18'
  const hard = location === 'home' ? 'w9' : 'gym19'
  const soft = inRebuild || (fromRebuild && buildWeek < BASE_WEEKS) || isEasyWeek(buildWeek)
  return soft || isWeekA(buildWeek, fromRebuild) ? steady : hard
}

export type DayKind = 'Strength' | 'Run' | 'Long run' | 'Cardio' | 'Rest'

/** The weekly rhythm (Mon → Sun) of a plan, for previews */
export function weekLayout(plan: PlanId, includeRuns: boolean): DayKind[] {
  if (includeRuns) return ['Strength', 'Run', 'Strength', 'Run', 'Strength', 'Rest', 'Long run']
  if (plan === 'rebuild') return ['Strength', 'Strength', 'Rest', 'Strength', 'Strength', 'Cardio', 'Rest']
  return ['Strength', 'Strength', 'Strength', 'Strength', 'Strength', 'Cardio', 'Rest']
}

/** Plan week (0-based) a "YYYY-MM-DD" date falls in; week 0 contains startDate */
export function planWeekOf(startDate: string, date: string): number {
  const first = mondayOf(new Date(startDate + 'T00:00:00'))
  const monday = mondayOf(new Date(date + 'T00:00:00'))
  // round: a week across a DST change isn't exactly 7 × 24 h
  return Math.round((monday.getTime() - first.getTime()) / (7 * 86_400_000))
}

/**
 * Plan week for a date once "Catch me up" has skipped some calendar weeks:
 * every skipped week before the date pushes the plan back one week.
 */
export function planWeekAt(startDate: string, date: string, skippedWeeks: number[] = []): number {
  const calendarWeek = planWeekOf(startDate, date)
  return calendarWeek - skippedWeeks.filter(w => w < calendarWeek).length
}

/** Working-set cap for strength sessions on a date (the Build easy weeks), else undefined */
export function setCapOn(
  plan: PlanId, startDate: string, date: string, skippedWeeks: number[] = [], includeRuns = true,
): number | undefined {
  if (plan === 'custom') return undefined
  const week = planWeekAt(startDate, date, skippedWeeks)
  const buildWeek = week - rebuildWeeks(plan, includeRuns)
  return isEasyWeek(buildWeek) ? EASY_WEEK_MAX_SETS : undefined
}

/**
 * Generates calendar entries for plan weeks [fromWeek, toWeek).
 * Week 0 is the week containing startDate; days before startDate are skipped.
 * With runs: Mon/Wed/Fri strength · Tue/Thu run · Sat rest · Sun long run.
 * Without runs: Rebuild Mon/Tue/Thu/Fri strength, Build Mon–Fri strength · Sat cardio · rest the other days.
 */
export function generatePlan(
  plan: PlanId,
  location: WorkoutLocation,
  startDate: string,
  fromWeek: number,
  toWeek: number,
  /** Calendar weeks the plan runs behind after "Catch me up" skipped missed weeks */
  weekOffset = 0,
  includeRuns = true,
): CalendarEntry[] {
  if (plan === 'custom') return []
  const entries: CalendarEntry[] = []
  const firstMonday = mondayOf(new Date(startDate + 'T00:00:00'))

  for (let week = fromWeek; week < toWeek; week++) {
    const buildWeek = week - rebuildWeeks(plan, includeRuns)
    const inRebuild = buildWeek < 0
    const fromRebuild = plan === 'rebuild'

    const monday = addDays(firstMonday, (week + weekOffset) * 7)
    const day = (offset: number) => toKey(addDays(monday, offset))
    const add = (offset: number, e: Omit<CalendarEntry, 'id' | 'date'>) => {
      const date = day(offset)
      if (date >= startDate) entries.push({ id: crypto.randomUUID(), date, ...e })
    }

    if (!includeRuns) {
      const strength = inRebuild
        ? rebuildStrengthNoRuns(week, location)
        : buildStrengthNoRuns(buildWeek, location, fromRebuild)
      const strengthDays = inRebuild ? [0, 1, 3, 4] : [0, 1, 2, 3, 4]
      strengthDays.forEach((offset, i) =>
        strength[i]!.forEach(workoutId => add(offset, { type: 'workout', workoutId })))
      add(5, { type: 'workout', workoutId: cardioWorkout(location, inRebuild, buildWeek, fromRebuild) })
      for (let offset = 0; offset < 7; offset++) {
        if (offset !== 5 && !strengthDays.includes(offset)) add(offset, { type: 'rest' })
      }
      continue
    }

    const strength = inRebuild ? rebuildStrength(week, location) : buildStrength(buildWeek, location, fromRebuild)
    const jog = (long: boolean) => (inRebuild ? rebuildJog(week, long) : buildJog(buildWeek, long, fromRebuild))
    ;[0, 2, 4].forEach((offset, i) =>
      strength[i]!.forEach(workoutId => add(offset, { type: 'workout', workoutId })))
    add(1, { type: 'jog', jog: jog(false) })
    add(3, { type: 'jog', jog: jog(false) })
    add(5, { type: 'rest' })
    add(6, { type: 'jog', jog: jog(true) })
  }
  return entries
}
