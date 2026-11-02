<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { circuitLabel, getWorkout, planExercises, type PlannedExercise } from '@/data'
import WatchLink from '@/components/WatchLink.vue'
import { useIntervalTimer } from '@/composables/useIntervalTimer'

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

const completedIntervals = ref(0)

const { started, paused, step, startTime, remainingSeconds, stepProgress, overallProgress, start, togglePause, skip, stop } =
    useIntervalTimer(steps, {
        isWork: s => s.kind === 'work',
        onStepEnd: (s, skipped) => { if (s.kind === 'work' && !skipped) completedIntervals.value++ },
        onFinish: finish,
    })

const phase = computed(() => {
    switch (step.value?.kind) {
        case 'work': return { label: 'Work', text: 'text-emerald-400', bar: 'bg-emerald-500', ring: 'border-emerald-500/40' }
        case 'roundRest': return { label: 'Round break', text: 'text-amber-400', bar: 'bg-amber-500', ring: 'border-amber-500/40' }
        case 'rest': return { label: 'Rest', text: 'text-indigo-400', bar: 'bg-indigo-500', ring: 'border-indigo-500/40' }
        default: return { label: 'Get ready', text: 'text-gray-300', bar: 'bg-gray-400', ring: 'border-gray-500/40' }
    }
})

function finish() {
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
