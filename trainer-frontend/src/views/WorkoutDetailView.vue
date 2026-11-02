<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { circuitLabel, getWorkout, planExercises, prescriptionLabel } from '@/data'
import WatchLink from '@/components/WatchLink.vue'

const route = useRoute()
const router = useRouter()

const workout = computed(() => getWorkout(route.params.id))
const exercises = computed(() => planExercises(workout.value))
const circuit = computed(() => workout.value?.format === 'circuit' ? workout.value.circuit : undefined)

const difficultyLabels = ['', 'Easy', 'Moderate', 'Hard', 'Very Hard', 'Max Effort']
const difficultyLabel = computed(() => difficultyLabels[workout.value?.difficulty ?? 0] ?? '')

/** "A1", "A2" … position within a superset group */
function supersetTag(index: number) {
    const list = exercises.value
    const label = list[index]?.superset
    let position = 1
    for (let i = index - 1; i >= 0 && list[i]?.superset === label; i--) position++
    return `${label}${position}`
}

function startWorkout() {
    router.push({ name: circuit.value ? 'circuit' : 'workout', params: { id: route.params.id } })
}
</script>

<template>
    <div class="flex-1 flex flex-col" v-if="workout">
        <!-- Header -->
        <header class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center">
            <button class="header-btn" @click="$router.push('/')">← Back</button>
        </header>

        <main class="flex-1 px-safe pt-3 pb-4 flex flex-col gap-6">

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

        <!-- Circuit format -->
        <div v-if="circuit" class="bg-emerald-950/50 border border-emerald-800/40 rounded-2xl p-4 flex flex-col gap-1">
            <span class="text-xs font-semibold uppercase tracking-widest text-emerald-400">Circuit</span>
            <p class="text-sm text-gray-200 font-semibold">{{ circuitLabel(circuit) }}</p>
            <p class="text-xs text-gray-400">Timed: move straight through every exercise, then repeat. {{
                circuit.roundRestSeconds }}s break between rounds.</p>
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
                <span v-if="exercise.superset"
                    class="text-[10px] font-bold w-7 text-center py-0.5 rounded-full bg-violet-500/20 text-violet-200 shrink-0">{{
                        supersetTag(index) }}</span>
                <span v-else class="text-xs font-bold text-gray-600 w-7 text-center shrink-0">{{ index + 1 }}</span>
                <div class="flex flex-col flex-1 min-w-0">
                    <span class="text-white text-sm font-semibold">{{ exercise.name }}</span>
                    <span class="text-indigo-300 text-xs font-semibold">{{
                        circuit ? `${circuit.workSeconds}s` : prescriptionLabel(exercise) }}</span>
                    <span class="text-gray-500 text-xs">{{ exercise.muscleGroup }} · {{ exercise.equipment }}</span>
                </div>
                <WatchLink :exercise="exercise" compact />
            </div>
            <p v-if="exercises.some(e => e.superset)" class="text-xs text-gray-500">
                Matching letters (A1 + A2) are supersets: alternate one set of each, then rest.
            </p>
        </div>

        </main>

        <!-- Start button -->
        <footer class="sticky bottom-0 z-20 bg-gray-900/95 backdrop-blur border-t border-gray-800 px-safe pt-3 pb-safe">
            <button @click="startWorkout"
                class="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg active:scale-95 transition-transform">
                Start Workout
            </button>
        </footer>
    </div>
</template>
