<script setup lang="ts">
import { computed } from 'vue'
import type { DayEvent } from '../../types/api'

// Compact class pill for the 7-column week grid
const props = defineProps<{
  event: DayEvent
}>()

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
    class="h-full w-full overflow-hidden rounded-md border-[1.5px] px-0.5 py-px text-white shadow-sm"
    :class="colorClasses"
  >
    <p class="truncate text-[10px] font-bold leading-3">{{ event.title }}</p>
    <p v-if="event.detail" class="truncate text-[9px] font-medium leading-3 text-white/90">
      {{ event.detail }}
    </p>
  </div>
</template>
