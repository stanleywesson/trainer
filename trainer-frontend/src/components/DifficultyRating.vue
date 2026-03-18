<script setup lang="ts">
defineProps<{
    modelValue: number
}>();

const emit = defineEmits<{
    'update:modelValue': [value: number]
}>();

const labels = ['', 'Easy', 'Moderate', 'Hard', 'Very Hard', 'Max Effort'];
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex justify-between text-xs text-gray-500 uppercase tracking-widest">
            <span>Easy</span>
            <span>Max Effort</span>
        </div>
        <div class="flex gap-2">
            <button v-for="n in 5" :key="n" @click="emit('update:modelValue', n)" :class="[
                'flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95',
                n <= modelValue
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-500'
            ]">
                {{ n }}
            </button>
        </div>
        <p class="text-center text-sm text-indigo-400 h-4">
            {{ modelValue ? labels[modelValue] : '' }}
        </p>
    </div>
</template>