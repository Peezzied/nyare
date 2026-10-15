<script setup lang="ts">
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
  <header class="w-full px-5 pt-6 pb-4">
    <div class="flex items-center justify-between">
      <!-- Burger Menu Button -->
      <button
        type="button"
        class="p-2 -ml-2 text-stone-700 hover:text-stone-900 transition-colors focus:outline-none"
        aria-label="Open menu"
        @click="emit('toggleMenu')"
      >
        <svg
          class="w-7 h-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <!-- Date / week title -->
      <h1 class="text-2xl font-bold tracking-tight text-stone-700 font-sans">
        {{ dateTitle }}
      </h1>

      <!-- Day / Week switch: "7" = go to the week, "1" = go to a day -->
      <button
        type="button"
        class="p-2 -mr-2 text-stone-800 hover:text-stone-900 transition-colors focus:outline-none"
        :aria-label="mode === 'day' ? 'Switch to week view' : 'Switch to day view'"
        @click="emit('toggleView')"
      >
        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
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
    </div>

    <!-- Header Divider Line -->
    <div class="mt-4 h-[3px] bg-stone-300 rounded-full w-full" />
  </header>
</template>
