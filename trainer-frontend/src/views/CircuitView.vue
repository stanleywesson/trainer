<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { circuitLabel, getWorkout, planExercises, type PlannedExercise } from '@/data'
import WatchLink from '@/components/WatchLink.vue'

type StepKind = 'ready' | 'work' | 'rest' | 'roundRest'
interface Step {
    kind: StepKind
    seconds: number
    round: number
    /** exercise being worked (work) or coming up next (ready / rest / roundRest) */
    exercise: PlannedExercise
    exerciseIndex: number
}

const GET_READY_SECONDS = 5

const route = useRoute()
const router = useRouter()

const workout = computed(() => getWorkout(route.params.id))
const exercises = computed(() => planExercises(workout.value))
const circuit = computed(() => workout.value?.circuit ?? { rounds: 1, workSeconds: 40, restSeconds: 20, roundRestSeconds: 60 })

// Flat timeline of every interval in the session
const steps = computed<Step[]>(() => {
    const list: Step[] = []
    const ex = exercises.value
    const c = circuit.value
    if (!ex.length) return list

    list.push({ kind: 'ready', seconds: GET_READY_SECONDS, round: 1, exercise: ex[0]!, exerciseIndex: 0 })
    for (let round = 1; round <= c.rounds; round++) {
        ex.forEach((exercise, i) => {
            list.push({ kind: 'work', seconds: c.workSeconds, round, exercise, exerciseIndex: i })
            const isLastInRound = i === ex.length - 1
            if (!isLastInRound && c.restSeconds > 0) {
                list.push({ kind: 'rest', seconds: c.restSeconds, round, exercise: ex[i + 1]!, exerciseIndex: i + 1 })
            } else if (isLastInRound && round < c.rounds) {
                list.push({ kind: 'roundRest', seconds: c.roundRestSeconds, round: round + 1, exercise: ex[0]!, exerciseIndex: 0 })
            }
        })
    }
    return list
})

const totalWorkSteps = computed(() => steps.value.filter(s => s.kind === 'work').length)

const started = ref(false)
const paused = ref(false)
const stepIndex = ref(0)
const remainingMs = ref(0)
const completedIntervals = ref(0)
const startTime = ref(0)

let endAt = 0
let ticker: ReturnType<typeof setInterval> | undefined
let lastBeepSecond = -1

const step = computed(() => steps.value[stepIndex.value])
const remainingSeconds = computed(() => Math.max(0, Math.ceil(remainingMs.value / 1000)))
const stepProgress = computed(() => step.value ? 1 - remainingMs.value / (step.value.seconds * 1000) : 0)
const overallProgress = computed(() => steps.value.length ? stepIndex.value / steps.value.length : 0)

const phase = computed(() => {
    switch (step.value?.kind) {
        case 'work': return { label: 'Work', text: 'text-emerald-400', bar: 'bg-emerald-500', ring: 'border-emerald-500/40' }
        case 'roundRest': return { label: 'Round break', text: 'text-amber-400', bar: 'bg-amber-500', ring: 'border-amber-500/40' }
        case 'rest': return { label: 'Rest', text: 'text-indigo-400', bar: 'bg-indigo-500', ring: 'border-indigo-500/40' }
        default: return { label: 'Get ready', text: 'text-gray-300', bar: 'bg-gray-400', ring: 'border-gray-500/40' }
    }
})

// ---- sound (unlocked by the Start tap; iOS requires a user gesture) ----
let audio: AudioContext | undefined
function beep(freq = 880, ms = 120) {
    if (!audio) return
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.25, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + ms / 1000)
    osc.connect(gain).connect(audio.destination)
    osc.start()
    osc.stop(audio.currentTime + ms / 1000)
}

// ---- keep the screen on while the timer runs ----
let wakeLock: WakeLockSentinel | undefined
async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock?.request('screen')
    } catch {
        // not supported / denied: timer still works
    }
}
function onVisibility() {
    if (document.visibilityState === 'visible' && started.value && !paused.value) {
        requestWakeLock()
        tick()
    }
}
document.addEventListener('visibilitychange', onVisibility)

// ---- timer ----
function tick() {
    const now = Date.now()
    // catch up if the phone was locked / app was in the background
    while (now >= endAt) {
        if (!advance(false)) return
    }
    remainingMs.value = endAt - now

    const s = remainingSeconds.value
    if (s !== lastBeepSecond && s <= 3 && s >= 1) beep(660, 100)
    lastBeepSecond = s
}

/** Move to the next step. Returns false when the session is finished. */
function advance(skipped: boolean): boolean {
    if (step.value?.kind === 'work' && !skipped) completedIntervals.value++

    if (stepIndex.value >= steps.value.length - 1) {
        finish()
        return false
    }
    stepIndex.value++
    const next = step.value!
    endAt = skipped ? Date.now() + next.seconds * 1000 : endAt + next.seconds * 1000
    remainingMs.value = endAt - Date.now()
    lastBeepSecond = -1
    beep(next.kind === 'work' ? 1046 : 523, next.kind === 'work' ? 300 : 200)
    return true
}

function start() {
    try {
        audio = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
        audio = undefined
    }
    started.value = true
    startTime.value = Date.now()
    stepIndex.value = 0
    endAt = Date.now() + (step.value?.seconds ?? 0) * 1000
    remainingMs.value = endAt - Date.now()
    ticker = setInterval(tick, 200)
    requestWakeLock()
}

function togglePause() {
    if (paused.value) {
        endAt = Date.now() + remainingMs.value
        ticker = setInterval(tick, 200)
        paused.value = false
        requestWakeLock()
    } else {
        clearInterval(ticker)
        remainingMs.value = Math.max(0, endAt - Date.now())
        paused.value = true
    }
}

function skip() {
    if (paused.value) togglePause()
    advance(true)
}

function stop() {
    clearInterval(ticker)
    wakeLock?.release().catch(() => { })
    wakeLock = undefined
}

function finish() {
    stop()
    router.push({
        name: 'summary',
        params: { id: route.params.id },
        query: { startTime: startTime.value, completed: completedIntervals.value },
    })
}

function finishEarly() {
    stop()
    router.push({ name: 'workoutDetail', params: { id: route.params.id } })
}

onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibility)
    audio?.close().catch(() => { })
})
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
            <div class="bg-emerald-950/50 border border-emerald-800/40 rounded-2xl p-4 flex flex-col gap-1">
                <span class="text-xs font-semibold uppercase tracking-widest text-emerald-400">Circuit</span>
                <p class="text-white font-semibold">{{ circuitLabel(circuit) }}</p>
                <p class="text-sm text-gray-400">{{ circuit.roundRestSeconds }}s break between rounds. Sound on
                    for countdown beeps.</p>
            </div>

            <div class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-3">
                <span class="text-xs font-semibold uppercase tracking-widest text-gray-500">Each round</span>
                <div v-for="(exercise, index) in exercises" :key="exercise.id" class="flex items-center gap-3">
                    <span class="text-xs font-bold text-gray-600 w-5 text-right">{{ index + 1 }}</span>
                    <div class="flex flex-col flex-1 min-w-0">
                        <span class="text-white text-sm font-semibold">{{ exercise.name }}</span>
                        <span class="text-gray-500 text-xs">{{ exercise.muscleGroup }}</span>
                    </div>
                    <span class="text-xs font-semibold text-gray-300">{{ circuit.workSeconds }}s</span>
                    <WatchLink :exercise="exercise" compact />
                </div>
            </div>
        </main>

        <!-- Running -->
        <main v-else-if="step" class="flex-1 px-safe pt-3 pb-4 flex flex-col gap-6">
            <!-- Overall progress -->
            <div class="flex flex-col gap-2">
                <div class="flex justify-between text-sm text-gray-400">
                    <span>Round {{ step.round }} of {{ circuit.rounds }}</span>
                    <span>Exercise {{ step.exerciseIndex + 1 }} of {{ exercises.length }}</span>
                </div>
                <div class="w-full bg-gray-800 rounded-full h-1.5">
                    <div class="bg-gray-400 h-1.5 rounded-full transition-all"
                        :style="{ width: `${overallProgress * 100}%` }"></div>
                </div>
            </div>

            <!-- Timer -->
            <div :class="['rounded-3xl border-2 bg-gray-800/60 p-6 flex flex-col items-center gap-4', phase.ring]">
                <span :class="['text-sm font-bold uppercase tracking-[0.2em]', phase.text]">
                    {{ paused ? 'Paused' : phase.label }}
                </span>
                <span class="text-8xl font-bold text-white tabular-nums leading-none">{{ remainingSeconds }}</span>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div :class="['h-2 rounded-full transition-[width] duration-200', phase.bar]"
                        :style="{ width: `${stepProgress * 100}%` }"></div>
                </div>
            </div>

            <!-- Exercise -->
            <div class="bg-gray-800 rounded-2xl p-5 flex flex-col gap-2">
                <span class="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    {{ step.kind === 'work' ? 'Now' : 'Up next' }}
                </span>
                <h2 class="text-2xl font-bold text-white">{{ step.exercise.name }}</h2>
                <span class="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                    {{ step.exercise.muscleGroup }}
                </span>
                <p class="text-gray-400 text-sm">{{ step.exercise.description }}</p>
                <p class="text-sm text-gray-500">Equipment: <span class="text-gray-400">{{ step.exercise.equipment
                }}</span></p>
                <WatchLink v-if="step.kind !== 'work'" :exercise="step.exercise" />
            </div>
        </main>

        <!-- Footer controls -->
        <footer class="sticky bottom-0 z-20 bg-gray-900/95 backdrop-blur border-t border-gray-800 px-safe pt-3 pb-safe">
            <button v-if="!started" @click="start"
                class="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-lg active:scale-95 transition-transform">
                Start Circuit
            </button>
            <div v-else class="flex gap-3">
                <button @click="togglePause"
                    :class="['flex-1 py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform',
                        paused ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-900']">
                    {{ paused ? 'Resume' : 'Pause' }}
                </button>
                <button @click="skip"
                    class="px-6 py-4 rounded-2xl border border-gray-700 text-gray-200 font-semibold active:scale-95 transition-transform">
                    Skip
                </button>
            </div>
            <p v-if="started" class="text-center text-xs text-gray-500 mt-2">
                {{ completedIntervals }} / {{ totalWorkSteps }} intervals done
            </p>
        </footer>
    </div>
</template>
