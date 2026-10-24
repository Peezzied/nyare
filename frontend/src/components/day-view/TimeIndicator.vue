<script setup lang="ts">
defineProps<{
  top: number // pixel position of the current time
  label: string // current class name, next class, or "No class"
}>()
</script>

<template>
  <div
    class="absolute left-0 right-0 z-20 pointer-events-none flex items-center -translate-y-1/2 transition-all duration-300"
    :style="{ top: `${top}px` }"
  >
    <!-- Dot at left edge of the grid -->
    <div
      class="absolute left-0 w-3.5 h-3.5 rounded-full bg-now translate-x-[-7px] shrink-0"
    />
    <!-- Horizontal indicator line -->
    <div class="h-[2px] bg-now flex-1" />
    <!-- What's on right now -->
    <span
      class="ml-1 shrink-0 rounded-full bg-now px-2 py-0.5 text-[11px] font-bold text-white shadow"
    >
      {{ label }}
    </span>
  </div>
</template>
