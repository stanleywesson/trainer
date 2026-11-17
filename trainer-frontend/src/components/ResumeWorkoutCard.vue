<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getWorkout } from '@/data'
import { clearActiveWorkout, loadActiveWorkout } from '@/utils/activeWorkout'
import { formatClock } from '@/utils/format'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

/** A workout left unfinished (the app reloaded or was closed): one tap back to where it stopped */
const router = useRouter()
const active = ref(loadActiveWorkout())
const name = computed(() => active.value ? getWorkout(active.value.workoutId)?.name : undefined)
const setsDone = computed(() => active.value?.completed.reduce((n, c) => n + c, 0) ?? 0)
const confirming = ref(false)

function resume() {
    if (!active.value) return
    router.push({ name: 'workout', params: { id: active.value.workoutId }, query: active.value.query })
}

function discard() {
    clearActiveWorkout()
    active.value = null
    confirming.value = false
}
</script>

<template>
    <section v-if="active && name" class="mb-6 rounded-2xl border-2 border-indigo-500 bg-indigo-950/30 p-4 flex flex-col gap-3">
        <div>
            <span class="text-xs font-bold uppercase tracking-widest text-indigo-300">Unfinished workout</span>
            <h2 class="text-lg font-bold text-white">{{ name }}</h2>
            <p class="text-sm text-gray-400">Started {{ formatClock(new Date(active.startTime)) }} · {{ setsDone }} set{{
                setsDone === 1 ? '' : 's' }} done</p>
        </div>
        <div class="flex gap-3">
            <button @click="confirming = true"
                class="px-5 min-h-12 rounded-xl border border-gray-600 text-gray-200 font-semibold">Discard</button>
            <button @click="resume"
                class="flex-1 min-h-12 rounded-xl bg-indigo-600 text-white font-bold active:bg-indigo-500">Resume</button>
        </div>
    </section>

    <ConfirmDialog v-if="confirming" title="Discard this workout?"
        message="The sets you've done won't be saved to history." confirm-label="Discard"
        @confirm="discard" @cancel="confirming = false" />
</template>
