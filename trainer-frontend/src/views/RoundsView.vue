<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getWorkout, planExercises, stationLabel } from '@/data'
import WatchLink from '@/components/WatchLink.vue'

const route = useRoute()
const router = useRouter()

const workout = computed(() => getWorkout(route.params.id))
const stations = computed(() => planExercises(workout.value))
const rounds = computed(() => workout.value?.rounds ?? 1)
const totalStations = computed(() => stations.value.length * rounds.value)

// ---- stopwatch (wall clock, so it survives the phone locking) ----
const started = ref(false)
const paused = ref(false)
const now = ref(Date.now())
const startTime = ref(0)
let pausedMs = 0
let pausedAt = 0
let ticker: ReturnType<typeof setInterval> | undefined

/** Active (unpaused) ms since start */
function activeMs(at = now.value) {
    if (!started.value) return 0
    return (paused.value ? pausedAt : at) - startTime.value - pausedMs
}

/** Number of stations completed, across all rounds */
const done = ref(0)
/** activeMs() at each Done tap, for round splits and undo */
const marks = ref<number[]>([])

const round = computed(() => Math.min(rounds.value, Math.floor(done.value / stations.value.length) + 1))
const stationIndex = computed(() => done.value % stations.value.length)
const current = computed(() => stations.value[stationIndex.value])
const next = computed(() => done.value + 1 < totalStations.value ? stations.value[(done.value + 1) % stations.value.length] : undefined)

const elapsed = computed(() => activeMs())
/** Time spent on the current station */
const stationElapsed = computed(() => elapsed.value - (marks.value[done.value - 1] ?? 0))

/** Finished rounds: [{ round, ms }] */
const splits = computed(() => {
    const list: { round: number, ms: number }[] = []
    const n = stations.value.length
    for (let r = 1; r * n <= marks.value.length; r++) {
        list.push({ round: r, ms: marks.value[r * n - 1]! - (marks.value[(r - 1) * n - 1] ?? 0) })
    }
    return list
})

function clock(ms: number) {
    const s = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = String(s % 60).padStart(2, '0')
    return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

// ---- keep the screen on ----
let wakeLock: WakeLockSentinel | undefined
async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock?.request('screen')
    } catch {
        // not supported / denied: stopwatch still works
    }
}
function releaseWakeLock() {
    wakeLock?.release().catch(() => { })
    wakeLock = undefined
}
function onVisibility() {
    if (document.visibilityState === 'visible' && started.value && !paused.value) requestWakeLock()
}
onMounted(() => document.addEventListener('visibilitychange', onVisibility))
onUnmounted(() => {
    clearInterval(ticker)
    releaseWakeLock()
    document.removeEventListener('visibilitychange', onVisibility)
})

function start() {
    started.value = true
    startTime.value = Date.now()
    now.value = startTime.value
    ticker = setInterval(() => { now.value = Date.now() }, 250)
    requestWakeLock()
}

function togglePause() {
    if (paused.value) {
        pausedMs += Date.now() - pausedAt
        paused.value = false
        now.value = Date.now()
        requestWakeLock()
    } else {
        pausedAt = Date.now()
        paused.value = true
        releaseWakeLock()
    }
}

function markDone() {
    if (paused.value) togglePause()
    marks.value.push(activeMs(Date.now()))
    done.value++
    navigator.vibrate?.(60)
    if (done.value >= totalStations.value) finish()
}

function undo() {
    if (!done.value) return
    marks.value.pop()
    done.value--
}

function finish() {
    const active = activeMs(Date.now())
    clearInterval(ticker)
    releaseWakeLock()
    router.push({
        name: 'summary',
        params: { id: route.params.id },
        // summary measures until "now", so shift the start to exclude paused time
        query: { startTime: Date.now() - active, completed: done.value },
    })
}

function finishEarly() {
    if (started.value && done.value > 0) finish()
    else router.push({ name: 'workoutDetail', params: { id: route.params.id } })
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

        <!-- Before starting: overview -->
        <main v-if="!started" class="flex-1 px-safe pt-3 pb-4 flex flex-col gap-6">
            <div class="bg-amber-950/40 border border-amber-800/40 rounded-2xl p-4 flex flex-col gap-1">
                <span class="text-xs font-semibold uppercase tracking-widest text-amber-400">For time</span>
                <p class="text-white font-semibold">{{ rounds }} rounds · {{ stations.length }} stations</p>
                <p class="text-sm text-gray-400">Finish each station, tap Done, move straight on. The clock runs
                    the whole time.</p>
            </div>

            <div class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-3">
                <span class="text-xs font-semibold uppercase tracking-widest text-gray-500">Each round</span>
                <div v-for="(station, index) in stations" :key="index" class="flex items-center gap-3">
                    <span class="text-xs font-bold text-gray-600 w-5 text-right">{{ index + 1 }}</span>
                    <div class="flex flex-col flex-1 min-w-0">
                        <span class="text-white text-sm font-semibold">{{ station.name }}</span>
                        <span class="text-gray-500 text-xs">{{ station.equipment }}</span>
                    </div>
                    <span class="text-xs font-semibold text-gray-300">{{ stationLabel(station) }}</span>
                    <WatchLink :exercise="station" compact />
                </div>
            </div>
        </main>

        <!-- Running -->
        <main v-else-if="current" class="flex-1 px-safe pt-3 pb-4 flex flex-col gap-6">
            <!-- Progress -->
            <div class="flex flex-col gap-2">
                <div class="flex justify-between text-sm text-gray-400">
                    <span>Round {{ round }} of {{ rounds }}</span>
                    <span>Station {{ stationIndex + 1 }} of {{ stations.length }}</span>
                </div>
                <div class="w-full bg-gray-800 rounded-full h-1.5">
                    <div class="bg-amber-500 h-1.5 rounded-full transition-all"
                        :style="{ width: `${(done / totalStations) * 100}%` }"></div>
                </div>
            </div>

            <!-- Stopwatch -->
            <div class="rounded-3xl border-2 border-amber-500/40 bg-gray-800/60 p-6 flex flex-col items-center gap-2">
                <span class="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
                    {{ paused ? 'Paused' : 'Total time' }}
                </span>
                <span class="text-7xl font-bold text-white tabular-nums leading-none">{{ clock(elapsed) }}</span>
                <span class="text-sm text-gray-400 tabular-nums">This station {{ clock(stationElapsed) }}</span>
            </div>

            <!-- Current station -->
            <div class="bg-gray-800 rounded-2xl p-5 flex flex-col gap-2">
                <span class="text-xs font-semibold uppercase tracking-widest text-gray-500">Now</span>
                <div class="flex items-baseline justify-between gap-3">
                    <h2 class="text-2xl font-bold text-white">{{ current.name }}</h2>
                    <span class="text-2xl font-bold text-amber-300 shrink-0">{{ stationLabel(current) }}</span>
                </div>
                <p class="text-gray-400 text-sm">{{ current.description }}</p>
                <p class="text-sm text-gray-500">Equipment: <span class="text-gray-400">{{ current.equipment }}</span></p>
                <WatchLink :exercise="current" />
            </div>

            <!-- Up next -->
            <div v-if="next" class="bg-gray-800/60 rounded-2xl px-5 py-3 flex items-center justify-between gap-3">
                <span class="text-xs font-semibold uppercase tracking-widest text-gray-500">Up next</span>
                <span class="text-sm text-gray-200 font-semibold truncate">{{ next.name }} · {{ stationLabel(next)
                }}</span>
            </div>

            <!-- Round splits -->
            <div v-if="splits.length" class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-2">
                <span class="text-xs font-semibold uppercase tracking-widest text-gray-500">Round splits</span>
                <div v-for="s in splits" :key="s.round" class="flex justify-between text-sm">
                    <span class="text-gray-400">Round {{ s.round }}</span>
                    <span class="text-white font-semibold tabular-nums">{{ clock(s.ms) }}</span>
                </div>
            </div>
        </main>

        <!-- Footer controls -->
        <footer class="sticky bottom-0 z-20 bg-gray-900/95 backdrop-blur border-t border-gray-800 px-safe pt-3 pb-safe">
            <button v-if="!started" @click="start"
                class="w-full py-4 rounded-2xl bg-amber-600 text-white font-bold text-lg active:scale-95 transition-transform">
                Start
            </button>
            <div v-else class="flex flex-col gap-3">
                <button @click="markDone"
                    class="w-full py-5 rounded-2xl bg-emerald-600 text-white font-bold text-xl active:scale-95 transition-transform">
                    {{ done + 1 >= totalStations ? 'Done · Finish' : 'Done' }}
                </button>
                <div class="flex gap-3">
                    <button @click="togglePause"
                        :class="['flex-1 py-3 rounded-2xl font-semibold active:scale-95 transition-transform',
                            paused ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-900']">
                        {{ paused ? 'Resume' : 'Pause' }}
                    </button>
                    <button @click="undo" :disabled="!done"
                        class="px-6 py-3 rounded-2xl border border-gray-700 text-gray-200 font-semibold active:scale-95 transition-transform disabled:opacity-40">
                        Undo
                    </button>
                </div>
            </div>
            <p v-if="started" class="text-center text-xs text-gray-500 mt-2">
                {{ done }} / {{ totalStations }} stations done
            </p>
        </footer>
    </div>
</template>
