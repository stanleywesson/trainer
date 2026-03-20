import { defineStore } from "pinia";
import { ref } from "vue";

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

    load();

    return {
        workouts,
        saveWorkout,
        getHistory,
        getById
    }
});

