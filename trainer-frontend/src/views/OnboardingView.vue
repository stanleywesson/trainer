<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PLANS, type PlanId } from '@/data/plans'
import type { WorkoutLocation } from '@/data'
import { useCalendarStore } from '@/stores/calendar'
import { formatDayLong, nextMonday, toKey, todayKey } from '@/utils/date'

const router = useRouter()
const calendar = useCalendarStore()

const step = ref<1 | 2 | 3>(1)
const plan = ref<PlanId | null>(null)
const location = ref<WorkoutLocation | null>(null)
const startDate = ref(toKey(nextMonday()))

const locations: { value: WorkoutLocation, label: string, detail: string }[] = [
    { value: 'home', label: '🏠 Home', detail: 'No gear needed: floor, a chair, a sturdy table and a door.' },
    { value: 'gym', label: '🏋️ Gym', detail: 'Machines, barbells and dumbbells, with weight tracking.' },
]

const week = [
    { day: 'Mon', what: 'Strength' }, { day: 'Tue', what: 'Run' }, { day: 'Wed', what: 'Strength' },
    { day: 'Thu', what: 'Run' }, { day: 'Fri', what: 'Strength' }, { day: 'Sat', what: 'Rest' }, { day: 'Sun', what: 'Long run' },
]

const canContinue = computed(() =>
    step.value === 1 ? plan.value !== null : step.value === 2 ? location.value !== null : startDate.value >= todayKey())

function next() {
    if (step.value === 1 && plan.value === 'custom') return finish()
    if (step.value < 3) step.value = (step.value + 1) as 2 | 3
    else finish()
}

function back() {
    if (step.value > 1) step.value = (step.value - 1) as 1 | 2
}

function finish() {
    calendar.setup(plan.value ?? 'custom', location.value ?? 'home', plan.value === 'custom' ? todayKey() : startDate.value)
    router.replace({ name: 'home' })
}

function skip() {
    plan.value = 'custom'
    finish()
}
</script>

<template>
    <div class="flex-1 flex flex-col">
        <header class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center justify-between">
            <button v-if="step > 1" class="header-btn" @click="back">← Back</button>
            <span v-else class="text-sm text-gray-500">Welcome</span>
            <button class="text-sm text-gray-400 font-semibold min-h-11 px-2" @click="skip">Skip</button>
        </header>

        <main class="flex-1 px-safe pt-3 pb-4 flex flex-col gap-6">
            <!-- Step indicator -->
            <div class="flex gap-2">
                <span v-for="n in (plan === 'custom' ? 1 : 3)" :key="n"
                    :class="['h-1.5 flex-1 rounded-full', n <= step ? 'bg-indigo-500' : 'bg-gray-700']"></span>
            </div>

            <!-- 1: plan -->
            <template v-if="step === 1">
                <div>
                    <h1 class="text-3xl font-bold text-white">Choose your plan</h1>
                    <p class="text-gray-400 mt-1">It fills your calendar with workouts, runs and rest days. You can
                        change it any time.</p>
                </div>
                <button v-for="p in PLANS" :key="p.id" @click="plan = p.id" :class="[
                    'text-left rounded-2xl p-4 border-2 flex flex-col gap-1 transition-colors',
                    plan === p.id ? 'border-indigo-500 bg-indigo-950/40' : 'border-gray-700 bg-gray-800'
                ]">
                    <span class="text-xl font-bold text-white">{{ p.name }}</span>
                    <span class="text-sm font-semibold text-indigo-300">{{ p.tagline }}</span>
                    <span class="text-sm text-gray-400">{{ p.description }}</span>
                </button>
            </template>

            <!-- 2: location -->
            <template v-else-if="step === 2">
                <div>
                    <h1 class="text-3xl font-bold text-white">Where do you train?</h1>
                    <p class="text-gray-400 mt-1">Runs are the same either way.</p>
                </div>
                <button v-for="l in locations" :key="l.value" @click="location = l.value" :class="[
                    'text-left rounded-2xl p-4 border-2 flex flex-col gap-1 transition-colors',
                    location === l.value ? 'border-indigo-500 bg-indigo-950/40' : 'border-gray-700 bg-gray-800'
                ]">
                    <span class="text-xl font-bold text-white">{{ l.label }}</span>
                    <span class="text-sm text-gray-400">{{ l.detail }}</span>
                </button>
            </template>

            <!-- 3: start date -->
            <template v-else>
                <div>
                    <h1 class="text-3xl font-bold text-white">When do you start?</h1>
                    <p class="text-gray-400 mt-1">Every week follows the same rhythm:</p>
                </div>
                <div class="grid grid-cols-7 gap-1.5">
                    <div v-for="d in week" :key="d.day" :class="['rounded-xl py-2 flex flex-col items-center gap-1',
                        d.what === 'Strength' ? 'bg-indigo-500/15' : d.what === 'Rest' ? 'bg-gray-800' : 'bg-emerald-500/15']">
                        <span class="text-xs font-bold text-white">{{ d.day }}</span>
                        <span class="text-[10px] text-gray-400 text-center leading-tight">{{ d.what }}</span>
                    </div>
                </div>
                <label class="flex flex-col gap-2">
                    <span class="text-sm font-semibold text-gray-300">Start date</span>
                    <input v-model="startDate" type="date" :min="todayKey()"
                        class="h-12 rounded-xl bg-gray-800 border border-gray-700 px-4 text-white font-semibold focus:outline-none focus:border-indigo-500" />
                    <span class="text-xs text-gray-500">{{ formatDayLong(startDate) }}. Days before this in the
                        first week are left empty.</span>
                </label>
            </template>
        </main>

        <footer class="sticky bottom-0 z-20 bg-gray-900/95 backdrop-blur border-t border-gray-800 px-safe pt-3 pb-safe">
            <button @click="next" :disabled="!canContinue" :class="['w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95',
                canContinue ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700']">
                {{ step === 3 || plan === 'custom' ? 'Create my calendar' : 'Continue' }}
            </button>
        </footer>
    </div>
</template>
