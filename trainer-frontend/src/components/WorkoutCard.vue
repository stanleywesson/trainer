<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  workout: {
    id: string
    name: string
    category: string
    difficulty: number
    estimatedMinutes: number
    format?: 'sets' | 'circuit' | 'rounds'
    location?: 'home' | 'gym'
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
      <span class="flex items-center gap-2">
        <span class="text-xs font-semibold uppercase tracking-widest text-indigo-400">
          {{ workout.category.replace('_', ' ') }}
        </span>
        <span v-if="workout.format === 'circuit'"
          class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
          Circuit
        </span>
        <span v-if="workout.format === 'rounds'"
          class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
          For time
        </span>
        <span v-if="workout.location === 'gym'"
          class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300">
          Gym
        </span>
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