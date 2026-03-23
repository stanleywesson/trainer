<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  workout: {
    id: string
    name: string
    category: string
    difficulty: number
    estimatedMinutes: number
    exercises: unknown[]
  }
}>();

const difficultyLabels = ['', 'Easy', 'Moderate', 'Hard', 'Very Hard', 'Max Effort'];
const difficultyLabel = computed(() => difficultyLabels[props.workout.difficulty] ?? '');
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
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-400">{{ workout.exercises.length }} exercises</p>
      <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-700 text-indigo-300">
        {{ workout.difficulty }} · {{ difficultyLabel }}
      </span>
    </div>
  </div>
</template>