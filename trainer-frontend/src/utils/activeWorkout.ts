import type { LocationQuery } from 'vue-router'

/**
 * The workout in progress, saved after every change so it survives the phone reloading or closing the app.
 * Cleared once the session is saved to history, or abandoned with Finish Early / Discard.
 */
export interface ActiveWorkout {
  workoutId: string
  /** The route query the workout was started with (holds the calendar date) */
  query: LocationQuery
  sessionDate: string
  startTime: number
  savedAt: number
  /** Order of the blocks, as indices into the planned exercises (changes when exercises are swapped) */
  blocks: number[][]
  currentBlock: number
  completed: number[]
  weights: (number | null)[][]
  repsDone: (number | null)[][]
}

const KEY = 'trainer_active_workout'
/** Older than this, it's not a workout anyone is coming back to */
const RESUME_HOURS = 12

export function loadActiveWorkout(now = Date.now()): ActiveWorkout | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as ActiveWorkout | null
    if (!saved || typeof saved.workoutId !== 'string' || now - saved.savedAt > RESUME_HOURS * 60 * 60 * 1000) return null
    return saved
  } catch {
    return null
  }
}

export function saveActiveWorkout(state: Omit<ActiveWorkout, 'savedAt'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: Date.now() }))
  } catch {
    // storage full or blocked: the workout still runs, it just can't be resumed
  }
}

export function clearActiveWorkout() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
}

/** The saved state fits this workout's plan (it may have changed in an app update since) */
export function fitsPlan(saved: ActiveWorkout, setCounts: number[]): boolean {
  const flat = saved.blocks.flat().sort((a, b) => a - b)
  return flat.length === setCounts.length && flat.every((v, i) => v === i)
    && saved.completed.length === setCounts.length
    && setCounts.every((n, i) => saved.weights[i]?.length === n && saved.repsDone[i]?.length === n
      && saved.completed[i]! <= n)
    && saved.currentBlock >= 0 && saved.currentBlock < saved.blocks.length
}
