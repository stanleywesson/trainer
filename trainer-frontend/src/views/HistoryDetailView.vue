<script setup lang="ts">
import { computed } from 'vue';
import { useHistoryStore } from '@/stores/history';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const historyStore = useHistoryStore();
const workout = computed(() => historyStore.getById(route.params.id as string));

const difficultyLabel = ['', 'Easy', 'Moderate', 'Hard', 'Very Hard', 'Max Effort']
const difficultyColor = ['', 'text-green-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400']

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
}
</script>

<template>
    <div class="p-4 bg-gray-900 min-h-screen">
        <!-- Header -->
        <div class="flex items-center gap-3 mb-6">
            <button @click="router.back()" class="text-gray-400 text-2xl leading-none">‹</button>
            <h1 class="text-2xl font-bold text-white">Workout Detail</h1>
        </div>

        <!-- Not found -->
        <div v-if="!workout" class="text-center text-gray-500 pt-20">
            Session not found.
        </div>

        <!-- Detail content -->
        <div v-else class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
                <h2 class="text-xl font-bold text-white">{{ workout.workoutName }}</h2>
                <p class="text-gray-400 text-sm">{{ formatDate(workout.date) }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-1">
                    <span class="text-xs text-gray-500 uppercase tracking-widest">Duration</span>
                    <span class="text-2xl font-bold text-white">{{ formatDuration(workout.durationSeconds) }}</span>
                </div>
                <div class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-1">
                    <span class="text-xs text-gray-500 uppercase tracking-widest">Exercises</span>
                    <span class="text-2xl font-bold text-white">{{ workout.completedExercises }}</span>
                </div>
            </div>

            <div class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-1">
                <span class="text-xs text-gray-500 uppercase tracking-widest">Difficulty</span>
                <span :class="['text-2xl font-bold', difficultyColor[workout.difficulty]]">
                    {{ difficultyLabel[workout.difficulty] }}
                </span>
            </div>
        </div>
    </div>
</template>