<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  navigator.storage?.persist()
})
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white" style="padding-top: env(safe-area-inset-top)">
    <RouterView />
  </div>
</template>