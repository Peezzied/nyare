<script setup lang="ts">
import { computed, ref } from 'vue'
import { mockCourses, mockSchedules } from '../../mocks/calendarData'
import { expandSchedulesForDate, formatDateHeader } from '../../utils/scheduleExpander'
import BurgerMenu from './BurgerMenu.vue'
import DayViewHeader from './DayViewHeader.vue'
import ScheduleCalendar from './ScheduleCalendar.vue'

// Defaults to today
const selectedDate = ref(new Date())
const isMenuOpen = ref(false)

const dateTitle = computed(() => formatDateHeader(selectedDate.value))

const dayEvents = computed(() => {
  return expandSchedulesForDate(selectedDate.value, mockSchedules, mockCourses)
})

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function handleMenuAction(action: 'edit' | 'new' | 'delete' | 'archive') {
  // Placeholder event action - no backend calls
  console.log(`[DayView] Menu action executed: ${action}`)
}

function handleOpenArchive() {
  // Placeholder archive action - no backend calls
  console.log('[DayView] Open schedule archive triggered')
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
          :date-title="dateTitle"
          @toggle-menu="toggleMenu"
          @open-archive="handleOpenArchive"
        />
      </div>

      <!-- Burger Menu Dropdown -->
      <BurgerMenu
        :is-open="isMenuOpen"
        @close="closeMenu"
        @action="handleMenuAction"
      />

      <!-- Main Schedule Grid: takes all the remaining space and scrolls inside -->
      <ScheduleCalendar :events="dayEvents" :selected-date="selectedDate" />

      <!-- Bottom navigation is added separately by a teammate. -->
    </div>
  </div>
</template>
