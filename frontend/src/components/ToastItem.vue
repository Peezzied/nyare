<script setup lang="ts">
// One toast card. Tap or a horizontal swipe past the threshold dismisses it.
// The card tracks the finger, fades as it travels, then flies out in the
// swipe direction; sub-threshold drags spring back to center.
import { computed, ref } from 'vue'
import { CircleCheck, CircleX, LoaderCircle } from '@lucide/vue'
import { resolveDismissSwipe } from '@/utils/swipeGesture'
import type { Toast, ToastKind } from '@/composables/useToasts'

defineProps<{ toast: Toast }>()

const emit = defineEmits<{ dismiss: [] }>()

function icon(kind: ToastKind) {
  switch (kind) {
    case 'success':
      return CircleCheck
    case 'error':
      return CircleX
    default:
      return LoaderCircle
  }
}

function iconColor(kind: ToastKind): string {
  switch (kind) {
    case 'success':
      return '#0B8043'
    case 'error':
      return '#DC2626'
    default:
      return '#00A4C8'
  }
}

const DRAG_START_PX = 6
const EXIT_X_PX = 480

const swipeX = ref(0)
const dragging = ref(false)
let startX = 0
let startY = 0
let activePointer = -1
let horizontal = false
let suppressClick = false

// Inline transform only while offset, so Vue's enter/leave class animations
// still own the toast when it sits at rest.
const cardStyle = computed(() => {
  const style: Record<string, string | number> = { touchAction: 'pan-y' }
  if (swipeX.value !== 0) {
    style.transform = `translateX(${swipeX.value}px)`
    style.opacity = 1 - Math.min(1, Math.abs(swipeX.value) / 300)
  }
  return style
})

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  activePointer = event.pointerId
  startX = event.clientX
  startY = event.clientY
  horizontal = false
  suppressClick = false
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerId !== activePointer) return
  const dx = event.clientX - startX
  const dy = event.clientY - startY
  if (!horizontal) {
    if (Math.abs(dx) < DRAG_START_PX && Math.abs(dy) < DRAG_START_PX) return
    if (Math.abs(dy) > Math.abs(dx)) {
      activePointer = -1
      return
    }
    horizontal = true
    dragging.value = true
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }
  swipeX.value = dx
}

function onPointerEnd(event: PointerEvent) {
  if (event.pointerId !== activePointer) return
  activePointer = -1
  if (!horizontal) return
  const dx = event.clientX - startX
  const dy = event.clientY - startY
  horizontal = false
  dragging.value = false
  if (Math.abs(dx) > DRAG_START_PX) suppressClick = true
  const direction = resolveDismissSwipe(dx, dy)
  swipeX.value = direction === 0 ? 0 : direction * EXIT_X_PX
  if (direction !== 0) emit('dismiss')
}

function onPointerCancel(event: PointerEvent) {
  if (event.pointerId !== activePointer) return
  activePointer = -1
  horizontal = false
  dragging.value = false
  swipeX.value = 0
}

function onClick() {
  if (suppressClick) {
    suppressClick = false
    return
  }
  emit('dismiss')
}
</script>

<template>
  <button
    type="button"
    data-testid="toast"
    class="pointer-events-auto flex w-full max-w-[340px] items-start gap-3 rounded-2xl border border-[#CBD5E1] bg-white p-3.5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.12)] select-none"
    :class="dragging ? '' : 'transition-[transform,opacity] duration-200 ease-out'"
    :style="cardStyle"
    @click="onClick"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerEnd"
    @pointercancel="onPointerCancel"
  >
    <component
      :is="icon(toast.kind)"
      class="mt-0.5 h-5 w-5 shrink-0"
      :class="{ 'animate-spin': toast.kind === 'info' }"
      :style="{ color: iconColor(toast.kind) }"
      aria-hidden="true"
    />
    <span class="min-w-0 flex-1">
      <span
        class="block text-sm font-semibold text-[#334155]"
        style="font-family: 'Quicksand', sans-serif; font-weight: 600"
      >
        {{ toast.title }}
      </span>
      <span
        v-if="toast.detail"
        class="mt-0.5 block text-xs text-[#7B8B97]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        {{ toast.detail }}
      </span>
    </span>
  </button>
</template>
