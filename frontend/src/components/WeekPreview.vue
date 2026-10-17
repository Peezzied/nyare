<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { HOUR_HEIGHT } from '@/constants/calendar'
import { WEEKDAYS } from '@/components/TimeBlockCard.vue'
import type { PreviewBlock, PendingSlot } from '@/utils/weekPreview'
import {
  slotFromOffset,
  slotFrom2DDrag,
  moveSlot2D,
  resizeSlotHandle,
  timeToMinutes,
} from '@/utils/weekPreview'
import { formatTime12h } from '@/utils/scheduleExpander'

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

const scrollerRef = ref<HTMLElement | null>(null)
const gridColumnsRef = ref<HTMLElement | null>(null)

type DragMode = 'none' | 'creating' | 'moving' | 'resizing-top' | 'resizing-bottom'
const dragMode = ref<DragMode>('none')
let activePointerId: number | null = null
let startPointerX = 0
let startPointerY = 0
let isDragThresholdMet = false
let initialClickOffsetMinutes = 0

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

function parseTimeToMinutes(timeStr: string): number {
  const [h = 0, m = 0] = timeStr.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime12h(start)} – ${formatTime12h(end)}`
}

function getBlockStyle(block: PreviewBlock) {
  const colIndex = WEEKDAYS.findIndex((w) => w.value === block.day)
  if (colIndex === -1) return {}

  const startMin = parseTimeToMinutes(block.startTime)
  const endMin = parseTimeToMinutes(block.endTime)
  const top = (startMin / 60) * HOUR_HEIGHT
  const height = Math.max(44, ((endMin - startMin) / 60) * HOUR_HEIGHT)

  const leftPercent = (colIndex / 7) * 100
  const widthPercent = 100 / 7

  return {
    top: `${top}px`,
    height: `${height}px`,
    left: `calc(${leftPercent}% + 2px)`,
    width: `calc(${widthPercent}% - 4px)`,
    backgroundColor: block.color,
  }
}

const pendingSlotStyle = computed(() => {
  const slot = props.pendingSlot
  if (!slot) return null
  const colIndex = WEEKDAYS.findIndex((w) => w.value === slot.day)
  if (colIndex === -1) return null

  const startMin = parseTimeToMinutes(slot.startTime)
  const endMin = parseTimeToMinutes(slot.endTime)
  const top = (startMin / 60) * HOUR_HEIGHT
  const height = Math.max(30, ((endMin - startMin) / 60) * HOUR_HEIGHT)

  const leftPercent = (colIndex / 7) * 100
  const widthPercent = 100 / 7

  return {
    top: `${top}px`,
    height: `${height}px`,
    left: `calc(${leftPercent}% + 2px)`,
    width: `calc(${widthPercent}% - 4px)`,
    backgroundColor: props.selectedColor || '#007B99',
  }
})

function onGridPointerDown(e: PointerEvent) {
  if (e.button !== 0 || !gridColumnsRef.value) return
  const rect = gridColumnsRef.value.getBoundingClientRect()
  const offsetX = e.clientX - rect.left
  const offsetY = e.clientY - rect.top

  activePointerId = e.pointerId
  startPointerX = offsetX
  startPointerY = offsetY
  isDragThresholdMet = false
  dragMode.value = 'creating'
  gridColumnsRef.value.setPointerCapture(e.pointerId)
}

function onPendingSlotPointerDown(e: PointerEvent) {
  e.stopPropagation()
  if (e.button !== 0 || !gridColumnsRef.value || !props.pendingSlot) return
  const rect = gridColumnsRef.value.getBoundingClientRect()
  const offsetY = e.clientY - rect.top

  activePointerId = e.pointerId
  dragMode.value = 'moving'
  const clickMinutes = (offsetY / HOUR_HEIGHT) * 60
  const startMinutes = timeToMinutes(props.pendingSlot.startTime)
  initialClickOffsetMinutes = clickMinutes - startMinutes

  gridColumnsRef.value.setPointerCapture(e.pointerId)
}

function onHandlePointerDown(e: PointerEvent, handle: 'top' | 'bottom') {
  e.stopPropagation()
  if (e.button !== 0 || !gridColumnsRef.value || !props.pendingSlot) return
  activePointerId = e.pointerId
  dragMode.value = handle === 'top' ? 'resizing-top' : 'resizing-bottom'
  gridColumnsRef.value.setPointerCapture(e.pointerId)
}

function onGridPointerMove(e: PointerEvent) {
  if (activePointerId !== e.pointerId || !gridColumnsRef.value) return
  const rect = gridColumnsRef.value.getBoundingClientRect()
  const offsetX = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left))
  const offsetY = Math.max(0, Math.min(24 * HOUR_HEIGHT, e.clientY - rect.top))

  if (!isDragThresholdMet) {
    const dx = Math.abs(offsetX - startPointerX)
    const dy = Math.abs(offsetY - startPointerY)
    if (dx > 4 || dy > 4) {
      isDragThresholdMet = true
    }
  }

  if (dragMode.value === 'creating') {
    if (isDragThresholdMet) {
      const slot = slotFrom2DDrag(startPointerY, offsetY, offsetX, rect.width)
      emit('selectSlot', slot)
    }
  } else if (dragMode.value === 'moving' && props.pendingSlot) {
    const slot = moveSlot2D(props.pendingSlot, offsetX, offsetY, initialClickOffsetMinutes, rect.width)
    emit('selectSlot', slot)
  } else if (dragMode.value === 'resizing-top' && props.pendingSlot) {
    const slot = resizeSlotHandle(props.pendingSlot, 'top', offsetY)
    emit('selectSlot', slot)
  } else if (dragMode.value === 'resizing-bottom' && props.pendingSlot) {
    const slot = resizeSlotHandle(props.pendingSlot, 'bottom', offsetY)
    emit('selectSlot', slot)
  }
}

function onGridPointerUp(e: PointerEvent) {
  if (activePointerId !== e.pointerId) return
  if (gridColumnsRef.value?.hasPointerCapture(e.pointerId)) {
    gridColumnsRef.value.releasePointerCapture(e.pointerId)
  }

  const rect = gridColumnsRef.value?.getBoundingClientRect()
  if (rect) {
    const offsetX = Math.max(0, Math.min(rect.width - 1, e.clientX - rect.left))
    const offsetY = Math.max(0, Math.min(24 * HOUR_HEIGHT, e.clientY - rect.top))

    if (dragMode.value === 'creating' && !isDragThresholdMet) {
      // Tap on empty space: snap to clicked 15-minute slot with default 1h duration
      const slot = slotFromOffset(offsetX, offsetY, rect.width, 60)
      if (slot) {
        emit('selectSlot', slot)
      }
    }
  }

  dragMode.value = 'none'
  activePointerId = null
  isDragThresholdMet = false
}

function onBlockClick(blockId: string) {
  emit('selectBlock', blockId)
}

onMounted(() => {
  if (scrollerRef.value) {
    let startMin = 8 * 60
    for (const b of props.blocks) {
      const min = parseTimeToMinutes(b.startTime)
      if (min < startMin) {
        startMin = min
      }
    }
    scrollerRef.value.scrollTop = Math.max(0, (startMin / 60) * HOUR_HEIGHT - 20)
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
    <div class="flex shrink-0 border-b border-[#9ccfe0] bg-[#F5F6EE]">
      <div class="w-11 shrink-0 border-r border-[#9ccfe0]/60" />
      <div class="grid flex-1 grid-cols-7 text-center">
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

    <!-- 24-hour scrollable time grid -->
    <div
      ref="scrollerRef"
      class="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
    >
      <div
        class="relative flex"
        :style="{ height: `${24 * HOUR_HEIGHT}px` }"
      >
        <!-- Time Axis Gutter -->
        <div class="relative w-11 shrink-0 border-r border-[#9ccfe0]/60 bg-[#F5F6EE]">
          <span
            v-for="h in 24"
            :key="h"
            class="absolute left-1 -translate-y-1/2 text-[10px] font-semibold text-[#a8a29e]"
            :style="{ top: `${(h - 1) * HOUR_HEIGHT}px` }"
          >
            {{ formatHourLabel(h - 1) }}
          </span>
        </div>

        <!-- 7-Column Day Space -->
        <div
          ref="gridColumnsRef"
          class="relative flex-1 touch-none cursor-crosshair"
          @pointerdown="onGridPointerDown"
          @pointermove="onGridPointerMove"
          @pointerup="onGridPointerUp"
          @pointercancel="onGridPointerUp"
        >
          <!-- Hour horizontal lines -->
          <div
            v-for="h in 24"
            :key="`line-${h}`"
            class="pointer-events-none absolute left-0 right-0 border-t border-[#9ccfe0]/40"
            :style="{ top: `${(h - 1) * HOUR_HEIGHT}px` }"
          />

          <!-- Sub-hour 30-minute dashed guidelines between row lines -->
          <div
            v-for="h in 24"
            :key="`sub-line-${h}`"
            class="pointer-events-none absolute left-0 right-0 border-t border-dashed border-[#9ccfe0]/25"
            :style="{ top: `${(h - 1) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }"
          />

          <!-- Day vertical column dividers -->
          <div class="pointer-events-none absolute inset-0 grid grid-cols-7">
            <div
              v-for="day in WEEKDAYS"
              :key="`col-${day.value}`"
              :data-day="day.value"
              class="border-r border-[#9ccfe0]/40 last:border-r-0"
            />
          </div>

          <!-- Pending slot pill with handles & time range (Google Calendar style) -->
          <div
            v-if="pendingSlotStyle && props.pendingSlot"
            data-testid="pending-slot-block"
            class="group absolute z-30 flex cursor-move flex-col overflow-visible rounded-xl border border-black/20 p-1 text-white shadow-lg transition-shadow hover:shadow-xl"
            :style="pendingSlotStyle"
            @pointerdown="onPendingSlotPointerDown"
          >
            <!-- Top resize handle -->
            <div
              data-testid="top-handle"
              class="absolute -top-3 left-1/2 flex h-6 w-10 -translate-x-1/2 cursor-ns-resize items-center justify-center touch-none z-40"
              @pointerdown="onHandlePointerDown($event, 'top')"
            >
              <span class="h-1.5 w-6 rounded-full border border-black/20 bg-white shadow-md transition-transform active:scale-125" />
            </div>

            <!-- Time badge -->
            <p class="truncate text-[10px] font-bold leading-3 select-none text-white drop-shadow-xs">
              {{ formatTimeRange(props.pendingSlot.startTime, props.pendingSlot.endTime) }}
            </p>

            <!-- Bottom resize handle -->
            <div
              data-testid="bottom-handle"
              class="absolute -bottom-3 left-1/2 flex h-6 w-10 -translate-x-1/2 cursor-ns-resize items-center justify-center touch-none z-40"
              @pointerdown="onHandlePointerDown($event, 'bottom')"
            >
              <span class="h-1.5 w-6 rounded-full border border-black/20 bg-white shadow-md transition-transform active:scale-125" />
            </div>
          </div>

          <!-- Course block pills -->
          <button
            v-for="block in blocks"
            :key="block.id"
            type="button"
            :aria-label="
              block.title
                ? `${block.title} ${block.startTime} to ${block.endTime}`
                : `${block.startTime} to ${block.endTime}`
            "
            class="absolute z-20 min-h-[44px] overflow-hidden rounded-md border-[1.5px] border-black/20 p-1 text-left text-white shadow-sm transition-transform active:scale-95"
            :style="getBlockStyle(block)"
            @pointerdown.stop
            @click.stop="onBlockClick(block.blockId)"
          >
            <p v-if="block.title" class="truncate text-[10px] font-bold leading-3">
              {{ block.title }}
            </p>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
