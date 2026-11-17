import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { keepUnreadable } from "@/utils/backup";

export interface LoggedSet {
    kind: 'warmup' | 'working' | 'drop'
    /** Reps done. Sessions saved before v1.3.3 hold the target here (no targetReps). 0 = timed / not entered */
    reps: number
    /** Planned reps (0 for timed / max sets); absent on older sessions */
    targetReps?: number
    durationSeconds?: number
    /** Distance-based sets (rows, carries…) */
    distanceMeters?: number
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
    /** For runs: distance covered, if entered */
    distanceKm?: number
    /** For runs: what the plan asked for, e.g. "Run 2 min / walk 1 min × 6" */
    plannedRun?: string
    /** When the logged sets were last corrected after the session */
    editedAt?: string
    /** The sets as first saved, kept so edits can be seen and undone */
    originalLog?: ExerciseLog[]
}

export const RUN_WORKOUT_ID = 'run'

/** Sessions can be corrected for this long after they end, so old history stays trustworthy */
export const EDIT_WINDOW_DAYS = 7

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
        const raw = localStorage.getItem(STORAGE_KEY);
        try {
            const parsed = JSON.parse(raw ?? '[]');
            if (!Array.isArray(parsed)) throw new Error('not a list');
            workouts.value = parsed;
        }
        catch {
            // set it aside first: the next save would otherwise overwrite it for good
            keepUnreadable(STORAGE_KEY, raw);
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

    /** Sessions from a backup that aren't on this phone yet */
    function newSessions(sessions: WorkoutSession[]): WorkoutSession[] {
        const known = new Set(workouts.value.map(w => w.id));
        return sessions.filter(s => {
            if (known.has(s.id)) return false;
            known.add(s.id);
            return true;
        });
    }

    /** Adds a backup's sessions; never changes or removes what's already here */
    function importSessions(sessions: WorkoutSession[]) {
        const fresh = newSessions(sessions);
        if (!fresh.length) return;
        workouts.value.push(...fresh);
        workouts.value.sort((a, b) => a.date.localeCompare(b.date));
        persist();
    }

    function removeWorkout(id: string) {
        workouts.value = workouts.value.filter(w => w.id !== id);
        persist();
    }

    /** Workouts with logged sets, within EDIT_WINDOW_DAYS of when they ended */
    function canEdit(session: WorkoutSession, now = Date.now()): boolean {
        if (session.kind === 'run' || !session.log?.length) return false;
        return now - Date.parse(session.date) < EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    }

    /** Replaces a session's logged sets; the first edit keeps the sets as originally saved */
    function updateLog(id: string, log: ExerciseLog[]) {
        const session = getById(id);
        if (!session || !canEdit(session)) return;
        if (!session.originalLog) session.originalLog = JSON.parse(JSON.stringify(session.log ?? []));
        session.log = log;
        session.editedAt = new Date().toISOString();
        persist();
    }

    /** Puts back the sets as first saved */
    function revertLog(id: string) {
        const session = getById(id);
        if (!session?.originalLog) return;
        session.log = session.originalLog;
        delete session.originalLog;
        delete session.editedAt;
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
        canEdit,
        updateLog,
        revertLog,
        newSessions,
        importSessions,
        runFor,
        unlinkRun,
        getHistory,
        getById,
        workoutStreak
    }
});

