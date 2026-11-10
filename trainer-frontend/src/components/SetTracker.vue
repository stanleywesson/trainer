<script setup lang="ts">
import { ref } from 'vue'
import type { SetSpec } from '@/data'

const props = defineProps<{
    sets: SetSpec[]
    /** Number of sets done (sets are completed in order); the set at this index is the active one */
    completed: number
    /** Show kg per set */
    weighted: boolean
    /** Distance-based exercise: no reps to log */
    distance?: boolean
    /** In a superset: false while the partner exercise is up, so the set card is shown as waiting */
    up?: boolean
    weights: (number | null)[]
    /** Actual reps per set (pre-filled with the target); null = not entered */
    reps: (number | null)[]
}>();

const emit = defineEmits<{
    weight: [index: number, value: number | null]
    reps: [index: number, value: number | null]
}>();

const STEP = 2.5
/** A done set opened for correction */
const editing = ref<number | null>(null)

function marker(index: number) {
    const s = props.sets[index]!
    if (s.kind === 'warmup') return 'W'
    if (s.kind === 'drop') return 'D'
    return String(props.sets.slice(0, index + 1).filter(x => x.kind === 'working').length)
}

function hasReps(set: SetSpec) {
    return !set.duration && !props.distance
}

/** "60 kg × 8", "BW × 8", "45s", "max" — one-line summary of a set */
function summary(i: number) {
    const set = props.sets[i]!
    const kg = props.weighted ? (props.weights[i] != null ? `${props.weights[i]} kg` : 'BW') : ''
    const what = hasReps(set) ? (props.reps[i] != null ? `${props.reps[i]}` : 'max') : set.label
    if (!kg) return hasReps(set) ? `${what} reps` : what
    return `${kg} × ${what}`
}

function onWeightInput(index: number, raw: string) {
    const value = parseFloat(raw.replace(',', '.'))
    emit('weight', index, Number.isFinite(value) && value >= 0 ? value : null)
}

function onRepsInput(index: number, raw: string) {
    const value = parseInt(raw, 10)
    emit('reps', index, Number.isFinite(value) && value >= 0 ? value : null)
}

function nudgeWeight(index: number, delta: number) {
    const next = Math.max(0, Math.round(((props.weights[index] ?? 0) + delta) * 10) / 10)
    emit('weight', index, next === 0 ? null : next)
}

function nudgeReps(index: number, delta: number) {
    emit('reps', index, Math.max(0, (props.reps[index] ?? 0) + delta))
}

function toggleEdit(i: number) {
    editing.value = editing.value === i ? null : i
}
</script>

<template>
    <div class="flex flex-col gap-1.5">
        <template v-for="(set, i) in sets" :key="i">
            <!-- Active set, or a done set opened for correction: big steppers -->
            <div v-if="i === completed || i === editing" :class="['rounded-2xl p-3 flex flex-col gap-3 border-2 transition-colors',
                i === editing ? 'border-gray-600 bg-gray-900/60'
                    : up === false ? 'border-gray-700 bg-gray-900/40'
                        : set.kind === 'drop' ? 'border-amber-400/70 bg-amber-950/20'
                            : set.kind === 'warmup' ? 'border-gray-400/60 bg-gray-900/60' : 'border-indigo-500 bg-indigo-950/30']">
                <div class="flex items-baseline justify-between gap-2">
                    <span :class="['text-xs font-bold uppercase tracking-widest',
                        i === editing ? 'text-gray-400' : set.kind === 'drop' ? 'text-amber-300' : set.kind === 'warmup' ? 'text-gray-300' : 'text-indigo-300']">
                        {{ i === editing ? 'Fixing ' : '' }}{{ set.kind === 'warmup' ? 'Warm-up' : set.kind === 'drop' ? 'Drop set' : `Set ${marker(i)}` }}
                        <span class="text-gray-500 normal-case tracking-normal font-semibold">· {{ i + 1 }} of {{ sets.length }}</span>
                    </span>
                    <span class="text-sm text-gray-300 font-semibold text-right">{{ set.label }}</span>
                </div>
                <p v-if="set.note" class="text-xs text-amber-300/90 -mt-2">{{ set.note }}</p>

                <div v-if="weighted" class="flex items-center gap-3">
                    <span class="w-10 text-sm text-gray-400">kg</span>
                    <button @click="nudgeWeight(i, -STEP)" aria-label="Decrease weight"
                        class="w-14 h-12 rounded-xl bg-gray-700 text-white text-xl font-bold active:bg-gray-600">−</button>
                    <input type="text" inputmode="decimal" :value="weights[i] ?? ''" placeholder="BW"
                        @change="onWeightInput(i, ($event.target as HTMLInputElement).value)"
                        :aria-label="`Weight for set ${marker(i)} in kg`"
                        class="flex-1 min-w-0 h-12 rounded-xl bg-gray-900 text-center text-white text-xl font-bold border border-gray-700 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500" />
                    <button @click="nudgeWeight(i, STEP)" aria-label="Increase weight"
                        class="w-14 h-12 rounded-xl bg-gray-700 text-white text-xl font-bold active:bg-gray-600">+</button>
                </div>

                <div v-if="hasReps(set)" class="flex items-center gap-3">
                    <span class="w-10 text-sm text-gray-400">reps</span>
                    <button @click="nudgeReps(i, -1)" aria-label="One rep fewer"
                        class="w-14 h-12 rounded-xl bg-gray-700 text-white text-xl font-bold active:bg-gray-600">−</button>
                    <input type="text" inputmode="numeric" :value="reps[i] ?? ''" placeholder="max"
                        @change="onRepsInput(i, ($event.target as HTMLInputElement).value)"
                        :aria-label="`Reps done in set ${marker(i)}`"
                        class="flex-1 min-w-0 h-12 rounded-xl bg-gray-900 text-center text-white text-xl font-bold border border-gray-700 placeholder:text-gray-600 placeholder:text-base focus:outline-none focus:border-indigo-500" />
                    <button @click="nudgeReps(i, 1)" aria-label="One rep more"
                        class="w-14 h-12 rounded-xl bg-gray-700 text-white text-xl font-bold active:bg-gray-600">+</button>
                </div>

                <button v-if="i === editing" @click="editing = null"
                    class="self-end px-4 py-2 rounded-xl border border-gray-600 text-gray-200 text-sm font-semibold">Close</button>
            </div>

            <!-- Done set: read-only line, tap to fix -->
            <button v-else-if="i < completed" @click="toggleEdit(i)"
                class="flex items-center gap-3 px-3 min-h-11 rounded-xl text-left active:bg-gray-700/40">
                <span :class="['w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white',
                    set.kind === 'warmup' ? 'bg-gray-500' : 'bg-indigo-600']">✓</span>
                <span class="w-6 text-sm text-gray-500 font-semibold">{{ marker(i) }}</span>
                <span class="flex-1 text-sm text-gray-200 font-semibold">{{ summary(i) }}</span>
                <span class="text-xs text-gray-500">edit</span>
            </button>

            <!-- Upcoming set: dimmed, read-only -->
            <div v-else class="flex items-center gap-3 px-3 min-h-9 text-gray-500">
                <span class="w-7 h-7 shrink-0 rounded-full border border-gray-700 flex items-center justify-center text-xs font-bold">{{ marker(i) }}</span>
                <span class="w-6"></span>
                <span class="flex-1 text-sm">{{ summary(i) }}</span>
            </div>
        </template>
    </div>
</template>
