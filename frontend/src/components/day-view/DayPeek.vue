<script setup lang="ts">
import { computed } from 'vue'
import { HOUR_HEIGHT } from '../../constants/calendar'
import type { DayEvent } from '../../types/calendar'
import { calculateGridBoundaries } from '../../utils/scheduleExpander'
import type { UntimedDayItem } from '../../utils/untimedItems'
import AllDayStrip from './AllDayStrip.vue'
import CourseCard from './CourseCard.vue'

// Static preview of a neighbouring day's column, shown only while swiping.
const props = defineProps<{
  events: DayEvent[]
  untimedItems: UntimedDayItem[]
  scrollTop: number // matches the real grid's scroll position
  gutterLeft: number // width of the fixed time axis
}>()

const boundaries = computed(() => calculateGridBoundaries(props.events))

const lineHours = computed(() => {
  const list: number[] = []
  for (let h = boundaries.value.startHour; h < boundaries.value.endHour; h++) list.push(h)
  return list
})

const gridHeight = computed(
  () => (boundaries.value.endHour - boundaries.value.startHour) * HOUR_HEIGHT,
)

function toMinutes(dateTime: string): number {
  const timePart = dateTime.split(' ')[1] ?? '00:00'
  const [h = 0, m = 0] = timePart.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function layout(event: DayEvent) {
  const startMin = toMinutes(event.start)
  const endMin = toMinutes(event.end)
  return {
    top: `${(startMin / 60 - boundaries.value.startHour) * HOUR_HEIGHT}px`,
    height: `${((endMin - startMin) / 60) * HOUR_HEIGHT}px`,
  }
}
</script>

<template>
  <div class="relative h-full w-full" aria-hidden="true">
    <!-- Column only: starts right of the fixed time axis -->
    <div
      class="absolute inset-y-0 right-0 flex flex-col bg-[#F5F6EE]"
      :style="{ left: `${gutterLeft}px` }"
    >
      <AllDayStrip v-if="untimedItems.length > 0" class="shrink-0" :items="untimedItems" />

      <div class="relative min-h-0 flex-1 overflow-hidden border-l border-[#9ccfe0]">
        <!-- Moved up by the real grid's scroll position so both days show the same hours -->
        <div
          class="absolute left-0 right-0 top-0"
          :style="{ height: `${gridHeight}px`, transform: `translateY(${-scrollTop}px)` }"
        >
          <div
            v-for="hour in lineHours"
            :key="hour"
            class="absolute left-0 right-0 border-t border-[#9ccfe0]"
            :style="{ top: `${(hour - boundaries.startHour) * HOUR_HEIGHT}px` }"
          />

          <div
            v-for="event in events"
            :key="event.id"
            class="absolute left-0 right-2"
            :style="layout(event)"
          >
            <CourseCard :event="event" embedded />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
