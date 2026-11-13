import { addDays, mondayOf, toKey } from '@/utils/date'
import type { WorkoutLocation } from '@/data'

export type PlanId = 'rebuild' | 'build' | 'custom'

export interface PlanInfo {
  id: PlanId
  name: string
  tagline: string
  description: string
}

export const PLANS: PlanInfo[] = [
  {
    id: 'rebuild',
    name: 'Rebuild',
    tagline: 'Coming back after a break',
    description: '8 weeks: easy full-body sessions and run/walk intervals, then split workouts. Continues as Build.',
  },
  {
    id: 'build',
    name: 'Build',
    tagline: 'Already training consistently',
    description: 'Push / pull / legs (or the full gym rotation), easy runs and a weekly long run.',
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

/** Rebuild weeks 0–7: run/walk progression → 20 min continuous */
function rebuildJog(week: number, long: boolean): JogSpec {
  if (week < 2) return { runSeconds: 60, walkSeconds: 120, repeats: long ? 10 : 8 }
  if (week < 4) return { runSeconds: 120, walkSeconds: 60, repeats: long ? 10 : 8 }
  if (week < 6) return { runSeconds: 300, walkSeconds: 60, repeats: long ? 5 : 4 }
  return continuous(long ? 25 : 20)
}

/** Build: 25 min easy runs, long run grows from 35 to 45 min */
function buildJog(week: number, long: boolean): JogSpec {
  return continuous(long ? Math.min(45, 35 + week * 2) : 25)
}

/** Strength workouts for Mon / Wed / Fri (each day may have more than one) */
function rebuildStrength(week: number, location: WorkoutLocation): string[][] {
  if (location === 'home') {
    if (week < 4) return [['w1'], ['w1'], week >= 2 ? ['w1', 'w5'] : ['w1']]
    return [['w2'], ['w3'], ['w4']]
  }
  if (week < 4) return week % 2 === 0 ? [['gym6'], ['gym7'], ['gym6']] : [['gym7'], ['gym6'], ['gym7']]
  return week % 2 === 0 ? [['gym8'], ['gym9'], ['gym8']] : [['gym9'], ['gym8'], ['gym9']]
}

function buildStrength(week: number, location: WorkoutLocation): string[][] {
  if (location === 'home') {
    // every other week, swap pull day for a circuit: arms (W6) or conditioning (W9)
    const wed = week % 4 === 1 ? 'w6' : week % 4 === 3 ? 'w9' : 'w3'
    return [['w2'], [wed], ['w4']]
  }
  return week % 2 === 0 ? [['gym2'], ['gym1'], ['gym4']] : [['gym3'], ['gym2'], ['gym5']]
}

const REBUILD_WEEKS = 8
export const WEEKS_PER_BLOCK = 12

/** Rebuild hands over to Build gently: for the first Build weeks every exercise is capped at a few working sets */
const BUILD_INTRO_WEEKS = 2
const BUILD_INTRO_MAX_SETS = 3

/** Plan week (0-based) a "YYYY-MM-DD" date falls in; week 0 contains startDate */
export function planWeekOf(startDate: string, date: string): number {
  const first = mondayOf(new Date(startDate + 'T00:00:00'))
  const monday = mondayOf(new Date(date + 'T00:00:00'))
  // round: a week across a DST change isn't exactly 7 × 24 h
  return Math.round((monday.getTime() - first.getTime()) / (7 * 86_400_000))
}

/** Working-set cap for strength sessions on a date (the Rebuild → Build ease-in weeks), else undefined */
export function setCapOn(plan: PlanId, startDate: string, date: string): number | undefined {
  if (plan !== 'rebuild') return undefined
  const buildWeek = planWeekOf(startDate, date) - REBUILD_WEEKS
  return buildWeek >= 0 && buildWeek < BUILD_INTRO_WEEKS ? BUILD_INTRO_MAX_SETS : undefined
}

/**
 * Generates calendar entries for plan weeks [fromWeek, toWeek).
 * Week 0 is the week containing startDate; days before startDate are skipped.
 * Layout: Mon/Wed/Fri strength · Tue/Thu run · Sat rest · Sun long run.
 */
export function generatePlan(
  plan: PlanId,
  location: WorkoutLocation,
  startDate: string,
  fromWeek: number,
  toWeek: number,
): CalendarEntry[] {
  if (plan === 'custom') return []
  const entries: CalendarEntry[] = []
  const firstMonday = mondayOf(new Date(startDate + 'T00:00:00'))

  for (let week = fromWeek; week < toWeek; week++) {
    const inRebuild = plan === 'rebuild' && week < REBUILD_WEEKS
    const buildWeek = plan === 'rebuild' ? week - REBUILD_WEEKS : week
    const strength = inRebuild ? rebuildStrength(week, location) : buildStrength(buildWeek, location)
    const jog = (long: boolean) => (inRebuild ? rebuildJog(week, long) : buildJog(buildWeek, long))

    const monday = addDays(firstMonday, week * 7)
    const day = (offset: number) => toKey(addDays(monday, offset))
    const add = (offset: number, e: Omit<CalendarEntry, 'id' | 'date'>) => {
      const date = day(offset)
      if (date >= startDate) entries.push({ id: crypto.randomUUID(), date, ...e })
    }

    ;[0, 2, 4].forEach((offset, i) =>
      strength[i]!.forEach(workoutId => add(offset, { type: 'workout', workoutId })))
    add(1, { type: 'jog', jog: jog(false) })
    add(3, { type: 'jog', jog: jog(false) })
    add(5, { type: 'rest' })
    add(6, { type: 'jog', jog: jog(true) })
  }
  return entries
}
