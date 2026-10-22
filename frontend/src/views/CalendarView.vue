<script setup lang="ts">
import { computed, h, onActivated, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { tasksApi } from '@/api/tasks'
import { useAcademicEvents } from '@/composables/useAcademicEvents'
import { useCatalog } from '@/composables/useCatalog'
import { useNotes } from '@/composables/useNotes'
import { useTasks } from '@/composables/useTasks'
import { useShellHeader } from '@/composables/useShellHeader'
import type { CalendarViewMode, DayEvent } from '@/types/calendar'
import type { CalendarItemDetailView, LinkedNoteRef } from '@/types/calendarItemDetail'
import type { TapOriginRect } from '@/types/notesTransition'
import type { AcademicEventResponse } from '@/types/api'
import { buildCalendarItemDetail } from '@/utils/calendarItemDetail'
import { toDateKey } from '@/utils/dayKey'
import { deriveDeadlineSections } from '@/utils/deadlineSections'
import { expandSchedulesForDate, formatDateHeader } from '@/utils/scheduleExpander'
import { deriveUntimedItems } from '@/utils/untimedItems'
import type { UntimedDayItem } from '@/utils/untimedItems'
import { useNow } from '@/composables/useNow'
import { formatWeekTitle, weekDates } from '@/utils/weekDays'
import DateTitlePicker from '@/components/day-view/DateTitlePicker.vue'
import DeadlinesView from '@/components/day-view/DeadlinesView.vue'
import EventDetailModal from '@/components/day-view/EventDetailModal.vue'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import DaySwiper from '@/components/day-view/DaySwiper.vue'
import ScheduleCalendar from '@/components/day-view/ScheduleCalendar.vue'
import TodayButton from '@/components/day-view/TodayButton.vue'
import ViewModeToggle from '@/components/day-view/ViewModeToggle.vue'
import WeekCalendar from '@/components/day-view/WeekCalendar.vue'
import WeekHeaderRow from '@/components/day-view/WeekHeaderRow.vue'

defineOptions({ name: 'CalendarView' })

// Defaults to today, in the day view
const selectedDate = ref(new Date())
const viewMode = ref<CalendarViewMode>('day')
const catalog = useCatalog()

// Shared caches: a Process run refetches them and the calendar follows.
const { tasks, loadTasks } = useTasks()
const { events, loadEvents } = useAcademicEvents()
// The shared notes cache never rejects, so a notes failure cannot hide the calendar.
const { notes, loadNotes } = useNotes()
const loadError = ref<string | null>(null)

async function loadData() {
  loadError.value = null
  try {
    await Promise.all([catalog.loadCatalog(), loadTasks(), loadEvents(), loadNotes()])
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Calendar data failed to load'
    console.warn('[DayView] API error loading tasks/events', error)
  }
}

onMounted(loadData)
// Cache-guarded: free on warm revisits, self-heals after cache resets.
onActivated(loadData)

const headerTitle = computed(() => {
  if (viewMode.value === 'day') return formatDateHeader(selectedDate.value)
  if (viewMode.value === 'week') return formatWeekTitle(selectedDate.value)
  return 'Deadlines'
})

// Per-date data: used for the current view and for the swipe preview
function eventsFor(date: Date) {
  return expandSchedulesForDate(date, catalog.schedules.value, catalog.courses.value)
}

function untimedFor(date: Date) {
  return deriveUntimedItems(tasks.value, events.value, toDateKey(date))
}

function setViewMode(mode: CalendarViewMode) {
  viewMode.value = mode
}

// ---- Back-to-today pill: hidden while today is on screen ----
const now = useNow()

// The deadlines list is anchored to now; it needs no date navigation.
const deadlineSections = computed(() => deriveDeadlineSections(events.value, now.value))

function getCourseName(courseId: number): string {
  const found = catalog.courses.value.find((c) => c.id === courseId)
  return found?.name ?? `Course ${courseId}`
}

const todayKey = computed(() => toDateKey(now.value))

const isShowingToday = computed(() => {
  if (viewMode.value === 'day') return toDateKey(selectedDate.value) === todayKey.value
  return weekDates(selectedDate.value).some((date) => toDateKey(date) === todayKey.value)
})

// Pinned week header clone for the swipe chrome; mirrors WeekCalendar's data.
function weekInfosFor(date: Date) {
  return weekDates(date).map((d) => ({ date: d, key: toDateKey(d), untimed: untimedFor(d) }))
}

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
  openDetail(buildCalendarItemDetail(event, 'class', notes.value), originRect)
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

/** Opens the detail view for a tapped deadline row (FR-007). */
function openEventDetail(event: AcademicEventResponse, originRect: DOMRect | null) {
  openDetail(buildCalendarItemDetail(event, 'event', notes.value), originRect)
}

function closeDetail() {
  isDetailOpen.value = false
}

/** Opens the note editor route for the linked note (FR-009, FR-015). */
function openLinkedNote(note: LinkedNoteRef) {
  isDetailOpen.value = false
  router.push({ name: 'note-edit', params: { id: note.id } })
}

/** Opens a new note prefilled with the class's course and meeting day. */
function addNote() {
  const item = detailItem.value
  if (!item?.entryDate) return
  isDetailOpen.value = false
  router.push({ name: 'note-new', query: { courseId: item.courseId, entryDate: item.entryDate } })
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
  right: () => h(ViewModeToggle, { mode: viewMode.value, onSelect: setViewMode }),
})
</script>

<template>
  <!-- Fills the AppShell scroll area; the swiper manages its own height. -->
  <div class="relative flex h-full flex-col">
    <div
      v-if="loadError"
      role="alert"
      class="mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#DC2626] px-4 py-2 text-sm font-bold text-white"
    >
      <span>{{ loadError }}</span>
      <button type="button" class="rounded-lg bg-white/20 px-3 py-1" @click="loadData">
        Retry
      </button>
    </div>

    <!-- Swipe left/right anywhere on the calendar: a day in day view, a week in week view.
         The deadlines list is now-anchored and sits outside the swiper. -->
    <Transition name="view-slide">
      <DaySwiper
        v-if="viewMode !== 'deadlines'"
        :key="viewMode"
        :selected-date="selectedDate"
        :step-days="viewMode === 'day' ? 1 : 7"
        @change-date="selectedDate = $event"
      >
        <!-- Three live calendars are mounted by the swiper; each panel gets
             its own date's data. -->
        <template #default="{ date }">
          <ScheduleCalendar
            v-if="viewMode === 'day'"
            :events="eventsFor(date)"
            :untimed-items="untimedFor(date)"
            :selected-date="date"
            @select-course="openClassDetail"
            @select-untimed="openUntimedDetail"
          />
          <WeekCalendar
            v-else
            :selected-date="date"
            :events-for="eventsFor"
            :untimed-for="untimedFor"
            @select-day="openDay"
            @select-course="openClassDetail"
            @select-untimed="openUntimedDetail"
          />
        </template>

        <!-- Pinned while swiping: the header row stays put; only the deck
             underneath moves. -->
        <template #chrome="{ date, gutterLeft }">
          <div v-if="viewMode === 'week'" class="bg-app-bg">
            <WeekHeaderRow
              :days="weekInfosFor(date)"
              :today-key="todayKey"
              :gutter-left="gutterLeft || 55"
              :cols-width="0"
            />
          </div>
        </template>
      </DaySwiper>

      <DeadlinesView
        v-else
        key="deadlines"
        :sections="deadlineSections"
        :course-name="getCourseName"
        @select="openEventDetail"
        @select-day="openDay"
      />
    </Transition>

    <TodayButton v-if="viewMode !== 'deadlines' && !isShowingToday" @jump="goToday" />

    <!-- One detail modal for both views; the container owns it.
         No frame element: the shell fills the viewport, so the modal fits it. -->
    <EventDetailModal
      :is-open="isDetailOpen"
      :origin-rect="detailOriginRect"
      :item="detailItem"
      :frame-el="null"
      @close="closeDetail"
      @open-note="openLinkedNote"
      @add-note="addNote"
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

<style scoped>
/* Mode switches: the incoming view slides up over the leaving one. */
.view-slide-enter-active {
  transition:
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 200ms ease-out;
}

.view-slide-leave-active {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  transition:
    transform 180ms ease-in,
    opacity 160ms ease-in;
}

.view-slide-enter-active {
  position: relative;
  z-index: 1;
}

.view-slide-enter-from {
  transform: translateY(14px);
  opacity: 0;
}

.view-slide-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .view-slide-enter-active,
  .view-slide-leave-active {
    transition-duration: 90ms;
    transition-timing-function: ease-out;
  }

  .view-slide-enter-from,
  .view-slide-leave-to {
    transform: none;
  }
}
</style>
