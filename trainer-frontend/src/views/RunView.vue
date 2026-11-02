<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LogRunDialog from '@/components/LogRunDialog.vue'
import { useCalendarStore } from '@/stores/calendar'
import { jogLabel, jogMinutes, type JogSpec } from '@/data/plans'
import { useIntervalTimer } from '@/composables/useIntervalTimer'

interface Step {
    kind: 'ready' | 'run' | 'walk'
    seconds: number
    repeat: number
}

const route = useRoute()
const router = useRouter()
const calendar = useCalendarStore()

const entry = computed(() => calendar.entries.find(e => e.id === route.params.entryId))
const jog = computed<JogSpec>(() => entry.value?.jog ?? { runSeconds: 20 * 60, walkSeconds: 0, repeats: 1 })

const steps = computed<Step[]>(() => {
    const j = jog.value
    const list: Step[] = [{ kind: 'ready', seconds: 5, repeat: 1 }]
    for (let r = 1; r <= j.repeats; r++) {
        list.push({ kind: 'run', seconds: j.runSeconds, repeat: r })
        // no walk after the final run
        if (j.walkSeconds > 0 && r < j.repeats) list.push({ kind: 'walk', seconds: j.walkSeconds, repeat: r })
    }
    return list
})

const { started, paused, step, activeSeconds, remainingSeconds, stepProgress, overallProgress, start, togglePause, skip, stop } =
    useIntervalTimer(steps, { isWork: s => s.kind === 'run', onFinish: () => done() })

/** Minutes shown in the log dialog (pre-filled from the timer, editable) */
const logMinutes = ref<number | null>(null)

const display = computed(() => {
    const s = remainingSeconds.value
    return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : String(s)
})

const phase = computed(() => {
    switch (step.value?.kind) {
        case 'run': return { label: 'Run', text: 'text-emerald-400', bar: 'bg-emerald-500', ring: 'border-emerald-500/40' }
        case 'walk': return { label: 'Walk', text: 'text-indigo-400', bar: 'bg-indigo-500', ring: 'border-indigo-500/40' }
        default: return { label: 'Get ready', text: 'text-gray-300', bar: 'bg-gray-400', ring: 'border-gray-500/40' }
    }
})

/** Stop the timer and open the log dialog pre-filled with the active time (excludes pauses) */
function done() {
    stop()
    logMinutes.value = Math.max(1, Math.round(activeSeconds() / 60))
}

function saveRun(minutes: number) {
    if (entry.value) calendar.updateEntry(entry.value.id, { done: true, doneMinutes: minutes })
    router.back()
}

function cancel() {
    stop()
    router.back()
}
</script>

<template>
    <div class="flex-1 flex flex-col">
        <header
            class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center justify-between gap-3">
            <h1 class="text-xl font-bold text-white truncate">Run</h1>
            <button v-if="started" class="header-btn shrink-0 !bg-emerald-500/15 !text-emerald-300 !border-emerald-500/40"
                @click="done">Finish & log</button>
            <button v-else class="header-btn shrink-0" @click="cancel">Cancel</button>
        </header>

        <main v-if="!started" class="flex-1 px-safe pt-3 pb-4 flex flex-col gap-6">
            <div class="bg-emerald-950/50 border border-emerald-800/40 rounded-2xl p-4 flex flex-col gap-1">
                <span class="text-xs font-semibold uppercase tracking-widest text-emerald-400">Today's run</span>
                <p class="text-white text-lg font-semibold">{{ jogLabel(jog) }}</p>
                <p class="text-sm text-gray-400">About {{ jogMinutes(jog) }} min. Easy pace: you should be able to
                    hold a conversation.</p>
            </div>
            <p class="text-sm text-gray-400">The phone beeps when it's time to switch between running and walking,
                and counts down the last 3 seconds. Keep the volume up.</p>
        </main>

        <main v-else-if="step" class="flex-1 px-safe pt-3 pb-4 flex flex-col gap-6">
            <div class="flex flex-col gap-2">
                <div class="flex justify-between text-sm text-gray-400">
                    <span>{{ jog.repeats > 1 ? `Interval ${step.repeat} of ${jog.repeats}` : jogLabel(jog) }}</span>
                    <span>{{ Math.round(overallProgress * 100) }}%</span>
                </div>
                <div class="w-full bg-gray-800 rounded-full h-1.5">
                    <div class="bg-gray-400 h-1.5 rounded-full transition-all"
                        :style="{ width: `${overallProgress * 100}%` }"></div>
                </div>
            </div>

            <div :class="['rounded-3xl border-2 bg-gray-800/60 p-8 flex flex-col items-center gap-4', phase.ring]">
                <span :class="['text-lg font-bold uppercase tracking-[0.2em]', phase.text]">
                    {{ paused ? 'Paused' : phase.label }}
                </span>
                <span class="text-8xl font-bold text-white tabular-nums leading-none">{{ display }}</span>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div :class="['h-2 rounded-full transition-[width] duration-200', phase.bar]"
                        :style="{ width: `${stepProgress * 100}%` }"></div>
                </div>
            </div>
        </main>

        <footer class="sticky bottom-0 z-20 bg-gray-900/95 backdrop-blur border-t border-gray-800 px-safe pt-3 pb-safe">
            <button v-if="!started" @click="start"
                class="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-lg active:scale-95 transition-transform">
                Start Run
            </button>
            <div v-else class="flex gap-3">
                <button @click="togglePause" :class="['flex-1 py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform',
                    paused ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-900']">
                    {{ paused ? 'Resume' : 'Pause' }}
                </button>
                <button @click="skip"
                    class="px-6 py-4 rounded-2xl border border-gray-700 text-gray-200 font-semibold active:scale-95 transition-transform">
                    Skip
                </button>
            </div>
        </footer>

        <!-- Cancel discards nothing: the run stays unlogged and you can log it later from the calendar -->
        <LogRunDialog v-if="logMinutes !== null" :default-minutes="logMinutes" @save="saveRun"
            @cancel="router.back()" />
    </div>
</template>
