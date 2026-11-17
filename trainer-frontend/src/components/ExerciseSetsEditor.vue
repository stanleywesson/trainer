<script setup lang="ts">
import type { ExerciseLog, LoggedSet } from '@/stores/history'

/** Corrects the sets of one logged exercise: only the numbers, and removing a set. No adding sets. */
const props = defineProps<{
    log: ExerciseLog
    /** Show kg per set, even if every set was saved as bodyweight */
    weighted: boolean
}>()

const emit = defineEmits<{
    change: [index: number, patch: Partial<LoggedSet>]
    remove: [index: number]
}>()

function marker(index: number) {
    const s = props.log.sets[index]!
    if (s.kind === 'warmup') return 'W'
    if (s.kind === 'drop') return 'D'
    return String(props.log.sets.slice(0, index + 1).filter(x => x.kind === 'working').length)
}

/** What the set's main number is: the same rule the read-only table uses */
function field(s: LoggedSet): { key: 'distanceMeters' | 'durationSeconds' | 'reps', unit: string } {
    if (s.distanceMeters) return { key: 'distanceMeters', unit: 'm' }
    if (s.durationSeconds) return { key: 'durationSeconds', unit: 's' }
    return { key: 'reps', unit: 'reps' }
}

function onWeight(index: number, raw: string) {
    const value = parseFloat(raw.replace(',', '.'))
    emit('change', index, { weightKg: Number.isFinite(value) && value > 0 ? Math.round(value * 10) / 10 : null })
}

function onAmount(index: number, raw: string) {
    const set = props.log.sets[index]!
    const { key } = field(set)
    const value = parseInt(raw, 10)
    const clean = Number.isFinite(value) && value >= 0 ? value : 0
    // time and distance of 0 would turn the set into a reps set, so keep the old value
    if (key !== 'reps' && clean === 0) return
    emit('change', index, { [key]: clean })
}
</script>

<template>
    <div class="flex flex-col gap-2">
        <div v-for="(set, i) in log.sets" :key="i" class="flex items-center gap-2">
            <span :class="['w-6 shrink-0 text-sm font-semibold',
                set.kind === 'drop' ? 'text-amber-300' : set.kind === 'warmup' ? 'text-gray-500' : 'text-gray-200']">{{ marker(i) }}</span>

            <label v-if="weighted" class="flex-1 min-w-0 flex items-center gap-1.5">
                <input type="text" inputmode="decimal" :value="set.weightKg ?? ''" placeholder="BW"
                    @change="onWeight(i, ($event.target as HTMLInputElement).value)"
                    :aria-label="`Weight for set ${marker(i)} in kg`"
                    class="w-full min-w-0 h-11 rounded-xl bg-gray-900 text-center text-white font-bold border border-gray-700 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500" />
                <span class="text-xs text-gray-500">kg</span>
            </label>

            <label class="flex-1 min-w-0 flex items-center gap-1.5">
                <input type="text" inputmode="numeric" :value="set[field(set).key] || ''" placeholder="–"
                    @change="onAmount(i, ($event.target as HTMLInputElement).value)"
                    :aria-label="`${field(set).unit === 'reps' ? 'Reps' : field(set).unit === 's' ? 'Seconds' : 'Metres'} for set ${marker(i)}`"
                    class="w-full min-w-0 h-11 rounded-xl bg-gray-900 text-center text-white font-bold border border-gray-700 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500" />
                <span class="w-7 text-xs text-gray-500">{{ field(set).unit }}</span>
            </label>

            <!-- The last set stays: removing whole exercises would change what the workout was -->
            <button v-if="log.sets.length > 1" @click="emit('remove', i)" :aria-label="`Remove set ${marker(i)}`"
                class="w-11 h-11 shrink-0 rounded-xl text-red-300 text-lg font-bold active:bg-red-950/40">✕</button>
            <span v-else class="w-11 shrink-0"></span>
        </div>
    </div>
</template>
