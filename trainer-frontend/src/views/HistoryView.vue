<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useHistoryStore, type WorkoutSession } from '@/stores/history';

const router = useRouter()
const historyStore = useHistoryStore();
const history = computed(() => [...historyStore.workouts].reverse());

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
    <div class="flex-1 flex flex-col">
        <header class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center">
            <RouterLink to="/" class="header-btn">← Back</RouterLink>
        </header>

        <main class="flex-1 px-safe pt-3 pb-safe flex flex-col gap-6">
        <h1 class="text-3xl font-bold text-white">History</h1>

        <div v-if="history.length === 0" class="text-center text-gray-500 pt-20">
            No workouts yet.
        </div>
        <div v-else class="flex flex-col gap-3">
            <button v-for="entry in history" :key="entry.id" @click="openDetail(entry)"
                class="bg-gray-800 rounded-2xl p-4 flex gap-3 text-left w-full active:scale-95 transition-transform">
                <span :class="['w-1.5 self-stretch rounded-full shrink-0',
                    entry.kind === 'run' ? 'bg-emerald-500' : 'bg-indigo-500']"></span>
                <div class="flex-1 min-w-0 flex flex-col gap-2">
                    <div class="flex items-center justify-between gap-2">
                        <span class="font-semibold text-white truncate">{{ entry.workoutName }}</span>
                        <span v-if="entry.kind !== 'run'"
                            :class="['text-xs font-semibold shrink-0', difficultyColor[entry.difficulty]]">
                            {{ difficultyLabel[entry.difficulty] }}
                        </span>
                    </div>
                    <div class="flex gap-4 text-sm text-gray-400">
                        <span>{{ formatDate(entry.date) }}</span>
                        <template v-if="entry.kind === 'run'">
                            <span>{{ Math.round(entry.durationSeconds / 60) }} min</span>
                        </template>
                        <template v-else>
                            <span>{{ formatDuration(entry.durationSeconds) }}</span>
                            <span>{{ entry.completedExercises }} exercises</span>
                        </template>
                    </div>
                </div>
            </button>
        </div>
        </main>
    </div>
</template>
