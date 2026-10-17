<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { academicEventsApi } from '../../api/academicEvents'
import { tasksApi } from '../../api/tasks'
import { mockCourses, mockEvents, mockSchedules, mockTasks } from '../../mocks/calendarData'
import type { AcademicEventResponse, TaskResponse } from '../../types/api'
import { toDateKey } from '../../utils/dayKey'
import { expandSchedulesForDate, formatDateHeader } from '../../utils/scheduleExpander'
import { deriveUntimedItems } from '../../utils/untimedItems'
import { formatWeekTitle } from '../../utils/weekDays'
import BurgerMenu from './BurgerMenu.vue'
import DayPeek from './DayPeek.vue'
import DaySwiper from './DaySwiper.vue'
import DayViewHeader from './DayViewHeader.vue'
import ScheduleCalendar from './ScheduleCalendar.vue'
import WeekCalendar from './WeekCalendar.vue'
import WeekPeek from './WeekPeek.vue'

// Defaults to today, in the day view
const selectedDate = ref(new Date())
const viewMode = ref<'day' | 'week'>('day')
const isMenuOpen = ref(false)

// Tasks + events load once per intent; swiping only refilters locally.
const tasks = ref<TaskResponse[]>([])
const events = ref<AcademicEventResponse[]>([])

onMounted(async () => {
  try {
    const [loadedTasks, loadedEvents] = await Promise.all([
      tasksApi.list(),
      academicEventsApi.list(),
    ])
    tasks.value = loadedTasks
    events.value = loadedEvents
  } catch (error) {
    // ponytail: backend optional in dev; fall back to fixtures so the day view stays usable.
    console.warn('[DayView] API unavailable, using mock tasks/events', error)
    tasks.value = mockTasks
    events.value = mockEvents
  }
})

const headerTitle = computed(() =>
  viewMode.value === 'day'
    ? formatDateHeader(selectedDate.value)
    : formatWeekTitle(selectedDate.value),
)

// Per-date data: used for the current view and for the swipe preview
function eventsFor(date: Date) {
  return expandSchedulesForDate(date, mockSchedules, mockCourses)
}

function untimedFor(date: Date) {
  return deriveUntimedItems(tasks.value, events.value, toDateKey(date))
}

const dayEvents = computed(() => eventsFor(selectedDate.value))
const untimedItems = computed(() => untimedFor(selectedDate.value))

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function toggleView() {
  viewMode.value = viewMode.value === 'day' ? 'week' : 'day'
}

// Tapping a day in the week header opens that day
function openDay(date: Date) {
  selectedDate.value = date
  viewMode.value = 'day'
}

function handleMenuAction(action: 'edit' | 'new' | 'delete' | 'archive') {
  // Placeholder event action - no backend calls
  console.log(`[DayView] Menu action executed: ${action}`)
}
</script>

<template>
  <!-- fixed inset-0 = always exactly the visible screen -->
  <div class="fixed inset-0 overflow-hidden bg-[#E5E7EB] flex justify-center sm:items-center">
    <!-- Mobile Frame Viewport -->
    <div
      class="w-full max-w-[430px] h-full sm:h-[880px] sm:max-h-[95%] bg-[#F5F6EE] flex flex-col relative sm:rounded-[36px] sm:shadow-2xl overflow-hidden"
    >
      <!-- Top Header -->
      <div class="shrink-0">
        <DayViewHeader
          :date-title="headerTitle"
          :mode="viewMode"
          @toggle-menu="toggleMenu"
          @toggle-view="toggleView"
        />
      </div>

      <!-- Burger Menu Dropdown -->
      <BurgerMenu :is-open="isMenuOpen" @close="closeMenu" @action="handleMenuAction" />

      <!-- Swipe left/right anywhere on the calendar: a day in day view, a week in week view -->
      <DaySwiper
        :selected-date="selectedDate"
        :step-days="viewMode === 'day' ? 1 : 7"
        @change-date="selectedDate = $event"
      >
        <ScheduleCalendar
          v-if="viewMode === 'day'"
          :events="dayEvents"
          :untimed-items="untimedItems"
          :selected-date="selectedDate"
        />
        <WeekCalendar
          v-else
          :selected-date="selectedDate"
          :events-for="eventsFor"
          :untimed-for="untimedFor"
          @select-day="openDay"
        />

        <template #peek="{ date, scrollTop, gutterLeft }">
          <DayPeek
            v-if="viewMode === 'day'"
            :events="eventsFor(date)"
            :untimed-items="untimedFor(date)"
            :scroll-top="scrollTop"
            :gutter-left="gutterLeft"
          />
          <WeekPeek
            v-else
            :date="date"
            :events-for="eventsFor"
            :untimed-for="untimedFor"
            :scroll-top="scrollTop"
            :gutter-left="gutterLeft"
          />
        </template>
      </DaySwiper>

      <!-- Bottom navigation is added separately by a teammate. -->
    </div>
  </div>
</template>
