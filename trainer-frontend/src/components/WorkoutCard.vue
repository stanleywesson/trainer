<script setup lang="ts">
defineProps<{
  workout: {
    id: string
    name: string
    category: string
    estimatedMinutes: number
    exercises: unknown[]
  }
}>()
</script>

<template>
  <div class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-2 active:scale-95 transition-transform cursor-pointer"
    @click="$router.push(`/workout/${workout.id}`)">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold uppercase tracking-widest text-indigo-400">
        {{ workout.category.replace('_', ' ') }}
      </span>
      <span class="text-xs text-gray-400">{{ workout.estimatedMinutes }} min</span>
    </div>
    <h2 class="text-lg font-bold text-white">{{ workout.name }}</h2>
    <p class="text-sm text-gray-400">{{ workout.exercises.length }} exercises</p>
  </div>
</template>