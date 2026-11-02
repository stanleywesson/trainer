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
  /** Show a weight (kg) input per set */
  weighted?: boolean
}

export interface DropSet {
  /** Total reps in the drop set */
  reps: number
  /** Lower the weight every N reps */
  dropEvery: number
}

export interface WorkoutExercise {
  exerciseId: string
  /** Working sets; falls back to the exercise defaults */
  sets?: number
  reps?: number
  /** Upper end of a rep range, e.g. reps 8 + repsMax 10 → "8–10" */
  repsMax?: number
  /** Seconds per set for timed exercises; falls back to exercise.defaultDuration */
  duration?: number
  warmupSets?: number
  warmupReps?: number
  /** Target weight in kg (pre-fills the weight input the first time) */
  weight?: number
  /** Rest after each set (or after each superset round); falls back to the exercise default */
  restSeconds?: number
  /** Consecutive entries with the same label are done as a superset */
  superset?: string
  /** One extra set after the working sets, lowering the weight every N reps */
  dropSet?: DropSet
  /** To failure for this workout */
  max?: boolean
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

export type WorkoutLocation = 'home' | 'gym'

export interface Workout {
  id: string
  name: string
  category: string
  difficulty: number
  estimatedMinutes: number
  recommendation: string
  /** "sets": do all sets of one exercise, then move on. "circuit": timed intervals through every exercise, repeated for N rounds. */
  format: 'sets' | 'circuit'
  location?: WorkoutLocation
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

export function workoutLocation(w: Workout): WorkoutLocation {
  return w.location ?? 'home'
}

/** Exercise merged with the workout-specific prescription */
export interface PlannedExercise extends Exercise {
  sets: number
  reps: number
  repsMax?: number
  duration?: number
  warmupSets: number
  warmupReps: number
  weight?: number
  superset?: string
  dropSet?: DropSet
}

export function planExercises(workout: Workout | undefined): PlannedExercise[] {
  return (workout?.exercises ?? []).map(entry => {
    const ex = getExercise(entry.exerciseId)
    const reps = entry.reps ?? ex.defaultReps
    return {
      ...ex,
      repType: entry.max ? 'failure' : ex.repType,
      restSeconds: entry.restSeconds ?? ex.restSeconds,
      sets: entry.sets ?? ex.defaultSets,
      reps,
      repsMax: entry.repsMax,
      duration: entry.duration ?? ex.defaultDuration,
      warmupSets: entry.warmupSets ?? 0,
      warmupReps: entry.warmupReps ?? reps,
      weight: entry.weight,
      superset: entry.superset,
      dropSet: entry.dropSet,
    }
  })
}

/** Groups consecutive exercises sharing a superset label into one block */
export function groupBlocks(planned: PlannedExercise[]): PlannedExercise[][] {
  const blocks: PlannedExercise[][] = []
  for (const p of planned) {
    const last = blocks[blocks.length - 1]
    if (p.superset && last && last[0]!.superset === p.superset) last.push(p)
    else blocks.push([p])
  }
  return blocks
}

export type SetKind = 'warmup' | 'working' | 'drop'

export interface SetSpec {
  kind: SetKind
  label: string
  reps: number
  duration?: number
  /** "drop at 10 · 20 · 30 · 40" for drop sets */
  note?: string
}

export function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rest = s % 60
  return rest ? `${m}:${String(rest).padStart(2, '0')}` : `${m} min`
}

/** Every set of a planned exercise, in order: warm-ups, working sets, drop set */
export function buildSets(p: PlannedExercise): SetSpec[] {
  const side = p.perSide ? ' / side' : ''
  const working = (): Omit<SetSpec, 'kind'> => {
    if (p.repType === 'duration') return { label: `${formatSeconds(p.duration ?? 0)}${side}`, reps: 0, duration: p.duration ?? 0 }
    if (p.repType === 'failure') return { label: `Max reps${side}`, reps: 0 }
    return { label: `${p.reps}${p.repsMax ? `–${p.repsMax}` : ''} reps${side}`, reps: p.reps }
  }

  const sets: SetSpec[] = []
  for (let i = 0; i < p.warmupSets; i++) {
    sets.push({ kind: 'warmup', label: `Warm-up · ${p.warmupReps} reps${side}`, reps: p.warmupReps })
  }
  for (let i = 0; i < p.sets; i++) sets.push({ kind: 'working', ...working() })
  if (p.dropSet) {
    const drops: number[] = []
    for (let r = p.dropSet.dropEvery; r < p.dropSet.reps; r += p.dropSet.dropEvery) drops.push(r)
    sets.push({
      kind: 'drop',
      label: `Drop set · ${p.dropSet.reps} reps${side}`,
      reps: p.dropSet.reps,
      note: `Lower the weight at ${drops.join(' · ')}`,
    })
  }
  return sets
}

/** e.g. "1 warm-up + 4 × 8–10", "3 × 8 / side", "3 × 30s", "2 × 15 + drop set" */
export function prescriptionLabel(p: PlannedExercise): string {
  const side = p.perSide ? ' / side' : ''
  let main: string
  if (p.repType === 'duration') main = p.sets === 1 ? formatSeconds(p.duration ?? 0) : `${p.sets} × ${formatSeconds(p.duration ?? 0)}`
  else if (p.repType === 'failure') main = `${p.sets} × max`
  else main = `${p.sets} × ${p.reps}${p.repsMax ? `–${p.repsMax}` : ''}`
  const warm = p.warmupSets ? `${p.warmupSets} warm-up + ` : ''
  const drop = p.dropSet ? ` + drop set` : ''
  const kg = p.weight ? ` @ ${p.weight} kg` : ''
  return `${warm}${main}${side}${drop}${kg}`
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
