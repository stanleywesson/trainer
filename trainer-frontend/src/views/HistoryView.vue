<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BackupPanel from '@/components/BackupPanel.vue'
import { useHistoryStore, type WorkoutSession } from '@/stores/history';
import { formatDuration } from '@/utils/format';

const router = useRouter()
const historyStore = useHistoryStore();
const history = computed(() => [...historyStore.workouts].reverse());

const TAB_KEY = 'trainer_history_tab'
const tab = ref<'sessions' | 'exercises'>(readTab())
function readTab() {
    try { return localStorage.getItem(TAB_KEY) === 'exercises' ? 'exercises' : 'sessions' } catch { return 'sessions' }
}
function setTab(t: 'sessions' | 'exercises') {
    tab.value = t
    try { localStorage.setItem(TAB_KEY, t) } catch { /* ignore */ }
}

/** Every exercise that has logged sets, most recently done first */
const exercises = computed(() => {
    const map = new Map<string, { id: string, name: string, count: number, last: string }>()
    for (const w of history.value) {
        for (const l of w.log ?? []) {
            if (!l.sets.length) continue
            const e = map.get(l.exerciseId)
            if (e) e.count++
            else map.set(l.exerciseId, { id: l.exerciseId, name: l.exerciseName, count: 1, last: w.date })
        }
    }
    return [...map.values()]
})

const difficultyLabel = ['', 'Easy', 'Moderate', 'Hard', 'Very Hard', 'Max Effort']
const difficultyColor = ['', 'text-green-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400']

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
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

        <main class="flex-1 px-safe pt-3 pb-safe flex flex-col gap-4">
        <h1 class="text-3xl font-bold text-white">History</h1>

        <BackupPanel />

        <div class="flex gap-1 p-1 rounded-xl bg-gray-800">
            <button v-for="t in (['sessions', 'exercises'] as const)" :key="t" @click="setTab(t)" :class="[
                'flex-1 min-h-10 rounded-lg text-sm font-semibold capitalize transition-colors',
                tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400'
            ]">{{ t }}</button>
        </div>

        <template v-if="tab === 'sessions'">
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
                        <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                            <span>{{ formatDate(entry.date) }}</span>
                            <span>{{ formatDuration(entry.durationSeconds) }}</span>
                            <span v-if="entry.kind === 'run' && entry.distanceKm">{{ entry.distanceKm }} km</span>
                            <span v-if="entry.kind !== 'run'">{{ entry.completedExercises }} exercises</span>
                        </div>
                    </div>
                </button>
            </div>
        </template>

        <template v-else>
            <div v-if="exercises.length === 0" class="text-center text-gray-500 pt-20">
                No exercises logged yet.
            </div>
            <div v-else class="flex flex-col gap-2">
                <RouterLink v-for="ex in exercises" :key="ex.id"
                    :to="{ name: 'exerciseHistory', params: { exerciseId: ex.id } }"
                    class="bg-gray-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 active:scale-95 transition-transform">
                    <div class="min-w-0">
                        <p class="text-white font-semibold truncate">{{ ex.name }}</p>
                        <p class="text-xs text-gray-400">{{ ex.count }} session{{ ex.count !== 1 ? 's' : '' }} · last {{ formatDate(ex.last) }}</p>
                    </div>
                    <span class="text-gray-500 shrink-0">›</span>
                </RouterLink>
            </div>
        </template>
        </main>
    </div>
</template>
