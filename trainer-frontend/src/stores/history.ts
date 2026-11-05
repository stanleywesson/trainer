import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface LoggedSet {
    kind: 'warmup' | 'working' | 'drop'
    /** Target reps (0 for timed / max sets) */
    reps: number
    durationSeconds?: number
    /** null = bodyweight / not entered */
    weightKg: number | null
}

export interface ExerciseLog {
    exerciseId: string
    exerciseName: string
    perSide?: boolean
    sets: LoggedSet[]
}

export interface WorkoutSession {
    id: string
    date: string
    workoutId: string
    workoutName: string
    durationSeconds: number
    difficulty: number
    completedExercises: number
    /** Sets done with weights; absent on sessions saved before weight logging existed */
    log?: ExerciseLog[]
    /** 'run' for logged runs; absent (= workout) on older sessions */
    kind?: 'workout' | 'run'
    /** For runs: the calendar entry this run completed */
    calendarEntryId?: string
}

export const RUN_WORKOUT_ID = 'run'

const STORAGE_KEY = 'trainer_history'

export const useHistoryStore = defineStore("history", () => {
    const workouts = ref<WorkoutSession[]>([]);
    /** Log of the session in progress, handed from the workout screen to the summary screen */
    const pendingLog = ref<ExerciseLog[]>([]);

    /** Most recent logged sets for an exercise, used to pre-fill weights */
    function lastLog(exerciseId: string): ExerciseLog | undefined {
        for (let i = workouts.value.length - 1; i >= 0; i--) {
            const entry = workouts.value[i]?.log?.find(l => l.exerciseId === exerciseId && l.sets.length > 0);
            if (entry) return entry;
        }
        return undefined;
    }

    function load() {
        try {
            workouts.value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        }
        catch {
            workouts.value = [];
        }
    }

    function persist() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts.value));
    }

    function saveWorkout(workout: Omit<WorkoutSession, 'id' | 'date'>, date = new Date().toISOString()) {
        const entry: WorkoutSession = {
            ...workout,
            id: crypto.randomUUID(),
            date
        };

        workouts.value.push(entry);
        // keep chronological order (backfilled runs may be dated in the past)
        workouts.value.sort((a, b) => a.date.localeCompare(b.date));
        persist();
        return entry;
    }

    function removeWorkout(id: string) {
        workouts.value = workouts.value.filter(w => w.id !== id);
        persist();
    }

    function runFor(calendarEntryId: string): WorkoutSession | undefined {
        return workouts.value.find(w => w.kind === 'run' && w.calendarEntryId === calendarEntryId);
    }

    /** Detach a run from a calendar entry that's being deleted (the run itself stays in history) */
    function unlinkRun(calendarEntryId: string) {
        const run = runFor(calendarEntryId);
        if (!run) return;
        delete run.calendarEntryId;
        persist();
    }

    function getHistory(): WorkoutSession[] {
        return [...workouts.value].reverse();
    }

    function getById(id: string): WorkoutSession | undefined {
        return workouts.value.find(w => w.id === id);
    }

    function localDateKey(d: Date) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    const workoutStreak = computed(() => {
        const days = new Set(workouts.value.map(w => localDateKey(new Date(w.date))))
        let count = 0
        const today = new Date()
        while (true) {
            if (!days.has(localDateKey(today))) break
            count++
            today.setDate(today.getDate() - 1)
        }
        return count
    });

    load();

    return {
        workouts,
        pendingLog,
        lastLog,
        saveWorkout,
        removeWorkout,
        runFor,
        unlinkRun,
        getHistory,
        getById,
        workoutStreak
    }
});

