import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface WorkoutSession {
    id: string
    date: string
    workoutId: string
    workoutName: string
    durationSeconds: number
    difficulty: number
    completedExercises: number
}

const STORAGE_KEY = 'trainer_history'

export const useHistoryStore = defineStore("history", () => {
    const workouts = ref<WorkoutSession[]>([]);

    function load() {
        try {
            workouts.value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        }
        catch {
            workouts.value = [];
        }
    }

    function saveWorkout(workout: Omit<WorkoutSession, 'id' | 'date'>) {
        const entry: WorkoutSession = {
            ...workout,
            id: crypto.randomUUID(),
            date: new Date().toISOString()
        };

        workouts.value.push(entry);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts.value));
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
        saveWorkout,
        getHistory,
        getById,
        workoutStreak
    }
});

