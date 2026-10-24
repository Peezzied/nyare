<script setup lang="ts">
import CalendarItemDetail from './CalendarItemDetail.vue'
import CategoryMarker from './CategoryMarker.vue'
import WeekHeaderRow from './WeekHeaderRow.vue'
import {
  CALENDAR_ITEM_DETAIL_FIXTURES,
  type CalendarItemDetailFixture,
} from '@/api/mocks/calendarItemDetailFixtures'
import type { CalendarItemMarkerState } from '@/types/calendarItemDetail'
import type { UntimedDayItem } from '@/utils/untimedItems'

const detailFixtures = CALENDAR_ITEM_DETAIL_FIXTURES.filter(
  (fixture) => fixture.marker === undefined && fixture.markers === undefined,
)

const markerFixtures = CALENDAR_ITEM_DETAIL_FIXTURES.filter(
  (fixture): fixture is CalendarItemDetailFixture & { marker: CalendarItemMarkerState } =>
    fixture.marker !== undefined,
)

// The real week cell proves the visible limit and the overflow count.
const overflowDay = {
  date: new Date(2026, 9, 21),
  key: '2026-10-21',
  untimed: [
    {
      id: 'task-cs201-heap-impl',
      title: 'Implement Binary Heap Operations',
      category: 'task',
      courseId: 1,
      completed: false,
      date: '2026-10-21',
    },
    {
      id: 'event-cs201-midterm',
      title: 'CS 201 Midterm Examination',
      category: 'event',
      courseId: 2,
      completed: false,
      date: '2026-10-21',
    },
    {
      id: 'task-cs201-hw1',
      title: 'Submit CS 201 Homework 1',
      category: 'task',
      courseId: 3,
      completed: true,
      date: '2026-10-21',
    },
  ] satisfies UntimedDayItem[],
}
</script>

<template>
  <Story title="CalendarItemDetail" group="day-view">
    <Variant v-for="fixture in detailFixtures" :key="fixture.name" :title="fixture.name">
      <div class="bg-app-bg p-6">
        <div class="mx-auto w-[342px] rounded-2xl bg-white p-6 shadow-sm">
          <CalendarItemDetail :item="fixture.item" />
        </div>
      </div>
    </Variant>

    <Variant v-for="fixture in markerFixtures" :key="fixture.name" :title="fixture.name">
      <div class="bg-app-bg p-6">
        <div
          class="flex w-[220px] items-center gap-2 rounded border border-[#1E293B]/50 bg-[#80C2F8] px-1.5 py-1"
        >
          <CategoryMarker
            :category="fixture.marker.category"
            :completed="fixture.marker.completed"
          />
          <span class="min-w-0 truncate text-[9px] font-bold text-white">
            {{ fixture.item.title }}
          </span>
        </div>
        <p class="mt-3 text-xs text-stone-500">Accessible label: {{ fixture.marker.label }}</p>
      </div>
    </Variant>

    <Variant title="week-overflow-day">
      <div class="bg-app-bg p-6">
        <div class="w-[120px]">
          <WeekHeaderRow :days="[overflowDay]" today-key="" :gutter-left="0" :cols-width="0" />
        </div>
        <p class="mt-3 text-xs text-stone-500">
          Two chips show; the third collapses into the overflow count.
        </p>
      </div>
    </Variant>
  </Story>
</template>
