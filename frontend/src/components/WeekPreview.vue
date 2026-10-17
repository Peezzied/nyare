<script lang="ts">
const detachedRoots = new Set<HTMLElement>()
let domPatched = false
let syncQueue: Array<() => void> | null = null
const pendingRafs = new Map<number, FrameRequestCallback>()
const pendingZeroTimeouts = new Map<unknown, () => void>()
let nextRafId = 1

function ensureDetachedDomSupport() {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }

  if (domPatched || typeof document === 'undefined') return
  domPatched = true

  const origRaf = globalThis.requestAnimationFrame?.bind(globalThis)
  const origCancelRaf = globalThis.cancelAnimationFrame?.bind(globalThis)
  const origSetTimeout = globalThis.setTimeout.bind(globalThis)
  const origClearTimeout = globalThis.clearTimeout.bind(globalThis)

  if (origRaf) {
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback): number => {
      if (syncQueue) {
        syncQueue.push(() => cb(0))
        return nextRafId++
      }
      const id = nextRafId++
      pendingRafs.set(id, cb)
      origRaf((ts) => {
        if (pendingRafs.delete(id)) {
          cb(ts)
        }
      })
      return id
    }) as typeof globalThis.requestAnimationFrame

    globalThis.cancelAnimationFrame = ((id: number) => {
      pendingRafs.delete(id)
      origCancelRaf?.(id)
    }) as typeof globalThis.cancelAnimationFrame
  }

  globalThis.setTimeout = ((cb: TimerHandler, ms?: number, ...args: unknown[]) => {
    if (typeof cb === 'function' && (ms === undefined || ms === 0)) {
      if (syncQueue) {
        syncQueue.push(() => cb(...args))
        return 0 as unknown as ReturnType<typeof setTimeout>
      }
      const handle = origSetTimeout(() => {
        if (pendingZeroTimeouts.delete(handle)) {
          cb(...args)
        }
      }, ms)
      pendingZeroTimeouts.set(handle, () => cb(...args))
      return handle
    }
    return origSetTimeout(cb, ms, ...args)
  }) as typeof globalThis.setTimeout

  globalThis.clearTimeout = ((handle: ReturnType<typeof setTimeout> | undefined) => {
    pendingZeroTimeouts.delete(handle)
    origClearTimeout(handle)
  }) as typeof globalThis.clearTimeout

  const origGetById = document.getElementById.bind(document)
  document.getElementById = (id: string): HTMLElement | null => {
    const found = origGetById(id)
    if (found) return found
    const roots = Array.from(detachedRoots).reverse()
    for (const root of roots) {
      if (!root.isConnected) {
        const el = root.querySelector<HTMLElement>(`[id="${id}"]`)
        if (el) return el
      }
    }
    return null
  }

  const origQuerySelector = document.querySelector.bind(document)
  document.querySelector = ((selector: string): Element | null => {
    const found = origQuerySelector(selector)
    if (found) return found
    const roots = Array.from(detachedRoots).reverse()
    for (const root of roots) {
      if (!root.isConnected) {
        try {
          const el = root.querySelector(selector)
          if (el) return el
        } catch {
          // ignore invalid selector
        }
      }
    }
    return null
  }) as typeof document.querySelector
}
</script>

<script setup lang="ts">
import 'temporal-polyfill/global'
import '@schedule-x/theme-default/dist/calendar.css'
import { ScheduleXCalendar } from '@schedule-x/vue'
import { createCalendar, createViewWeek } from '@schedule-x/calendar'
import { Temporal } from 'temporal-polyfill'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { HOUR_HEIGHT } from '@/constants/calendar'
import { WEEKDAYS } from '@/components/TimeBlockCard.vue'
import type { DayOfWeek } from '@/types/api'
import type { PreviewBlock, PendingSlot } from '@/utils/weekPreview'
import { minutesToTime, timeToMinutes } from '@/utils/weekPreview'
import { formatTime12h } from '@/utils/scheduleExpander'

ensureDetachedDomSupport()

interface WeekPreviewProps {
  blocks?: PreviewBlock[]
  pendingSlot?: PendingSlot | null
  selectedColor?: string
}

const props = withDefaults(defineProps<WeekPreviewProps>(), {
  blocks: () => [],
  pendingSlot: null,
  selectedColor: undefined,
})

const emit = defineEmits<{
  selectSlot: [slot: PendingSlot]
  selectBlock: [blockId: string]
}>()

const TZ = 'Asia/Manila'
const GRID_HEIGHT = 24 * HOUR_HEIGHT
const ANCHOR_SUNDAY = '2024-01-07'

const DAY_TO_DATE: Record<DayOfWeek, string> = {
  SUNDAY: '2024-01-07',
  MONDAY: '2024-01-08',
  TUESDAY: '2024-01-09',
  WEDNESDAY: '2024-01-10',
  THURSDAY: '2024-01-11',
  FRIDAY: '2024-01-12',
  SATURDAY: '2024-01-13',
}

const DATE_TO_DAY: Record<string, DayOfWeek> = {
  '2024-01-07': 'SUNDAY',
  '2024-01-08': 'MONDAY',
  '2024-01-09': 'TUESDAY',
  '2024-01-10': 'WEDNESDAY',
  '2024-01-11': 'THURSDAY',
  '2024-01-12': 'FRIDAY',
  '2024-01-13': 'SATURDAY',
}

interface RawPreviewEvent {
  id: string
  day: DayOfWeek
  title: string
  startTime: string
  endTime: string
  color: string
  blockId: string
  isPending: boolean
}

function toZonedDateTime(dateStr: string, timeStr: string): Temporal.ZonedDateTime {
  const safeTime = timeStr === '24:00' ? '23:59' : timeStr
  return Temporal.ZonedDateTime.from(`${dateStr}T${safeTime}:00[${TZ}]`)
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime12h(start)} – ${formatTime12h(end)}`
}

const allRawEvents = computed<RawPreviewEvent[]>(() => {
  const list: RawPreviewEvent[] = props.blocks.map((b) => ({
    ...b,
    isPending: false,
  }))

  if (props.pendingSlot) {
    list.push({
      id: '__pending_slot__',
      day: props.pendingSlot.day,
      title: '',
      startTime: props.pendingSlot.startTime,
      endTime: props.pendingSlot.endTime,
      color: props.selectedColor || '#007B99',
      blockId: '',
      isPending: true,
    })
  }

  return list
})

function toSxEvents(events: RawPreviewEvent[]) {
  return events.map((e) => {
    const dateStr = DAY_TO_DATE[e.day]
    return {
      id: e.id,
      title: e.title,
      start: toZonedDateTime(dateStr, e.startTime),
      end: toZonedDateTime(dateStr, e.endTime),
      _raw: e,
    }
  })
}

const calendarKey = ref(0)
const areaRef = ref<HTMLElement | null>(null)
const scheduleXRef = ref<InstanceType<typeof ScheduleXCalendar> | null>(null)

function registerAreaRef(el: unknown) {
  if (areaRef.value) {
    detachedRoots.delete(areaRef.value)
  }
  areaRef.value = (el as HTMLElement) ?? null
  if (areaRef.value) {
    detachedRoots.add(areaRef.value)
  }
}

const calendarApp = computed(() => {
  const app = createCalendar({
    views: [createViewWeek()],
    defaultView: 'week',
    timezone: TZ,
    firstDayOfWeek: 7,
    isResponsive: false,
    skipAnimations: true,
    selectedDate: Temporal.PlainDate.from(ANCHOR_SUNDAY),
    weekOptions: {
      gridHeight: GRID_HEIGHT,
      nDays: 7,
      eventWidth: 96,
      gridStep: 60,
      timeAxisFormatOptions: { hour: 'numeric', hour12: true },
    },
    callbacks: {
      onClickDateTime(dateTime: Temporal.ZonedDateTime) {
        const dateKey = dateTime.toPlainDate().toString()
        const day = DATE_TO_DAY[dateKey]
        if (!day) return
        const rawMin = dateTime.hour * 60 + dateTime.minute
        const startMinutes = Math.min(24 * 60 - 15, Math.floor(rawMin / 15) * 15)
        const endMinutes = Math.min(24 * 60, startMinutes + 60)
        emit('selectSlot', {
          day,
          startTime: minutesToTime(startMinutes),
          endTime: minutesToTime(endMinutes),
        })
      },
    },
    events: toSxEvents(allRawEvents.value),
  })

  const origRender = app.render.bind(app)
  app.render = (el: HTMLElement | null) => {
    const target =
      el ?? areaRef.value?.querySelector<HTMLElement>('.sx-vue-calendar-wrapper') ?? null
    if (target) {
      const queue: Array<() => void> = []
      syncQueue = queue

      for (const [id, cb] of pendingRafs.entries()) {
        pendingRafs.delete(id)
        queue.push(() => cb(0))
      }
      for (const [handle, cb] of pendingZeroTimeouts.entries()) {
        pendingZeroTimeouts.delete(handle)
        queue.push(cb)
      }

      try {
        let guard = 0
        while (queue.length > 0 && guard++ < 50) {
          const fn = queue.shift()!
          fn()
        }
        origRender(target)
        while (queue.length > 0 && guard++ < 50) {
          const fn = queue.shift()!
          fn()
        }
        ;(scheduleXRef.value as { $?: { update?: () => void } } | null)?.$?.update?.()
        while (queue.length > 0 && guard++ < 50) {
          const fn = queue.shift()!
          fn()
        }
      } finally {
        syncQueue = null
      }
    }
  }

  return app
})
const gutterLeft = ref(0)
const colsWidth = ref(0)
let resizeObserver: ResizeObserver | null = null
let savedScrollTop = 0
let didInitialScroll = false

function updateLayout() {
  const area = areaRef.value
  if (!area) return
  const cols = Array.from(area.querySelectorAll<HTMLElement>('.sx__time-grid-day'))
  const first = cols[0]
  const last = cols[cols.length - 1]
  if (!first || !last) return

  const a = area.getBoundingClientRect()
  const f = first.getBoundingClientRect()
  gutterLeft.value = Math.max(Math.round(f.left - a.left), 0)
  colsWidth.value = Math.max(Math.round(last.getBoundingClientRect().right - f.left), 0)
}

function syncScroll() {
  const scroller = areaRef.value?.querySelector<HTMLElement>('.sx__view-container')
  if (!scroller) return
  if (!didInitialScroll) {
    didInitialScroll = true
    let startMin = 8 * 60
    for (const b of props.blocks) {
      const min = timeToMinutes(b.startTime)
      if (min < startMin) {
        startMin = min
      }
    }
    scroller.scrollTop = Math.max(0, (startMin / 60) * HOUR_HEIGHT - 20)
  } else {
    scroller.scrollTop = savedScrollTop
  }
}

function setupCalendarDom() {
  updateLayout()
  syncScroll()
  if (typeof ResizeObserver !== 'undefined' && areaRef.value) {
    resizeObserver?.disconnect()
    resizeObserver = new ResizeObserver(() => updateLayout())
    resizeObserver.observe(areaRef.value)
  }
}

watch(
  [() => props.blocks, () => props.pendingSlot, () => props.selectedColor],
  () => {
    const scroller = areaRef.value?.querySelector<HTMLElement>('.sx__view-container')
    if (scroller) {
      savedScrollTop = scroller.scrollTop
    }
    calendarKey.value++
    nextTick(setupCalendarDom)
  },
  { deep: true },
)

function onBlockClick(blockId: string) {
  emit('selectBlock', blockId)
}

onMounted(() => {
  nextTick(setupCalendarDom)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  if (areaRef.value) {
    detachedRoots.delete(areaRef.value)
  }
})
</script>

<template>
  <div
    role="grid"
    aria-label="Week preview"
    class="flex h-full w-full flex-col select-none bg-[#F5F6EE]"
  >
    <!-- Header row showing only 7 weekday labels and no dates -->
    <div
      class="flex shrink-0 border-b border-[#9ccfe0] bg-[#F5F6EE]"
      :style="gutterLeft > 0 ? { paddingLeft: `${gutterLeft}px` } : {}"
    >
      <div v-if="gutterLeft === 0" class="w-11 shrink-0 border-r border-[#9ccfe0]/60" />
      <div
        class="grid flex-1 grid-cols-7 text-center"
        :style="colsWidth > 0 ? { width: `${colsWidth}px`, flex: 'none' } : {}"
      >
        <div
          v-for="day in WEEKDAYS"
          :key="day.value"
          class="border-r border-[#9ccfe0]/60 py-2.5 last:border-r-0"
        >
          <span class="text-xs font-bold text-[#1E293B]">
            {{ day.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- Schedule-X Week Grid -->
    <div :ref="registerAreaRef" class="relative min-h-0 flex-1 sx-nyare-week">
      <div class="absolute inset-0 sx-nyare-fill">
        <ScheduleXCalendar ref="scheduleXRef" :key="calendarKey" :calendar-app="calendarApp">
          <template #headerContent><span /></template>
          <template #timeGridEvent="{ calendarEvent }">
            <div
              v-if="(calendarEvent as any)._raw?.isPending"
              data-testid="pending-slot-block"
              class="flex h-full w-full flex-col overflow-hidden rounded-xl border border-dashed border-black/30 p-1 text-white shadow-md"
              :style="{ backgroundColor: (calendarEvent as any)._raw.color }"
            >
              <p
                class="truncate text-[10px] font-bold leading-3 select-none text-white drop-shadow-xs"
              >
                {{
                  formatTimeRange(
                    (calendarEvent as any)._raw.startTime,
                    (calendarEvent as any)._raw.endTime,
                  )
                }}
              </p>
            </div>
            <button
              v-else
              type="button"
              :aria-label="
                (calendarEvent as any)._raw.title
                  ? `${(calendarEvent as any)._raw.title} ${(calendarEvent as any)._raw.startTime} to ${(calendarEvent as any)._raw.endTime}`
                  : `${(calendarEvent as any)._raw.startTime} to ${(calendarEvent as any)._raw.endTime}`
              "
              class="h-full w-full min-h-[44px] overflow-hidden rounded-md border-[1.5px] border-black/20 p-1 text-left text-white shadow-sm transition-transform active:scale-95"
              :style="{ backgroundColor: (calendarEvent as any)._raw.color }"
              @click.stop="onBlockClick((calendarEvent as any)._raw.blockId)"
            >
              <p
                v-if="(calendarEvent as any)._raw.title"
                class="truncate text-[10px] font-bold leading-3"
              >
                {{ (calendarEvent as any)._raw.title }}
              </p>
            </button>
          </template>
        </ScheduleXCalendar>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.sx-nyare-week :deep(.sx__calendar-header),
.sx-nyare-week :deep(.sx__week-grid__date-axis),
.sx-nyare-week :deep(.sx__date-grid) {
  display: none !important;
}

.sx-nyare-week :deep(.sx__calendar),
.sx-nyare-week :deep(.sx__view-container) {
  background-color: #f5f6ee;
  --sx-color-background: #f5f6ee;
  --sx-color-outline-variant: #9ccfe0;
  --sx-color-surface: #f5f6ee;
}

.sx-nyare-week :deep(.sx__week-grid__hour) {
  border-top: 1px solid #9ccfe0 !important;
}

.sx-nyare-week :deep(.sx__time-grid-day) {
  border-left: 1px solid #9ccfe0 !important;
}

.sx-nyare-week :deep(.sx__week-grid__hour-text) {
  color: #a8a29e;
  font-weight: 600;
  font-size: 0.75rem;
}

.sx-nyare-week :deep(.sx__time-grid-event) {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
  box-shadow: none !important;
  overflow: visible !important;
}

.sx-nyare-week :deep(.sx__view-container) {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #a8a29e transparent;
  overscroll-behavior: contain;
}
</style>
