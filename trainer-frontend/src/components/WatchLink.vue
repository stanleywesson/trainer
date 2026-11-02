<script setup lang="ts">
import { computed } from 'vue'
import { videoLink, type Exercise } from '@/data'

const props = withDefaults(defineProps<{
    exercise: Pick<Exercise, 'name' | 'source' | 'videoUrl'>
    /** compact: small icon-only pill for lists */
    compact?: boolean
}>(), { compact: false })

const link = computed(() => videoLink(props.exercise))
</script>

<template>
    <a :href="link.url" target="_blank" rel="noopener noreferrer" @click.stop
        :aria-label="`Watch how to do ${exercise.name}${link.direct ? '' : ' (YouTube search)'}`" :class="[
            'inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-transform active:scale-95',
            'bg-red-600/15 text-red-300 border border-red-500/40',
            compact ? 'w-9 h-9 shrink-0' : 'self-start min-h-11 px-4 text-sm'
        ]">
        <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor" aria-hidden="true">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z" />
        </svg>
        <span v-if="!compact">{{ link.direct ? 'Watch how' : 'Find a how-to video' }}</span>
    </a>
</template>
