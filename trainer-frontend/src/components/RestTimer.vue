<script setup lang="ts">
import { onUnmounted, ref } from 'vue';

const props = withDefaults(defineProps<{
    seconds: number
    label?: string
    skipLabel?: string
    /** Optional line under the countdown, e.g. the exercise name */
    detail?: string
}>(), { label: 'Rest', skipLabel: 'Skip Rest' });

const emit = defineEmits<{
    'done': [],
    'skip': []
}>();

// Wall clock, not a tick count: timers are suspended while the phone is locked,
// so the countdown has to catch up from the real time when the app wakes.
const endAt = Date.now() + props.seconds * 1000;
const remaining = ref(props.seconds);
let finished = false;

function tick() {
    if (finished) return;
    remaining.value = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    if (remaining.value <= 0) {
        finished = true;
        clearInterval(interval);
        emit('done');
    }
}
const interval = setInterval(tick, 250);

// ---- keep the screen on while counting down ----
let wakeLock: WakeLockSentinel | undefined;
let unmounted = false;
async function requestWakeLock() {
    try {
        const lock = await navigator.wakeLock?.request('screen');
        // The timer may have closed while the request was pending
        if (unmounted) lock?.release().catch(() => { });
        else wakeLock = lock;
    } catch {
        // not supported / denied: timer still works
    }
}
function onVisibility() {
    if (document.visibilityState !== 'visible') return;
    tick();
    // The browser drops the lock when the app is hidden
    if (!finished) requestWakeLock();
}
document.addEventListener('visibilitychange', onVisibility);
requestWakeLock();

onUnmounted(() => {
    unmounted = true;
    clearInterval(interval);
    document.removeEventListener('visibilitychange', onVisibility);
    wakeLock?.release().catch(() => { });
});
</script>

<template>
    <div class="flex flex-col items-center gap-6 py-6">
        <p class="text-gray-400 text-sm uppercase tracking-widest">{{ label }}</p>
        <span class="text-7xl font-bold text-white tabular-nums">{{ remaining }}</span>
        <p v-if="detail" class="text-gray-300 text-center">{{ detail }}</p>

        <div class="w-full bg-gray-700 rounded-full h-2">
            <div class="bg-indigo-500 h-2 rounded-full transition-all"
                :style="{ width: `${(remaining / seconds) * 100}%` }"></div>
        </div>

        <button @click="emit('skip')" class="px-6 py-2 rounded-full border border-gray-500 text-gray-300 text-sm active:scale-95 transition-transform">
            {{ skipLabel }}
        </button>
    </div>
</template>