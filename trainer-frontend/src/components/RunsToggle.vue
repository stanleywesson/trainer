<script setup lang="ts">
const on = defineModel<boolean>({ required: true })
</script>

<template>
    <button type="button" role="switch" :aria-checked="on" @click="on = !on"
        class="text-left rounded-2xl p-4 border-2 border-gray-700 bg-gray-800 flex items-center gap-4">
        <span class="flex-1 flex flex-col gap-1">
            <span class="text-base font-bold text-white">🏃 Include runs</span>
            <span class="text-sm text-gray-400">{{ on
                ? 'Easy runs and a weekly long run between strength days.'
                : 'No running: more strength days and a weekly cardio session instead.' }}</span>
        </span>
        <span :class="['shrink-0 w-12 h-7 rounded-full p-1 transition-colors', on ? 'bg-emerald-600' : 'bg-gray-600']">
            <span :class="['block w-5 h-5 rounded-full bg-white transition-transform', on ? 'translate-x-5' : '']"></span>
        </span>
    </button>
</template>
