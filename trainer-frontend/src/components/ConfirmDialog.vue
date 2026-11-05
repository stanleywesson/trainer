<script setup lang="ts">
defineProps<{
    title: string
    message?: string
    confirmLabel?: string
}>()

const emit = defineEmits<{
    confirm: []
    cancel: []
}>()
</script>

<template>
    <div class="fixed inset-0 z-40 bg-black/60 flex items-end" @click.self="emit('cancel')">
        <div class="w-full bg-gray-800 rounded-t-3xl px-safe pt-5 pb-safe flex flex-col gap-4">
            <div>
                <h2 class="text-lg font-bold text-white">{{ title }}</h2>
                <p v-if="message" class="text-sm text-gray-400">{{ message }}</p>
            </div>
            <div class="flex gap-3">
                <button @click="emit('cancel')"
                    class="px-6 py-4 rounded-2xl border border-gray-600 text-gray-200 font-semibold active:scale-95 transition-transform">
                    Cancel
                </button>
                <button @click="emit('confirm')"
                    class="flex-1 py-4 rounded-2xl bg-red-600 text-white font-bold text-lg active:scale-95 transition-transform">
                    {{ confirmLabel ?? 'Delete' }}
                </button>
            </div>
        </div>
    </div>
</template>
