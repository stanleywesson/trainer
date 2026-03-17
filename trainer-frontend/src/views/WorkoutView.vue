<script setup lang="ts">
import workoutsData from '@/data/workouts.json'
import exercisesData from '@/data/exercises.json'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import SetTracker from '@/components/SetTracker.vue';

const route = useRoute();
const router = useRouter();
const currentIndex = ref(0);

const workout = computed(() =>
    workoutsData.find(x => x.id === route.params.id)
);

const exercises = computed(() =>
    (workout.value?.exercises ?? []).map(e => {
        const ex = exercisesData.find(data => data.id === e.exerciseId)!

        return {
            ...ex,
            sets: e.sets,
            reps: e.reps,
            repType: ex.repType as 'reps' | 'duration' | 'failure'
        }
    })
);

const currentExercise = computed(() => exercises.value[currentIndex.value]);
const nextExercise = computed(() => exercises.value[currentIndex.value + 1] ?? null);
const isLastExercise = computed(() => currentIndex.value >= exercises.value.length - 1);

function finishEarly() {
    router.push('/');
}

function next() {
    if (isLastExercise.value) {
        router.push('/');
    } else {
        currentIndex.value++;
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-900 p-4 flex flex-col gap-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold text-white">{{ workout?.name }}</h1>
            <button class="text-sm text-red-400 font-semibold" @click="finishEarly">Finish Early</button>
        </div>

        <!-- Progress -->
        <div class="flex flex-col gap-2">
            <div class="flex justify-between text-sm text-gray-400">
                <span>Exercise {{ currentIndex + 1 }} of {{ exercises.length }}</span>
                <span>{{ Math.round(((currentIndex + 1) / exercises.length) * 100) }}%</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2">
                <div class="bg-indigo-500 h-2 rounded-full transition-all"
                    :style="{ width: `${((currentIndex + 1) / exercises.length) * 100}%` }"></div>
            </div>
        </div>

        <!-- Current Exercise -->
        <div class="bg-gray-800 rounded-2xl p-5 flex flex-col gap-3" v-if="currentExercise">
            <span class="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                {{ currentExercise.muscleGroup }}
            </span>
            <h2 class="text-2xl font-bold text-white">{{ currentExercise.name }}</h2>
            <p class="text-gray-400 text-sm">{{ currentExercise.description }}</p>

            <SetTracker :key="currentIndex" :sets="currentExercise.sets" :reps="currentExercise.reps"
                :repType="currentExercise.repType" :default-duration="currentExercise.defaultDuration" class="mt-1" />

            <div class="text-sm text-gray-300">
                <span>Tempo: {{ currentExercise.tempo }}</span>
            </div>

            <div class="text-sm text-gray-400">
                <span class="text-gray-500">Equipment: </span>{{ currentExercise.equipment }}
            </div>

            <div class="text-sm text-gray-400">
                <span class="text-gray-500">Progression: </span>{{ currentExercise.progressionPath }}
            </div>
        </div>

        <!-- Next Exercise Preview -->
        <div class="bg-gray-800/50 rounded-2xl p-4 flex flex-col gap-1" v-if="nextExercise">
            <span class="text-xs text-gray-500 uppercase tracking-widest">Up next</span>
            <span class="text-white font-semibold">{{ nextExercise?.name }}</span>
        </div>

        <!-- Navigation -->
        <div class="mt-auto">
            <button @click="next"
                class="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg active:scale-95 transition-transform">{{
                    isLastExercise ? 'Finish' : 'Next Exercise' }}</button>
            <button v-if="!isLastExercise" @click="next" class="w-full py-3 mt-2 text-gray-400 text-sm">Skip this
                exercise</button>
        </div>
    </div>
</template>
