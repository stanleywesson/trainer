<script setup lang="ts">
import { computed, ref } from 'vue';
import { useHistoryStore } from '@/stores/history';
import { useCalendarStore } from '@/stores/calendar';
import { useRoute, useRouter } from 'vue-router';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import ExerciseSetsTable from '@/components/ExerciseSetsTable.vue';
import { formatClock, formatDuration, formatPace } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const historyStore = useHistoryStore();
const calendar = useCalendarStore();
const workout = computed(() => historyStore.getById(route.params.id as string));
const isRun = computed(() => workout.value?.kind === 'run');
const confirming = ref(false);

function deleteSession() {
    if (workout.value) calendar.deleteSession(workout.value.id);
    confirming.value = false;
    router.back();
}

const difficultyLabel = ['', 'Easy', 'Moderate', 'Hard', 'Very Hard', 'Max Effort']
const difficultyColor = ['', 'text-green-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400']

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** Saved time is when the session ended; start = end − duration */
const timeRange = computed(() => {
    const w = workout.value
    if (!w || !w.durationSeconds) return ''
    const end = new Date(w.date)
    const start = new Date(end.getTime() - w.durationSeconds * 1000)
    return `${formatClock(start)} – ${formatClock(end)}`
})

const totals = computed(() => {
    const work = (workout.value?.log ?? []).flatMap(l => l.sets).filter(s => s.kind !== 'warmup')
    return {
        sets: work.length,
        reps: work.reduce((n, s) => n + (s.durationSeconds ? 0 : s.reps), 0),
        volume: Math.round(work.reduce((n, s) => n + (s.weightKg ?? 0) * (s.durationSeconds ? 0 : s.reps), 0)),
    }
})

function openExercise(exerciseId: string) {
    router.push({ name: 'exerciseHistory', params: { exerciseId } })
}
</script>

<template>
    <div class="flex-1 flex flex-col">
        <!-- Header -->
        <header class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center gap-3">
            <button @click="router.back()" class="header-btn">← Back</button>
            <h1 class="flex-1 text-xl font-bold text-white truncate">{{ isRun ? 'Run' : 'Workout' }} Detail</h1>
            <button v-if="workout" @click="confirming = true"
                class="header-btn shrink-0 !text-red-300 !border-red-500/40">Delete</button>
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
                <p class="text-gray-400 text-sm">{{ formatDate(workout.date) }}<template v-if="timeRange && !isRun">
                    · {{ timeRange }}</template></p>
            </div>

            <!-- Run -->
            <template v-if="isRun">
                <div class="grid grid-cols-2 gap-3">
                    <div class="stat-tile">
                        <span class="stat-label">Time</span>
                        <span class="stat-value">{{ formatDuration(workout.durationSeconds) }}</span>
                    </div>
                    <div class="stat-tile">
                        <span class="stat-label">Distance</span>
                        <span class="stat-value">{{ workout.distanceKm ? `${workout.distanceKm} km` : '–' }}</span>
                    </div>
                    <div class="stat-tile">
                        <span class="stat-label">Pace</span>
                        <span class="stat-value">{{ workout.distanceKm ? formatPace(workout.durationSeconds, workout.distanceKm) : '–' }}</span>
                    </div>
                    <div class="stat-tile">
                        <span class="stat-label">Logged at</span>
                        <span class="stat-value">{{ formatClock(new Date(workout.date)) }}</span>
                    </div>
                </div>
                <div v-if="workout.plannedRun" class="stat-tile">
                    <span class="stat-label">Planned</span>
                    <span class="text-white font-semibold">{{ workout.plannedRun }}</span>
                </div>
            </template>

            <!-- Workout -->
            <template v-else>
                <div class="grid grid-cols-2 gap-3">
                    <div class="stat-tile">
                        <span class="stat-label">Duration</span>
                        <span class="stat-value">{{ formatDuration(workout.durationSeconds) }}</span>
                    </div>
                    <div class="stat-tile">
                        <span class="stat-label">Difficulty</span>
                        <span class="stat-value"><span :class="difficultyColor[workout.difficulty]">
                            {{ difficultyLabel[workout.difficulty] || '–' }}</span></span>
                    </div>
                    <div class="stat-tile">
                        <span class="stat-label">Exercises</span>
                        <span class="stat-value">{{ workout.completedExercises }}</span>
                    </div>
                    <div class="stat-tile">
                        <span class="stat-label">Work sets</span>
                        <span class="stat-value">{{ totals.sets || '–' }}</span>
                    </div>
                    <div v-if="totals.reps" class="stat-tile">
                        <span class="stat-label">Total reps</span>
                        <span class="stat-value">{{ totals.reps }}</span>
                    </div>
                    <div v-if="totals.volume" class="stat-tile">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">{{ totals.volume.toLocaleString() }} kg</span>
                    </div>
                </div>

                <!-- Each exercise: full set-by-set log; tap the name for that exercise's past sessions -->
                <div v-for="entry in workout.log" :key="entry.exerciseId"
                    class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-3">
                    <button @click="openExercise(entry.exerciseId)"
                        class="flex items-center justify-between gap-2 text-left -my-1 py-1 min-h-11">
                        <span class="text-white font-semibold">{{ entry.exerciseName }}<span v-if="entry.perSide"
                                class="text-gray-500 font-normal text-sm"> · per side</span></span>
                        <span class="text-xs font-semibold text-indigo-300 shrink-0">All sessions ›</span>
                    </button>
                    <ExerciseSetsTable :log="entry" />
                </div>

                <p v-if="!workout.log?.length" class="text-sm text-gray-500 text-center">
                    No set-by-set data was saved for this session. Sessions from v1.3.4 on save every exercise.</p>
            </template>
        </div>
        </main>

        <ConfirmDialog v-if="confirming" :title="`Delete this ${isRun ? 'run' : 'workout'}?`"
            :message="isRun
                ? 'It will be removed from history and the planned run will show as not done again.'
                : 'It will be removed from history. This can\'t be undone.'"
            @confirm="deleteSession" @cancel="confirming = false" />
    </div>
</template>
