<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { exercises, workouts, formatSeconds, formatDistance, type Exercise } from '@/data'
import { useHistoryStore } from '@/stores/history'
import WatchLink from '@/components/WatchLink.vue'

/** Read-only exercise library, for looking things up outside a workout */
const router = useRouter()
const historyStore = useHistoryStore()

const search = ref('')
const selectedGroup = ref<string | null>(null)
const openId = ref<string | null>(null)

/** "Back (Lats, Rhomboids)" → "Back", "Chest, Triceps" → "Chest" */
function primaryGroup(ex: Exercise) {
    return ex.muscleGroup.split(/[,(]/)[0]!.trim()
}

const groups = computed(() => [...new Set(exercises.map(primaryGroup))].sort())

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    return exercises
        .filter(ex => !selectedGroup.value || primaryGroup(ex) === selectedGroup.value)
        .filter(ex => !q || [ex.name, ex.muscleGroup, ex.secondaryMuscle, ex.equipment]
            .some(f => f.toLowerCase().includes(q)))
        .sort((a, b) => a.name.localeCompare(b.name))
})

/** Workouts that use each exercise */
const usedIn = computed(() => {
    const map = new Map<string, { id: string, name: string }[]>()
    for (const w of workouts) {
        for (const id of new Set(w.exercises.map(e => e.exerciseId))) {
            if (!map.has(id)) map.set(id, [])
            map.get(id)!.push({ id: w.id, name: w.name })
        }
    }
    return map
})

const loggedIds = computed(() =>
    new Set(historyStore.workouts.flatMap(w => (w.log ?? []).filter(l => l.sets.length > 0).map(l => l.exerciseId))))

function defaultLabel(ex: Exercise) {
    const side = ex.perSide ? (ex.repType === 'duration' ? ' each side' : ' / side') : ''
    if (ex.repType === 'duration') return `${ex.defaultSets} × ${formatSeconds(ex.defaultDuration ?? 0)}${side}`
    if (ex.repType === 'distance') return `${ex.defaultSets} × ${formatDistance(ex.defaultDistance ?? 0)}`
    if (ex.repType === 'failure') return `${ex.defaultSets} × max${side}`
    return `${ex.defaultSets} × ${ex.defaultReps}${side}`
}

function toggle(id: string) {
    openId.value = openId.value === id ? null : id
}
</script>

<template>
    <div class="flex-1 flex flex-col">
        <header class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center gap-3">
            <button @click="router.back()" class="header-btn">← Back</button>
            <h1 class="flex-1 text-xl font-bold text-white truncate">Exercises</h1>
        </header>

        <main class="flex-1 px-safe pt-3 pb-safe flex flex-col gap-3">
            <div class="flex gap-2">
                <input v-model="search" type="search" placeholder="Search name, muscle, equipment"
                    aria-label="Search exercises"
                    class="flex-[2] min-w-0 min-h-11 px-3.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
                <select v-model="selectedGroup" aria-label="Muscle group"
                    :class="['filter-select', selectedGroup != null ? 'filter-select-active' : '']">
                    <option :value="null">All muscles</option>
                    <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
                </select>
            </div>

            <p class="text-xs text-gray-500">{{ filtered.length }} exercise{{ filtered.length !== 1 ? 's' : '' }}</p>

            <div v-if="filtered.length === 0" class="text-center text-gray-500 pt-12">No exercises match.</div>

            <div v-for="ex in filtered" :key="ex.id" class="bg-gray-800 rounded-2xl">
                <button class="w-full text-left p-4 flex items-center gap-3 min-h-11" :aria-expanded="openId === ex.id"
                    @click="toggle(ex.id)">
                    <span class="flex-1 min-w-0">
                        <span class="block text-white font-semibold truncate">{{ ex.name }}</span>
                        <span class="block text-xs text-gray-400 truncate">{{ ex.muscleGroup }} · {{ ex.equipment
                            }}</span>
                    </span>
                    <span class="text-gray-500 transition-transform" :class="openId === ex.id ? 'rotate-90' : ''"
                        aria-hidden="true">›</span>
                </button>

                <div v-if="openId === ex.id" class="px-4 pb-4 flex flex-col gap-3 text-sm">
                    <p class="text-gray-200">{{ ex.description }}</p>

                    <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                            <dt class="stat-label">Default</dt>
                            <dd class="text-white">{{ defaultLabel(ex) }}</dd>
                        </div>
                        <div>
                            <dt class="stat-label">Rest</dt>
                            <dd class="text-white">{{ formatSeconds(ex.restSeconds) }}</dd>
                        </div>
                        <div>
                            <dt class="stat-label">Tempo</dt>
                            <dd class="text-white">{{ ex.tempo }}</dd>
                        </div>
                        <div>
                            <dt class="stat-label">Secondary</dt>
                            <dd class="text-white">{{ ex.secondaryMuscle || '—' }}</dd>
                        </div>
                    </dl>

                    <div v-if="ex.progressionPath">
                        <p class="stat-label mb-0.5">Progression</p>
                        <p class="text-gray-200">{{ ex.progressionPath }}</p>
                    </div>

                    <div v-if="usedIn.get(ex.id)?.length">
                        <p class="stat-label mb-1">Used in</p>
                        <div class="flex flex-wrap gap-1.5">
                            <RouterLink v-for="w in usedIn.get(ex.id)" :key="w.id" :to="`/workout/${w.id}`"
                                class="text-xs px-2.5 py-1.5 rounded-full bg-gray-700 text-indigo-300">
                                {{ w.name }}</RouterLink>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <WatchLink :exercise="ex" />
                        <RouterLink v-if="loggedIds.has(ex.id)"
                            :to="{ name: 'exerciseHistory', params: { exerciseId: ex.id } }"
                            class="header-btn">Your history</RouterLink>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>
