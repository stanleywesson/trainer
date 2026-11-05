import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { WorkoutLocation } from '@/data'
import { generatePlan, jogLabel, WEEKS_PER_BLOCK, type CalendarEntry, type PlanId } from '@/data/plans'
import { RUN_WORKOUT_ID, useHistoryStore } from '@/stores/history'
import { fromKey, toKey, todayKey } from '@/utils/date'

interface CalendarState {
  plan: PlanId
  location: WorkoutLocation
  startDate: string
  weeksGenerated: number
  entries: CalendarEntry[]
}

const STORAGE_KEY = 'trainer_calendar'

export type EntryStatus = 'done' | 'missed' | 'today' | 'upcoming'

export const useCalendarStore = defineStore('calendar', () => {
  const state = ref<CalendarState | null>(null)
  const history = useHistoryStore()

  function load() {
    try {
      state.value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    } catch {
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

  function setup(plan: PlanId, location: WorkoutLocation, startDate: string) {
    state.value = {
      plan,
      location,
      startDate,
      weeksGenerated: plan === 'custom' ? 0 : WEEKS_PER_BLOCK,
      entries: generatePlan(plan, location, startDate, 0, WEEKS_PER_BLOCK),
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
    s.entries.push(...generatePlan(s.plan, s.location, s.startDate, from, from + WEEKS_PER_BLOCK))
    s.weeksGenerated = from + WEEKS_PER_BLOCK
    persist()
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

  function removeEntry(id: string) {
    if (!state.value) return
    // deleting a planned run from the calendar doesn't erase the run you actually did:
    // the history record stays, just unlinked
    history.unlinkRun(id)
    state.value.entries = state.value.entries.filter(e => e.id !== id)
    persist()
  }

  /** Runs are dated on their calendar day (now if that's today, else midday) so history and streaks agree */
  function addRunToHistory(entryId: string, minutes: number, distanceKm?: number | null) {
    const entry = state.value?.entries.find(e => e.id === entryId)
    const day = entry?.date
    const date = !day || day === todayKey()
      ? new Date().toISOString()
      : new Date(fromKey(day).getTime() + 12 * 3600_000).toISOString()
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
    state, needsSetup, entries, lastDate, streak,
    setup, reset, extend, addEntry, updateEntry, removeEntry, entriesOn, isDone, status,
    logRun, undoRun, deleteSession,
  }
})
