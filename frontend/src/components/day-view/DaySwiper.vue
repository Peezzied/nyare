<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { HOUR_HEIGHT } from '../../constants/calendar'
import { addDays } from '../../utils/dayKey'
import { formatTime12h } from '../../utils/scheduleExpander'
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
const COVER_TIMEOUT_MS = 500 // safety net if the calendar never reports "ready"

const viewportRef = ref<HTMLElement | null>(null)
const dragX = ref(0)
// covering = the swipe landed; the preview stays up until the real calendar is ready
const phase = ref<'idle' | 'dragging' | 'settling' | 'covering'>('idle')
const peekSide = ref<-1 | 0 | 1>(0) // +1 = next on the right, -1 = previous on the left
const dragBase = ref<Date>(props.selectedDate) // the date the drag started from
const slideDistance = ref(0) // viewport width minus the fixed time axis
const peekScrollTop = ref(0)
const peekGutter = ref(0) // width of the fixed time axis
const axisTop = ref(0) // height of everything above the scrolling grid

const hourLabels = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  label: formatTime12h(`${String(hour).padStart(2, '0')}:00`),
}))

const peekDate = computed(() =>
  phase.value === 'idle' || peekSide.value === 0
    ? null
    : addDays(dragBase.value, peekSide.value * props.stepDays),
)

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const sliding = computed(() => phase.value !== 'idle')

// Everything left of the time axis is hidden while sliding; the fixed axis covers it
const clipStyle = computed(() =>
  sliding.value ? { clipPath: `inset(0 0 0 ${peekGutter.value}px)` } : {},
)

const trackStyle = computed(() => {
  if (phase.value !== 'dragging' && phase.value !== 'settling') return {}
  return {
    transform: `translate3d(${dragX.value}px, 0, 0)`,
    transition:
      phase.value === 'settling'
        ? `transform ${prefersReducedMotion() ? 0 : SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
        : 'none',
    willChange: 'transform',
  }
})

// The preview sits one slide-distance to the side; once landed it sits in place
const peekLeft = computed(() =>
  phase.value === 'covering' ? '0px' : `${peekSide.value * slideDistance.value}px`,
)

// ---- Gesture tracking (plain variables: no re-render needed) ----
let pointerId: number | null = null
let startX = 0
let startY = 0
let startTime = 0
let locked: 'none' | 'horizontal' | 'vertical' = 'none'
let suppressClick = false
let settleTimer = 0
let coverTimer = 0

function clamp(value: number, limit: number) {
  return Math.max(-limit, Math.min(limit, value))
}

function onPointerDown(e: PointerEvent) {
  if (phase.value === 'settling' || phase.value === 'covering' || !e.isPrimary) return
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
  if (!viewport) return
  const vp = viewport.getBoundingClientRect()
  const scroller = viewport.querySelector<HTMLElement>('.sx__view-container')
  const column = viewport.querySelector<HTMLElement>('.sx__time-grid-day')

  peekScrollTop.value = scroller?.scrollTop ?? 0
  peekGutter.value = column ? Math.max(Math.round(column.getBoundingClientRect().left - vp.left), 0) : 0
  axisTop.value = scroller ? Math.max(Math.round(scroller.getBoundingClientRect().top - vp.top), 0) : 0
  slideDistance.value = Math.max(vp.width - peekGutter.value, 1)
  dragBase.value = props.selectedDate
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
  if (dragX.value !== 0) peekSide.value = dragX.value < 0 ? 1 : -1
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
  if (offset !== 0) peekSide.value = offset
  dragX.value = offset === 0 ? 0 : offset > 0 ? -slideDistance.value : slideDistance.value
  window.clearTimeout(settleTimer)
  settleTimer = window.setTimeout(
    () => finish(offset),
    (prefersReducedMotion() ? 0 : SETTLE_MS) + 20,
  )
}

function finish(offset: -1 | 0 | 1) {
  if (offset === 0) {
    endCover()
    return
  }
  // Change the date and keep the preview covering the spot until the
  // real calendar says it is drawn and scrolled (see onDayReady)
  phase.value = 'covering'
  dragX.value = 0
  emit('changeDate', addDays(dragBase.value, offset * props.stepDays))
  window.clearTimeout(coverTimer)
  coverTimer = window.setTimeout(endCover, COVER_TIMEOUT_MS)
}

function endCover() {
  window.clearTimeout(coverTimer)
  phase.value = 'idle'
  dragX.value = 0
  peekSide.value = 0
}

// The calendar dispatches "day-ready" once the new range is rendered and scrolled
function onDayReady() {
  if (phase.value !== 'covering') return
  // wait two frames so the new calendar has actually painted
  requestAnimationFrame(() => requestAnimationFrame(endCover))
}

// A drag must not count as a tap on whatever was under the finger
function onClickCapture(e: MouseEvent) {
  if (suppressClick) {
    e.stopPropagation()
    e.preventDefault()
    suppressClick = false
  }
}

onMounted(() => viewportRef.value?.addEventListener('day-ready', onDayReady))

onUnmounted(() => {
  viewportRef.value?.removeEventListener('day-ready', onDayReady)
  window.clearTimeout(settleTimer)
  window.clearTimeout(coverTimer)
})
</script>

<template>
  <div
    ref="viewportRef"
    class="day-swiper relative min-h-0 flex-1 select-none overflow-hidden"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @click.capture="onClickCapture"
  >
    <!-- Columns: clipped so nothing shows over the fixed time axis while sliding -->
    <div class="absolute inset-0" :style="clipStyle">
      <div class="absolute inset-0 flex flex-col" :style="trackStyle">
        <slot />

        <div
          v-if="peekDate"
          class="pointer-events-none absolute top-0 z-30 h-full w-full"
          :style="{ left: peekLeft }"
        >
          <slot
            name="peek"
            :date="peekDate"
            :scrollTop="peekScrollTop"
            :gutterLeft="peekGutter"
          />
        </div>
      </div>
    </div>

    <!-- Fixed time axis, shown only while sliding -->
    <div
      v-if="sliding"
      class="pointer-events-none absolute left-0 top-0 z-40 h-full bg-[#F5F6EE]"
      :style="{ width: `${peekGutter}px` }"
    >
      <div
        v-if="axisTop > 0"
        class="border-b border-[#9ccfe0]"
        :style="{ height: `${axisTop}px` }"
      />
      <div class="relative overflow-hidden" :style="{ height: `calc(100% - ${axisTop}px)` }">
        <div
          class="absolute left-0 right-0 top-0"
          :style="{ transform: `translateY(${-peekScrollTop}px)` }"
        >
          <span
            v-for="item in hourLabels"
            :key="item.hour"
            class="absolute left-2 text-xs font-semibold leading-4 text-[#a8a29e]"
            :style="{ top: `${item.hour * HOUR_HEIGHT - 10}px` }"
          >
            {{ item.label }}
          </span>
        </div>
      </div>
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
