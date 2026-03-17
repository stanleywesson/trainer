<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    sets: number,
    repType: 'reps' | 'duration' | 'failure',
    defaultDuration?: number,
    reps: number
}>();

const emit = defineEmits<{
    'set-complete': [setNumber: number]
    'all-sets-complete': []
}>();

const completedSets = ref(0);

function repLabel() {
    if (props.repType === 'failure') return 'To Failure'
    if (props.repType === 'duration') return `${props.defaultDuration}s`
    return `${props.reps} reps`
}

function completeSet(index: number) {
    if (index !== completedSets.value)
        return;

    completedSets.value++;
    emit('set-complete', completedSets.value);

    if (completedSets.value === props.sets) {
        emit('all-sets-complete');
    }
}
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between text-sm text-gray-400">
            <span>{{ completedSets }}/{{ sets }} sets complete</span>
            <span>{{ repLabel() }}</span>
        </div>

        <div class="flex gap-3">
            <button v-for="i in sets" :key="i" @click="completeSet(i - 1)" :class="[
                'w-10 h-10 rounded-full border-2 font-bold text-sm transition-all active:scale-90',
                i - 1 < completedSets
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : i - 1 === completedSets
                        ? 'border-indigo-400 text-indigo-400'
                        : 'border-gray-600 text-gray-600'
            ]">
                {{ i }}
            </button>
        </div>
    </div>
</template>