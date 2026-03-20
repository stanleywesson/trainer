<script setup lang="ts">
import WorkoutCard from '@/components/WorkoutCard.vue'
import workoutsData from '@/data/workouts.json'

const workouts = workoutsData
</script>

<template>
    <div class="min-h-screen bg-gray-900 p-4">
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-white">Workouts</h1>
            <RouterLink to="/history" class="text-sm text-indigo-400 font-semibold">History</RouterLink>
        </div>
        <div class="flex flex-col gap-4">
            <WorkoutCard v-for="workout in workouts" :key="workout.id" :workout="workout" />
        </div>
    </div>
</template>
