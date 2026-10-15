<script setup lang="ts">
import { computed } from 'vue'
import { HOUR_HEIGHT } from '../../constants/calendar'
import type { DayEvent } from '../../types/calendar'
import { toDateKey } from '../../utils/dayKey'
import type { UntimedDayItem } from '../../utils/untimedItems'
import { weekDates } from '../../utils/weekDays'
import WeekHeaderRow from './WeekHeaderRow.vue'
import WeekPill from './WeekPill.vue'

// Static preview of a neighbouring week, shown only while swiping.
const props = defineProps<{
  date: Date // any day inside the week to preview
  eventsFor: (date: Date) => DayEvent[]
  untimedFor: (date: Date) => UntimedDayItem[]
  scrollTop: number // matches the real grid's scroll position
  gutterLeft: number // width of the fixed time axis
}>()

const todayKey = toDateKey(new Date())
const GRID_HEIGHT = 24 * HOUR_HEIGHT
const lineHours = Array.from({ length: 24 }, (_, hour) => hour)

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
  return {
    top: `${(startMin / 60) * HOUR_HEIGHT}px`,
    height: `${((endMin - startMin) / 60) * HOUR_HEIGHT}px`,
  }
}
</script>

<template>
  <div class="relative h-full w-full" aria-hidden="true">
    <!-- Columns only: starts right of the fixed time axis -->
    <div
      class="absolute inset-y-0 right-0 flex flex-col bg-[#F5F6EE]"
      :style="{ left: `${gutterLeft}px` }"
    >
      <WeekHeaderRow :days="days" :today-key="todayKey" :gutter-left="0" :cols-width="0" />

      <div class="relative min-h-0 flex-1 overflow-hidden">
        <!-- Moved up by the real grid's scroll position so both weeks show the same hours -->
        <div
          class="absolute left-0 right-0 top-0"
          :style="{ height: `${GRID_HEIGHT}px`, transform: `translateY(${-scrollTop}px)` }"
        >
          <div
            v-for="hour in lineHours"
            :key="hour"
            class="absolute left-0 right-0 border-t border-[#9ccfe0]"
            :style="{ top: `${hour * HOUR_HEIGHT}px` }"
          />

          <div class="absolute inset-0 grid grid-cols-7">
            <div
              v-for="day in days"
              :key="day.key"
              class="relative border-l border-[#9ccfe0]"
            >
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
</template>
