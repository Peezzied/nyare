<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { academicEventsApi } from '../../api/academicEvents'
import { notesApi } from '../../api/notes'
import { tasksApi } from '../../api/tasks'
import { useCatalog } from '@/composables/useCatalog'
import type { AcademicEventResponse, NoteSummaryResponse, TaskResponse } from '../../types/api'
import type { DayEvent } from '../../types/calendar'
import type { CalendarItemDetailView, LinkedNoteRef } from '../../types/calendarItemDetail'
import type { TapOriginRect } from '../../types/detailModal'
import { buildCalendarItemDetail } from '../../utils/calendarItemDetail'
import { toDateKey } from '../../utils/dayKey'
import { expandSchedulesForDate, formatDateHeader } from '../../utils/scheduleExpander'
import { deriveUntimedItems } from '../../utils/untimedItems'
import type { UntimedDayItem } from '../../utils/untimedItems'
import { formatWeekTitle } from '../../utils/weekDays'
import BurgerMenu from './BurgerMenu.vue'
import EventDetailModal from './EventDetailModal.vue'
import NavigationBar from '../NavigationBar.vue'
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
const catalog = useCatalog()

// Tasks + events load once per intent; swiping only refilters locally.
const tasks = ref<TaskResponse[]>([])
const events = ref<AcademicEventResponse[]>([])
const notes = ref<NoteSummaryResponse[]>([])

onMounted(async () => {
  try {
    await catalog.loadCatalog()
    const [loadedTasks, loadedEvents, loadedNotes] = await Promise.all([
      tasksApi.list(),
      academicEventsApi.list(),
      notesApi.list(),
    ])
    tasks.value = loadedTasks
    events.value = loadedEvents
    notes.value = loadedNotes
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

// ---- Calendar item detail ----
// The container owns the modal so it survives a day/week switch.
const router = useRouter()

const detailItem = ref<CalendarItemDetailView | null>(null)
const detailOriginRect = ref<TapOriginRect | null>(null)
const isDetailOpen = ref(false)
const detailError = ref<string | null>(null)

function openDetail(item: CalendarItemDetailView, originRect: DOMRect | null) {
  detailError.value = null
  detailItem.value = item
  detailOriginRect.value = originRect
    ? {
        top: originRect.top,
        left: originRect.left,
        width: originRect.width,
        height: originRect.height,
      }
    : null
  isDetailOpen.value = true
}

/** Opens the detail view for a class meeting (FR-006). */
function openClassDetail(event: DayEvent, originRect: DOMRect) {
  openDetail(buildCalendarItemDetail(event, 'class'), originRect)
}

/** Opens the detail view for a tapped task (FR-006) or event (FR-007) chip. */
function openUntimedDetail(item: UntimedDayItem, originRect: DOMRect | null) {
  const task = tasks.value.find((candidate) => candidate.id === item.id)
  if (task) {
    openDetail(buildCalendarItemDetail(task, 'task', notes.value), originRect)
    return
  }
  const academicEvent = events.value.find((candidate) => candidate.id === item.id)
  if (academicEvent) {
    openDetail(buildCalendarItemDetail(academicEvent, 'event', notes.value), originRect)
  }
}

function closeDetail() {
  isDetailOpen.value = false
}

/** Opens the note editor route for the linked note (FR-009, FR-015). */
function openLinkedNote(note: LinkedNoteRef) {
  isDetailOpen.value = false
  router.push({ name: 'note-edit', params: { id: note.id } })
}

/**
 * Marks a task complete with one status write, then patches the cached task
 * from the saved DTO. No list refetch (FR-010, FR-011).
 */
async function completeTask(taskId: string) {
  const cached = tasks.value.find((candidate) => candidate.id === taskId)
  if (!cached || cached.status === 'COMPLETED') return

  try {
    const saved = await tasksApi.updateStatus(taskId, 'COMPLETED')
    tasks.value = tasks.value.map((candidate) => (candidate.id === saved.id ? saved : candidate))
    if (detailItem.value?.task?.id === saved.id) {
      detailItem.value = { ...detailItem.value, task: { id: saved.id, completed: true } }
    }
  } catch (error) {
    // Keep the prior state and tell the student the write failed.
    detailError.value = `Could not complete "${cached.title}". Try again.`
    console.warn('[DayView] Failed to complete task', error)
  }
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
          @select-course="openClassDetail"
          @select-untimed="openUntimedDetail"
        />
        <WeekCalendar
          v-else
          :selected-date="selectedDate"
          :events-for="eventsFor"
          :untimed-for="untimedFor"
          @select-day="openDay"
          @select-course="openClassDetail"
          @select-untimed="openUntimedDetail"
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

      <!-- One detail modal for both views; the container owns it -->
      <EventDetailModal
        :is-open="isDetailOpen"
        :origin-rect="detailOriginRect"
        :item="detailItem"
        @close="closeDetail"
        @open-note="openLinkedNote"
        @complete-task="completeTask"
      />

      <!-- A failed complete write keeps the prior state and shows the error here -->
      <p
        v-if="detailError"
        role="alert"
        class="absolute bottom-20 left-1/2 z-[60] w-max max-w-[80%] -translate-x-1/2 rounded-xl bg-[#DC2626] px-4 py-2 text-center text-sm font-bold text-white shadow-lg"
      >
        {{ detailError }}
      </p>

      <!-- Bottom navigation: the h-16 reserve keeps the swiper clear of the bar;
           transform-gpu anchors the bar's fixed positioning inside the frame on all breakpoints -->
      <div class="h-16 shrink-0 transform-gpu">
        <NavigationBar />
      </div>
    </div>
  </div>
</template>
