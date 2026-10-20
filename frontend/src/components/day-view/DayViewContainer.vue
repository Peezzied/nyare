<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { academicEventsApi } from '../../api/academicEvents'
import { tasksApi } from '../../api/tasks'
import { useCatalog } from '@/composables/useCatalog'
import { useNotes } from '@/composables/useNotes'
import { useShellHeader } from '@/composables/useShellHeader'
import type { AcademicEventResponse, TaskResponse } from '../../types/api'
import type { DayEvent } from '../../types/calendar'
import type { CalendarItemDetailView, LinkedNoteRef } from '../../types/calendarItemDetail'
import type { TapOriginRect } from '../../types/notesTransition'
import { buildCalendarItemDetail } from '../../utils/calendarItemDetail'
import { toDateKey } from '../../utils/dayKey'
import { expandSchedulesForDate, formatDateHeader } from '../../utils/scheduleExpander'
import { deriveUntimedItems } from '../../utils/untimedItems'
import type { UntimedDayItem } from '../../utils/untimedItems'
import { useNow } from '../../composables/useNow'
import { formatWeekTitle, weekDates } from '../../utils/weekDays'
import DateTitlePicker from './DateTitlePicker.vue'
import EventDetailModal from './EventDetailModal.vue'
import HamburgerMenu from '../HamburgerMenu.vue'
import DayPeek from './DayPeek.vue'
import DaySwiper from './DaySwiper.vue'
import ScheduleCalendar from './ScheduleCalendar.vue'
import TodayButton from './TodayButton.vue'
import ViewModeToggle from './ViewModeToggle.vue'
import WeekCalendar from './WeekCalendar.vue'
import WeekPeek from './WeekPeek.vue'

// Defaults to today, in the day view
const selectedDate = ref(new Date())
const viewMode = ref<'day' | 'week'>('day')
const catalog = useCatalog()

// Tasks + events load once per intent; swiping only refilters locally.
const tasks = ref<TaskResponse[]>([])
const events = ref<AcademicEventResponse[]>([])
// The shared notes cache never rejects, so a notes failure cannot hide the calendar.
const { notes, loadNotes } = useNotes()

onMounted(async () => {
  try {
    await catalog.loadCatalog()
    const [loadedTasks, loadedEvents] = await Promise.all([
      tasksApi.list(),
      academicEventsApi.list(),
    ])
    tasks.value = loadedTasks
    events.value = loadedEvents
  } catch (error) {
    console.warn('[DayView] API error loading tasks/events', error)
  }
  await loadNotes()
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

function toggleView() {
  viewMode.value = viewMode.value === 'day' ? 'week' : 'day'
}

// ---- Back-to-today pill: hidden while today is on screen ----
const now = useNow()

const isShowingToday = computed(() => {
  const todayKey = toDateKey(now.value)
  if (viewMode.value === 'day') return toDateKey(selectedDate.value) === todayKey
  return weekDates(selectedDate.value).some((date) => toDateKey(date) === todayKey)
})

function goToday() {
  selectedDate.value = new Date()
}

// Tapping a day in the week header opens that day
function openDay(date: Date) {
  selectedDate.value = date
  viewMode.value = 'day'
}

// Mini month picker: a picked date moves the current view, not its mode.
function jumpToDate(date: Date) {
  selectedDate.value = date
}

// Busy-dot predicate for the mini month; reuses the already-loaded lists.
function hasItemsOn(date: Date) {
  return eventsFor(date).length > 0 || untimedFor(date).length > 0
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
        // DOMRect carries no corner radius; the calendar cards all use 16px.
        borderRadius: '16px',
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
      detailItem.value = {
        ...detailItem.value,
        task: { id: saved.id, completed: saved.status === 'COMPLETED' },
      }
    }
    detailError.value = null
  } catch (error) {
    // Keep the prior state and tell the student the write failed.
    detailError.value = `Could not complete "${cached.title}". Try again.`
    console.warn('[DayView] Failed to complete task', error)
  }
}

// The shell header shows the date title (tappable month picker), the
// account menu, and the day/week mode switch.
useShellHeader({
  title: headerTitle,
  left: () => h(HamburgerMenu),
  center: () =>
    h(DateTitlePicker, {
      title: headerTitle.value,
      selected: selectedDate.value,
      hasItems: hasItemsOn,
      onSelect: jumpToDate,
    }),
  right: () => h(ViewModeToggle, { mode: viewMode.value, onToggle: toggleView }),
})
</script>

<template>
  <!-- Fills the AppShell scroll area; the swiper manages its own height. -->
  <div class="relative flex h-full flex-col">
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

    <TodayButton v-if="!isShowingToday" @jump="goToday" />

    <!-- One detail modal for both views; the container owns it.
         No frame element: the shell fills the viewport, so the modal fits it. -->
    <EventDetailModal
      :is-open="isDetailOpen"
      :origin-rect="detailOriginRect"
      :item="detailItem"
      :frame-el="null"
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
  </div>
</template>
