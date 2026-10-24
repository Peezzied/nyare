<script setup lang="ts">
import { computed, ref } from 'vue'
import { Calendar, Clock, Sun, Trash2 } from '@lucide/vue'
import { useCatalog } from '@/composables/useCatalog'
import { resolveRowSwipe } from '@/utils/swipeGesture'
import { formatDuration, formatDueLabel, getTaskUrgency, URGENCY_COLORS } from '@/utils/taskUrgency'
import { Checkbox } from '@/components/ui/checkbox'
import type { TaskResponse } from '@/types/api'

const props = withDefaults(
  defineProps<{
    task: TaskResponse
    courseName: string
    dueDate: string | null
    time: string
    /** Hides the status checkbox and disables the swipe actions, for archived lists. */
    readonly?: boolean
  }>(),
  {
    readonly: false,
  },
)

const emit = defineEmits<{ open: []; toggle: []; actions: [] }>()

const catalog = useCatalog()

const done = computed(() => props.task.status === 'COMPLETED')
const iconColor = computed(() => URGENCY_COLORS[getTaskUrgency(props.dueDate)])

const isToday = computed(() => {
  if (!props.dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(props.dueDate + 'T00:00:00')
  return Math.round((due.getTime() - today.getTime()) / 86_400_000) === 0
})

const dueIcon = computed(() => (isToday.value ? Sun : Calendar))
const dueLabel = computed(() => formatDueLabel(props.dueDate))

const REVEAL_WIDTH_PX = 96
const DRAG_START_PX = 6

const swipeX = ref(0)
const dragging = ref(false)
let startX = 0
let startY = 0
let activePointer = -1
let horizontal = false
let suppressClick = false

function onPointerDown(event: PointerEvent) {
  if (props.readonly) return
  if (event.button !== 0) return
  if ((event.target as HTMLElement).closest('[data-swipe-exclude]')) return
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
    if (Math.abs(dy) > Math.abs(dx) || dx > 0) {
      activePointer = -1
      return
    }
    horizontal = true
    dragging.value = true
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }
  swipeX.value = Math.max(-REVEAL_WIDTH_PX, Math.min(0, dx))
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
  swipeX.value = 0
  if (resolveRowSwipe(dx, dy)) emit('actions')
}

function onPointerCancel(event: PointerEvent) {
  if (event.pointerId !== activePointer) return
  activePointer = -1
  horizontal = false
  dragging.value = false
  swipeX.value = 0
}

function onRowClick() {
  if (suppressClick) {
    suppressClick = false
    return
  }
  emit('open')
}
</script>

<template>
  <li
    class="relative mx-4 border-b border-app-border transition-opacity last:border-b-0"
    :class="{ 'opacity-50': done }"
  >
    <div
      v-if="!readonly"
      aria-hidden="true"
      class="absolute inset-y-0 right-0 flex w-24 items-center justify-end gap-3 bg-warn-bg px-3"
      :style="{ opacity: Math.min(1, -swipeX / 24) }"
    >
      <Calendar class="size-5 text-warn" />
      <Clock class="size-5 text-warn" />
      <Trash2 class="size-5 text-warn" />
    </div>

    <div
      class="relative flex cursor-pointer items-center gap-3 bg-app-bg py-4"
      :class="dragging ? '' : 'transition-transform duration-200 ease-out'"
      :style="{ transform: `translateX(${swipeX}px)`, touchAction: 'pan-y' }"
      role="button"
      tabindex="0"
      @click="onRowClick"
      @keydown.enter="emit('open')"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerEnd"
      @pointercancel="onPointerCancel"
    >
      <div
        v-if="!readonly"
        class="flex h-11 w-11 shrink-0 items-center justify-center"
        data-swipe-exclude
        @click.stop
      >
        <Checkbox
          :model-value="done"
          :aria-label="`Mark ${task.title} as completed`"
          @update:model-value="emit('toggle')"
        />
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-1 mr-2">
        <span
          class="text-base leading-snug font-semibold text-text-main"
          :class="{ 'line-through': done }"
        >
          {{ task.title }}
        </span>
        <span
          class="flex min-w-0 items-center gap-1.5 text-[10px] tracking-wider uppercase"
          :style="{ color: catalog.courseColor(task.courseId).text }"
        >
          <span
            class="font-semibold size-1.5 shrink-0 rounded-full"
            aria-hidden="true"
            :style="{ backgroundColor: catalog.courseColor(task.courseId).solid }"
          />
          <span class="font-medium truncate font-secondary">{{ courseName }}</span>
        </span>
        <span v-if="time" class="text-xs text-text-muted">{{ time }}</span>
      </div>

      <div class="flex shrink-0 items-center gap-2.5">
        <span
          v-if="formatDuration(task.duration)"
          class="flex h-8 items-center text-sm font-secondary text-primary"
        >
          {{ formatDuration(task.duration) }}
        </span>
        <div v-if="dueDate" class="relative flex size-8 shrink-0 items-center justify-center">
          <component
            :is="dueIcon"
            class="size-6 transition-colors"
            :style="{ color: iconColor }"
            aria-hidden="true"
          />
          <span
            v-if="dueLabel"
            class="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/45 px-1.5 py-[1px] text-[9.5px] leading-tight font-bold tracking-tight whitespace-nowrap text-white shadow-xs backdrop-blur-xs"
          >
            {{ dueLabel }}
          </span>
        </div>
      </div>
    </div>
  </li>
</template>
