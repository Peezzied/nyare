<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DayEvent } from '../../types/calendar'
import { buildMarkerState } from '../../utils/calendarItemDetail'
import CategoryMarker from './CategoryMarker.vue'

// Compact class pill for the 7-column week grid
const props = defineProps<{
  event: DayEvent
}>()

const emit = defineEmits<{
  (e: 'select', event: DayEvent, originRect: DOMRect): void
}>()

const pillRef = ref<HTMLElement | null>(null)

const CLASS_MARKER_LABEL = buildMarkerState('class').label

function handleActivate() {
  const rect = pillRef.value?.getBoundingClientRect()
  if (rect) emit('select', props.event, rect)
}

const colorClasses = computed(() => {
  switch (props.event.colorTheme) {
    case 'green':
      return 'bg-[#7CE19D] border-[#1E3A2F]'
    case 'blue':
      return 'bg-[#80C2F8] border-[#1E293B]'
    case 'purple':
      return 'bg-[#C084FC] border-[#3B0764]'
    case 'orange':
      return 'bg-[#FB923C] border-[#7C2D12]'
    default:
      return 'bg-[#80C2F8] border-[#1E293B]'
  }
})
</script>

<template>
  <div
    ref="pillRef"
    role="button"
    tabindex="0"
    :aria-label="`${CLASS_MARKER_LABEL}: ${event.title}`"
    class="h-full w-full overflow-hidden rounded-md border-[1.5px] px-0.5 py-px text-white shadow-sm cursor-pointer hover:brightness-105 active:scale-[0.98] transition-transform select-none"
    :class="colorClasses"
    @click="handleActivate"
    @keydown.enter.prevent="handleActivate"
    @keydown.space.prevent="handleActivate"
  >
    <div class="flex items-center gap-0.5">
      <CategoryMarker category="class" />
      <p class="min-w-0 truncate text-[10px] font-bold leading-3">{{ event.title }}</p>
    </div>
    <p v-if="event.detail" class="truncate text-[9px] font-medium leading-3 text-white/90">
      {{ event.detail }}
    </p>
  </div>
</template>
