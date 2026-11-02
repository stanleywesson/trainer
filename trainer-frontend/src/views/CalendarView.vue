<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { workouts, workoutLocation } from '@/data'
import { useCalendarStore } from '@/stores/calendar'
import { addDays, formatDayLong, fromKey, mondayOf, toKey, todayKey } from '@/utils/date'
import EntryRow from '@/components/EntryRow.vue'

const router = useRouter()
const calendar = useCalendarStore()

const selected = ref(todayKey())
const monthCursor = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

const monthLabel = computed(() =>
    monthCursor.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))

/** 6 rows × 7 days (Mon–Sun) covering the visible month */
const grid = computed(() => {
    const first = mondayOf(monthCursor.value)
    return Array.from({ length: 42 }, (_, i) => {
        const d = addDays(first, i)
        return { key: toKey(d), day: d.getDate(), inMonth: d.getMonth() === monthCursor.value.getMonth() }
    })
})

function shiftMonth(delta: number) {
    const m = monthCursor.value
    monthCursor.value = new Date(m.getFullYear(), m.getMonth() + delta, 1)
}

function goToday() {
    selected.value = todayKey()
    monthCursor.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
}

/** Dot colours for a day cell */
function dots(key: string) {
    return calendar.entriesOn(key).map(e => {
        const s = calendar.status(e)
        if (s === 'missed') return 'bg-red-400'
        if (e.type === 'rest') return 'bg-gray-500'
        const base = e.type === 'workout' ? 'bg-indigo-400' : 'bg-emerald-400'
        return s === 'done' ? `${base} ring-2 ring-white/70` : base
    })
}

const selectedEntries = computed(() => calendar.entriesOn(selected.value))

// ---- adding entries ----
const adding = ref<null | 'workout' | 'jog'>(null)
const newWorkoutId = ref('')
const newJogMinutes = ref('30')
const homeWorkouts = workouts.filter(w => workoutLocation(w) === 'home')
const gymWorkouts = workouts.filter(w => workoutLocation(w) === 'gym')

function addWorkout() {
    if (!newWorkoutId.value) return
    calendar.addEntry({ date: selected.value, type: 'workout', workoutId: newWorkoutId.value })
    adding.value = null
    newWorkoutId.value = ''
}

function addJog() {
    const m = parseInt(newJogMinutes.value, 10)
    if (!Number.isFinite(m) || m <= 0) return
    calendar.addEntry({ date: selected.value, type: 'jog', jog: { runSeconds: m * 60, walkSeconds: 0, repeats: 1 } })
    adding.value = null
}

function addRest() {
    calendar.addEntry({ date: selected.value, type: 'rest' })
}

// ---- plan management ----
const showExtend = computed(() => {
    const last = calendar.lastDate
    return calendar.state?.plan !== 'custom' && !!last && last <= toKey(addDays(new Date(), 21))
})

function changePlan() {
    if (!confirm('Change plan? This replaces your calendar, including entries you added or moved. Your workout history is kept.')) return
    calendar.reset()
    router.replace({ name: 'welcome' })
}
</script>

<template>
    <div class="flex-1 flex flex-col">
        <header class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center justify-between gap-3">
            <RouterLink to="/" class="header-btn">← Back</RouterLink>
            <button class="header-btn" @click="goToday">Today</button>
        </header>

        <main class="flex-1 px-safe pt-3 pb-safe flex flex-col gap-5">
            <!-- Month navigation -->
            <div class="flex items-center justify-between">
                <button class="header-btn !px-3" aria-label="Previous month" @click="shiftMonth(-1)">‹</button>
                <h1 class="text-xl font-bold text-white">{{ monthLabel }}</h1>
                <button class="header-btn !px-3" aria-label="Next month" @click="shiftMonth(1)">›</button>
            </div>

            <!-- Grid -->
            <div class="flex flex-col gap-1">
                <div class="grid grid-cols-7 text-center text-[11px] font-semibold text-gray-500 uppercase">
                    <span v-for="d in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="d">{{ d }}</span>
                </div>
                <div class="grid grid-cols-7 gap-1">
                    <button v-for="cell in grid" :key="cell.key" @click="selected = cell.key" :class="[
                        'aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-sm font-semibold transition-colors',
                        cell.key === selected ? 'bg-indigo-600 text-white'
                            : cell.key === todayKey() ? 'bg-gray-700 text-white'
                                : cell.inMonth ? 'bg-gray-800 text-gray-200' : 'bg-gray-800/40 text-gray-600'
                    ]">
                        <span>{{ cell.day }}</span>
                        <span class="flex gap-0.5 h-1.5">
                            <span v-for="(c, i) in dots(cell.key)" :key="i" :class="['w-1.5 h-1.5 rounded-full', c]"></span>
                        </span>
                    </button>
                </div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 pt-1">
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-indigo-400"></span>Workout</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>Run</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-gray-500"></span>Rest</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-gray-300 ring-2 ring-white/70"></span>Done</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-400"></span>Missed</span>
                </div>
            </div>

            <!-- Selected day -->
            <section class="flex flex-col gap-3">
                <h2 class="text-lg font-bold text-white">{{ formatDayLong(selected) }}</h2>
                <EntryRow v-for="entry in selectedEntries" :key="entry.id" :entry="entry" editable />
                <p v-if="selectedEntries.length === 0" class="text-sm text-gray-500">Nothing planned.</p>

                <!-- Add -->
                <div class="flex gap-2">
                    <button @click="adding = adding === 'workout' ? null : 'workout'"
                        class="flex-1 min-h-11 rounded-xl bg-gray-800 border border-gray-700 text-sm font-semibold text-indigo-300">+ Workout</button>
                    <button @click="adding = adding === 'jog' ? null : 'jog'"
                        class="flex-1 min-h-11 rounded-xl bg-gray-800 border border-gray-700 text-sm font-semibold text-emerald-300">+ Run</button>
                    <button @click="addRest"
                        class="flex-1 min-h-11 rounded-xl bg-gray-800 border border-gray-700 text-sm font-semibold text-gray-300">+ Rest</button>
                </div>

                <div v-if="adding === 'workout'" class="flex gap-2">
                    <select v-model="newWorkoutId"
                        class="flex-1 min-w-0 h-11 rounded-xl bg-gray-800 border border-gray-700 px-3 text-white text-sm">
                        <option value="" disabled>Choose a workout…</option>
                        <optgroup label="Home">
                            <option v-for="w in homeWorkouts" :key="w.id" :value="w.id">{{ w.name }} ({{ w.estimatedMinutes }} min)</option>
                        </optgroup>
                        <optgroup label="Gym">
                            <option v-for="w in gymWorkouts" :key="w.id" :value="w.id">{{ w.name }} ({{ w.estimatedMinutes }} min)</option>
                        </optgroup>
                    </select>
                    <button @click="addWorkout" class="px-4 h-11 rounded-xl bg-indigo-600 text-white text-sm font-bold">Add</button>
                </div>

                <div v-if="adding === 'jog'" class="flex gap-2 items-center">
                    <input v-model="newJogMinutes" type="text" inputmode="numeric"
                        class="w-20 h-11 rounded-xl bg-gray-800 border border-gray-700 px-3 text-white text-center font-semibold" />
                    <span class="text-sm text-gray-400 flex-1">min easy run</span>
                    <button @click="addJog" class="px-4 h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold">Add</button>
                </div>
            </section>

            <!-- Plan -->
            <section class="flex flex-col gap-2 border-t border-gray-800 pt-4">
                <button v-if="showExtend" @click="calendar.extend()"
                    class="min-h-11 rounded-xl bg-indigo-600 text-white text-sm font-bold">Extend plan by 12 weeks</button>
                <button @click="changePlan"
                    class="min-h-11 rounded-xl border border-gray-700 text-gray-300 text-sm font-semibold">Change plan</button>
            </section>
        </main>
    </div>
</template>
