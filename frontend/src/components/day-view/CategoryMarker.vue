<script setup lang="ts">
import { computed } from 'vue'
import { Check, Flag } from '@lucide/vue'
import type { CalendarItemCategory } from '@/types/calendarItemDetail'
import { buildMarkerState } from '@/utils/calendarItemDetail'

const props = withDefaults(
  defineProps<{
    category: CalendarItemCategory
    completed?: boolean
  }>(),
  { completed: false },
)

const marker = computed(() => buildMarkerState(props.category, props.completed))
</script>

<template>
  <!-- Tri-block form: no icon for a class, a flag for an event, a completion box for a task. -->
  <span class="inline-flex shrink-0 items-center justify-center">
    <Flag
      v-if="marker.category === 'event'"
      data-testid="marker-indicator"
      class="h-3 w-3"
      aria-hidden="true"
    />

    <span
      v-else-if="marker.category === 'task'"
      data-testid="marker-indicator"
      class="flex h-3 w-3 items-center justify-center rounded-[3px] border border-current"
      aria-hidden="true"
    >
      <Check v-if="marker.completed" data-testid="marker-check" class="h-2.5 w-2.5" />
    </span>

    <!-- The category name lands in the parent item's accessible name (FR-005). -->
    <span class="sr-only">{{ marker.label }}</span>
  </span>
</template>
