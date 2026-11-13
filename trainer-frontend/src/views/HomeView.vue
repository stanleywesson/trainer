<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import WorkoutCard from '@/components/WorkoutCard.vue'
import { workouts as workoutsData, workoutLocation, type WorkoutLocation } from '@/data'
import { useCalendarStore } from '@/stores/calendar';
import TodayCard from '@/components/TodayCard.vue'

const selectedLocation = ref<WorkoutLocation | null>(null);
const selectedDuration = ref<number | null>(null);
const selectedDifficulty = ref<number | null>(null);
const calendar = useCalendarStore();
const appVersion = __APP_VERSION__;

const locations: { value: WorkoutLocation, label: string }[] = [
    { value: 'home', label: '🏠 Home' },
    { value: 'gym', label: '🏋️ Gym' },
];
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
        (!selectedLocation.value || workoutLocation(w) === selectedLocation.value) &&
        (!selectedDuration.value || w.estimatedMinutes === selectedDuration.value) &&
        (!selectedDifficulty.value || w.difficulty === selectedDifficulty.value))
);

const PAGE_SIZE = 10
const page = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(filteredWorkouts.value.length / PAGE_SIZE)))
const pagedWorkouts = computed(() =>
    filteredWorkouts.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
const listTop = ref<HTMLElement | null>(null)

// New filters → back to the first page
watch([selectedLocation, selectedDuration, selectedDifficulty], () => { page.value = 1 })

function goToPage(p: number) {
    page.value = Math.min(Math.max(1, p), pageCount.value)
    // Bring the top of the list back into view (below the sticky header)
    listTop.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function toggleLocation(l: WorkoutLocation) {
    selectedLocation.value = selectedLocation.value === l ? null : l
}

const hasFilters = computed(() =>
    selectedLocation.value != null || selectedDuration.value != null || selectedDifficulty.value != null)

function clearFilters() {
    selectedLocation.value = null
    selectedDuration.value = null
    selectedDifficulty.value = null
}

</script>

<template>
    <div class="flex-1 flex flex-col">
        <header
            class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center justify-between">
            <h1 class="text-2xl font-bold text-white">Workouts</h1>
            <div class="flex items-center gap-3">
                <span v-if="calendar.streak > 0" class="text-sm text-orange-400 font-semibold"
                    :aria-label="`${calendar.streak} day streak`">🔥 {{ calendar.streak }}</span>
                <RouterLink to="/history" class="header-btn">History</RouterLink>
            </div>
        </header>

        <main class="flex-1 px-safe pb-safe pt-3">

        <TodayCard />

        <div ref="listTop" class="flex items-center justify-between mb-3 scroll-mt-20">
            <h2 class="text-lg font-bold text-white">All workouts</h2>
            <RouterLink to="/exercises" class="text-sm font-semibold text-indigo-300 px-2 py-2 -mr-2">
                Browse exercises ›</RouterLink>
        </div>

        <!-- Location filter -->
        <div class="flex gap-2 mb-3">
            <button v-for="l in locations" :key="l.value" @click="toggleLocation(l.value)" :class="[
                'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                selectedLocation === l.value ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'
            ]">{{ l.label }}</button>
        </div>

        <!-- Duration & difficulty dropdowns (native selects open the phone's picker) -->
        <div class="flex gap-2 mb-3">
            <select v-model="selectedDuration" aria-label="Duration"
                :class="['filter-select', selectedDuration != null ? 'filter-select-active' : '']">
                <option :value="null">Any duration</option>
                <option v-for="d in durations" :key="d" :value="d">{{ d }} min</option>
            </select>
            <select v-model="selectedDifficulty" aria-label="Difficulty"
                :class="['filter-select', selectedDifficulty != null ? 'filter-select-active' : '']">
                <option :value="null">Any difficulty</option>
                <option v-for="d in difficulties" :key="d.value" :value="d.value">{{ d.value }} · {{ d.label }}</option>
            </select>
        </div>

        <!-- Results count -->
        <div class="flex items-center justify-between mb-4 min-h-8">
            <p class="text-xs text-gray-500">{{ filteredWorkouts.length }} workout{{ filteredWorkouts.length !== 1 ?
                's' : '' }}</p>
            <button v-if="hasFilters" @click="clearFilters" class="text-xs font-semibold text-indigo-300 px-2 py-1">
                Clear filters</button>
        </div>

        <div class="flex flex-col gap-4">
            <WorkoutCard v-for="workout in pagedWorkouts" :key="workout.id" :workout="workout" />
        </div>

        <!-- Pager -->
        <nav v-if="pageCount > 1" class="flex items-center justify-between gap-3 mt-5" aria-label="Workout pages">
            <button class="header-btn disabled:opacity-40" :disabled="page === 1" @click="goToPage(page - 1)">
                ← Prev</button>
            <span class="text-sm text-gray-400">Page {{ page }} of {{ pageCount }}</span>
            <button class="header-btn disabled:opacity-40" :disabled="page === pageCount"
                @click="goToPage(page + 1)">Next →</button>
        </nav>

        <p class="text-center text-xs text-gray-600 mt-8">v{{ appVersion }}</p>
        </main>
    </div>
</template>
