<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { Menu } from '@lucide/vue'
import { useAcademicEvents } from '@/composables/useAcademicEvents'
import { useCatalog } from '@/composables/useCatalog'
import { useShellHeader } from '@/composables/useShellHeader'
import { useTasks } from '@/composables/useTasks'
import { toDateKey } from '../../utils/dayKey'
import { expandSchedulesForDate, formatDateHeader } from '../../utils/scheduleExpander'
import { deriveUntimedItems } from '../../utils/untimedItems'
import { formatWeekTitle } from '../../utils/weekDays'
import BurgerMenu from './BurgerMenu.vue'
import HeaderIconButton from '../HeaderIconButton.vue'
import DayPeek from './DayPeek.vue'
import DaySwiper from './DaySwiper.vue'
import ScheduleCalendar from './ScheduleCalendar.vue'
import ViewModeToggle from './ViewModeToggle.vue'
import WeekCalendar from './WeekCalendar.vue'
import WeekPeek from './WeekPeek.vue'

// Defaults to today, in the day view
const selectedDate = ref(new Date())
const viewMode = ref<'day' | 'week'>('day')
const isMenuOpen = ref(false)
const catalog = useCatalog()

// Tasks + events load once per intent; swiping only refilters locally.
const { tasks, loadTasks } = useTasks()
const { events, loadEvents } = useAcademicEvents()

onMounted(async () => {
  try {
    await catalog.loadCatalog()
    await Promise.all([loadTasks(), loadEvents()])
  } catch (error) {
    console.warn('[DayView] API error loading tasks/events', error)
  }
})

const headerTitle = computed(() =>
  viewMode.value === 'day'
    ? formatDateHeader(selectedDate.value)
    : formatWeekTitle(selectedDate.value),
)

// Per-date data: used for the current view and for the swipe preview
function eventsFor(date: Date) {
  return expandSchedulesForDate(date, catalog.schedules.value, catalog.courses.value)
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

// The shell header shows the date title, the schedule menu, and the
// day/week mode switch.
useShellHeader({
  title: headerTitle,
  left: () =>
    h(HeaderIconButton, { 'aria-label': 'Open menu', onClick: toggleMenu }, () =>
      h(Menu, { class: 'h-6 w-6' }),
    ),
  right: () => h(ViewModeToggle, { mode: viewMode.value, onToggle: toggleView }),
})
</script>

<template>
  <!-- Fills the AppShell scroll area; the swiper manages its own height. -->
  <div class="flex h-full flex-col">
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
  </div>
</template>
