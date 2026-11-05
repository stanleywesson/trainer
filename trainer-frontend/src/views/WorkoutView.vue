<script setup lang="ts">
import { buildSets, getWorkout, groupBlocks, planExercises, prescriptionLabel, type PlannedExercise, type SetSpec } from '@/data'
import { useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import SetTracker from '@/components/SetTracker.vue';
import RestTimer from '@/components/RestTimer.vue';
import WatchLink from '@/components/WatchLink.vue';
import { useHistoryStore, type ExerciseLog } from '@/stores/history';

const route = useRoute();
const router = useRouter();
const historyStore = useHistoryStore();

const workout = getWorkout(route.params.id);
const planned = planExercises(workout);
const specs: SetSpec[][] = planned.map(buildSets);
/** Blocks of indices into `planned`: one exercise, or a superset group */
const blocks: number[][] = groupBlocks(planned).map(group => group.map(p => planned.indexOf(p)));

const currentBlock = ref(0);
const completed = ref<number[]>(planned.map(() => 0));
const weights = ref<(number | null)[][]>(planned.map((p, i) => prefillWeights(p, specs[i]!)));
/** Actual reps per set, pre-filled with the target (null for max/timed sets until entered) */
const repsDone = ref<(number | null)[][]>(specs.map(sets => sets.map(s => (!s.duration && s.reps) ? s.reps : null)));
const startTime = Date.now();
const completedCount = ref(0);

const showRest = ref(false);
const restSeconds = ref(0);
const timed = ref<{ exIdx: number, setIdx: number, seconds: number, name: string } | null>(null);

const blockIndices = computed(() => blocks[currentBlock.value] ?? []);
const isSuperset = computed(() => blockIndices.value.length > 1);
/** Rest after a set (or after a superset round): taken from the block's last exercise */
const blockRest = computed(() => planned[blockIndices.value[blockIndices.value.length - 1]!]?.restSeconds ?? 0);
const isLastBlock = computed(() => currentBlock.value >= blocks.length - 1);
const nextBlockNames = computed(() =>
    (blocks[currentBlock.value + 1] ?? []).map(i => planned[i]!.name).join(' + '));
const progress = computed(() => blocks.length ? (currentBlock.value + 1) / blocks.length : 0);

/** Same set position from last time this exercise was logged, else the workout's target weight */
function prefillWeights(p: PlannedExercise, sets: SetSpec[]): (number | null)[] {
    if (!p.weighted) return sets.map(() => null);
    const last = historyStore.lastLog(p.id);
    return sets.map((s, i) => {
        const sameKind = last?.sets.filter(x => x.kind === s.kind) ?? [];
        const position = sets.slice(0, i).filter(x => x.kind === s.kind).length;
        const fromLast = sameKind[position]?.weightKg ?? sameKind[sameKind.length - 1]?.weightKg ?? null;
        return fromLast ?? (s.kind === 'warmup' ? null : p.weight ?? null);
    });
}

function setWeight(exIdx: number, setIdx: number, value: number | null) {
    weights.value[exIdx]![setIdx] = value;
}

function setReps(exIdx: number, setIdx: number, value: number | null) {
    repsDone.value[exIdx]![setIdx] = value;
}

function completeSet(exIdx: number, setIdx: number) {
    const spec = specs[exIdx]![setIdx]!;
    if (spec.duration) {
        timed.value = { exIdx, setIdx, seconds: spec.duration, name: planned[exIdx]!.name };
        return;
    }
    markDone(exIdx);
}

function finishTimed() {
    if (!timed.value) return;
    const { exIdx } = timed.value;
    timed.value = null;
    markDone(exIdx);
}

function markDone(exIdx: number) {
    completed.value[exIdx]!++;

    const counts = blockIndices.value.map(i => completed.value[i]!);
    const blockDone = blockIndices.value.every(i => completed.value[i]! >= specs[i]!.length);
    // Supersets rest only after every exercise in the pair has done this round
    const roundDone = counts.every(c => c === counts[0]);
    const rest = blockRest.value;

    if (!blockDone && roundDone && rest > 0) {
        restSeconds.value = rest;
        showRest.value = true;
    }
}

function buildLog(): ExerciseLog[] {
    return planned.flatMap((p, i) => {
        const done = completed.value[i]!;
        if (!done) return [];
        return [{
            exerciseId: p.id,
            exerciseName: p.name,
            ...(p.perSide ? { perSide: true } : {}),
            sets: specs[i]!.slice(0, done).map((s, j) => ({
                kind: s.kind,
                reps: repsDone.value[i]![j] ?? s.reps,
                targetReps: s.reps,
                ...(s.duration ? { durationSeconds: s.duration } : {}),
                ...(p.repType === 'distance' && p.distance ? { distanceMeters: p.distance } : {}),
                weightKg: p.weighted ? weights.value[i]![j] ?? null : null,
            })),
        }];
    });
}

function finishEarly() {
    router.push({ name: 'workoutDetail', params: { id: route.params.id } });
}

function next(skipped = false) {
    if (!skipped) {
        completedCount.value += blockIndices.value.length;
        // "Next" without ticking any set circles = did the exercise as planned: log all its sets
        for (const i of blockIndices.value) {
            if (completed.value[i] === 0) completed.value[i] = specs[i]!.length;
        }
    }

    if (isLastBlock.value) {
        historyStore.pendingLog = buildLog();
        router.push({
            name: 'summary',
            params: { id: route.params.id },
            query: { startTime, completed: completedCount.value },
        });
    } else {
        currentBlock.value++;
        window.scrollTo({ top: 0 });
    }
}

function supersetTag(position: number) {
    return `${planned[blockIndices.value[0]!]!.superset ?? ''}${position + 1}`;
}
</script>

<template>
    <div class="flex-1 flex flex-col">
        <!-- Header -->
        <header
            class="sticky top-0 z-20 bg-gray-900/95 backdrop-blur px-safe pt-safe pb-3 flex items-center justify-between gap-3">
            <h1 class="text-xl font-bold text-white truncate">{{ workout?.name }}</h1>
            <button class="header-btn shrink-0 !bg-red-500/15 !text-red-300 !border-red-500/40"
                @click="finishEarly">Finish Early</button>
        </header>

        <main class="flex-1 px-safe pt-3 pb-4 flex flex-col gap-6">

            <!-- Progress -->
            <div class="flex flex-col gap-2">
                <div class="flex justify-between text-sm text-gray-400">
                    <span>{{ isSuperset ? 'Superset' : 'Exercise' }} {{ currentBlock + 1 }} of {{ blocks.length }}</span>
                    <span>{{ Math.round(progress * 100) }}%</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-indigo-500 h-2 rounded-full transition-all" :style="{ width: `${progress * 100}%` }">
                    </div>
                </div>
            </div>

            <!-- Superset instructions -->
            <div v-if="isSuperset" class="bg-violet-950/50 border border-violet-800/40 rounded-2xl p-4 flex flex-col gap-1">
                <span class="text-xs font-semibold uppercase tracking-widest text-violet-300">Superset</span>
                <p class="text-sm text-gray-200">
                    Alternate: one set of each, back to back, then rest {{ blockRest }}s.
                </p>
            </div>

            <!-- Exercise cards -->
            <div v-for="(exIdx, position) in blockIndices" :key="exIdx"
                class="bg-gray-800 rounded-2xl p-5 flex flex-col gap-3">
                <div class="flex items-center gap-2">
                    <span v-if="isSuperset"
                        class="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200">{{
                            supersetTag(position) }}</span>
                    <span class="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                        {{ planned[exIdx]!.muscleGroup }}
                    </span>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-white">{{ planned[exIdx]!.name }}</h2>
                    <p class="text-sm text-gray-300 font-semibold mt-0.5">{{ prescriptionLabel(planned[exIdx]!) }}</p>
                </div>
                <p class="text-gray-400 text-sm">{{ planned[exIdx]!.description }}</p>
                <WatchLink :exercise="planned[exIdx]!" />

                <SetTracker :sets="specs[exIdx]!" :completed="completed[exIdx]!"
                    :weighted="!!planned[exIdx]!.weighted" :weights="weights[exIdx]!" :reps="repsDone[exIdx]!" class="mt-1"
                    @complete="completeSet(exIdx, $event)" @weight="(s, v) => setWeight(exIdx, s, v)"
                    @reps="(s, v) => setReps(exIdx, s, v)" />

                <div class="text-sm text-gray-400 flex flex-col gap-1">
                    <span><span class="text-gray-500">Tempo: </span>{{ planned[exIdx]!.tempo }}</span>
                    <span><span class="text-gray-500">Equipment: </span>{{ planned[exIdx]!.equipment }}</span>
                    <span><span class="text-gray-500">Progression: </span>{{ planned[exIdx]!.progressionPath }}</span>
                </div>
            </div>

            <!-- Next preview -->
            <div class="bg-gray-800/50 rounded-2xl p-4 flex flex-col gap-1" v-if="nextBlockNames">
                <span class="text-xs text-gray-500 uppercase tracking-widest">Up next</span>
                <span class="text-white font-semibold">{{ nextBlockNames }}</span>
            </div>
        </main>

        <!-- Rest timer -->
        <div v-if="showRest"
            class="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center px-safe pt-safe pb-safe z-30">
            <RestTimer :key="`rest-${restSeconds}-${completed.join()}`" :seconds="restSeconds" @done="showRest = false"
                @skip="showRest = false" />
        </div>

        <!-- Timed set (holds, lunges, cardio warm-up) -->
        <div v-if="timed"
            class="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center px-safe pt-safe pb-safe z-30">
            <RestTimer :key="`timed-${timed.exIdx}-${timed.setIdx}`" :seconds="timed.seconds" label="Go"
                skip-label="Done early" :detail="timed.name" @done="finishTimed" @skip="finishTimed" />
        </div>

        <!-- Navigation -->
        <footer class="sticky bottom-0 z-20 bg-gray-900/95 backdrop-blur border-t border-gray-800 px-safe pt-3 pb-safe">
            <button @click="next(false)"
                class="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg active:scale-95 transition-transform">{{
                    isLastBlock ? 'Finish' : isSuperset ? 'Next' : 'Next Exercise' }}</button>
            <button @click="next(true)"
                class="w-full py-3 mt-2 rounded-2xl border border-gray-700 text-gray-200 text-sm font-semibold active:scale-95 transition-transform">{{
                    isLastBlock ? 'Skip & Finish' : isSuperset ? 'Skip this superset' : 'Skip this exercise' }}</button>
        </footer>
    </div>
</template>
