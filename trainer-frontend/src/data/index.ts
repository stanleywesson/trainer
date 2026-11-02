import exercisesJson from './exercises.json'
import workoutsJson from './workouts.json'

export type RepType = 'reps' | 'duration' | 'failure'

export interface Exercise {
  id: string
  name: string
  muscleGroup: string
  secondaryMuscle: string
  defaultSets: number
  defaultReps: number
  repType: RepType
  /** Seconds per set, for repType "duration" */
  defaultDuration?: number
  /** Reps / time are per side (unilateral exercise) */
  perSide?: boolean
  restSeconds: number
  tempo: string
  equipment: string
  description: string
  progressionPath: string
  source?: string
  /** Direct link to a specific tutorial video. When empty, a YouTube search link is used instead. */
  videoUrl?: string
}

export interface WorkoutExercise {
  exerciseId: string
  /** Straight-set workouts only; falls back to the exercise defaults */
  sets?: number
  reps?: number
  /** Seconds per set for holds; falls back to exercise.defaultDuration */
  duration?: number
}

export interface CircuitConfig {
  rounds: number
  /** Work time per exercise */
  workSeconds: number
  /** Rest between exercises */
  restSeconds: number
  /** Rest between rounds */
  roundRestSeconds: number
}

export interface Workout {
  id: string
  name: string
  category: string
  difficulty: number
  estimatedMinutes: number
  recommendation: string
  /** "sets": do all sets of one exercise, then move on. "circuit": timed intervals through every exercise, repeated for N rounds. */
  format: 'sets' | 'circuit'
  circuit?: CircuitConfig
  exercises: WorkoutExercise[]
}

export const exercises = exercisesJson as Exercise[]
export const workouts = workoutsJson as Workout[]

export function getWorkout(id: unknown): Workout | undefined {
  return workouts.find(w => w.id === id)
}

export function getExercise(id: string): Exercise {
  const ex = exercises.find(e => e.id === id)
  if (!ex) throw new Error(`Unknown exercise id "${id}"`)
  return ex
}

/** Exercise merged with the workout-specific prescription */
export interface PlannedExercise extends Exercise {
  sets: number
  reps: number
  duration?: number
}

export function planExercises(workout: Workout | undefined): PlannedExercise[] {
  return (workout?.exercises ?? []).map(entry => {
    const ex = getExercise(entry.exerciseId)
    return {
      ...ex,
      sets: entry.sets ?? ex.defaultSets,
      reps: entry.reps ?? ex.defaultReps,
      duration: entry.duration ?? ex.defaultDuration,
    }
  })
}

/** e.g. "3 × 12", "3 × 8 / side", "3 × 30s", "3 × max" */
export function prescriptionLabel(p: PlannedExercise): string {
  const side = p.perSide ? ' / side' : ''
  if (p.repType === 'duration') return `${p.sets} × ${p.duration ?? 0}s${side}`
  if (p.repType === 'failure') return `${p.sets} × max${side}`
  return `${p.sets} × ${p.reps}${side}`
}

/**
 * "How to" video for an exercise: the hand-picked videoUrl if set,
 * otherwise a YouTube search scoped to the exercise's source channel.
 */
export function videoLink(ex: Pick<Exercise, 'name' | 'source' | 'videoUrl'>): { url: string, direct: boolean } {
  if (ex.videoUrl) return { url: ex.videoUrl, direct: true }
  const channel = ex.source?.split(',')[0]?.trim() ?? ''
  // "Wall Walk / Wall Handstand Hold" → "Wall Walk"; "Table Row (Inverted Row)" → "Table Row"
  const name = ex.name.split(' / ')[0]!.replace(/\s*\(.*\)/, '')
  const query = `${channel} ${name} tutorial`.trim()
  return { url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, direct: false }
}

export function circuitLabel(c: CircuitConfig): string {
  return `${c.rounds} rounds · ${c.workSeconds}s work / ${c.restSeconds}s rest`
}
