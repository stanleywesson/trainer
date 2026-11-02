<script setup lang="ts">
import { computed } from 'vue';
import { useHistoryStore, type LoggedSet } from '@/stores/history';
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

function setChip(s: LoggedSet) {
    const prefix = s.kind === 'warmup' ? 'W ' : s.kind === 'drop' ? 'Drop ' : ''
    const amount = s.durationSeconds ? `${s.durationSeconds}s` : s.reps ? `${s.reps}` : 'max'
    const weight = s.weightKg != null ? `${s.weightKg} kg` : 'BW'
    return `${prefix}${weight} × ${amount}`
}

function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
}
</script>

<template>
    <div class="flex-1 flex flex-col">
        <!-- Header -->
        <header class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center gap-3">
            <button @click="router.back()" class="header-btn">← Back</button>
            <h1 class="text-xl font-bold text-white truncate">Workout Detail</h1>
        </header>

        <main class="flex-1 px-safe pt-3 pb-safe">

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

            <!-- Logged sets & weights -->
            <div v-if="workout.log?.length" class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-4">
                <span class="text-xs text-gray-500 uppercase tracking-widest">Sets & weights</span>
                <div v-for="entry in workout.log" :key="entry.exerciseId" class="flex flex-col gap-2">
                    <span class="text-white text-sm font-semibold">{{ entry.exerciseName }}<span v-if="entry.perSide"
                            class="text-gray-500 font-normal"> · per side</span></span>
                    <div class="flex flex-wrap gap-1.5">
                        <span v-for="(set, i) in entry.sets" :key="i" :class="['text-xs font-semibold px-2 py-1 rounded-lg',
                            set.kind === 'warmup' ? 'bg-gray-700/60 text-gray-400'
                                : set.kind === 'drop' ? 'bg-amber-500/15 text-amber-300'
                                    : 'bg-indigo-500/15 text-indigo-200']">{{ setChip(set) }}</span>
                    </div>
                </div>
            </div>
        </div>
        </main>
    </div>
</template>