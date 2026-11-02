<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  navigator.storage?.persist()
})
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-gray-900 text-white">
    <RouterView />
  </div>
</template>
