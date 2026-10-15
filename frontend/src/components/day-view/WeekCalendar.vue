<script setup lang="ts">
import 'temporal-polyfill/global'
import '@schedule-x/theme-default/dist/calendar.css'
import { ScheduleXCalendar } from '@schedule-x/vue'
import { createCalendar, createViewWeek } from '@schedule-x/calendar'
import { Temporal } from 'temporal-polyfill'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { HOUR_HEIGHT } from '../../constants/calendar'
import { useNow } from '../../composables/useNow'
import type { DayEvent } from '../../types/calendar'
import { toDateKey } from '../../utils/dayKey'
import type { UntimedDayItem } from '../../utils/untimedItems'
import { weekDates } from '../../utils/weekDays'
import WeekHeaderRow from './WeekHeaderRow.vue'
import WeekPill from './WeekPill.vue'

const props = defineProps<{
  selectedDate: Date
  eventsFor: (date: Date) => DayEvent[]
  untimedFor: (date: Date) => UntimedDayItem[]
}>()

const emit = defineEmits<{
  (e: 'selectDay', date: Date): void
}>()

const TZ = 'Asia/Manila'
const GRID_HEIGHT = 24 * HOUR_HEIGHT

const now = useNow()
const todayKey = computed(() => toDateKey(now.value))

// ---- The seven days of the week and their data ----
const days = computed(() => weekDates(props.selectedDate))

const dayInfos = computed(() =>
  days.value.map((date) => ({
    date,
    key: toDateKey(date),
    events: props.eventsFor(date),
    untimed: props.untimedFor(date),
  })),
)

// Schedule X needs unique ids, and the same weekly class repeats on several days
const allEvents = computed<DayEvent[]>(() =>
  dayInfos.value.flatMap((info) =>
    info.events.map((event) => ({ ...event, id: `${info.key}-${event.id}` })),
  ),
)

const todayIndex = computed(() => days.value.findIndex((d) => toDateKey(d) === todayKey.value))

// ---- Map DayEvent to Schedule X events ----
// DayEvent.start/end format: "YYYY-MM-DD HH:mm"
function toSxEvents(events: DayEvent[]) {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    start: Temporal.ZonedDateTime.from(`${e.start.replace(' ', 'T')}:00[${TZ}]`),
    end: Temporal.ZonedDateTime.from(`${e.end.replace(' ', 'T')}:00[${TZ}]`),
    // Carry the raw DayEvent so the slot can pass it to WeekPill
    _raw: e,
  }))
}

// ---- Calendar instance ----
// Rebuilt (new key) whenever the week changes. Untimed items live in the
// WeekHeaderRow above, not in Schedule X.
const calendarKey = ref(0)

const calendarApp = computed(() =>
  createCalendar({
    views: [createViewWeek()],
    defaultView: 'week',
    timezone: TZ,
    firstDayOfWeek: 7, // Sunday
    isResponsive: false, // otherwise a phone-width calendar switches itself to day view
    skipAnimations: true,
    selectedDate: Temporal.PlainDate.from(toDateKey(props.selectedDate)),
    weekOptions: {
      gridHeight: GRID_HEIGHT,
      nDays: 7,
      eventWidth: 94, // leaves a small gap to the right of each pill
      gridStep: 60,
      timeAxisFormatOptions: { hour: 'numeric', hour12: true },
    },
    events: toSxEvents(allEvents.value),
  }),
)

// ---- Current time (today's column only) ----
const nowMinutes = computed(() => now.value.getHours() * 60 + now.value.getMinutes())

const nowTop = computed<number | null>(() => {
  if (todayIndex.value < 0) return null
  return (nowMinutes.value / 60) * HOUR_HEIGHT
})

function toMinutes(dateTime: string): number {
  const timePart = dateTime.split(' ')[1] ?? '00:00'
  const [h = 0, m = 0] = timePart.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

// ---- DOM references inside Schedule X ----
const wrapperRef = ref<HTMLElement | null>(null)
const areaRef = ref<HTMLElement | null>(null)
const scrollEl = ref<HTMLElement | null>(null) // the element that scrolls
const columnsReady = ref(false)
const scrollTop = ref(0)
const viewHeight = ref(0)
let scrollCleanup: (() => void) | null = null
let resizeObserver: ResizeObserver | null = null

const gutterLeft = ref(0) // width of the time axis
const colsWidth = ref(0) // width of the 7 day columns
const overlay = ref({ top: 0, left: 0, width: 0 }) // the time line, relative to the grid area

// Scroll memory: the first build scrolls to "now"; later rebuilds (swipes)
// restore the position you were at.
let didInitialScroll = false
let savedScrollTop = 0

watch(
  () => props.selectedDate,
  () => {
    if (scrollEl.value) savedScrollTop = scrollEl.value.scrollTop
    calendarKey.value++
  },
)

function queryColumns(): HTMLElement[] {
  return Array.from(areaRef.value?.querySelectorAll<HTMLElement>('.sx__time-grid-day') ?? [])
}

function updateOverlay() {
  const area = areaRef.value
  if (!area) return
  const cols = queryColumns()
  const first = cols[0]
  const last = cols[cols.length - 1]
  if (!first || !last) return

  const a = area.getBoundingClientRect()
  const f = first.getBoundingClientRect()
  gutterLeft.value = Math.max(Math.round(f.left - a.left), 0)
  colsWidth.value = Math.max(Math.round(last.getBoundingClientRect().right - f.left), 0)

  const todayCol = todayIndex.value >= 0 ? cols[todayIndex.value] : undefined
  if (todayCol && nowTop.value !== null) {
    const t = todayCol.getBoundingClientRect()
    overlay.value = {
      top: f.top - a.top + nowTop.value,
      left: t.left - a.left,
      width: t.width,
    }
  }
}

function measure() {
  if (scrollEl.value) {
    scrollTop.value = scrollEl.value.scrollTop
    viewHeight.value = scrollEl.value.clientHeight
  }
  updateOverlay()
}

function observeLayout() {
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(() => measure())
  if (wrapperRef.value) resizeObserver.observe(wrapperRef.value)
  if (areaRef.value) resizeObserver.observe(areaRef.value)
  if (scrollEl.value) resizeObserver.observe(scrollEl.value)
}

// Re-measure every frame for a short while after (re)building the calendar
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

function findColumns(tries = 40) {
  if (queryColumns().length > 0) {
    columnsReady.value = true
    observeLayout()
    updateOverlay()
    return
  }
  if (tries > 0) {
    requestAnimationFrame(() => findColumns(tries - 1))
  } else {
    console.warn('[WeekView] .sx__time-grid-day not found')
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
      console.warn('[WeekView] .sx__view-container not found')
    }
    return
  }
  scrollEl.value = el
  observeLayout()
  el.addEventListener('scroll', measure, { passive: true })
  scrollCleanup = () => el.removeEventListener('scroll', measure)
  if (didInitialScroll) {
    el.scrollTop = savedScrollTop
  } else {
    didInitialScroll = true
    scrollToNow('auto')
  }
  measure()
  // Tell the swiper this week is on screen and scrolled into place
  requestAnimationFrame(() => {
    wrapperRef.value?.dispatchEvent(new CustomEvent('day-ready', { bubbles: true }))
  })
}

function setup() {
  findColumns()
  attachScrollListener()
  settle()
}

onMounted(() => {
  nextTick(setup)
  window.addEventListener('resize', measure)
  document.fonts?.ready.then(() => settle(30))
})

onUnmounted(() => {
  scrollCleanup?.()
  resizeObserver?.disconnect()
  cancelAnimationFrame(settleFrame)
  window.removeEventListener('resize', measure)
})

// After a calendar rebuild, find the new elements
watch(calendarKey, () => {
  columnsReady.value = false
  scrollEl.value = null
  nextTick(setup)
})

watch(nowTop, () => nextTick(updateOverlay))

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
  const firstTop =
    allEvents.value.length > 0
      ? Math.min(...allEvents.value.map((e) => (toMinutes(e.start) / 60) * HOUR_HEIGHT))
      : null
  const target = nowTop.value ?? firstTop ?? 8 * HOUR_HEIGHT
  el.scrollTo({ top: Math.max(target - 120, 0), behavior })
}
</script>

<template>
  <div ref="wrapperRef" class="relative flex min-h-0 flex-1 flex-col">
    <!-- Day names, dates and untimed items; tap a day to open it -->
    <WeekHeaderRow
      :days="dayInfos"
      :today-key="todayKey"
      :gutter-left="gutterLeft"
      :cols-width="colsWidth"
      @select="emit('selectDay', $event)"
    />

    <div ref="areaRef" class="relative min-h-0 flex-1 sx-nyare-week">
      <div class="absolute inset-0 sx-nyare-fill">
        <ScheduleXCalendar :calendar-app="calendarApp" :key="calendarKey">
          <template #timeGridEvent="{ calendarEvent }">
            <WeekPill :event="(calendarEvent as any)._raw as DayEvent" />
          </template>
        </ScheduleXCalendar>
      </div>

      <!-- Time line: only across today's column, like Google Calendar -->
      <div
        v-if="columnsReady && nowTop !== null && todayIndex >= 0"
        class="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      >
        <div
          class="absolute flex -translate-y-1/2 items-center"
          :style="{
            top: `${overlay.top}px`,
            left: `${overlay.left}px`,
            width: `${overlay.width}px`,
          }"
        >
          <div class="-ml-[5px] h-2.5 w-2.5 shrink-0 rounded-full bg-[#0E7490]" />
          <div class="h-[2px] flex-1 bg-[#0E7490]" />
        </div>
      </div>

      <!-- Now jump button: bottom LEFT (right side is reserved for a teammate) -->
      <button
        v-if="nowDirection"
        type="button"
        class="absolute bottom-4 left-4 z-30 rounded-full bg-[#0E7490] px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform active:scale-95"
        @click="scrollToNow()"
      >
        {{ nowDirection === 'up' ? '↑' : '↓' }} Now
      </button>
    </div>
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
   (WeekHeaderRow is used instead) */
.sx-nyare-week :deep(.sx__calendar-header),
.sx-nyare-week :deep(.sx__week-grid__date-axis),
.sx-nyare-week :deep(.sx__date-grid) {
  display: none !important;
}

/* Nyare background colour */
.sx-nyare-week :deep(.sx__calendar),
.sx-nyare-week :deep(.sx__view-container) {
  background-color: #f5f6ee;
  --sx-color-background: #f5f6ee;
  --sx-color-outline-variant: #9ccfe0;
  --sx-color-surface: #f5f6ee;
}

/* Grid lines: thin light blue, with a line between the day columns */
.sx-nyare-week :deep(.sx__week-grid__hour) {
  border-top: 1px solid #9ccfe0 !important;
}
.sx-nyare-week :deep(.sx__time-grid-day) {
  border-left: 1px solid #9ccfe0 !important;
}

/* Time-axis labels */
.sx-nyare-week :deep(.sx__week-grid__hour-text) {
  color: #a8a29e;
  font-weight: 600;
  font-size: 0.75rem;
}

/* Strip Schedule X's default event card so WeekPill shows as designed */
.sx-nyare-week :deep(.sx__time-grid-event) {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
  box-shadow: none !important;
  overflow: visible !important;
}

/* The element that scrolls: thin scrollbar, contained overscroll */
.sx-nyare-week :deep(.sx__view-container) {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #a8a29e transparent;
  overscroll-behavior: contain;
}
</style>
