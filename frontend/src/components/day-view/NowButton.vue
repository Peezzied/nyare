<script setup lang="ts">
import { ArrowDown, ArrowUp } from '@lucide/vue'
import { computed } from 'vue'

// Floating "jump to now" button for the day and week grids
const props = defineProps<{
  direction: 'up' | 'down'
}>()

const emit = defineEmits<{
  (e: 'jump'): void
}>()

const Icon = computed(() => (props.direction === 'up' ? ArrowUp : ArrowDown))
</script>

<template>
  <button
    type="button"
    class="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-full bg-[#0E7490] px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform active:scale-95"
    @click="emit('jump')"
  >
    <component :is="Icon" class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
    Now
  </button>
</template>
