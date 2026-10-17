<script setup lang="ts">
import 'temporal-polyfill/global'
import '@schedule-x/theme-default/dist/calendar.css'
import { ScheduleXCalendar } from '@schedule-x/vue'
import { createCalendar, createViewDay } from '@schedule-x/calendar'
import { createCalendarControlsPlugin } from '@schedule-x/calendar-controls'
import { Temporal } from 'temporal-polyfill'
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useNow } from '../../composables/useNow'
import { getHourHeight } from '../../utils/calendarStyle'
import type { DayEvent } from '../../types/calendar'
import type { UntimedDayItem } from '../../utils/untimedItems'
import { calculateGridBoundaries, formatTimeRange } from '../../utils/scheduleExpander'
import { useRouter } from 'vue-router'
import type {
  ActiveModalState,
  CourseBlockDetailState,
  NonCourseBlockDetailState,
} from '../../types/detailModal'
import AllDayStrip from './AllDayStrip.vue'
import CourseCard from './CourseCard.vue'
import EventDetailModal from './EventDetailModal.vue'
import TimeIndicator from './TimeIndicator.vue'

const props = defineProps<{
  events: DayEvent[]
  untimedItems: UntimedDayItem[]
  selectedDate: Date
}>()

const emit = defineEmits<{
  (e: 'selectUntimed', item: UntimedDayItem): void
}>()

const PILL_INSET_LEFT = 0 // must match the left padding on .sx__time-grid-event
const PILL_INSET_RIGHT = 8 // must match the right padding on .sx__time-grid-event
const TZ = 'Asia/Manila'

const now = useNow()

// ---- Grid boundaries ----
const boundaries = computed(() => calculateGridBoundaries(props.events))

// ---- Map DayEvent to Schedule X events ----
// DayEvent.start/end format: "YYYY-MM-DD HH:mm"
function toSxEvents(events: DayEvent[]) {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    start: Temporal.ZonedDateTime.from(`${e.start.replace(' ', 'T')}:00[${TZ}]`),
    end: Temporal.ZonedDateTime.from(`${e.end.replace(' ', 'T')}:00[${TZ}]`),
    // Carry the raw DayEvent so the slot can pass it to CourseCard
    _raw: e,
  }))
}

// ---- Calendar instance ----
// Untimed items are NOT part of it: they live in the AllDayStrip above.
const calendarControls = createCalendarControlsPlugin()

function toPlainDate(d: Date): Temporal.PlainDate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dateStr = String(d.getDate()).padStart(2, '0')
  return Temporal.PlainDate.from(`${y}-${m}-${dateStr}`)
}

const initialB = boundaries.value
const initialHours = initialB.endHour - initialB.startHour

const calendarApp = shallowRef(
  createCalendar(
    {
      views: [createViewDay()],
      defaultView: 'day',
      timezone: TZ,
      skipAnimations: true,
      selectedDate: toPlainDate(props.selectedDate),
      dayBoundaries: {
        start: `${String(initialB.startHour).padStart(2, '0')}:00`,
        end: `${String(initialB.endHour).padStart(2, '0')}:00`,
      },
      weekOptions: {
        gridHeight: initialHours * getHourHeight(),
        gridStep: 60,
        timeAxisFormatOptions: { hour: 'numeric', hour12: true },
      },
      events: toSxEvents(props.events),
    },
    [calendarControls],
  ),
)

// ---- Current time ----
const isToday = computed(() => now.value.toDateString() === props.selectedDate.toDateString())
const nowMinutes = computed(() => now.value.getHours() * 60 + now.value.getMinutes())

function toMinutes(dateTime: string): number {
  const timePart = dateTime.split(' ')[1] ?? '00:00'
  const [h = 0, m = 0] = timePart.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

// Pixel offset of the current time from the top of the grid column
const nowTop = computed<number | null>(() => {
  if (!isToday.value) return null
  const hours = nowMinutes.value / 60
  if (hours < boundaries.value.startHour || hours > boundaries.value.endHour) return null
  return (hours - boundaries.value.startHour) * getHourHeight()
})

const currentEvent = computed(() =>
  props.events.find(
    (e) => toMinutes(e.start) <= nowMinutes.value && nowMinutes.value < toMinutes(e.end),
  ),
)
const nextEvent = computed(() =>
  [...props.events]
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    .find((e) => toMinutes(e.start) > nowMinutes.value),
)
const nowLabel = computed(() => {
  if (currentEvent.value) return currentEvent.value.title
  if (nextEvent.value) return `Next: ${nextEvent.value.title}`
  return 'No class'
})

// ---- DOM references ----
const wrapperRef = ref<HTMLElement | null>(null) // whole component (strip + grid)
const areaRef = ref<HTMLElement | null>(null) // the Schedule X area below the strip
const dayColEl = ref<HTMLElement | null>(null) // the positioned day column
const scrollEl = ref<HTMLElement | null>(null) // the element that scrolls
const scrollTop = ref(0)
const viewHeight = ref(0)
let scrollCleanup: (() => void) | null = null
let resizeObserver: ResizeObserver | null = null

// Where the time line sits, in pixels relative to the Schedule X area
const overlay = ref({ top: 0, left: 0, width: 0 })
// Left edge of the day column, so the all-day strip lines up with the grid pills
const gutterLeft = ref(55)

// Scroll memory: the first build scrolls to "now"; later date changes (swipes)
// restore the position you were at, like Google Calendar.
let didInitialScroll = false
let savedScrollTop = 0

// Update the calendar in-place when date, boundaries, or events change
watch([() => props.selectedDate, boundaries, () => props.events], async ([newDate, newBoundaries, newEvents]) => {
  if (scrollEl.value) savedScrollTop = scrollEl.value.scrollTop
  const b = newBoundaries
  const hours = b.endHour - b.startHour

  calendarControls.setDayBoundaries({
    start: `${String(b.startHour).padStart(2, '0')}:00`,
    end: `${String(b.endHour).padStart(2, '0')}:00`,
  })
  calendarControls.setWeekOptions({
    gridHeight: hours * getHourHeight(),
    gridStep: 60,
    timeAxisFormatOptions: { hour: 'numeric', hour12: true },
  })
  calendarControls.setDate(toPlainDate(newDate))
  calendarApp.value.events.set(toSxEvents(newEvents))

  if (scrollEl.value) {
    scrollEl.value.scrollTop = savedScrollTop
  }
  measure()
  settle(15)

  // Wait for Vue to mount the Teleport components, then paint
  await nextTick()
  requestAnimationFrame(() => {
    wrapperRef.value?.dispatchEvent(new CustomEvent('day-ready', { bubbles: true }))
  })
})

function updateOverlay() {
  const area = areaRef.value
  const col = dayColEl.value
  if (!area || !col) return
  const a = area.getBoundingClientRect()
  const c = col.getBoundingClientRect()
  const diff = c.left - a.left
  gutterLeft.value = Math.abs(diff - 55) <= 1 ? 55 : Math.max(Math.round(diff), 0)
  if (nowTop.value === null) return
  overlay.value = {
    top: c.top - a.top + nowTop.value,
    left: c.left - a.left + PILL_INSET_LEFT,
    width: c.width - PILL_INSET_LEFT - PILL_INSET_RIGHT,
  }
}

function measure() {
  if (scrollEl.value) {
    scrollTop.value = scrollEl.value.scrollTop
    viewHeight.value = scrollEl.value.clientHeight
  }
  updateOverlay()
}

// Re-measure whenever any of these elements change size
function observeLayout() {
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(() => measure())
  if (wrapperRef.value) resizeObserver.observe(wrapperRef.value)
  if (areaRef.value) resizeObserver.observe(areaRef.value)
  if (dayColEl.value) resizeObserver.observe(dayColEl.value)
  if (scrollEl.value) resizeObserver.observe(scrollEl.value)
}

// Re-measure every frame for a short while after (re)building the calendar.
// Schedule X lays out in several steps, and scrolling can move things without
// any resize event, so a one-time measurement can end up stale.
let settleFrame = 0
function settle(frames = 90) {
  cancelAnimationFrame(settleFrame)
  let left = frames
  const tick = () => {
    measure()
    if (--left > 0) settleFrame = requestAnimationFrame(tick)
  }
  settleFrame = requestAnimationFrame(tick)
}

function findDayCol(tries = 40) {
  const el = areaRef.value?.querySelector<HTMLElement>('.sx__time-grid-day') ?? null
  if (el) {
    dayColEl.value = el
    observeLayout()
    updateOverlay()
    return
  }
  if (tries > 0) {
    requestAnimationFrame(() => findDayCol(tries - 1))
  } else {
    console.warn('[DayView] .sx__time-grid-day not found')
  }
}

function attachScrollListener(tries = 40) {
  if (scrollCleanup) {
    scrollCleanup()
    scrollCleanup = null
  }
  const el = areaRef.value?.querySelector<HTMLElement>('.sx__view-container') ?? null
  if (!el) {
    if (tries > 0) {
      requestAnimationFrame(() => attachScrollListener(tries - 1))
    } else {
      console.warn('[DayView] .sx__view-container not found')
    }
    return
  }
  scrollEl.value = el
  observeLayout()
  el.addEventListener('scroll', measure, { passive: true })
  scrollCleanup = () => el.removeEventListener('scroll', measure)
  if (didInitialScroll) {
    // Rebuild after a swipe: keep the scroll position
    el.scrollTop = savedScrollTop
  } else {
    didInitialScroll = true
    scrollToNow('auto')
  }
  measure()
  // Tell the swiper this day is on screen and scrolled into place
  requestAnimationFrame(() => {
    wrapperRef.value?.dispatchEvent(new CustomEvent('day-ready', { bubbles: true }))
  })
}

function setup() {
  findDayCol()
  attachScrollListener()
  settle()
}

onMounted(() => {
  nextTick(setup)
  window.addEventListener('resize', measure)
  // Fonts load after first paint and change the time-axis width
  document.fonts?.ready.then(() => settle(30))
})

onUnmounted(() => {
  scrollCleanup?.()
  resizeObserver?.disconnect()
  cancelAnimationFrame(settleFrame)
  window.removeEventListener('resize', measure)
})

watch(nowTop, () => nextTick(updateOverlay))

// ---- Modal State & Detail Expansion ----
const router = useRouter()

const modalState = ref<ActiveModalState>({
  isOpen: false,
  originRect: null,
  kind: null,
  animationPhase: 'idle',
  payload: null,
})

function getThemeColorClass(theme: 'green' | 'blue' | 'purple' | 'orange') {
  switch (theme) {
    case 'green':
      return 'bg-[#7CE19D]'
    case 'blue':
      return 'bg-[#80C2F8]'
    case 'purple':
      return 'bg-[#C084FC]'
    case 'orange':
      return 'bg-[#FB923C]'
    default:
      return 'bg-[#80C2F8]'
  }
}

function onSelectCourse(event: DayEvent, rect: DOMRect) {
  const startTime = event.start.split(' ')[1] ?? ''
  const endTime = event.end.split(' ')[1] ?? ''
  const timeWindow = formatTimeRange(startTime, endTime)

  const payload: CourseBlockDetailState = {
    courseId: event.courseId,
    courseName: event.title,
    colorDot: getThemeColorClass(event.colorTheme),
    timeWindow,
    tasksTarget: '/tasks',
    notesTarget: '/notes',
  }

  modalState.value = {
    isOpen: true,
    originRect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
    kind: 'course',
    animationPhase: 'expanding',
    payload,
  }
}

// ---- Untimed items ----
function onSelectUntimed(item: UntimedDayItem, rect?: DOMRect) {
  console.log('[DayView] Untimed item tapped:', item.title)
  emit('selectUntimed', item)

  const payload: NonCourseBlockDetailState = {
    id: item.id,
    title: item.title,
    itemType: item.category === 'event' ? 'academic-event' : 'task',
    linkedNote: null,
  }

  modalState.value = {
    isOpen: true,
    originRect: rect
      ? {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }
      : null,
    kind: 'other',
    animationPhase: 'expanding',
    payload,
  }
}

function onCloseModal() {
  modalState.value.isOpen = false
}

function onModalNavigate(routePath: string) {
  modalState.value.isOpen = false
  if (router) {
    router.push(routePath)
  }
}

// ---- Jump button ----
const nowDirection = computed<'up' | 'down' | null>(() => {
  if (nowTop.value === null) return null
  if (nowTop.value < scrollTop.value) return 'up'
  if (nowTop.value > scrollTop.value + viewHeight.value - 24) return 'down'
  return null
})

function scrollToNow(behavior: ScrollBehavior = 'smooth') {
  const el = scrollEl.value
  if (!el) return
  const hHeight = getHourHeight()
  const firstTop =
    props.events.length > 0
      ? Math.min(
          ...props.events.map(
            (e) => (toMinutes(e.start) / 60 - boundaries.value.startHour) * hHeight,
          ),
        )
      : null
  const target = nowTop.value ?? firstTop ?? (8 - boundaries.value.startHour) * hHeight
  el.scrollTo({ top: Math.max(target - 120, 0), behavior })
}
</script>

<template>
  <div ref="wrapperRef" class="relative flex min-h-0 flex-1 flex-col bg-[#F5F6EE]">
    <!-- Tasks/events without a time: sits on top like Google Calendar's all-day row -->
    <AllDayStrip
      v-if="untimedItems.length > 0"
      class="shrink-0"
      :items="untimedItems"
      :style="{ paddingLeft: `${gutterLeft}px` }"
      @select-untimed="onSelectUntimed"
    />

    <!-- Schedule X area: takes all the remaining space and scrolls inside -->
    <div ref="areaRef" class="relative min-h-0 flex-1 sx-nyare-wrapper">
      <!-- Absolute box: always exactly the size of the free space, so Schedule X
           gets a real height and scrolls inside it -->
      <div class="absolute inset-0 sx-nyare-fill">
        <ScheduleXCalendar :calendar-app="calendarApp">
          <template #timeGridEvent="{ calendarEvent }">
            <CourseCard
              :event="(calendarEvent as any)._raw as DayEvent"
              embedded
              @select="onSelectCourse"
            />
          </template>
        </ScheduleXCalendar>
      </div>

      <!-- Time line: a normal Vue overlay above the calendar, clipped to this area -->
      <div
        v-if="dayColEl !== null && nowTop !== null"
        class="absolute inset-0 z-20 overflow-hidden pointer-events-none"
      >
        <div
          class="absolute"
          :style="{
            top: `${overlay.top}px`,
            left: `${overlay.left}px`,
            width: `${overlay.width}px`,
          }"
        >
          <TimeIndicator :top="0" :label="nowLabel" />
        </div>
      </div>

      <!-- Now jump button: bottom LEFT (right side is reserved for a teammate) -->
      <button
        v-if="nowDirection"
        type="button"
        class="absolute bottom-4 left-4 z-30 rounded-full bg-[#0E7490] px-4 py-2 text-sm font-bold text-white shadow-lg active:scale-95 transition-transform"
        @click="scrollToNow()"
      >
        {{ nowDirection === 'up' ? '↑' : '↓' }} Now
      </button>
    </div>

    <!-- Expanding Event Detail Modal Overlay -->
    <EventDetailModal
      :is-open="modalState.isOpen"
      :origin-rect="modalState.originRect"
      :kind="modalState.kind ?? 'course'"
      :data="modalState.payload"
      @close="onCloseModal"
      @navigate="onModalNavigate"
    />
  </div>
</template>

<style scoped>
/* Give every Schedule X wrapper a real height so the grid scrolls inside it */
.sx-nyare-fill,
.sx-nyare-fill :deep(.sx-vue-calendar-wrapper),
.sx-nyare-fill :deep(.sx__calendar-wrapper),
.sx-nyare-fill :deep(.sx__calendar) {
  height: 100%;
  max-height: none;
  width: 100%;
  border: none;
  border-radius: 0;
}

/* Hide Schedule X's own toolbar, date header and all-day row
   (DayViewHeader and AllDayStrip are used instead) */
.sx-nyare-wrapper :deep(.sx__calendar-header),
.sx-nyare-wrapper :deep(.sx__week-grid__date-axis),
.sx-nyare-wrapper :deep(.sx__date-grid) {
  display: none !important;
}

/* Nyare background colour */
.sx-nyare-wrapper :deep(.sx__calendar),
.sx-nyare-wrapper :deep(.sx__view-container) {
  background-color: #f5f6ee;
  --sx-color-background: #f5f6ee;
  --sx-color-outline-variant: #9ccfe0;
  --sx-color-surface: #f5f6ee;
}

/* Grid lines: thin light blue */
.sx-nyare-wrapper :deep(.sx__week-grid__hour) {
  border-top: 1px solid #9ccfe0 !important;
}
.sx-nyare-wrapper :deep(.sx__time-grid-day) {
  border-left: 1px solid #9ccfe0 !important;
}

/* Strip Schedule X's default event card so CourseCard shows as designed.
   Right padding gives the pills a gap from the screen edge
   (keep equal to PILL_INSET_RIGHT in the script). */
.sx-nyare-wrapper :deep(.sx__time-grid-event) {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 0 8px 0 0 !important;
  box-sizing: border-box !important;
  box-shadow: none !important;
  overflow: visible !important;
}

/* Disable Schedule-X slide and event grow transition animations */
.sx-nyare-wrapper :deep(.sx__slide-left),
.sx-nyare-wrapper :deep(.sx__slide-right),
.sx-nyare-wrapper :deep(.sx__time-grid-event.is-event-new) {
  animation: none !important;
  opacity: 1 !important;
  transform: none !important;
}

/* The element that scrolls: thin scrollbar, contained overscroll */
.sx-nyare-wrapper :deep(.sx__view-container) {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #a8a29e transparent;
  overscroll-behavior: contain;
  padding-right: 0;
}
</style>
