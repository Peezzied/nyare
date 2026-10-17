<script setup lang="ts">
import { ref } from 'vue'
import WeekCalendar from './WeekCalendar.vue'
import DayViewHeader from './DayViewHeader.vue'
import { mockCourses, mockEvents, mockSchedules, mockTasks } from '../../mocks/calendarData'
import { expandSchedulesForDate } from '../../utils/scheduleExpander'
import { deriveUntimedItems } from '../../utils/untimedItems'
import { toDateKey } from '../../utils/dayKey'
import { formatWeekTitle } from '../../utils/weekDays'

const activeDate = ref(new Date(2026, 9, 14))

function eventsFor(date: Date) {
  return expandSchedulesForDate(date, mockSchedules, mockCourses)
}

function untimedFor(date: Date) {
  return deriveUntimedItems(mockTasks, mockEvents, toDateKey(date))
}

function handleSelectDay(date: Date) {
  activeDate.value = date
}
</script>

<template>
  <Story title="Calendar / Week View (Full)">
    <Variant title="Mobile Frame (420px)">
      <div class="p-4 flex justify-center bg-slate-200 min-h-screen">
        <div
          class="w-full max-w-[420px] h-[780px] bg-[#F5F6EE] flex flex-col rounded-[32px] shadow-2xl border border-slate-300 overflow-hidden"
        >
          <DayViewHeader :date-title="formatWeekTitle(activeDate)" mode="week" />
          <WeekCalendar
            :selected-date="activeDate"
            :events-for="eventsFor"
            :untimed-for="untimedFor"
            @select-day="handleSelectDay"
          />
        </div>
      </div>
    </Variant>

    <Variant title="Tablet / Desktop Frame (768px)">
      <div class="p-4 flex justify-center bg-slate-200 min-h-screen">
        <div
          class="w-full max-w-[768px] h-[800px] bg-[#F5F6EE] flex flex-col rounded-2xl shadow-xl border border-slate-300 overflow-hidden"
        >
          <DayViewHeader :date-title="formatWeekTitle(activeDate)" mode="week" />
          <WeekCalendar
            :selected-date="activeDate"
            :events-for="eventsFor"
            :untimed-for="untimedFor"
            @select-day="handleSelectDay"
          />
        </div>
      </div>
    </Variant>
  </Story>
</template>
