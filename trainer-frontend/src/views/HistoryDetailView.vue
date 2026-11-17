<script setup lang="ts">
import { computed, ref } from 'vue';
import { EDIT_WINDOW_DAYS, useHistoryStore, type ExerciseLog, type LoggedSet } from '@/stores/history';
import { useCalendarStore } from '@/stores/calendar';
import { useRoute, useRouter } from 'vue-router';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import ExerciseSetsTable from '@/components/ExerciseSetsTable.vue';
import ExerciseSetsEditor from '@/components/ExerciseSetsEditor.vue';
import { exercises } from '@/data';
import { formatClock, formatDuration, formatPace } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const historyStore = useHistoryStore();
const calendar = useCalendarStore();
const workout = computed(() => historyStore.getById(route.params.id as string));
const isRun = computed(() => workout.value?.kind === 'run');
const confirming = ref(false);

function deleteSession() {
    if (workout.value) calendar.deleteSession(workout.value.id);
    confirming.value = false;
    router.back();
}

const difficultyLabel = ['', 'Easy', 'Moderate', 'Hard', 'Very Hard', 'Max Effort']
const difficultyColor = ['', 'text-green-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400']

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** Saved time is when the session ended; start = end − duration */
const timeRange = computed(() => {
    const w = workout.value
    if (!w || !w.durationSeconds) return ''
    const end = new Date(w.date)
    const start = new Date(end.getTime() - w.durationSeconds * 1000)
    return `${formatClock(start)} – ${formatClock(end)}`
})

/* Editing: fix the numbers of logged sets, or remove a set, within EDIT_WINDOW_DAYS */
const editing = ref(false);
const draft = ref<ExerciseLog[]>([]);
const showingOriginal = ref(false);
const confirmingRevert = ref(false);
const canEdit = computed(() => !!workout.value && historyStore.canEdit(workout.value));

/** The sets on screen: the draft while editing, else the saved (or original) log */
const shownLog = computed(() => editing.value ? draft.value
    : showingOriginal.value && workout.value?.originalLog ? workout.value.originalLog
        : workout.value?.log ?? []);

const editDeadline = computed(() => {
    if (!workout.value) return '';
    const until = new Date(Date.parse(workout.value.date) + EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    return until.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
});

function formatEdited(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function isWeighted(entry: ExerciseLog) {
    return !!exercises.find(e => e.id === entry.exerciseId)?.weighted || entry.sets.some(s => s.weightKg != null);
}

function startEdit() {
    draft.value = JSON.parse(JSON.stringify(workout.value?.log ?? []));
    showingOriginal.value = false;
    editing.value = true;
}

function changeSet(exIdx: number, setIdx: number, patch: Partial<LoggedSet>) {
    const set = draft.value[exIdx]?.sets[setIdx];
    if (set) Object.assign(set, patch);
}

function removeSet(exIdx: number, setIdx: number) {
    draft.value[exIdx]?.sets.splice(setIdx, 1);
}

function saveEdit() {
    if (workout.value) historyStore.updateLog(workout.value.id, draft.value);
    editing.value = false;
}

function revert() {
    if (workout.value) historyStore.revertLog(workout.value.id);
    showingOriginal.value = false;
    confirmingRevert.value = false;
}

const totals = computed(() => {
    const work = shownLog.value.flatMap(l => l.sets).filter(s => s.kind !== 'warmup')
    return {
        sets: work.length,
        reps: work.reduce((n, s) => n + (s.durationSeconds ? 0 : s.reps), 0),
        volume: Math.round(work.reduce((n, s) => n + (s.weightKg ?? 0) * (s.durationSeconds ? 0 : s.reps), 0)),
    }
})

function openExercise(exerciseId: string) {
    router.push({ name: 'exerciseHistory', params: { exerciseId } })
}
</script>

<template>
    <div class="flex-1 flex flex-col">
        <!-- Header -->
        <header class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center gap-3">
            <button @click="router.back()" class="header-btn">← Back</button>
            <h1 class="flex-1 text-xl font-bold text-white truncate">{{ isRun ? 'Run' : 'Workout' }} Detail</h1>
            <button v-if="canEdit && !editing" @click="startEdit" class="header-btn shrink-0">Edit</button>
            <button v-if="workout && !editing" @click="confirming = true"
                class="header-btn shrink-0 !text-red-300 !border-red-500/40">Delete</button>
        </header>

        <main class="flex-1 px-safe pt-3 pb-safe">

        <!-- Not found -->
        <div v-if="!workout" class="text-center text-gray-500 pt-20">
            Session not found.
        </div>

        <!-- Detail content -->
        <div v-else class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
                <h2 class="text-xl font-bold text-white">{{ workout.workoutName }}</h2>
                <p class="text-gray-400 text-sm">{{ formatDate(workout.date) }}<template v-if="timeRange && !isRun">
                    · {{ timeRange }}</template></p>
                <p v-if="editing" class="text-xs text-gray-400">
                    Fix the numbers or remove a set. Can be changed until {{ editDeadline }}.</p>
                <div v-else-if="workout.editedAt" class="flex flex-wrap items-center gap-x-3 text-xs">
                    <span class="px-2 py-0.5 rounded-full bg-amber-950/50 text-amber-300 font-semibold">
                        Edited {{ formatEdited(workout.editedAt) }}</span>
                    <button v-if="workout.originalLog" @click="showingOriginal = !showingOriginal"
                        class="min-h-11 font-semibold text-indigo-300">{{ showingOriginal ? 'Show current' : 'Show original' }}</button>
                    <button v-if="workout.originalLog" @click="confirmingRevert = true"
                        class="min-h-11 font-semibold text-gray-400">Undo edits</button>
                </div>
                <p v-if="showingOriginal && !editing" class="text-xs text-amber-300/90">Showing the sets as first saved.</p>
            </div>

            <!-- Run -->
            <template v-if="isRun">
                <div class="grid grid-cols-2 gap-3">
                    <div class="stat-tile">
                        <span class="stat-label">Time</span>
                        <span class="stat-value">{{ formatDuration(workout.durationSeconds) }}</span>
                    </div>
                    <div class="stat-tile">
                        <span class="stat-label">Distance</span>
                        <span class="stat-value">{{ workout.distanceKm ? `${workout.distanceKm} km` : '–' }}</span>
                    </div>
                    <div class="stat-tile">
                        <span class="stat-label">Pace</span>
                        <span class="stat-value">{{ workout.distanceKm ? formatPace(workout.durationSeconds, workout.distanceKm) : '–' }}</span>
                    </div>
                    <div class="stat-tile">
                        <span class="stat-label">Logged at</span>
                        <span class="stat-value">{{ formatClock(new Date(workout.date)) }}</span>
                    </div>
                </div>
                <div v-if="workout.plannedRun" class="stat-tile">
                    <span class="stat-label">Planned</span>
                    <span class="text-white font-semibold">{{ workout.plannedRun }}</span>
                </div>
            </template>

            <!-- Workout -->
            <template v-else>
                <div class="grid grid-cols-2 gap-3">
                    <div class="stat-tile">
                        <span class="stat-label">Duration</span>
                        <span class="stat-value">{{ formatDuration(workout.durationSeconds) }}</span>
                    </div>
                    <div class="stat-tile">
                        <span class="stat-label">Difficulty</span>
                        <span class="stat-value"><span :class="difficultyColor[workout.difficulty]">
                            {{ difficultyLabel[workout.difficulty] || '–' }}</span></span>
                    </div>
                    <div class="stat-tile">
                        <span class="stat-label">Exercises</span>
                        <span class="stat-value">{{ workout.completedExercises }}</span>
                    </div>
                    <div class="stat-tile">
                        <span class="stat-label">Work sets</span>
                        <span class="stat-value">{{ totals.sets || '–' }}</span>
                    </div>
                    <div v-if="totals.reps" class="stat-tile">
                        <span class="stat-label">Total reps</span>
                        <span class="stat-value">{{ totals.reps }}</span>
                    </div>
                    <div v-if="totals.volume" class="stat-tile">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">{{ totals.volume.toLocaleString() }} kg</span>
                    </div>
                </div>

                <!-- Each exercise: full set-by-set log; tap the name for that exercise's past sessions -->
                <div v-for="(entry, exIdx) in shownLog" :key="entry.exerciseId"
                    class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-3">
                    <p v-if="editing" class="text-white font-semibold">{{ entry.exerciseName }}<span v-if="entry.perSide"
                            class="text-gray-500 font-normal text-sm"> · per side</span></p>
                    <button v-else @click="openExercise(entry.exerciseId)"
                        class="flex items-center justify-between gap-2 text-left -my-1 py-1 min-h-11">
                        <span class="text-white font-semibold">{{ entry.exerciseName }}<span v-if="entry.perSide"
                                class="text-gray-500 font-normal text-sm"> · per side</span></span>
                        <span class="text-xs font-semibold text-indigo-300 shrink-0">All sessions ›</span>
                    </button>
                    <ExerciseSetsEditor v-if="editing" :log="entry" :weighted="isWeighted(entry)"
                        @change="(i, patch) => changeSet(exIdx, i, patch)" @remove="i => removeSet(exIdx, i)" />
                    <ExerciseSetsTable v-else :log="entry" />
                </div>

                <div v-if="editing" class="sticky bottom-0 -mx-4 px-4 pt-3 pb-safe bg-gray-900/95 backdrop-blur flex gap-3">
                    <button @click="editing = false"
                        class="flex-1 min-h-12 rounded-xl border border-gray-600 text-gray-200 font-semibold">Cancel</button>
                    <button @click="saveEdit"
                        class="flex-1 min-h-12 rounded-xl bg-indigo-600 text-white font-semibold active:bg-indigo-500">Save</button>
                </div>

                <p v-if="!workout.log?.length" class="text-sm text-gray-500 text-center">
                    No set-by-set data was saved for this session. Sessions from v1.3.4 on save every exercise.</p>
            </template>
        </div>
        </main>

        <ConfirmDialog v-if="confirming" :title="`Delete this ${isRun ? 'run' : 'workout'}?`"
            :message="isRun
                ? 'It will be removed from history and the planned run will show as not done again.'
                : 'It will be removed from history. This can\'t be undone.'"
            @confirm="deleteSession" @cancel="confirming = false" />
        <ConfirmDialog v-if="confirmingRevert" title="Undo edits?"
            message="The sets go back to how they were first saved." confirm-label="Undo edits"
            @confirm="revert" @cancel="confirmingRevert = false" />
    </div>
</template>
