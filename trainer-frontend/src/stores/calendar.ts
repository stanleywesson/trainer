import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getWorkout, type WorkoutLocation } from '@/data'
import {
  generatePlan, jogLabel, planWeekAt, planWeekOf, setCapOn as planSetCapOn, WEEKS_PER_BLOCK, type CalendarEntry, type PlanId,
} from '@/data/plans'
import { RUN_WORKOUT_ID, useHistoryStore } from '@/stores/history'
import { keepUnreadable } from '@/utils/backup'
import { addDays, fromKey, mondayOf, toKey, todayKey } from '@/utils/date'

export interface CalendarState {
  plan: PlanId
  location: WorkoutLocation
  startDate: string
  weeksGenerated: number
  entries: CalendarEntry[]
  /** Calendar weeks (0-based from startDate) that "Catch me up" skipped because nothing was trained */
  skippedWeeks?: number[]
  /** Plan includes runs; missing (calendars from before the option) means true */
  includeRuns?: boolean
}

const STORAGE_KEY = 'trainer_calendar'

export type EntryStatus = 'done' | 'missed' | 'today' | 'upcoming'

export const useCalendarStore = defineStore('calendar', () => {
  const state = ref<CalendarState | null>(null)
  const history = useHistoryStore()

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY)
    try {
      const parsed = JSON.parse(raw ?? 'null')
      if (parsed !== null && !Array.isArray(parsed?.entries)) throw new Error('not a calendar')
      state.value = parsed
    } catch {
      // set it aside first: the next save would otherwise overwrite it for good
      keepUnreadable(STORAGE_KEY, raw)
      state.value = null
    }
  }

  function persist() {
    if (state.value) localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
    else localStorage.removeItem(STORAGE_KEY)
  }

  /** First launch: no plan chosen yet */
  const needsSetup = computed(() => state.value === null)
  const entries = computed(() => state.value?.entries ?? [])

  const includeRuns = computed(() => state.value?.includeRuns !== false)

  function setup(plan: PlanId, location: WorkoutLocation, startDate: string, runs = true) {
    state.value = {
      plan,
      location,
      startDate,
      weeksGenerated: plan === 'custom' ? 0 : WEEKS_PER_BLOCK,
      entries: generatePlan(plan, location, startDate, 0, WEEKS_PER_BLOCK, 0, runs),
      includeRuns: runs,
    }
    persist()
  }

  function reset() {
    state.value = null
    persist()
  }

  /** Add the next 12 weeks of the plan */
  function extend() {
    const s = state.value
    if (!s || s.plan === 'custom') return
    const from = s.weeksGenerated
    const offset = s.skippedWeeks?.length ?? 0
    s.entries.push(...generatePlan(s.plan, s.location, s.startDate, from, from + WEEKS_PER_BLOCK, offset, includeRuns.value))
    s.weeksGenerated = from + WEEKS_PER_BLOCK
    persist()
  }

  /**
   * "Catch me up": past days stay as they are (done or missed). Whole calendar weeks with no training
   * are skipped so the plan picks up where you left off, and everything from today on is rebuilt
   * from the current plan. Entries added by hand to upcoming days are replaced.
   * Returns how many weeks the plan moved back.
   */
  function catchUp(): number {
    const s = state.value
    if (!s || s.plan === 'custom') return 0
    const today = todayKey()
    const cutoff = rebuildCutoff()

    // finished calendar weeks (before this one) without a single workout or run
    const thisWeek = planWeekOf(s.startDate, today)
    const firstMonday = mondayOf(fromKey(s.startDate))
    const skipped: number[] = []
    for (let week = 0; week < thisWeek; week++) {
      const monday = addDays(firstMonday, week * 7)
      const trained = [0, 1, 2, 3, 4, 5, 6].some(d => activeDays.value.has(toKey(addDays(monday, d))))
      if (!trained) skipped.push(week)
    }
    const oldOffset = s.skippedWeeks?.length ?? 0
    const offset = skipped.length

    const fromWeek = Math.max(0, planWeekAt(s.startDate, cutoff, skipped))
    // keep the calendar filled as far ahead as before
    const toWeek = Math.max(fromWeek + 4, s.weeksGenerated + oldOffset - offset)

    s.entries = s.entries.filter(e => e.date < cutoff || isDone(e))
    s.entries.push(...generatePlan(s.plan, s.location, s.startDate, fromWeek, toWeek, offset, includeRuns.value)
      .filter(e => e.date >= cutoff))
    s.skippedWeeks = skipped
    s.weeksGenerated = toWeek
    persist()
    return offset - oldOffset
  }

  /** First day a rebuild may replace: today, or tomorrow once something was trained today */
  function rebuildCutoff(): string {
    const today = todayKey()
    return entriesOn(today).some(isDone) || activeDays.value.has(today)
      ? toKey(addDays(fromKey(today), 1))
      : today
  }

  /**
   * Change runs or location mid-plan. You stay in the same plan week: past days stay as they are and
   * everything from today on is rebuilt (entries added by hand to upcoming days are replaced).
   */
  function changeSettings(patch: { includeRuns?: boolean, location?: WorkoutLocation }) {
    const s = state.value
    if (!s || s.plan === 'custom') return
    Object.assign(s, patch)
    const cutoff = rebuildCutoff()
    const offset = s.skippedWeeks?.length ?? 0
    const fromWeek = Math.max(0, planWeekAt(s.startDate, cutoff, s.skippedWeeks))
    const toWeek = Math.max(fromWeek + 4, s.weeksGenerated)
    s.entries = s.entries.filter(e => e.date < cutoff || isDone(e))
    s.entries.push(...generatePlan(s.plan, s.location, s.startDate, fromWeek, toWeek, offset, includeRuns.value)
      .filter(e => e.date >= cutoff))
    s.weeksGenerated = toWeek
    persist()
  }

  function setIncludeRuns(on: boolean) {
    if (includeRuns.value !== on) changeSettings({ includeRuns: on })
  }

  function setLocation(location: WorkoutLocation) {
    if (state.value && state.value.location !== location) changeSettings({ location })
  }

  /** Last planned day, used to offer "Extend plan" near the end */
  const lastDate = computed(() =>
    entries.value.reduce<string | null>((max, e) => (max === null || e.date > max ? e.date : max), null))

  function addEntry(entry: Omit<CalendarEntry, 'id'>) {
    if (!state.value) return
    state.value.entries.push({ id: crypto.randomUUID(), ...entry })
    persist()
  }

  function updateEntry(id: string, patch: Partial<Omit<CalendarEntry, 'id'>>) {
    const e = state.value?.entries.find(x => x.id === id)
    if (!e) return
    Object.assign(e, patch)
    persist()
  }

  /** Max working sets per exercise for a strength session on this date (easy weeks), else undefined */
  function setCapOn(date: string): number | undefined {
    const s = state.value
    return s ? planSetCapOn(s.plan, s.startDate, date, s.skippedWeeks, includeRuns.value) : undefined
  }

  function removeEntry(id: string) {
    if (!state.value) return
    // deleting a planned run from the calendar doesn't erase the run you actually did:
    // the history record stays, just unlinked
    history.unlinkRun(id)
    state.value.entries = state.value.entries.filter(e => e.id !== id)
    persist()
  }

  /** Logged sessions are dated on their calendar day (now if that's today, else midday) so history and streaks agree */
  function sessionDateFor(day: string | undefined): string {
    return !day || day === todayKey()
      ? new Date().toISOString()
      : new Date(fromKey(day).getTime() + 12 * 3600_000).toISOString()
  }

  /** Log a "log"-format workout (e.g. a brisk walk) done on a calendar day; it then shows as done there */
  function logSession(workoutId: string, day: string, minutes: number, distanceKm?: number | null) {
    const workout = getWorkout(workoutId)
    if (!workout) return
    history.saveWorkout({
      kind: 'workout',
      workoutId,
      workoutName: workout.name,
      durationSeconds: minutes * 60,
      difficulty: 0,
      completedExercises: workout.exercises.length,
      ...(distanceKm ? { distanceKm } : {}),
    }, sessionDateFor(day))
  }

  /** The session logged for a "log"-format workout on a calendar day, if any */
  function loggedSession(workoutId: string, day: string) {
    return history.workouts.find(w => w.workoutId === workoutId && toKey(new Date(w.date)) === day)
  }

  /** Un-log a "log"-format workout: removes its history record, so the calendar day is open again */
  function undoSession(workoutId: string, day: string) {
    const session = loggedSession(workoutId, day)
    if (session) history.removeWorkout(session.id)
  }

  function addRunToHistory(entryId: string, minutes: number, distanceKm?: number | null) {
    const entry = state.value?.entries.find(e => e.id === entryId)
    const date = sessionDateFor(entry?.date)
    history.saveWorkout({
      kind: 'run',
      calendarEntryId: entryId,
      workoutId: RUN_WORKOUT_ID,
      workoutName: 'Run',
      durationSeconds: minutes * 60,
      difficulty: 0,
      completedExercises: 0,
      ...(distanceKm ? { distanceKm } : {}),
      ...(entry?.jog ? { plannedRun: jogLabel(entry.jog) } : {}),
    }, date)
  }

  /** Mark a planned run done and record it in history */
  function logRun(entryId: string, minutes: number, distanceKm?: number | null) {
    const existing = history.runFor(entryId)
    if (existing) history.removeWorkout(existing.id)
    updateEntry(entryId, { done: true, doneMinutes: minutes })
    addRunToHistory(entryId, minutes, distanceKm)
  }

  /** Un-log a run: clears the calendar tick and its history record */
  function undoRun(entryId: string) {
    const existing = history.runFor(entryId)
    if (existing) history.removeWorkout(existing.id)
    updateEntry(entryId, { done: false, doneMinutes: undefined })
  }

  /** Delete a history session; a run also un-ticks its calendar entry */
  function deleteSession(sessionId: string) {
    const session = history.getById(sessionId)
    if (!session) return
    history.removeWorkout(sessionId)
    if (session.kind === 'run' && session.calendarEntryId) {
      updateEntry(session.calendarEntryId, { done: false, doneMinutes: undefined })
    }
  }

  /** How a backup's calendar relates to this one. 'different' = another plan, so merging would double it up */
  function importMode(incoming: CalendarState | null): 'none' | 'restore' | 'merge' | 'different' {
    if (!incoming) return 'none'
    if (!state.value?.entries.length) return 'restore'
    const ids = new Set(state.value.entries.map(e => e.id))
    if (incoming.entries.some(e => ids.has(e.id))) return 'merge'
    return incoming.entries.length ? 'different' : 'none'
  }

  function importCalendar(incoming: CalendarState | null, replaceDifferent: boolean) {
    const mode = importMode(incoming)
    if (!incoming || mode === 'none' || (mode === 'different' && !replaceDifferent)) return
    const current = state.value
    if (mode === 'merge' && current) {
      const byId = new Map(current.entries.map(e => [e.id, e]))
      for (const e of incoming.entries) {
        const local = byId.get(e.id)
        if (!local) {
          current.entries.push(e)
        } else if (e.done && !local.done) {
          local.done = true
          local.doneMinutes = e.doneMinutes
        }
      }
      current.weeksGenerated = Math.max(current.weeksGenerated, incoming.weeksGenerated)
      if (incoming.skippedWeeks?.length && (incoming.skippedWeeks.length > (current.skippedWeeks?.length ?? 0))) {
        current.skippedWeeks = incoming.skippedWeeks
      }
    } else {
      state.value = incoming
    }
    persist()
  }

  /** Runs logged before history tracked runs: add them to history once */
  function backfillRuns() {
    for (const e of entries.value) {
      if (e.type === 'jog' && e.done && e.doneMinutes && !history.runFor(e.id)) {
        addRunToHistory(e.id, e.doneMinutes)
      }
    }
  }

  function entriesOn(date: string): CalendarEntry[] {
    const order = { workout: 0, jog: 1, rest: 2 }
    return entries.value.filter(e => e.date === date).sort((a, b) => order[a.type] - order[b.type])
  }

  /** Workout ids finished per day, from history */
  const finishedByDay = computed(() => {
    const map = new Map<string, Set<string>>()
    for (const w of history.workouts) {
      const day = toKey(new Date(w.date))
      if (!map.has(day)) map.set(day, new Set())
      map.get(day)!.add(w.workoutId)
    }
    return map
  })

  function isDone(e: CalendarEntry): boolean {
    if (e.done) return true
    if (e.type === 'workout') return !!e.workoutId && !!finishedByDay.value.get(e.date)?.has(e.workoutId)
    return false
  }

  function status(e: CalendarEntry): EntryStatus {
    if (isDone(e)) return 'done'
    const today = todayKey()
    if (e.date === today) return 'today'
    if (e.date < today) return e.type === 'rest' ? 'done' : 'missed'
    return 'upcoming'
  }

  /** Days with a finished workout or a logged run, for the streak */
  const activeDays = computed(() => {
    const days = new Set(finishedByDay.value.keys())
    for (const e of entries.value) if (e.type === 'jog' && e.done) days.add(e.date)
    return days
  })

  /** Consecutive days with training, counting back from today. Rest days and today (if not done yet) don't break it. */
  const streak = computed(() => {
    let count = 0
    let d = new Date()
    if (!activeDays.value.has(toKey(d))) d = fromKey(toKey(new Date(d.getTime() - 86400000)))
    for (let guard = 0; guard < 3650; guard++) {
      const key = toKey(d)
      const isRest = entriesOn(key).some(e => e.type === 'rest')
      if (activeDays.value.has(key)) count++
      else if (!isRest) break
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
    }
    return count
  })

  load()
  backfillRuns()

  return {
    state, needsSetup, entries, lastDate, streak, includeRuns,
    setup, reset, extend, catchUp, setIncludeRuns, setLocation, addEntry, updateEntry, removeEntry, entriesOn, isDone, status, setCapOn,
    logRun, undoRun, logSession, loggedSession, undoSession, deleteSession, importMode, importCalendar,
  }
})
