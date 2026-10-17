<script setup lang="ts">
import { RouterView } from 'vue-router'

// ponytail: notes pages play an entrance animation on mount; other screens stay instant.
function enterClass(name: unknown, transition: unknown): string | undefined {
  if (transition !== 'note') return undefined
  return name === 'notes'
    ? 'animate-in fade-in duration-200 motion-reduce:animate-none'
    : 'animate-in fade-in slide-in-from-bottom-8 duration-300 motion-reduce:animate-none'
}
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <component
      :is="Component"
      :key="route.path"
      :class="enterClass(route.name, route.meta.transition)"
    />
  </RouterView>
</template>
