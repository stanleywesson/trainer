<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import workoutsData from '@/data/workouts.json'
import DifficultyRating from '@/components/DifficultyRating.vue'
import { useHistoryStore } from '@/stores/history';

const route = useRoute();
const router = useRouter();
const historyStore = useHistoryStore();

const workout = computed(() => workoutsData.find(w => w.id === route.params.id));
const startTime = Number(route.query.startTime);
const completed = Number(route.query.completed);
const durationMs = startTime > 0 ? Date.now() - startTime : 0;

const difficulty = ref(0)

function formatDuration(ms: number) {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}m ${seconds}s`
}

function saveAndFinish() {
    historyStore.saveWorkout({
        workoutId: route.params.id as string,
        workoutName: workout.value?.name ?? '',
        durationSeconds: Math.floor(durationMs / 1000),
        difficulty: difficulty.value,
        completedExercises: completed,
    })
    router.push('/');
}
</script>

<template>
    <div class="min-h-screen bg-gray-900 p-4 flex flex-col gap-6">
        <div class="flex flex-col items-center gap-2 pt-8">
            <span class="text-5xl">🏁</span>
            <h1 class="text-2xl font-bold text-white">Workout Complete</h1>
            <p class="text-gray-400">{{ workout?.name }}</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-1">
                <span class="text-xs text-gray-500 uppercase tracking-widest">Duration</span>
                <span class="text-2xl font-bold text-white">{{ formatDuration(durationMs) }}</span>
            </div>
            <div class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-1">
                <span class="text-xs text-gray-500 uppercase tracking-widest">Exercises</span>
                <span class="text-2xl font-bold text-white">{{ completed }}</span>
            </div>
        </div>

        <div class="bg-gray-800 rounded-2xl p-5 flex flex-col gap-3">
            <h2 class="text-white font-semibold">How hard was it?</h2>
            <DifficultyRating v-model="difficulty" />
        </div>

        <div class="mt-auto">
            <button @click="saveAndFinish" :disabled="difficulty === 0" :class="[
                'w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95',
                difficulty > 0
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-600'
            ]">
                Save & Finish
            </button>
        </div>
    </div>
</template>