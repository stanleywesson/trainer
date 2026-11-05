<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
    /** Pre-filled minutes (the planned run time) */
    defaultMinutes: number
}>()

const emit = defineEmits<{
    save: [minutes: number, distanceKm: number | null]
    cancel: []
}>()

const quick = [20, 30, 45]
const minutes = ref<string>(String(props.defaultMinutes || ''))
const distance = ref<string>('')

function save() {
    const m = parseInt(minutes.value, 10)
    const km = parseFloat(distance.value.replace(',', '.'))
    if (Number.isFinite(m) && m > 0) emit('save', m, Number.isFinite(km) && km > 0 ? Math.round(km * 100) / 100 : null)
}
</script>

<template>
    <div class="fixed inset-0 z-40 bg-black/60 flex items-end" @click.self="emit('cancel')">
        <div class="w-full bg-gray-800 rounded-t-3xl px-safe pt-5 pb-safe flex flex-col gap-4">
            <div>
                <h2 class="text-lg font-bold text-white">Log your run</h2>
                <p class="text-sm text-gray-400">How long did you run? (from your watch, or a guess)</p>
            </div>

            <div class="flex gap-2">
                <button v-for="q in quick" :key="q" @click="minutes = String(q)" :class="[
                    'flex-1 py-3 rounded-xl font-semibold transition-colors',
                    minutes === String(q) ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-200'
                ]">{{ q }} min</button>
            </div>

            <div class="flex gap-3">
                <label class="flex-1 flex items-center gap-2 min-w-0">
                    <input v-model="minutes" type="text" inputmode="numeric" placeholder="Minutes"
                        class="w-full min-w-0 h-12 rounded-xl bg-gray-900 border border-gray-700 px-4 text-white text-lg font-semibold focus:outline-none focus:border-emerald-500" />
                    <span class="text-gray-400 shrink-0">min</span>
                </label>
                <label class="flex-1 flex items-center gap-2 min-w-0">
                    <input v-model="distance" type="text" inputmode="decimal" placeholder="Optional"
                        aria-label="Distance in kilometres (optional)"
                        class="w-full min-w-0 h-12 rounded-xl bg-gray-900 border border-gray-700 px-4 text-white text-lg font-semibold placeholder:text-sm placeholder:font-normal placeholder:text-gray-600 focus:outline-none focus:border-emerald-500" />
                    <span class="text-gray-400 shrink-0">km</span>
                </label>
            </div>

            <div class="flex gap-3">
                <button @click="emit('cancel')"
                    class="px-6 py-4 rounded-2xl border border-gray-600 text-gray-200 font-semibold active:scale-95 transition-transform">
                    Cancel
                </button>
                <button @click="save"
                    class="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-lg active:scale-95 transition-transform">
                    Save run
                </button>
            </div>
        </div>
    </div>
</template>
