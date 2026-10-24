<script setup lang="ts">
// Floating "jump to now / today" pill for the day and week grids.
import { ArrowDown, ArrowUp, CalendarDays } from '@lucide/vue'
import { computed } from 'vue'

const props = defineProps<{
  /** 'up'/'down' scroll toward the now-indicator; 'today' returns to the current day. */
  direction: 'up' | 'down' | 'today'
}>()

const emit = defineEmits<{
  (e: 'jump'): void
}>()

const Icon = computed(() =>
  props.direction === 'today' ? CalendarDays : props.direction === 'up' ? ArrowUp : ArrowDown,
)
const label = computed(() => (props.direction === 'today' ? 'Today' : 'Now'))
</script>

<template>
  <button
    type="button"
    class="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-full bg-now px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform active:scale-95"
    @click="emit('jump')"
  >
    <component :is="Icon" class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
    {{ label }}
  </button>
</template>
