<script setup lang="ts">
import { computed } from 'vue'
import type { DayEvent } from '../../types/calendar'
import { calculateGridBoundaries, formatTime12h } from '../../utils/scheduleExpander'
import type { UntimedDayItem } from '../../utils/untimedItems'
import AllDayStrip from './AllDayStrip.vue'
import CourseCard from './CourseCard.vue'

// Static preview of a neighbouring day's calendar, shown only while swiping.
// Mirrors Schedule-X DOM structure and stylesheet classes for 100% pixel-perfect alignment.
const props = defineProps<{
  events: DayEvent[]
  untimedItems: UntimedDayItem[]
  scrollTop: number // matches the real grid's scroll position
  gutterLeft: number // width of the time axis
}>()

const boundaries = computed(() => calculateGridBoundaries(props.events))
const totalHours = computed(() => boundaries.value.endHour - boundaries.value.startHour)

const gutter = computed(() => props.gutterLeft || 55)

// The 24 hours of the grid (0 to 23)
const hours = computed(() => {
  const list: number[] = []
  for (let h = boundaries.value.startHour; h < boundaries.value.endHour; h++) list.push(h)
  return list
})

function toMinutes(dateTime: string): number {
  const timePart = dateTime.split(' ')[1] ?? '00:00'
  const [h = 0, m = 0] = timePart.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function layout(event: DayEvent) {
  const startMin = toMinutes(event.start)
  const endMin = toMinutes(event.end)
  const topHours = (startMin / 60 - boundaries.value.startHour).toFixed(4)
  const durationHours = ((endMin - startMin) / 60).toFixed(4)
  return {
    top: `calc(${topHours} * var(--calendar-hour-height, 48px))`,
    height: `calc(${durationHours} * var(--calendar-hour-height, 48px))`,
  }
}
</script>

<template>
  <div class="relative flex h-full w-full flex-col bg-[#F5F6EE]" aria-hidden="true">
    <AllDayStrip
      v-if="untimedItems.length > 0"
      class="shrink-0"
      :items="untimedItems"
      :style="{ paddingLeft: `${gutter}px` }"
    />

    <div class="relative min-h-0 flex-1 sx-nyare-wrapper overflow-hidden">
      <div class="absolute inset-0 sx-nyare-fill">
        <div class="sx-vue-calendar-wrapper">
          <div class="sx__calendar-wrapper">
            <div class="sx__calendar">
              <div
                class="sx__view-container"
                :style="{ transform: `translateY(${-scrollTop}px)` }"
              >
                <div
                  class="sx__week-grid"
                  :style="{ height: `calc(${totalHours} * var(--calendar-hour-height, 48px))` }"
                >
                  <div class="sx__week-grid__time-axis">
                    <div
                      v-for="hour in hours"
                      :key="hour"
                      class="sx__week-grid__hour"
                    >
                      <span class="sx__week-grid__hour-text">
                        {{ formatTime12h(`${String(hour).padStart(2, '0')}:00`) }}
                      </span>
                    </div>
                  </div>

                  <div class="sx__time-grid-day">
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sx-nyare-fill,
.sx-nyare-fill :deep(.sx-vue-calendar-wrapper),
.sx-nyare-fill :deep(.sx__calendar-wrapper),
.sx-nyare-fill :deep(.sx__calendar) {
  height: 100%;
  max-height: none;
  width: 100%;
  border: none;
  border-radius: 0;
}

.sx-nyare-wrapper :deep(.sx__week-grid__hour),
.sx-nyare-wrapper .sx__week-grid__hour {
  border-top: 1px solid #9ccfe0 !important;
}

.sx-nyare-wrapper :deep(.sx__time-grid-day),
.sx-nyare-wrapper .sx__time-grid-day {
  border-left: 1px solid #9ccfe0 !important;
}

.sx-nyare-wrapper .sx__calendar,
.sx-nyare-wrapper .sx__view-container {
  background-color: #f5f6ee !important;
}
</style>
