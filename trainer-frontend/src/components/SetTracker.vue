<script setup lang="ts">
import type { SetSpec } from '@/data'

const props = defineProps<{
    sets: SetSpec[]
    /** Number of sets done (sets are completed in order) */
    completed: number
    /** Show a kg input per set */
    weighted: boolean
    weights: (number | null)[]
    /** Actual reps per set (pre-filled with the target); null = not entered */
    reps: (number | null)[]
}>();

const emit = defineEmits<{
    complete: [index: number]
    weight: [index: number, value: number | null]
    reps: [index: number, value: number | null]
}>();

const STEP = 2.5

function marker(index: number) {
    const s = props.sets[index]!
    if (s.kind === 'warmup') return 'W'
    if (s.kind === 'drop') return 'D'
    return String(props.sets.slice(0, index + 1).filter(x => x.kind === 'working').length)
}

function onInput(index: number, raw: string) {
    const value = parseFloat(raw.replace(',', '.'))
    emit('weight', index, Number.isFinite(value) && value >= 0 ? value : null)
}

function onReps(index: number, raw: string) {
    const value = parseInt(raw, 10)
    emit('reps', index, Number.isFinite(value) && value >= 0 ? value : null)
}

function nudge(index: number, delta: number) {
    const current = props.weights[index] ?? 0
    const next = Math.max(0, Math.round((current + delta) * 10) / 10)
    emit('weight', index, next === 0 ? null : next)
}
</script>

<template>
    <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between text-sm text-gray-400">
            <span>{{ completed }}/{{ sets.length }} sets complete</span>
            <span class="text-xs text-gray-500">{{ weighted ? 'kg × reps · empty kg = bodyweight' : 'reps done' }}</span>
        </div>

        <div v-for="(set, i) in sets" :key="i" :class="['flex items-center gap-2 rounded-xl px-2 py-1.5',
            i === completed ? 'bg-gray-700/40' : '']">
            <button @click="emit('complete', i)" :disabled="i !== completed"
                :aria-label="`Complete set ${marker(i)}`" :class="[
                    'w-11 h-11 shrink-0 rounded-full border-2 font-bold text-sm transition-all active:scale-90',
                    i < completed
                        ? (set.kind === 'warmup' ? 'bg-gray-500 border-gray-500 text-white' : 'bg-indigo-600 border-indigo-600 text-white')
                        : i === completed
                            ? (set.kind === 'warmup' ? 'border-gray-300 text-gray-200' : set.kind === 'drop' ? 'border-amber-400 text-amber-300' : 'border-indigo-400 text-indigo-300')
                            : 'border-gray-600 text-gray-500'
                ]">
                {{ i < completed ? '✓' : marker(i) }}
            </button>

            <div class="flex-1 min-w-0">
                <p :class="['text-sm font-semibold', set.kind === 'warmup' ? 'text-gray-400' : 'text-white']">{{
                    set.label }}</p>
                <p v-if="set.note" class="text-xs text-amber-300/90">{{ set.note }}</p>
            </div>

            <div v-if="weighted" class="flex items-center shrink-0">
                <button @click="nudge(i, -STEP)" aria-label="Decrease weight"
                    class="w-8 h-11 rounded-l-xl bg-gray-700 text-gray-200 font-bold active:bg-gray-600">−</button>
                <input type="text" inputmode="decimal" :value="weights[i] ?? ''" placeholder="BW"
                    @change="onInput(i, ($event.target as HTMLInputElement).value)" :aria-label="`Weight for set ${marker(i)} in kg`"
                    class="w-12 h-11 bg-gray-900 text-center text-white font-semibold border-y border-gray-700 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500" />
                <button @click="nudge(i, STEP)" aria-label="Increase weight"
                    class="w-8 h-11 rounded-r-xl bg-gray-700 text-gray-200 font-bold active:bg-gray-600">+</button>
            </div>

            <!-- Actual reps (timed sets are logged by the timer instead) -->
            <template v-if="!set.duration">
                <span v-if="weighted" class="text-gray-500 text-sm shrink-0">×</span>
                <input type="text" inputmode="numeric" :value="reps[i] ?? ''" placeholder="reps"
                    @change="onReps(i, ($event.target as HTMLInputElement).value)" :aria-label="`Reps done in set ${marker(i)}`"
                    class="w-12 h-11 shrink-0 rounded-xl bg-gray-900 text-center text-white font-semibold border border-gray-700 placeholder:text-gray-600 placeholder:text-xs focus:outline-none focus:border-indigo-500" />
            </template>
        </div>
    </div>
</template>
