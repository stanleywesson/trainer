<script setup lang="ts">
import { computed } from 'vue'
import { useCalendarStore } from '@/stores/calendar'
import { todayKey } from '@/utils/date'
import EntryRow from '@/components/EntryRow.vue'

const calendar = useCalendarStore()
const today = computed(() => calendar.entriesOn(todayKey()))
const planName = computed(() => {
    const plan = calendar.state?.plan
    return plan === 'rebuild' ? 'Rebuild' : plan === 'build' ? 'Build' : 'Custom'
})
</script>

<template>
    <section class="flex flex-col gap-3 mb-6">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-lg font-bold text-white">Today</h2>
                <p class="text-xs text-gray-500">{{ planName }} plan</p>
            </div>
            <RouterLink to="/calendar" class="header-btn">📅 Calendar</RouterLink>
        </div>

        <EntryRow v-for="entry in today" :key="entry.id" :entry="entry" />

        <div v-if="today.length === 0" class="rounded-2xl border border-dashed border-gray-700 p-4 text-sm text-gray-400">
            Nothing planned today. Pick a workout below, or add one in the calendar.
        </div>
    </section>
</template>
