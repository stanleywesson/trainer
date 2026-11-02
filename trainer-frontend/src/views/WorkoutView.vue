<script setup lang="ts">
import { getWorkout, planExercises } from '@/data'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import SetTracker from '@/components/SetTracker.vue';
import RestTimer from '@/components/RestTimer.vue';
import WatchLink from '@/components/WatchLink.vue';

const route = useRoute();
const router = useRouter();
const currentIndex = ref(0);
const showRest = ref(false);
const restSeconds = ref(0);
const startTime = ref(Date.now());
const completedCount = ref(0);

const workout = computed(() => getWorkout(route.params.id));
const exercises = computed(() => planExercises(workout.value));

const currentExercise = computed(() => exercises.value[currentIndex.value]);
const nextExercise = computed(() => exercises.value[currentIndex.value + 1] ?? null);
const isLastExercise = computed(() => currentIndex.value >= exercises.value.length - 1);

function finishEarly() {
    router.push({ name: 'workoutDetail', params: { id: route.params.id } });
}

function next(skipped = false) {
    if (!skipped)
        completedCount.value++

    if (isLastExercise.value) {
        router.push(
            {
                name: 'summary',
                params: { id: route.params.id },
                query: {
                    startTime: startTime.value,
                    completed: completedCount.value
                }
            }
        );
    } else {
        currentIndex.value++;
    }
}

function onSetComplete() {
    restSeconds.value = currentExercise.value?.restSeconds ?? 60;
    showRest.value = true;
}

function onRestDone() {
    showRest.value = false;
}
</script>

<template>
    <div class="flex-1 flex flex-col">
        <!-- Header -->
        <header
            class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center justify-between gap-3">
            <h1 class="text-xl font-bold text-white truncate">{{ workout?.name }}</h1>
            <button class="header-btn shrink-0 !bg-red-500/15 !text-red-300 !border-red-500/40"
                @click="finishEarly">Finish Early</button>
        </header>

        <main class="flex-1 px-safe pt-3 pb-4 flex flex-col gap-6">

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
            <WatchLink :exercise="currentExercise" />

            <SetTracker :key="currentIndex" :sets="currentExercise.sets" :reps="currentExercise.reps"
                :repType="currentExercise.repType" :duration="currentExercise.duration"
                :per-side="currentExercise.perSide" class="mt-1"
                @set-complete="onSetComplete" />

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

        <!-- Rest Timer -->
        <div v-if="showRest"
            class="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center px-safe pt-safe pb-safe z-30">
            <RestTimer :key="restSeconds" :seconds="restSeconds" @done="onRestDone" @skip="onRestDone" />
        </div>

        <!-- Next Exercise Preview -->
        <div class="bg-gray-800/50 rounded-2xl p-4 flex flex-col gap-1" v-if="nextExercise">
            <span class="text-xs text-gray-500 uppercase tracking-widest">Up next</span>
            <span class="text-white font-semibold">{{ nextExercise?.name }}</span>
        </div>

        </main>

        <!-- Navigation -->
        <footer class="sticky bottom-0 z-20 bg-gray-900/95 backdrop-blur border-t border-gray-800 px-safe pt-3 pb-safe">
            <button @click="next(false)"
                class="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg active:scale-95 transition-transform">{{
                    isLastExercise ? 'Finish' : 'Next Exercise' }}</button>
            <button @click="next(true)"
                class="w-full py-3 mt-2 rounded-2xl border border-gray-700 text-gray-200 text-sm font-semibold active:scale-95 transition-transform">{{
                isLastExercise ? 'Skip & Finish' : 'Skip this exercise' }}</button>
        </footer>
    </div>
</template>
