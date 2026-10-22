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
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { getHourHeight } from '@/utils/calendarStyle'
import { WEEKDAYS } from '@/components/TimeBlockCard.vue'
import type { DayOfWeek } from '@/types/api'
import type { PreviewBlock, PendingSlot } from '@/utils/weekPreview'
import { minutesToTime, timeToMinutes, moveSlot2D, resizeSlotHandle } from '@/utils/weekPreview'

ensureDetachedDomSupport()

interface WeekPreviewProps {
  blocks?: PreviewBlock[]
  /** Pixels at the scroller's bottom covered by an overlay (e.g. the drawer). */
  bottomClearance?: number
}

const props = withDefaults(defineProps<WeekPreviewProps>(), {
  blocks: () => [],
  bottomClearance: 0,
})

const emit = defineEmits<{
  selectSlot: [slot: PendingSlot]
  selectBlock: [blockId: string]
  moveBlock: [blockId: string, fromDay: DayOfWeek, slot: PendingSlot]
}>()

const TZ = 'Asia/Manila'
const ANCHOR_SUNDAY = '2024-01-07'
// Same floor as min-h-[44px] on the block button, snapped to the 15-minute grid.
const PILL_MIN_HEIGHT_PX = 44
// The resize handles hang 8px above and below the pill edge.
const PILL_HANDLE_OVERHANG = 8

function minBlockMinutes(): number {
  return Math.ceil(((PILL_MIN_HEIGHT_PX / getHourHeight()) * 60) / 15) * 15
}

/**
 * Shifts a pill vertically so its painted height (min-h button plus handle
 * overhang) stays inside the grid at the start and end of the calendar.
 */
function pillShiftY(raw: PreviewBlock): number {
  const pxPerMinute = getHourHeight() / 60
  const gridBottom = 24 * getHourHeight()
  const top = timeToMinutes(raw.startTime) * pxPerMinute
  const painted = Math.max(
    PILL_MIN_HEIGHT_PX,
    (timeToMinutes(raw.endTime) - timeToMinutes(raw.startTime)) * pxPerMinute,
  )
  const overBottom = top + painted + PILL_HANDLE_OVERHANG - gridBottom
  if (overBottom > 0) return -overBottom
  return Math.max(0, PILL_HANDLE_OVERHANG - top)
}

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

function toZonedDateTime(dateStr: string, timeStr: string): Temporal.ZonedDateTime {
  const safeTime = timeStr === '24:00' ? '23:59' : timeStr
  return Temporal.ZonedDateTime.from(`${dateStr}T${safeTime}:00[${TZ}]`)
}

function toSxEvents(events: PreviewBlock[]) {
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

const calendarApp = createCalendar({
  views: [createViewWeek()],
  defaultView: 'week',
  timezone: TZ,
  firstDayOfWeek: 7,
  isResponsive: false,
  skipAnimations: true,
  selectedDate: Temporal.PlainDate.from(ANCHOR_SUNDAY),
  weekOptions: {
    gridHeight: 24 * getHourHeight(),
    nDays: 7,
    eventWidth: 94,
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
  events: toSxEvents(props.blocks),
})

const origRender = calendarApp.render.bind(calendarApp)
calendarApp.render = (el: HTMLElement | null) => {
  const target = el ?? areaRef.value?.querySelector<HTMLElement>('.sx-vue-calendar-wrapper') ?? null
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

const gutterLeft = ref(0)
const colsWidth = ref(0)
let resizeObserver: ResizeObserver | null = null
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
  if (!scroller || didInitialScroll) return
  didInitialScroll = true
  let startMin = 8 * 60
  for (const b of props.blocks) {
    const min = timeToMinutes(b.startTime)
    if (min < startMin) {
      startMin = min
    }
  }
  scroller.scrollTop = Math.max(0, (startMin / 60) * getHourHeight() - 20)
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

// Events refresh in place; the calendar is never remounted, so the scroll
// container and its position survive every update.
const seenBlocks = new Map(props.blocks.map((b) => [b.id, `${b.startTime}-${b.endTime}`]))

/** Scrolls the grid so a block stays above anything covering the scroller's bottom edge. */
function revealBlock(block: PreviewBlock) {
  const scroller = areaRef.value?.querySelector<HTMLElement>('.sx__view-container')
  if (!scroller) return
  const visibleBottom = scroller.clientHeight - props.bottomClearance
  if (visibleBottom <= 0) return
  const top = (timeToMinutes(block.startTime) / 60) * getHourHeight()
  const bottom = (timeToMinutes(block.endTime) / 60) * getHourHeight()
  if (bottom > scroller.scrollTop + visibleBottom) {
    scroller.scrollTo({ top: bottom - visibleBottom + 8, behavior: 'smooth' })
  } else if (top < scroller.scrollTop) {
    scroller.scrollTo({ top: top - 8, behavior: 'smooth' })
  }
}

function syncEvents() {
  // Blocks added or retimed after the initial scroll count; first load is
  // positioned by syncScroll instead. A re-tapped pending slot keeps its id,
  // so the time signature marks it for reveal too.
  const changed = didInitialScroll
    ? props.blocks.filter((b) => seenBlocks.get(b.id) !== `${b.startTime}-${b.endTime}`)
    : []
  seenBlocks.clear()
  for (const b of props.blocks) seenBlocks.set(b.id, `${b.startTime}-${b.endTime}`)
  calendarApp.events.set(toSxEvents(props.blocks))
  nextTick(() => {
    setupCalendarDom()
    if (changed[0]) revealBlock(changed[0])
  })
}

watch(
  [() => props.blocks],
  () => {
    // Refreshing events mid-drag would drop the pointer capture and the
    // element being visually translated, so defer until the drag ends.
    if (blockDrag) {
      rebuildAfterDrag = true
      return
    }
    syncEvents()
  },
  { deep: true },
)

type BlockDragMode = 'moving' | 'resizing-top' | 'resizing-bottom'

interface BlockDrag {
  pointerId: number
  mode: BlockDragMode
  raw: PreviewBlock
  startClientX: number
  startClientY: number
  clickOffsetMinutes: number
  eventEl: HTMLElement | null
  moved: boolean
  slot: PendingSlot | null
}

let blockDrag: BlockDrag | null = null
let rebuildAfterDrag = false
let suppressNextBlockClick = false
let lastDragEvent: PointerEvent | null = null
let dragScrollRaf = 0

const DRAG_EDGE_ZONE = 56
const DRAG_SCROLL_STEP = 12

// The week grid element carries a 55px left gutter for the time axis, so the
// column span is measured from the first to the last day column instead.
function dayGridRect(): DOMRect | null {
  const cols = areaRef.value?.querySelectorAll<HTMLElement>('.sx__time-grid-day')
  const first = cols?.[0]
  const last = cols?.[cols.length - 1]
  if (!first || !last) return null
  const f = first.getBoundingClientRect()
  const l = last.getBoundingClientRect()
  return new DOMRect(f.left, f.top, l.right - f.left, f.height)
}

function dragScroller(): HTMLElement | null {
  return areaRef.value?.querySelector<HTMLElement>('.sx__view-container') ?? null
}

function onBlockPointerDown(e: PointerEvent, raw: PreviewBlock, mode: BlockDragMode = 'moving') {
  if (e.button !== 0) return
  const rect = dayGridRect()
  if (!rect) return

  const clickMinutes = ((e.clientY - rect.top) / getHourHeight()) * 60
  blockDrag = {
    pointerId: e.pointerId,
    mode,
    raw,
    startClientX: e.clientX,
    startClientY: e.clientY,
    clickOffsetMinutes: clickMinutes - timeToMinutes(raw.startTime),
    eventEl: (e.currentTarget as HTMLElement).closest<HTMLElement>('.sx__time-grid-event'),
    moved: false,
    slot: null,
  }
  const scroller = dragScroller()
  if (scroller) scroller.style.scrollBehavior = 'auto'

  window.addEventListener('pointermove', onBlockPointerMove)
  window.addEventListener('pointerup', onBlockPointerUp)
  window.addEventListener('pointercancel', onBlockPointerUp)
}

/**
 * Auto-scrolls the grid while a dragged edge hovers near the scroller's top or
 * the drawer's top edge, so a block can reach the calendar's start and end.
 */
function edgeAutoScroll() {
  const drag = blockDrag
  const e = lastDragEvent
  const scroller = dragScroller()
  if (!drag || !e || !scroller) {
    dragScrollRaf = 0
    return
  }
  const bounds = scroller.getBoundingClientRect()
  const bottomEdge = bounds.bottom - props.bottomClearance
  let delta = 0
  if (e.clientY > bottomEdge - DRAG_EDGE_ZONE) delta = DRAG_SCROLL_STEP
  else if (e.clientY < bounds.top + DRAG_EDGE_ZONE) delta = -DRAG_SCROLL_STEP
  if (!delta) {
    dragScrollRaf = 0
    return
  }
  scroller.scrollTop += delta
  applyDragFrame(e)
  dragScrollRaf = requestAnimationFrame(edgeAutoScroll)
}

function onBlockPointerMove(e: PointerEvent) {
  const drag = blockDrag
  if (!drag || drag.pointerId !== e.pointerId) return
  lastDragEvent = e

  if (!drag.moved) {
    if (
      Math.abs(e.clientX - drag.startClientX) < 4 &&
      Math.abs(e.clientY - drag.startClientY) < 4
    ) {
      return
    }
    drag.moved = true
  }

  applyDragFrame(e)
  if (!dragScrollRaf) dragScrollRaf = requestAnimationFrame(edgeAutoScroll)
}

function applyDragFrame(e: PointerEvent) {
  const drag = blockDrag
  if (!drag) return
  const rect = dayGridRect()
  if (!rect) return

  const offsetX = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left))
  const offsetY = Math.max(0, Math.min(24 * getHourHeight(), e.clientY - rect.top))
  const base: PendingSlot = {
    day: drag.raw.day,
    startTime: drag.raw.startTime,
    endTime: drag.raw.endTime,
  }
  const slot =
    drag.mode === 'moving'
      ? moveSlot2D(base, offsetX, offsetY, drag.clickOffsetMinutes, rect.width)
      : resizeSlotHandle(
          base,
          drag.mode === 'resizing-top' ? 'top' : 'bottom',
          offsetY,
          minBlockMinutes(),
        )
  drag.slot = slot

  // Live visual: reposition the event container directly; rebuild is deferred.
  const el = drag.eventEl
  if (!el) return
  const pxPerMinute = getHourHeight() / 60
  const colWidth = rect.width / 7
  const rawDayIndex = WEEKDAYS.findIndex((w) => w.value === drag.raw.day)
  const newDayIndex = WEEKDAYS.findIndex((w) => w.value === slot.day)
  const deltaX = (newDayIndex - rawDayIndex) * colWidth
  const startMin = timeToMinutes(slot.startTime)
  const rawStartMin = timeToMinutes(drag.raw.startTime)
  const deltaY = drag.mode === 'resizing-bottom' ? 0 : (startMin - rawStartMin) * pxPerMinute
  el.style.transform = `translate(${deltaX}px, ${deltaY}px)`
  el.style.zIndex = '30'
  if (drag.mode !== 'moving') {
    const newHeight = Math.max(20, (timeToMinutes(slot.endTime) - startMin) * pxPerMinute)
    el.style.height = `${newHeight}px`
  }
}

function onBlockPointerUp(e: PointerEvent) {
  const drag = blockDrag
  if (!drag || drag.pointerId !== e.pointerId) return
  blockDrag = null
  lastDragEvent = null
  if (dragScrollRaf) {
    cancelAnimationFrame(dragScrollRaf)
    dragScrollRaf = 0
  }
  const scroller = dragScroller()
  if (scroller) scroller.style.scrollBehavior = ''
  window.removeEventListener('pointermove', onBlockPointerMove)
  window.removeEventListener('pointerup', onBlockPointerUp)
  window.removeEventListener('pointercancel', onBlockPointerUp)

  if (drag.moved && drag.slot) {
    suppressNextBlockClick = true
    // Strip the live-drag transform before the events refresh re-renders the
    // pill; a reused DOM node would otherwise keep it.
    const el = drag.eventEl
    if (el) {
      el.style.transform = ''
      el.style.zIndex = ''
      el.style.height = ''
    }
    emit('moveBlock', drag.raw.blockId, drag.raw.day, drag.slot)
  }
  if (rebuildAfterDrag) {
    rebuildAfterDrag = false
    syncEvents()
  }
}

function onBlockClick(raw: PreviewBlock) {
  if (suppressNextBlockClick) {
    suppressNextBlockClick = false
    return
  }
  emit('selectBlock', raw.blockId)
  nextTick(() => revealBlock(raw))
}

onMounted(() => {
  nextTick(setupCalendarDom)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  cancelAnimationFrame(dragScrollRaf)
  window.removeEventListener('pointermove', onBlockPointerMove)
  window.removeEventListener('pointerup', onBlockPointerUp)
  window.removeEventListener('pointercancel', onBlockPointerUp)
  if (areaRef.value) {
    detachedRoots.delete(areaRef.value)
  }
})
</script>

<template>
  <div
    role="grid"
    aria-label="Week preview"
    class="flex h-full w-full flex-col select-none bg-app-bg"
  >
    <!-- Header row showing only 7 weekday labels and no dates -->
    <div
      class="flex shrink-0 border-b border-app-border bg-app-bg"
      :style="gutterLeft > 0 ? { paddingLeft: `${gutterLeft}px` } : {}"
    >
      <div v-if="gutterLeft === 0" class="w-11 shrink-0" />
      <div
        class="grid flex-1 grid-cols-7 text-center"
        :style="colsWidth > 0 ? { width: `${colsWidth}px`, flex: 'none' } : {}"
      >
        <div v-for="day in WEEKDAYS" :key="day.value" class="py-2.5">
          <span class="text-xs font-bold tracking-wide text-stone-500">
            {{ day.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- Schedule-X Week Grid -->
    <div
      :ref="registerAreaRef"
      class="relative min-h-0 flex-1 sx-nyare-week"
      :style="{ '--week-preview-clearance': `${bottomClearance + 8}px` }"
    >
      <div class="absolute inset-0 sx-nyare-fill">
        <ScheduleXCalendar ref="scheduleXRef" :calendar-app="calendarApp">
          <template #headerContent><span /></template>
          <template #timeGridEvent="{ calendarEvent }">
            <div
              class="group relative h-full w-full touch-none"
              :style="{
                transform: `translateY(${pillShiftY((calendarEvent as any)._raw)}px)`,
              }"
              @pointerdown="onBlockPointerDown($event, (calendarEvent as any)._raw)"
            >
              <button
                type="button"
                :aria-label="
                  (calendarEvent as any)._raw.title
                    ? `${(calendarEvent as any)._raw.title} ${(calendarEvent as any)._raw.startTime} to ${(calendarEvent as any)._raw.endTime}`
                    : `${(calendarEvent as any)._raw.startTime} to ${(calendarEvent as any)._raw.endTime}`
                "
                class="h-full w-full min-h-[44px] cursor-move overflow-hidden rounded-md border p-1 text-left shadow-sm transition-all active:scale-95"
                :style="{
                  backgroundColor: (calendarEvent as any)._raw.color.bg,
                  borderColor: (calendarEvent as any)._raw.color.border,
                  color: (calendarEvent as any)._raw.color.text,
                  opacity: (calendarEvent as any)._raw.dimmed ? 0.55 : 1,
                }"
                @click.stop="onBlockClick((calendarEvent as any)._raw)"
              >
                <p
                  v-if="(calendarEvent as any)._raw.title"
                  class="truncate font-secondary text-[10px] font-semibold leading-[13px]"
                >
                  {{ (calendarEvent as any)._raw.title }}
                </p>
              </button>
              <div
                data-testid="top-handle"
                aria-hidden="true"
                class="absolute -top-2 left-1/2 z-10 flex h-5 w-10 -translate-x-1/2 cursor-ns-resize touch-none items-center justify-center"
                @pointerdown.stop="
                  onBlockPointerDown($event, (calendarEvent as any)._raw, 'resizing-top')
                "
              >
                <span
                  class="h-1 w-6 rounded-full border border-black/20 bg-white shadow-md transition-transform group-active:scale-110"
                />
              </div>
              <div
                data-testid="bottom-handle"
                aria-hidden="true"
                class="absolute -bottom-2 left-1/2 z-10 flex h-5 w-10 -translate-x-1/2 cursor-ns-resize touch-none items-center justify-center"
                @pointerdown.stop="
                  onBlockPointerDown($event, (calendarEvent as any)._raw, 'resizing-bottom')
                "
              >
                <span
                  class="h-1 w-6 rounded-full border border-black/20 bg-white shadow-md transition-transform group-active:scale-110"
                />
              </div>
            </div>
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
  background-color: var(--color-calendar-canvas);
  --sx-color-background: var(--color-calendar-canvas);
  --sx-color-outline-variant: #cbd5e1;
  --sx-color-surface: var(--color-calendar-canvas);
}

.sx-nyare-week :deep(.sx__week-grid__hour) {
  border-top: 1px solid #cbd5e1 !important;
}

.sx-nyare-week :deep(.sx__time-grid-day) {
  border-left: 1px solid #cbd5e1 !important;
}

.sx-nyare-week :deep(.sx__week-grid__hour-text) {
  color: var(--color-text-muted);
}

.sx-nyare-week :deep(.sx__time-grid-event) {
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 2px !important;
  box-shadow: none !important;
  overflow: visible !important;
}

/* The element that scrolls: full width without scrollbar track cutting off Saturday */
.sx-nyare-week :deep(.sx__view-container) {
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  overscroll-behavior: contain;
}

/* Spacer inside the scroll flow: lets bottom-edge slots rise above the open drawer. */
.sx-nyare-week :deep(.sx__view-container)::after {
  content: '';
  display: block;
  height: var(--week-preview-clearance, 8px);
}

.sx-nyare-week :deep(.sx__view-container)::-webkit-scrollbar {
  display: none;
}
</style>
