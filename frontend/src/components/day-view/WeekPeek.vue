<script setup lang="ts">
import { computed } from 'vue'
import type { DayEvent } from '../../types/calendar'
import { toDateKey } from '../../utils/dayKey'
import { formatTime12h } from '../../utils/scheduleExpander'
import type { UntimedDayItem } from '../../utils/untimedItems'
import { weekDates } from '../../utils/weekDays'
import WeekHeaderRow from './WeekHeaderRow.vue'
import WeekPill from './WeekPill.vue'

// Static preview of a neighbouring week, shown only while swiping.
// Mirrors Schedule-X DOM structure and stylesheet classes for 100% pixel-perfect alignment.
const props = defineProps<{
  date: Date // any day inside the week to preview
  eventsFor: (date: Date) => DayEvent[]
  untimedFor: (date: Date) => UntimedDayItem[]
  scrollTop: number // matches the real grid's scroll position
  gutterLeft: number // width of the time axis
}>()

const todayKey = toDateKey(new Date())

const gutter = computed(() => props.gutterLeft || 55)

// The 24 hours of the week grid (0 to 23)
const hours = Array.from({ length: 24 }, (_, i) => i)

const days = computed(() =>
  weekDates(props.date).map((date) => ({
    date,
    key: toDateKey(date),
    events: props.eventsFor(date),
    untimed: props.untimedFor(date),
  })),
)

function toMinutes(dateTime: string): number {
  const timePart = dateTime.split(' ')[1] ?? '00:00'
  const [h = 0, m = 0] = timePart.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function layout(event: DayEvent) {
  const startMin = toMinutes(event.start)
  const endMin = toMinutes(event.end)
  const topHours = (startMin / 60).toFixed(4)
  const durationHours = ((endMin - startMin) / 60).toFixed(4)
  return {
    top: `calc(${topHours} * var(--calendar-hour-height, 48px))`,
    height: `calc(${durationHours} * var(--calendar-hour-height, 48px))`,
  }
}
</script>

<template>
  <div class="relative flex h-full w-full flex-col bg-[#F5F6EE]" aria-hidden="true">
    <WeekHeaderRow :days="days" :today-key="todayKey" :gutter-left="gutter" :cols-width="0" />

    <div class="relative min-h-0 flex-1 sx-nyare-week overflow-hidden">
      <div class="absolute inset-0 sx-nyare-fill">
        <div class="sx-vue-calendar-wrapper">
          <div class="sx__calendar-wrapper">
            <div class="sx__calendar">
              <div class="sx__view-container" :style="{ transform: `translateY(${-scrollTop}px)` }">
                <div
                  class="sx__week-grid"
                  :style="{ height: `calc(24 * var(--calendar-hour-height, 48px))` }"
                >
                  <div class="sx__week-grid__time-axis">
                    <div v-for="hour in hours" :key="hour" class="sx__week-grid__hour">
                      <span class="sx__week-grid__hour-text">
                        {{ formatTime12h(`${String(hour).padStart(2, '0')}:00`) }}
                      </span>
                    </div>
                  </div>

                  <div v-for="day in days" :key="day.key" class="sx__time-grid-day">
                    <div
                      v-for="event in day.events"
                      :key="event.id"
                      class="absolute left-0 right-[6%]"
                      :style="layout(event)"
                    >
                      <WeekPill :event="event" />
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

.sx-nyare-week :deep(.sx__week-grid__hour),
.sx-nyare-week .sx__week-grid__hour {
  border-top: 1px solid #9ccfe0 !important;
}

.sx-nyare-week :deep(.sx__time-grid-day),
.sx-nyare-week .sx__time-grid-day {
  border-left: 1px solid #9ccfe0 !important;
}

.sx-nyare-week .sx__calendar,
.sx-nyare-week .sx__view-container {
  background-color: #f5f6ee !important;
}

.sx-nyare-week .sx__view-container {
  overflow-y: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sx-nyare-week .sx__view-container::-webkit-scrollbar {
  display: none;
}
</style>
