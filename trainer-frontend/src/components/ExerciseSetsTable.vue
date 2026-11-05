<script setup lang="ts">
import { computed } from 'vue'
import type { ExerciseLog, LoggedSet } from '@/stores/history'
import { formatDistance } from '@/data'

const props = defineProps<{ log: ExerciseLog }>()

/** Older sessions only stored the target, so we can't tell what was actually done */
const hasActual = computed(() => props.log.sets.some(s => s.targetReps !== undefined))
const weighted = computed(() => props.log.sets.some(s => s.weightKg != null))

function marker(index: number) {
    const s = props.log.sets[index]!
    if (s.kind === 'warmup') return 'W'
    if (s.kind === 'drop') return 'D'
    return String(props.log.sets.slice(0, index + 1).filter(x => x.kind === 'working').length)
}

function amount(s: LoggedSet) {
    if (s.distanceMeters) return formatDistance(s.distanceMeters)
    if (s.durationSeconds) return `${s.durationSeconds}s`
    return s.reps ? String(s.reps) : '–'
}

/** Show the target next to reps only when they differ */
function target(s: LoggedSet) {
    if (s.durationSeconds || s.distanceMeters || s.targetReps === undefined) return ''
    if (s.targetReps === 0) return 'max'
    return s.targetReps !== s.reps ? `of ${s.targetReps}` : ''
}

const workSets = computed(() => props.log.sets.filter(s => s.kind !== 'warmup'))
const totalReps = computed(() => workSets.value.reduce((n, s) => n + (s.durationSeconds ? 0 : s.reps), 0))
const totalTime = computed(() => workSets.value.reduce((n, s) => n + (s.durationSeconds ?? 0), 0))
const totalDistance = computed(() => workSets.value.reduce((n, s) => n + (s.distanceMeters ?? 0), 0))
const volume = computed(() => workSets.value.reduce((n, s) => n + (s.weightKg ?? 0) * (s.durationSeconds ? 0 : s.reps), 0))
const topWeight = computed(() => Math.max(0, ...workSets.value.map(s => s.weightKg ?? 0)))
</script>

<template>
    <div class="flex flex-col gap-2">
        <table class="w-full text-sm tabular-nums">
            <thead>
                <tr class="text-[10px] uppercase tracking-widest text-gray-500">
                    <th class="text-left font-semibold pb-1 w-10">Set</th>
                    <th v-if="weighted" class="text-right font-semibold pb-1">Weight</th>
                    <th class="text-right font-semibold pb-1">{{ log.sets.some(s => s.distanceMeters) ? 'Distance'
                        : log.sets.some(s => s.durationSeconds) ? 'Time' : 'Reps' }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(set, i) in log.sets" :key="i"
                    :class="['border-t border-gray-700/60', set.kind === 'warmup' ? 'text-gray-500' : 'text-gray-100']">
                    <td :class="['py-1.5 font-semibold', set.kind === 'drop' ? 'text-amber-300' : '']">{{ marker(i) }}</td>
                    <td v-if="weighted" class="py-1.5 text-right font-semibold">
                        {{ set.weightKg != null ? `${set.weightKg} kg` : 'BW' }}</td>
                    <td class="py-1.5 text-right">
                        <span class="font-semibold">{{ amount(set) }}</span>
                        <span v-if="target(set)" class="text-xs text-gray-500 ml-1">{{ target(set) }}</span>
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <span>{{ workSets.length }} work set{{ workSets.length !== 1 ? 's' : '' }}</span>
            <span v-if="totalReps">{{ totalReps }} reps{{ log.perSide ? ' per side' : '' }}</span>
            <span v-if="totalTime">{{ totalTime }}s total</span>
            <span v-if="totalDistance">{{ formatDistance(totalDistance) }} total</span>
            <span v-if="topWeight">Top {{ topWeight }} kg</span>
            <span v-if="volume">Volume {{ Math.round(volume) }} kg</span>
        </div>
        <p v-if="!hasActual" class="text-[11px] text-gray-500">Logged before actual reps were recorded: reps shown are the plan's targets.</p>
    </div>
</template>
