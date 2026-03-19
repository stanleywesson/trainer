<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useHistoryStore, type WorkoutSession } from '@/stores/history';

const router = useRouter()
const historyStore = useHistoryStore();
const history = historyStore.getHistory();

const difficultyLabel = ['', 'Easy', 'Moderate', 'Hard', 'Very Hard', 'Max Effort']
const difficultyColor = ['', 'text-green-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400']

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
}

function openDetail(workout: WorkoutSession) {
    router.push({ name: 'historyDetail', params: { id: workout.id } })
}
</script>

<template>
    <div class="p-4 bg-gray-900 min-h-screen">
        <div class="flex items-center gap-3 mb-6">
            <RouterLink to="/" class="text-gray-400 text-2xl leading-none">‹</RouterLink>
            <h1 class="text-2xl font-bold text-white">History</h1>
        </div>

        <div v-if="history.length === 0" class="text-center text-gray-500 pt-20">
            No workouts yet.
        </div>
        <div v-else class="flex flex-col gap-3">
            <button v-for="entry in history" :key="entry.id" @click="openDetail(entry)"
                class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-2 text-left w-full active:scale-95 transition-transform">
                <div class="flex items-center justify-between">
                    <span class="font-semibold text-white">{{ entry.workoutName }}</span>
                    <span :class="['text-xs font-semibold', difficultyColor[entry.difficulty]]">
                        {{ difficultyLabel[entry.difficulty] }}
                    </span>
                </div>
                <div class="flex gap-4 text-sm text-gray-400">
                    <span>{{ formatDate(entry.date) }}</span>
                    <span>{{ formatDuration(entry.durationSeconds) }}</span>
                    <span>{{ entry.completedExercises }} exercises</span>
                </div>
            </button>
        </div>
    </div>
</template>