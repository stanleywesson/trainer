<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHistoryStore } from '@/stores/history'
import ExerciseSetsTable from '@/components/ExerciseSetsTable.vue'

const route = useRoute()
const router = useRouter()
const historyStore = useHistoryStore()
const exerciseId = computed(() => route.params.exerciseId as string)

/** Every session that logged this exercise, newest first */
const sessions = computed(() =>
    [...historyStore.workouts].reverse().flatMap(w => {
        const log = w.log?.find(l => l.exerciseId === exerciseId.value && l.sets.length > 0)
        return log ? [{ session: w, log }] : []
    }))

const name = computed(() => sessions.value[0]?.log.exerciseName ?? 'Exercise')

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
    <div class="flex-1 flex flex-col">
        <header class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center gap-3">
            <button @click="router.back()" class="header-btn">← Back</button>
            <h1 class="flex-1 text-xl font-bold text-white truncate">{{ name }}</h1>
        </header>

        <main class="flex-1 px-safe pt-3 pb-safe flex flex-col gap-3">
            <p class="text-sm text-gray-400">{{ sessions.length }} session{{ sessions.length !== 1 ? 's' : '' }} logged</p>

            <div v-if="sessions.length === 0" class="text-center text-gray-500 pt-20">
                No sessions logged for this exercise yet.
            </div>

            <div v-for="{ session, log } in sessions" :key="session.id"
                class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-3">
                <RouterLink :to="{ name: 'historyDetail', params: { id: session.id } }"
                    class="flex items-baseline justify-between gap-2 min-h-11 -my-1 py-1">
                    <span class="text-white font-semibold">{{ formatDate(session.date) }}</span>
                    <span class="text-xs text-gray-400 truncate">{{ session.workoutName }} ›</span>
                </RouterLink>
                <ExerciseSetsTable :log="log" />
            </div>
        </main>
    </div>
</template>
