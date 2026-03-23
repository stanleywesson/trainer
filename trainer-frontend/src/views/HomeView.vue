<script setup lang="ts">
import { computed, ref } from 'vue'
import WorkoutCard from '@/components/WorkoutCard.vue'
import workoutsData from '@/data/workouts.json'

const selectedDuration = ref<number | null>(null);
const selectedDifficulty = ref<number | null>(null);

const durations = [15, 20, 30, 40, 60];
const difficulties = [
    { value: 1, label: 'Easy' },
    { value: 2, label: 'Moderate' },
    { value: 3, label: 'Hard' },
    { value: 4, label: 'Very Hard' },
    { value: 5, label: 'Max Effort' },
];

const filteredWorkouts = computed(() =>
    workoutsData.filter(w =>
        (!selectedDuration.value || w.estimatedMinutes === selectedDuration.value) &&
        (!selectedDifficulty.value || w.difficulty === selectedDifficulty.value))
);

function toggleDuration(d: number) {
    selectedDuration.value = selectedDuration.value === d ? null : d
}

function toggleDifficulty(d: number) {
    selectedDifficulty.value = selectedDifficulty.value === d ? null : d
}
</script>

<template>
    <div class="min-h-screen bg-gray-900 p-4">
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Workouts</h1>
            <RouterLink to="/history" class="text-sm text-indigo-400 font-semibold">History</RouterLink>
        </div>

        <!-- Duration filter -->
        <div class="flex gap-2 mb-3 overflow-x-auto pb-1">
            <button v-for="d in durations" :key="d" @click="toggleDuration(d)" :class="[
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                selectedDuration != null && selectedDuration === d ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
            ]">{{ d }} min</button>
        </div>

        <!-- Difficulty filter -->
        <div class="flex gap-2 mb-6 overflow-x-auto pb-1">
            <button v-for="d in difficulties" :key="d.value" @click="toggleDifficulty(d.value)" :class="[
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                selectedDifficulty != null && selectedDifficulty === d.value ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
            ]">{{ d.value }} · {{ d.label }}</button>
        </div>

        <!-- Results count -->
        <p class="text-xs text-gray-500 mb-4">{{ filteredWorkouts.length }} workout{{ filteredWorkouts.length !== 1 ?
            's' : '' }}</p>

        <div class="flex flex-col gap-4">
            <WorkoutCard v-for="workout in filteredWorkouts" :key="workout.id" :workout="workout" />
        </div>
    </div>
</template>
