<script setup lang="ts">
import { onUnmounted, ref } from 'vue';

const props = defineProps<{
    seconds: number
}>();

const emit = defineEmits<{
    'done': [],
    'skip': []
}>();

const remaining = ref(props.seconds);
const interval = setInterval(() => {
    remaining.value--;
    if (remaining.value <= 0) {
        clearInterval(interval);
        emit('done');
    }
}, 1000);

onUnmounted(() => clearInterval(interval));
</script>

<template>
    <div class="flex flex-col items-center gap-6 py-6">
        <p class="text-gray-400 text-sm uppercase tracking-widest">Rest</p>
        <span class="text-7xl font-bold text-white">{{ remaining }}</span>

        <div class="w-full bg-gray-700 rounded-full h-2">
            <div class="bg-indigo-500 h-2 rounded-full transition-all"
                :style="{ width: `${(remaining / seconds) * 100}%` }"></div>
        </div>

        <button @click="emit('skip')" class="px-6 py-2 rounded-full border border-gray-500 text-gray-300 text-sm active:scale-95 transition-transform">
            Skip Rest
        </button>
    </div>
</template>