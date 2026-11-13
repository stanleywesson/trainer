<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getWorkout, planExercises } from '@/data'
import { jogLabel, jogMinutes, type CalendarEntry } from '@/data/plans'
import { useCalendarStore } from '@/stores/calendar'
import LogRunDialog from '@/components/LogRunDialog.vue'

const props = defineProps<{
    entry: CalendarEntry
    /** Show move / delete controls */
    editable?: boolean
}>()

const router = useRouter()
const calendar = useCalendarStore()
const logging = ref(false)

const workout = computed(() => props.entry.workoutId ? getWorkout(props.entry.workoutId) : undefined)
const status = computed(() => calendar.status(props.entry))

const title = computed(() => {
    if (props.entry.type === 'workout') return workout.value?.name ?? 'Workout'
    if (props.entry.type === 'jog') return 'Run'
    return 'Rest day'
})

const subtitle = computed(() => {
    const e = props.entry
    if (e.type === 'workout') {
        if (!workout.value) return ''
        const cap = calendar.setCapOn(e.date)
        const eased = cap !== undefined && planExercises(workout.value).some(p => p.sets > cap)
        return `${workout.value.estimatedMinutes} min · ${workout.value.category}${eased ? ` · ease-in: max ${cap} sets` : ''}`
    }
    if (e.type === 'jog' && e.jog) {
        return e.done && e.doneMinutes ? `Ran ${e.doneMinutes} min · planned: ${jogLabel(e.jog)}` : jogLabel(e.jog)
    }
    return 'Recover: sleep, eat well, maybe a walk'
})

const accent = computed(() => ({
    workout: 'bg-indigo-500',
    jog: 'bg-emerald-500',
    rest: 'bg-gray-500',
}[props.entry.type]))

function openWorkout() {
    // the planned date decides ease-in caps, even when previewing a future session
    if (props.entry.workoutId) router.push({ name: 'workoutDetail', params: { id: props.entry.workoutId }, query: { date: props.entry.date } })
}

function startTimer() {
    router.push({ name: 'run', params: { entryId: props.entry.id } })
}

function saveRun(minutes: number, distanceKm: number | null) {
    calendar.logRun(props.entry.id, minutes, distanceKm)
    logging.value = false
}

function undoRun() {
    calendar.undoRun(props.entry.id)
}

function move(date: string) {
    if (date) calendar.updateEntry(props.entry.id, { date })
}
</script>

<template>
    <div class="flex flex-col gap-3 rounded-2xl bg-gray-800 p-4">
        <div class="flex items-start gap-3">
            <span :class="['w-1.5 self-stretch rounded-full shrink-0', accent]"></span>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <span class="text-white font-semibold truncate">{{ title }}</span>
                    <span v-if="status === 'done'"
                        class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 shrink-0">
                        {{ entry.type === 'rest' ? 'Rested' : 'Done' }}</span>
                    <span v-else-if="status === 'missed'"
                        class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 shrink-0">
                        Missed</span>
                </div>
                <p class="text-sm text-gray-400">{{ subtitle }}</p>
            </div>
        </div>

        <!-- Actions -->
        <div v-if="entry.type !== 'rest' || editable" class="flex flex-wrap gap-2">
            <template v-if="entry.type === 'workout'">
                <button @click="openWorkout"
                    class="px-4 min-h-11 rounded-xl bg-indigo-600 text-white text-sm font-bold active:scale-95 transition-transform">
                    {{ status === 'done' ? 'View' : 'Start' }}</button>
            </template>
            <template v-else-if="entry.type === 'jog'">
                <template v-if="status !== 'done'">
                    <button @click="logging = true"
                        class="px-4 min-h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold active:scale-95 transition-transform">
                        Log run</button>
                    <button @click="startTimer"
                        class="px-4 min-h-11 rounded-xl border border-emerald-500/50 text-emerald-300 text-sm font-semibold active:scale-95 transition-transform">
                        Run timer</button>
                </template>
                <button v-else @click="undoRun"
                    class="px-4 min-h-11 rounded-xl border border-gray-600 text-gray-300 text-sm font-semibold active:scale-95 transition-transform">
                    Undo</button>
            </template>

            <template v-if="editable">
                <label
                    class="relative px-4 min-h-11 rounded-xl border border-gray-600 text-gray-300 text-sm font-semibold inline-flex items-center active:scale-95 transition-transform">
                    Move
                    <input type="date" :value="entry.date" @change="move(($event.target as HTMLInputElement).value)"
                        class="absolute inset-0 opacity-0" aria-label="Move to date" />
                </label>
                <button @click="calendar.removeEntry(entry.id)"
                    class="px-4 min-h-11 rounded-xl border border-red-500/40 text-red-300 text-sm font-semibold active:scale-95 transition-transform">
                    Delete</button>
            </template>
        </div>

        <LogRunDialog v-if="logging" :default-minutes="entry.jog ? jogMinutes(entry.jog) : 30" @save="saveRun"
            @cancel="logging = false" />
    </div>
</template>
