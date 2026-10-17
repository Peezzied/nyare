<script setup lang="ts">
import { Menu } from '@lucide/vue'

defineProps<{
  dateTitle: string
  mode: 'day' | 'week'
}>()

const emit = defineEmits<{
  (e: 'toggleMenu'): void
  (e: 'toggleView'): void
}>()
</script>

<template>
  <header
    class="flex h-14 w-full items-center justify-between border-b-[3px] border-(--color-app-border) bg-(--color-app-bg) px-4"
  >
    <!-- Burger Menu Button -->
    <button
      type="button"
      class="flex h-11 w-11 items-center justify-center rounded-lg text-(--color-text-main) transition-colors hover:bg-black/5 active:bg-black/10"
      aria-label="Open menu"
      @click="emit('toggleMenu')"
    >
      <Menu class="h-6 w-6" />
    </button>

    <!-- Date / week title -->
    <h1 class="text-xl font-bold tracking-tight text-(--color-text-main)">
      {{ dateTitle }}
    </h1>

    <!-- Day / Week switch: "7" = go to the week, "1" = go to a day -->
    <button
      type="button"
      class="flex h-11 w-11 items-center justify-center rounded-lg text-(--color-text-main) transition-colors hover:bg-black/5 active:bg-black/10"
      :aria-label="mode === 'day' ? 'Switch to week view' : 'Switch to day view'"
      @click="emit('toggleView')"
    >
      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          d="M19 4h-1V2h-2v2H8V2H6v2H5C3.89 4 3 4.9 3 6v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"
        />
        <text
          x="12"
          y="17.5"
          font-size="8.5"
          font-weight="bold"
          text-anchor="middle"
          fill="currentColor"
        >
          {{ mode === 'day' ? '7' : '1' }}
        </text>
      </svg>
    </button>
  </header>
</template>
