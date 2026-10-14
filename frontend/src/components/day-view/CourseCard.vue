<script setup lang="ts">
import { computed } from 'vue'
import type { DayEvent } from '../../types/api'
import { formatTimeRange } from '../../utils/scheduleExpander'

const props = withDefaults(
  defineProps<{
    event: DayEvent
    top?: number
    height?: number
    // When true the card fills a parent container instead of absolute-positioning itself.
    // Used by the Schedule X #timeGridEvent slot where SX already positions the container.
    embedded?: boolean
  }>(),
  { top: 0, height: 0, embedded: false },
)

const formattedTime = computed(() => {
  const startTime = props.event.start.split(' ')[1] ?? ''
  const endTime = props.event.end.split(' ')[1] ?? ''
  return formatTimeRange(startTime, endTime)
})

const colorClasses = computed(() => {
  switch (props.event.colorTheme) {
    case 'green':
      return {
        bg: 'bg-[#7CE19D]',
        border: 'border-[#1E3A2F]',
      }
    case 'blue':
      return {
        bg: 'bg-[#80C2F8]',
        border: 'border-[#1E293B]',
      }
    case 'purple':
      return {
        bg: 'bg-[#C084FC]',
        border: 'border-[#3B0764]',
      }
    case 'orange':
      return {
        bg: 'bg-[#FB923C]',
        border: 'border-[#7C2D12]',
      }
    default:
      return {
        bg: 'bg-[#80C2F8]',
        border: 'border-[#1E293B]',
      }
  }
})
</script>

<template>
  <div
    class="rounded-2xl p-4 border-[2.5px] shadow-sm flex flex-col justify-start transition-transform hover:scale-[1.01]"
    :class="[
      colorClasses.bg,
      colorClasses.border,
      props.embedded ? 'relative h-full w-full' : 'absolute left-2 right-2',
    ]"
    :style="props.embedded ? {} : { top: `${top}px`, height: `${height}px` }"
  >
    <!-- Course Title -->
    <h3 class="text-xl font-bold text-white tracking-wide leading-tight">
      {{ event.title }}
    </h3>

    <!-- Time & Detail Line -->
    <p class="text-white/95 text-sm font-medium mt-1">
      <span>{{ formattedTime }}</span>
      <span v-if="event.detail"> • {{ event.detail }}</span>
    </p>
  </div>
</template>
