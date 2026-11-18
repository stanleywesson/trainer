<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PLANS, planWeekAt } from '@/data/plans'
import RunsToggle from '@/components/RunsToggle.vue'
import { useCalendarStore } from '@/stores/calendar'
import { formatDayLong, todayKey } from '@/utils/date'
import type { WorkoutLocation } from '@/data'

const router = useRouter()
const calendar = useCalendarStore()

const info = computed(() => PLANS.find(p => p.id === calendar.state?.plan))
const isCustom = computed(() => calendar.state?.plan === 'custom')

/** 1-based plan week today, after any weeks "Catch me up" skipped */
const planWeek = computed(() => {
    const s = calendar.state
    if (!s || isCustom.value) return null
    const week = planWeekAt(s.startDate, todayKey(), s.skippedWeeks)
    return week >= 0 ? week + 1 : null
})

const notice = ref('')

function catchUp() {
    if (!confirm('Catch me up? Past days stay as they are. If you missed whole weeks, the plan picks up where you left off, '
        + 'and everything from today on follows the latest plan. Workouts or runs you added yourself to upcoming days are replaced.')) return
    const moved = calendar.catchUp()
    notice.value = moved > 0
        ? `All caught up. The plan continues where you left off (${moved} missed ${moved === 1 ? 'week' : 'weeks'} skipped).`
        : 'All caught up. Upcoming days follow the latest plan.'
}

function setRuns(on: boolean) {
    if (!confirm(`${on ? 'Add runs back to' : 'Take runs out of'} your plan? You stay in the same plan week. Past days stay as `
        + 'they are, and everything from today on is rebuilt with the new week. Workouts or runs you added yourself to upcoming '
        + 'days are replaced.')) return
    calendar.setIncludeRuns(on)
    notice.value = on ? 'Runs are back in your plan from today.' : 'Runs are out of your plan from today.'
}

const locations: { value: WorkoutLocation, label: string }[] = [
    { value: 'home', label: '🏠 Home' },
    { value: 'gym', label: '🏋️ Gym' },
]

function setLocation(location: WorkoutLocation) {
    if (location === calendar.state?.location) return
    if (!confirm(`Train ${location === 'gym' ? 'at the gym' : 'at home'} from now on? You stay in the same plan week. Past days `
        + 'stay as they are, and everything from today on is rebuilt with the new workouts. Workouts or runs you added '
        + 'yourself to upcoming days are replaced.')) return
    calendar.setLocation(location)
    notice.value = `Your plan uses ${location === 'gym' ? 'gym' : 'home'} workouts from today.`
}

function changePlan() {
    if (!confirm('Change plan? This replaces your calendar, including entries you added or moved. Your workout history is kept.')) return
    calendar.reset()
    router.replace({ name: 'welcome' })
}
</script>

<template>
    <div class="flex-1 flex flex-col">
        <header class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center gap-3">
            <button @click="router.back()" class="header-btn">← Back</button>
            <h1 class="text-lg font-bold text-white">Your plan</h1>
        </header>

        <main v-if="calendar.state" class="flex-1 px-safe pt-3 pb-safe flex flex-col gap-4">
            <!-- Summary -->
            <section class="rounded-2xl p-4 bg-gray-800 border border-gray-700 flex flex-col gap-1">
                <span class="text-xl font-bold text-white">{{ info?.name ?? 'Custom' }}</span>
                <span class="text-sm font-semibold text-indigo-300">{{ info?.tagline }}</span>
                <span v-if="!isCustom" class="text-sm text-gray-400">
                    {{ calendar.state.location === 'gym' ? '🏋️ Gym' : '🏠 Home' }}
                    · {{ calendar.includeRuns ? 'with runs' : 'no runs' }}
                    <template v-if="planWeek"> · week {{ planWeek }}</template>
                </span>
                <span class="text-xs text-gray-500">Started {{ formatDayLong(calendar.state.startDate) }}</span>
            </section>

            <template v-if="!isCustom">
                <section class="flex flex-col gap-2">
                    <span class="text-sm font-semibold text-gray-300">Where you train</span>
                    <div class="grid grid-cols-2 gap-2">
                        <button v-for="l in locations" :key="l.value" @click="setLocation(l.value)" :class="[
                            'min-h-11 rounded-xl border-2 text-sm font-semibold transition-colors',
                            calendar.state.location === l.value
                                ? 'border-indigo-500 bg-indigo-950/40 text-white' : 'border-gray-700 bg-gray-800 text-gray-300'
                        ]">{{ l.label }}</button>
                    </div>
                </section>

                <RunsToggle :model-value="calendar.includeRuns" @update:model-value="setRuns" />

                <section class="flex flex-col gap-2">
                    <button @click="catchUp"
                        class="min-h-11 rounded-xl border border-indigo-700 text-indigo-300 text-sm font-semibold">Catch me up</button>
                    <p class="text-xs text-gray-500">Missed some days or weeks? Rebuilds your calendar from today so the plan
                        continues where you left off.</p>
                </section>
            </template>

            <p v-if="notice" class="text-sm text-emerald-300 text-center">{{ notice }}</p>

            <section class="flex flex-col gap-2 border-t border-gray-800 pt-4">
                <button @click="changePlan"
                    class="min-h-11 rounded-xl border border-gray-700 text-gray-300 text-sm font-semibold">Change plan</button>
                <p class="text-xs text-gray-500">Start over with a different plan, location or start date. Your workout
                    history is kept.</p>
            </section>
        </main>
    </div>
</template>
