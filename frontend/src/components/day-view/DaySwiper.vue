<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { addDays, toDateKey } from '../../utils/dayKey'
import { resolveSwipe } from '../../utils/swipeGesture'

const props = withDefaults(
  defineProps<{
    selectedDate: Date
    stepDays?: number // 1 = day view, 7 = week view
  }>(),
  { stepDays: 1 },
)

const emit = defineEmits<{
  (e: 'changeDate', date: Date): void
}>()

const SETTLE_MS = 220
const COMMIT_FRACTION = 0.25 // a slow drag commits after a quarter of the slide distance

const viewportRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)
const dragX = ref(0)
const phase = ref<'idle' | 'dragging' | 'settling'>('idle')
const slideDistance = ref(0) // viewport width
const gutterLeft = ref(0) // width of the time axis, for the pinned chrome slot

// The previous, current and next calendars are all mounted; a committed swipe
// just shifts which one sits in the middle. Keyed by date, so Vue moves the
// already-rendered nodes instead of remounting them.
const panelDates = computed(() => [
  addDays(props.selectedDate, -props.stepDays),
  props.selectedDate,
  addDays(props.selectedDate, props.stepDays),
])

function prefersReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

const trackStyle = computed(() => ({
  transform: `translate3d(calc(-100% + ${dragX.value}px), 0, 0)`,
  transition:
    phase.value === 'settling' && !prefersReducedMotion()
      ? `transform ${SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
      : 'none',
  willChange: phase.value === 'idle' ? undefined : 'transform',
}))

// ---- Gesture tracking (plain variables: no re-render needed) ----
let pointerId: number | null = null
let startX = 0
let startY = 0
let startTime = 0
let locked: 'none' | 'horizontal' | 'vertical' = 'none'
let suppressClick = false
let settleTimer = 0

function clamp(value: number, limit: number) {
  return Math.max(-limit, Math.min(limit, value))
}

function onPointerDown(e: PointerEvent) {
  if (phase.value === 'settling' || !e.isPrimary) return
  if (e.pointerType === 'mouse' && e.button !== 0) return
  pointerId = e.pointerId
  startX = e.clientX
  startY = e.clientY
  startTime = performance.now()
  locked = 'none'
  suppressClick = false
}

function beginDrag(e: PointerEvent) {
  const viewport = viewportRef.value
  const currentPanel = trackRef.value?.children[1] as HTMLElement | undefined
  if (!viewport || !currentPanel) return
  const vp = viewport.getBoundingClientRect()
  const firstCol = currentPanel.querySelector<HTMLElement>('.sx__time-grid-day')
  const currentScroller =
    currentPanel.querySelector<HTMLElement>('[data-cal-scroll]') ??
    currentPanel.querySelector<HTMLElement>('.sx__view-container')

  gutterLeft.value = firstCol
    ? Math.max(Math.round(firstCol.getBoundingClientRect().left - vp.left), 0)
    : 0
  slideDistance.value = Math.max(vp.width, 1)

  // The middle panel is the visible scroller; match the neighbours to it so
  // the incoming day is at the same scroll depth when it slides in.
  const scrollTop = currentScroller?.scrollTop ?? 0
  for (const panel of Array.from(trackRef.value?.children ?? [])) {
    const scroller =
      panel.querySelector<HTMLElement>('[data-cal-scroll]') ??
      panel.querySelector<HTMLElement>('.sx__view-container')
    if (scroller && scroller !== currentScroller) {
      scroller.scrollTo({ top: scrollTop, behavior: 'instant' })
    }
  }

  phase.value = 'dragging'
  suppressClick = true
  try {
    viewport.setPointerCapture(e.pointerId)
  } catch {
    // capture is optional
  }
}

function onPointerMove(e: PointerEvent) {
  if (pointerId !== e.pointerId || locked === 'vertical') return
  const dx = e.clientX - startX
  const dy = e.clientY - startY

  if (locked === 'none') {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
    if (Math.abs(dx) > Math.abs(dy) * 1.2) {
      locked = 'horizontal'
      beginDrag(e)
    } else {
      locked = 'vertical' // the browser scrolls the grid
      return
    }
  }

  dragX.value = clamp(dx, slideDistance.value)
}

function onPointerUp(e: PointerEvent) {
  if (pointerId !== e.pointerId) return
  pointerId = null
  if (locked !== 'horizontal') return
  locked = 'none'

  const dx = e.clientX - startX
  const dy = e.clientY - startY
  const quick = resolveSwipe(dx, dy, performance.now() - startTime) // fast flick
  const far = Math.abs(dx) > slideDistance.value * COMMIT_FRACTION ? (dx < 0 ? 1 : -1) : 0 // slow drag
  settle((quick || far) as -1 | 0 | 1)
}

function onPointerCancel(e: PointerEvent) {
  if (pointerId !== e.pointerId) return
  pointerId = null
  if (locked === 'horizontal') settle(0)
  locked = 'none'
}

function settle(offset: -1 | 0 | 1) {
  phase.value = 'settling'
  dragX.value = offset === 0 ? 0 : offset > 0 ? -slideDistance.value : slideDistance.value
  window.clearTimeout(settleTimer)
  settleTimer = window.setTimeout(
    () => finish(offset),
    (prefersReducedMotion() ? 0 : SETTLE_MS) + 20,
  )
}

function finish(offset: -1 | 0 | 1) {
  phase.value = 'idle'
  dragX.value = 0
  if (offset !== 0) {
    // Panels reorder by key in the same patch as the transform reset, so the
    // incoming calendar stays on screen without a flash.
    emit('changeDate', addDays(props.selectedDate, offset * props.stepDays))
  }
}

onUnmounted(() => window.clearTimeout(settleTimer))

// A drag must not count as a tap on whatever was under the finger
function onClickCapture(e: MouseEvent) {
  if (suppressClick) {
    e.stopPropagation()
    e.preventDefault()
    suppressClick = false
  }
}
</script>

<template>
  <div
    ref="viewportRef"
    class="day-swiper relative min-h-0 flex-1 select-none overflow-hidden bg-app-bg"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @click.capture="onClickCapture"
  >
    <!-- Three mounted calendars: previous, current, next -->
    <div ref="trackRef" class="absolute inset-0 flex flex-col" :style="trackStyle">
      <div
        v-for="(date, index) in panelDates"
        :key="toDateKey(date)"
        class="absolute top-0 flex h-full w-full flex-col"
        :style="{ left: `${index * 100}%` }"
      >
        <slot :date="date" :is-current="index === 1" />
      </div>
    </div>

    <!-- Pinned chrome: the header row stays put while only the deck slides. -->
    <div v-if="phase !== 'idle'" class="pointer-events-none absolute inset-0 z-40">
      <slot name="chrome" :date="selectedDate" :gutterLeft="gutterLeft" />
    </div>
  </div>
</template>

<style scoped>
/* Everything inside allows vertical scrolling only, so horizontal drags
   reach our handler instead of being claimed by the browser. */
.day-swiper :deep(*) {
  touch-action: pan-y;
}
</style>
