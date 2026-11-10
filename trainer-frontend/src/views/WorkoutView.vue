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
    const row = weights.value[exIdx]!;
    const old = row[setIdx];
    row[setIdx] = value;
    // Changing the active set carries over to the upcoming sets of the same kind that were on the same weight
    if (setIdx !== completed.value[exIdx]) return;
    const kind = specs[exIdx]![setIdx]!.kind;
    for (let j = setIdx + 1; j < row.length; j++) {
        if (specs[exIdx]![j]!.kind === kind && row[j] === old) row[j] = value;
    }
}

/** The exercise whose set is up next in this block (supersets alternate), or null when every set is done */
const upNext = computed(() => {
    let best: number | null = null;
    for (const i of blockIndices.value) {
        if (completed.value[i]! >= specs[i]!.length) continue;
        if (best === null || completed.value[i]! < completed.value[best]!) best = i;
    }
    return best;
});

const anySetDone = computed(() => blockIndices.value.some(i => completed.value[i]! > 0));

const primaryLabel = computed(() => {
    const i = upNext.value;
    if (i === null) return isLastBlock.value ? 'Finish' : isSuperset.value ? 'Next' : 'Next Exercise';
    const setIdx = completed.value[i]!;
    const tag = isSuperset.value ? `${supersetTag(blockIndices.value.indexOf(i))} ` : '';
    const verb = specs[i]![setIdx]!.duration ? '▶ Start' : '✓ Done';
    return `${verb} · ${tag}set ${setIdx + 1} of ${specs[i]!.length}`;
});

function primary() {
    const i = upNext.value;
    if (i === null) next(false);
    else completeSet(i, completed.value[i]!);
}

const secondaryLabel = computed(() => {
    if (!anySetDone.value) return isLastBlock.value ? 'Skip & Finish' : isSuperset.value ? 'Skip this superset' : 'Skip this exercise';
    return isLastBlock.value ? 'Finish now' : 'Move on to the next exercise';
});

function secondary() {
    next(!anySetDone.value);
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

/** Exercises in the current block with sets not marked done */
const unticked = ref<{ exIdx: number, from: number, total: number }[]>([]);

function untickedLabel(u: { exIdx: number, from: number, total: number }) {
    const sets = u.from === u.total ? `Set ${u.from}` : `Sets ${u.from}–${u.total}`;
    return `${sets} of ${u.total} · ${planned[u.exIdx]!.name}`;
}

function next(skipped = false) {
    if (!skipped) {
        const partial = blockIndices.value
            .filter(i => completed.value[i]! < specs[i]!.length)
            .map(i => ({ exIdx: i, from: completed.value[i]! + 1, total: specs[i]!.length }));
        if (partial.length) {
            unticked.value = partial;
            return;
        }
    }
    advance(skipped);
}

/** Answer to the "sets not marked done" prompt */
function resolveUnticked(markDone: boolean) {
    if (markDone) {
        for (const u of unticked.value) completed.value[u.exIdx] = specs[u.exIdx]!.length;
    }
    unticked.value = [];
    advance(false);
}

function advance(skipped: boolean) {
    if (!skipped) {
        completedCount.value += blockIndices.value.filter(i => completed.value[i]! > 0).length;
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
                    :weighted="!!planned[exIdx]!.weighted" :distance="planned[exIdx]!.repType === 'distance'"
                    :up="!isSuperset || upNext === exIdx"
                    :weights="weights[exIdx]!" :reps="repsDone[exIdx]!" class="mt-1"
                    @weight="(s, v) => setWeight(exIdx, s, v)" @reps="(s, v) => setReps(exIdx, s, v)" />

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

        <!-- Sets not ticked: forgot to tap, or really stopped early? -->
        <div v-if="unticked.length" class="fixed inset-0 z-40 bg-black/60 flex items-end" @click.self="unticked = []">
            <div class="w-full bg-gray-800 rounded-t-3xl px-safe pt-5 pb-safe flex flex-col gap-4">
                <div class="flex flex-col gap-1">
                    <h2 class="text-lg font-bold text-white">Not all sets are marked done</h2>
                    <p v-for="u in unticked" :key="u.exIdx" class="text-sm text-gray-300">{{ untickedLabel(u) }}</p>
                    <p class="text-sm text-gray-400 mt-1">Did you do them? Sets left out won't be saved in history.</p>
                </div>
                <button @click="resolveUnticked(true)"
                    class="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg active:scale-95 transition-transform">
                    Yes, mark done</button>
                <div class="flex gap-3">
                    <button @click="unticked = []"
                        class="px-6 py-3 rounded-2xl border border-gray-600 text-gray-200 font-semibold active:scale-95 transition-transform">
                        Back</button>
                    <button @click="resolveUnticked(false)"
                        class="flex-1 py-3 rounded-2xl border border-gray-600 text-gray-200 font-semibold active:scale-95 transition-transform">
                        No, leave them out</button>
                </div>
            </div>
        </div>

        <!-- Navigation -->
        <footer class="sticky bottom-0 z-20 bg-gray-900/95 backdrop-blur border-t border-gray-800 px-safe pt-3 pb-safe">
            <!-- One big button that always does the next thing: log the set that's up, then move on -->
            <button @click="primary"
                :class="['w-full py-4 rounded-2xl text-white font-bold text-lg active:scale-95 transition-transform',
                    upNext === null ? 'bg-emerald-600' : 'bg-indigo-600']">{{ primaryLabel }}</button>
            <button @click="secondary"
                class="w-full py-3 mt-2 rounded-2xl border border-gray-700 text-gray-200 text-sm font-semibold active:scale-95 transition-transform">{{
                    secondaryLabel }}</button>
        </footer>
    </div>
</template>
