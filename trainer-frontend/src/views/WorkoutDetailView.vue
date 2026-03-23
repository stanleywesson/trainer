<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import workoutsData from '@/data/workouts.json'
import exercisesData from '@/data/exercises.json'

const route = useRoute()
const router = useRouter()

const workout = computed(() => workoutsData.find(w => w.id === route.params.id))

const exercises = computed(() =>
    (workout.value?.exercises ?? []).map(e =>
        exercisesData.find(ex => ex.id === e.exerciseId)!
    )
)

const difficultyLabels = ['', 'Easy', 'Moderate', 'Hard', 'Very Hard', 'Max Effort']
const difficultyLabel = computed(() => difficultyLabels[workout.value?.difficulty ?? 0] ?? '')

function startWorkout() {
    router.push({ name: 'workout', params: { id: route.params.id } })
}
</script>

<template>
    <div class="min-h-screen bg-gray-900 p-4 flex flex-col gap-6" v-if="workout">
        <!-- Header -->
        <div class="flex items-center justify-between pt-2">
            <button class="text-sm text-gray-400 font-semibold" @click="$router.push('/')">← Back</button>
        </div>

        <!-- Title -->
        <div class="flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                {{ workout.category }}
            </span>
            <h1 class="text-3xl font-bold text-white">{{ workout.name }}</h1>
        </div>

        <!-- Stats row -->
        <div class="flex gap-3">
            <div class="flex-1 bg-gray-800 rounded-2xl p-3 flex flex-col items-center gap-1">
                <span class="text-xl font-bold text-white">{{ workout.estimatedMinutes }}</span>
                <span class="text-xs text-gray-500 uppercase tracking-widest">min</span>
            </div>
            <div class="flex-1 bg-gray-800 rounded-2xl p-3 flex flex-col items-center gap-1">
                <span class="text-xl font-bold text-white">{{ workout.exercises.length }}</span>
                <span class="text-xs text-gray-500 uppercase tracking-widest">exercises</span>
            </div>
            <div class="flex-1 bg-gray-800 rounded-2xl p-3 flex flex-col items-center gap-1">
                <span class="text-xl font-bold text-white">{{ workout.difficulty }}</span>
                <span class="text-xs text-gray-500 uppercase tracking-widest">{{ difficultyLabel }}</span>
            </div>
        </div>

        <!-- Recommendation -->
        <div class="bg-indigo-950/60 border border-indigo-800/40 rounded-2xl p-4 flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-widest text-indigo-400">Recommendation</span>
            <p class="text-sm text-gray-300 leading-relaxed">{{ workout.recommendation }}</p>
        </div>

        <!-- Exercise list -->
        <div class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-3">
            <span class="text-xs font-semibold uppercase tracking-widest text-gray-500">Exercises</span>
            <div v-for="(exercise, index) in exercises" :key="exercise.id"
                class="flex items-center gap-3">
                <span class="text-xs font-bold text-gray-600 w-5 text-right">{{ index + 1 }}</span>
                <div class="flex flex-col">
                    <span class="text-white text-sm font-semibold">{{ exercise.name }}</span>
                    <span class="text-gray-500 text-xs">{{ exercise.muscleGroup }}</span>
                </div>
            </div>
        </div>

        <!-- Start button -->
        <div class="mt-auto">
            <button @click="startWorkout"
                class="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg active:scale-95 transition-transform">
                Start Workout
            </button>
        </div>
    </div>
</template>
