<script setup lang="ts">
// Notification center for Process runs. Mirrors NoteEditorModal: the panel
// expands from the shelf rect over 320ms, contracts back over 240ms, an
// ephemeral history state covers device back gestures, and reduced motion
// falls back to an opacity crossfade.
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Bell,
  CircleAlert,
  CircleCheck,
  CircleSlash,
  CircleX,
  Inbox,
  LoaderCircle,
  X,
} from '@lucide/vue'
import type { AnimationPhase, TapOriginRect } from '@/types/notesTransition'
import {
  COLLAPSE_DURATION_MS,
  CONTENT_DELAY_MS,
  CONTROLS_DELAY_MS,
  EXPAND_DURATION_MS,
  REDUCED_MOTION_DURATION_MS,
  calculateTargetStyle,
  getOriginStyle,
  isReducedMotion,
} from '@/composables/useNoteTransition'
import { useNotifications } from '@/composables/useNotifications'
import type { ProcessNotification, ProcessNotificationStatus } from '@/composables/useNotifications'
import { formatEntryDate } from '@/utils/noteDate'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    originRect: TapOriginRect | null
  }>(),
  { originRect: null },
)

const emit = defineEmits<{
  (e: 'close'): void
  /** Fires when the user taps a run record. The parent opens it when it is live. */
  (e: 'open-run', record: ProcessNotification): void
}>()

const notifications = useNotifications()

// Clear is two-stage: first click removes read finished records and arms
// the button; a second click within 3s removes running and unread too.
const clearArmed = ref(false)
let clearTimer: ReturnType<typeof setTimeout> | null = null

function onClear(): void {
  if (clearArmed.value) {
    notifications.clearRecords()
    clearArmed.value = false
    if (clearTimer) {
      clearTimeout(clearTimer)
      clearTimer = null
    }
    return
  }
  notifications.clearFinished()
  clearArmed.value = true
  clearTimer = setTimeout(() => {
    clearArmed.value = false
    clearTimer = null
  }, 3000)
}

const rootRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const phase = ref<AnimationPhase>('idle')
const isTransitioning = ref(false)
const isExpanded = ref(false)
const showContent = ref(false)
const showControls = ref(false)
const cardStyle = ref<Record<string, string>>({})
const reduced = ref(false)

let phaseTimer: ReturnType<typeof setTimeout> | null = null
let contentTimer: ReturnType<typeof setTimeout> | null = null
let controlsTimer: ReturnType<typeof setTimeout> | null = null
let pushedHistory = false

function clearAllTimers() {
  if (phaseTimer) clearTimeout(phaseTimer)
  if (contentTimer) clearTimeout(contentTimer)
  if (controlsTimer) clearTimeout(controlsTimer)
  phaseTimer = null
  contentTimer = null
  controlsTimer = null
}

function pushHistoryState() {
  if (!pushedHistory && typeof window !== 'undefined') {
    try {
      window.history.pushState({ nyareNotificationCenter: true }, '')
      pushedHistory = true
    } catch {
      // Ignore if history API is unavailable in test environment
    }
  }
}

function runExpansion() {
  clearAllTimers()
  reduced.value = isReducedMotion()
  phase.value = 'expanding'
  isTransitioning.value = false
  isExpanded.value = false

  cardStyle.value = reduced.value ? calculateTargetStyle() : getOriginStyle(props.originRect)

  pushHistoryState()
  void nextTick(() => rootRef.value?.focus({ preventScroll: true }))

  if (reduced.value) {
    showContent.value = true
    showControls.value = true
    nextTick(() => {
      if (containerRef.value) {
        void containerRef.value.offsetHeight
      }
      requestAnimationFrame(() => {
        isExpanded.value = true
        phaseTimer = setTimeout(() => {
          phase.value = 'settled'
        }, REDUCED_MOTION_DURATION_MS)
      })
    })
    return
  }

  showContent.value = false
  showControls.value = false

  nextTick(() => {
    if (containerRef.value) {
      void containerRef.value.offsetHeight
    }

    requestAnimationFrame(() => {
      isTransitioning.value = true
      isExpanded.value = true
      cardStyle.value = calculateTargetStyle()

      contentTimer = setTimeout(() => {
        showContent.value = true
      }, CONTENT_DELAY_MS)

      controlsTimer = setTimeout(() => {
        showControls.value = true
      }, CONTROLS_DELAY_MS)

      phaseTimer = setTimeout(() => {
        phase.value = 'settled'
      }, EXPAND_DURATION_MS)
    })
  })
}

function requestClose(triggerHistoryBack = true) {
  if (phase.value === 'collapsing' || phase.value === 'idle') {
    return
  }

  clearAllTimers()
  phase.value = 'collapsing'
  isTransitioning.value = !reduced.value
  showContent.value = false
  showControls.value = false
  isExpanded.value = false

  if (!reduced.value) {
    cardStyle.value = getOriginStyle(props.originRect)
  }

  if (triggerHistoryBack && pushedHistory && typeof window !== 'undefined') {
    pushedHistory = false
    try {
      if (window.history.state?.nyareNotificationCenter) {
        window.history.back()
      }
    } catch {
      // Ignore in tests
    }
  }

  phaseTimer = setTimeout(
    () => {
      phase.value = 'idle'
      isTransitioning.value = false
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
      }
      notifications.markAllRead()
      emit('close')
    },
    reduced.value ? REDUCED_MOTION_DURATION_MS : COLLAPSE_DURATION_MS,
  )
}

defineExpose({ requestClose })

function onEscape() {
  if (phase.value === 'expanding' || phase.value === 'settled') {
    requestClose(true)
  }
}

function onPopState() {
  if (phase.value === 'collapsing' || phase.value === 'idle') {
    return
  }
  pushedHistory = false
  requestClose(false)
}

function onViewportResize() {
  if (isExpanded.value && phase.value !== 'collapsing') {
    cardStyle.value = calculateTargetStyle()
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden'
      }
      runExpansion()
    } else {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
      }
      clearAllTimers()
      phase.value = 'idle'
      isTransitioning.value = false
      isExpanded.value = false
      showContent.value = false
      showControls.value = false
      pushedHistory = false
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', onPopState)
    window.addEventListener('resize', onViewportResize)
    window.visualViewport?.addEventListener('resize', onViewportResize)
  }
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('popstate', onPopState)
    window.removeEventListener('resize', onViewportResize)
    window.visualViewport?.removeEventListener('resize', onViewportResize)
  }
  clearAllTimers()
  if (clearTimer) {
    clearTimeout(clearTimer)
    clearTimer = null
  }
})

function statusIcon(status: ProcessNotificationStatus) {
  switch (status) {
    case 'running':
      return LoaderCircle
    case 'done':
      return CircleCheck
    case 'cancelled':
      return CircleSlash
    case 'saved-after-cancel':
      return CircleAlert
    case 'error':
      return CircleX
  }
}

function statusColor(status: ProcessNotificationStatus): string {
  switch (status) {
    case 'running':
      return '#00A4C8'
    case 'done':
      return '#0B8043'
    case 'cancelled':
      return '#7B8B97'
    case 'saved-after-cancel':
      return '#B78103'
    case 'error':
      return '#DC2626'
  }
}

function headline(record: ProcessNotification): string {
  switch (record.status) {
    case 'running':
      return 'Processing notes'
    case 'done':
      return 'Process complete'
    case 'cancelled':
      return 'Process stopped'
    case 'saved-after-cancel':
      return 'Stopped, but changes saved'
    case 'error':
      return 'Process failed'
  }
}

function detail(record: ProcessNotification): string {
  switch (record.status) {
    case 'running':
      return record.progress
        ? `Reading notes for ${formatEntryDate(record.progress.date)} — ${record.progress.index} of ${record.progress.total}`
        : 'Starting…'
    case 'done': {
      const parts = [
        `${record.noteCount} notes`,
        `${record.summary?.tasksCreated ?? 0} tasks`,
        `${record.summary?.eventsCreated ?? 0} events`,
        `${record.summary?.contextsCreated ?? 0} context`,
      ]
      return parts.join(' · ')
    }
    case 'cancelled':
      return 'Pending notes stay unprocessed.'
    case 'saved-after-cancel':
      return 'The run saved its changes before stopping.'
    case 'error':
      return record.error ?? 'Process failed'
  }
}

function stamp(record: ProcessNotification): string {
  const iso = record.finishedAt ?? record.startedAt
  const time = new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${formatEntryDate(iso.slice(0, 10))} · ${time}`
}
</script>

<template>
  <div
    v-if="isOpen || phase === 'collapsing'"
    ref="rootRef"
    data-testid="notification-center"
    tabindex="-1"
    class="fixed inset-0 z-50 overflow-hidden outline-none"
    role="dialog"
    aria-modal="true"
    aria-label="Notifications"
    @keydown.esc="onEscape"
  >
    <!-- Background layer: subtle dark scrim -->
    <div
      class="absolute inset-0 bg-black/20 transition-opacity duration-300"
      :class="isExpanded ? 'opacity-100' : 'opacity-0'"
      @click="onEscape"
    />

    <!-- Full-screen expanding container -->
    <div
      ref="containerRef"
      data-testid="notification-center-container"
      class="fixed overflow-hidden bg-[#F5F6EE] will-change-[top,left,width,height,border-radius]"
      :class="
        reduced
          ? ['transition-opacity duration-[150ms]', isExpanded ? 'opacity-100' : 'opacity-0']
          : isTransitioning && phase === 'expanding'
            ? 'transition-all duration-[320ms] [transition-timing-function:cubic-bezier(0.05,0.7,0.1,1.0)]'
            : isTransitioning && phase === 'collapsing'
              ? 'transition-all duration-[240ms] [transition-timing-function:cubic-bezier(0.3,0.0,0.8,0.15)]'
              : ''
      "
      :style="cardStyle"
    >
      <div class="flex h-full flex-col">
        <header
          class="flex h-14 shrink-0 items-center justify-between border-b-[3px] border-app-border px-3 transition-opacity duration-200"
          :class="showControls ? 'opacity-100' : 'opacity-0'"
        >
          <button
            v-if="notifications.records.value.length > 0"
            type="button"
            data-testid="notification-clear"
            class="flex h-11 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors hover:bg-black/5 active:bg-black/10"
            :class="clearArmed ? 'text-[#DC2626]' : 'text-text-muted'"
            style="font-family: 'Quicksand', sans-serif; font-weight: 600"
            @click="onClear"
          >
            {{ clearArmed ? 'Clear all' : 'Clear' }}
          </button>
          <span v-else class="w-11" aria-hidden="true" />
          <h2
            class="text-xl font-bold text-text-main"
            style="font-family: 'Quicksand', sans-serif; font-weight: 700"
          >
            Notifications
          </h2>
          <button
            type="button"
            aria-label="Close notifications"
            data-testid="notification-center-close"
            class="flex h-11 w-11 items-center justify-center rounded-lg text-text-main transition-colors hover:bg-black/5 active:bg-black/10"
            @click="requestClose(true)"
          >
            <X class="h-6 w-6" />
          </button>
        </header>

        <div
          class="min-h-0 flex-1 overflow-y-auto px-4 py-4 transition-opacity duration-200"
          :class="showContent ? 'opacity-100' : 'opacity-0'"
        >
          <div
            v-if="notifications.records.value.length === 0"
            data-testid="notification-empty"
            class="mt-16 flex flex-col items-center gap-3 text-text-muted"
          >
            <Inbox class="h-10 w-10" aria-hidden="true" />
            <p class="text-sm" style="font-family: 'Inter', sans-serif; font-weight: 400">
              No activity yet.
            </p>
          </div>

          <ul v-else class="space-y-3">
            <li v-for="record in notifications.records.value" :key="record.id">
              <button
                type="button"
                :data-testid="`notification-${record.status}`"
                class="flex w-full items-start gap-3 rounded-2xl border border-app-border bg-card p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                @click="emit('open-run', record)"
              >
                <component
                  :is="statusIcon(record.status)"
                  class="mt-0.5 h-5 w-5 shrink-0"
                  :class="{ 'animate-spin': record.status === 'running' }"
                  :style="{ color: statusColor(record.status) }"
                  aria-hidden="true"
                />
                <span class="min-w-0 flex-1">
                  <span class="flex items-center gap-2">
                    <span
                      class="text-sm font-semibold text-text-main"
                      style="font-family: 'Quicksand', sans-serif; font-weight: 600"
                    >
                      {{ headline(record) }}
                    </span>
                    <span
                      v-if="!record.read"
                      class="h-2 w-2 shrink-0 rounded-full bg-primary"
                      aria-label="Unread"
                    />
                  </span>
                  <span
                    class="mt-0.5 block text-sm text-text-muted"
                    style="font-family: 'Inter', sans-serif; font-weight: 400"
                  >
                    {{ detail(record) }}
                  </span>
                  <span
                    v-if="record.courseNames.length"
                    class="mt-0.5 block text-xs text-text-muted"
                    style="font-family: 'Inter', sans-serif; font-weight: 400"
                  >
                    {{ record.courseNames.join(', ') }}
                  </span>
                  <span
                    class="mt-1 block text-xs text-text-muted"
                    style="font-family: 'Inter', sans-serif; font-weight: 400"
                  >
                    {{ stamp(record) }}
                  </span>
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
