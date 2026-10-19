<script setup lang="ts">
import { ref } from 'vue'
import ScheduleCalendar from './ScheduleCalendar.vue'
import { mockCourses, mockEvents, mockSchedules, mockTasks } from '../../mocks/calendarData'
import { expandSchedulesForDate } from '../../utils/scheduleExpander'
import { deriveUntimedItems } from '../../utils/untimedItems'
import { toDateKey } from '../../utils/dayKey'

// Wednesday 2026-10-14 contains both timed courses and untimed items
const wednesdayDate = new Date(2026, 9, 14)
const wednesdayEvents = expandSchedulesForDate(wednesdayDate, mockSchedules, mockCourses)
const wednesdayUntimed = deriveUntimedItems(mockTasks, mockEvents, toDateKey(wednesdayDate))

// Thursday 2026-10-15
const thursdayDate = new Date(2026, 9, 15)
const thursdayEvents = expandSchedulesForDate(thursdayDate, mockSchedules, mockCourses)
const thursdayUntimed = deriveUntimedItems(mockTasks, mockEvents, toDateKey(thursdayDate))

// Sunday (Empty Day)
const sundayDate = new Date(2026, 9, 18)
const sundayEvents = expandSchedulesForDate(sundayDate, mockSchedules, mockCourses)
const sundayUntimed = deriveUntimedItems(mockTasks, mockEvents, toDateKey(sundayDate))

const currentDate = ref(wednesdayDate)
</script>

<template>
  <Story title="Calendar / Day View (Full)">
    <Variant title="Wednesday (Classes + Tasks)">
      <div class="p-4 flex justify-center bg-slate-200 min-h-screen">
        <div
          class="w-full max-w-[420px] h-[780px] bg-[#F5F6EE] flex flex-col rounded-[32px] shadow-2xl border border-slate-300 overflow-hidden"
        >
          <ScheduleCalendar
            :events="wednesdayEvents"
            :untimed-items="wednesdayUntimed"
            :selected-date="wednesdayDate"
          />
        </div>
      </div>
    </Variant>

    <Variant title="Thursday (Design Layout)">
      <div class="p-4 flex justify-center bg-slate-200 min-h-screen">
        <div
          class="w-full max-w-[420px] h-[780px] bg-[#F5F6EE] flex flex-col rounded-[32px] shadow-2xl border border-slate-300 overflow-hidden"
        >
          <ScheduleCalendar
            :events="thursdayEvents"
            :untimed-items="thursdayUntimed"
            :selected-date="thursdayDate"
          />
        </div>
      </div>
    </Variant>

    <Variant title="Empty Day (Sunday)">
      <div class="p-4 flex justify-center bg-slate-200 min-h-screen">
        <div
          class="w-full max-w-[420px] h-[780px] bg-[#F5F6EE] flex flex-col rounded-[32px] shadow-2xl border border-slate-300 overflow-hidden"
        >
          <ScheduleCalendar
            :events="sundayEvents"
            :untimed-items="sundayUntimed"
            :selected-date="sundayDate"
          />
        </div>
      </div>
    </Variant>

    <Variant title="Expanded Container (Tablet)">
      <div class="p-4 flex justify-center bg-slate-200 min-h-screen">
        <div
          class="w-full max-w-2xl h-[800px] bg-[#F5F6EE] flex flex-col rounded-2xl shadow-xl border border-slate-300 overflow-hidden"
        >
          <ScheduleCalendar
            :events="wednesdayEvents"
            :untimed-items="wednesdayUntimed"
            :selected-date="currentDate"
          />
        </div>
      </div>
    </Variant>
  </Story>
</template>
