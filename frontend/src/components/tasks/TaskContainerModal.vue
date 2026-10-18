<script setup lang="ts">
// In-page container-transform overlay that hosts TaskDetailPanel. Mirrors
// NoteEditorModal: expand from the tapped rect over 320ms, contract back over
// 240ms, ephemeral history state for device back gestures, reduced motion falls
// back to an opacity crossfade.
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import TaskDetailPanel from './TaskDetailPanel.vue'
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

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    taskId: string | null
    originRect: TapOriginRect | null
  }>(),
  {
    originRect: null,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const phase = ref<AnimationPhase>('idle')
const isTransitioning = ref(false)
const isExpanded = ref(false)
const showContent = ref(false)
const showControls = ref(false)
const cardStyle = ref<Record<string, string>>({})
const reduced = ref(false)
const closeReduced = ref(false)
const sessionKey = ref(0)

// The delete close forces the opacity fade even when reduced motion is off,
// because the origin row is gone and there is nothing to contract into.
const fadeMode = computed(() => reduced.value || closeReduced.value)

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
      window.history.pushState({ nyareTaskModal: true }, '')
      pushedHistory = true
    } catch {
      // Ignore if history API is unavailable in test environment
    }
  }
}

function runExpansion() {
  // A second open request while the container is already open is ignored.
  if (phase.value === 'expanding' || phase.value === 'settled') {
    return
  }

  clearAllTimers()
  reduced.value = isReducedMotion()
  closeReduced.value = false
  phase.value = 'expanding'
  isTransitioning.value = false
  isExpanded.value = false

  cardStyle.value = reduced.value ? calculateTargetStyle() : getOriginStyle(props.originRect)

  pushHistoryState()
  // Move focus into the dialog so Escape reaches its keydown handler.
  void nextTick(() => rootRef.value?.focus({ preventScroll: true }))

  if (reduced.value) {
    // Opacity crossfade only: no spatial transition, no staggered entrance.
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
    // Force browser reflow to commit initial origin geometry before transition starts
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

function requestClose(triggerHistoryBack = true, forceReduced = false) {
  if (phase.value === 'collapsing' || phase.value === 'idle') {
    return
  }

  const useReduced = reduced.value || forceReduced
  closeReduced.value = forceReduced

  clearAllTimers()
  phase.value = 'collapsing'
  isTransitioning.value = !useReduced
  showContent.value = false
  showControls.value = false
  isExpanded.value = false

  if (!useReduced) {
    cardStyle.value = getOriginStyle(props.originRect)
  }

  if (triggerHistoryBack && pushedHistory && typeof window !== 'undefined') {
    pushedHistory = false
    try {
      if (window.history.state?.nyareTaskModal) {
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
      emit('close')
    },
    useReduced ? REDUCED_MOTION_DURATION_MS : COLLAPSE_DURATION_MS,
  )
}

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
      sessionKey.value += 1
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
      closeReduced.value = false
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
})
</script>

<template>
  <div
    v-if="isOpen || phase === 'collapsing'"
    ref="rootRef"
    data-testid="task-modal"
    tabindex="-1"
    class="fixed inset-0 z-50 overflow-hidden outline-none"
    role="dialog"
    aria-modal="true"
    aria-label="Task"
    @keydown.esc="onEscape"
  >
    <!-- Background layer: subtle dark scrim -->
    <div
      data-testid="task-modal-backdrop"
      class="absolute inset-0 bg-black/20 transition-opacity duration-300"
      :class="isExpanded ? 'opacity-100' : 'opacity-0'"
      @click="onEscape"
    />

    <!-- Full-screen expanding container -->
    <div
      ref="containerRef"
      data-testid="task-modal-container"
      class="fixed overflow-hidden bg-[#F5F6EE] will-change-[top,left,width,height,border-radius]"
      :class="
        fadeMode
          ? ['transition-opacity duration-[150ms]', isExpanded ? 'opacity-100' : 'opacity-0']
          : isTransitioning && phase === 'expanding'
            ? 'transition-all duration-[320ms] [transition-timing-function:cubic-bezier(0.05,0.7,0.1,1.0)]'
            : isTransitioning && phase === 'collapsing'
              ? 'transition-all duration-[240ms] [transition-timing-function:cubic-bezier(0.3,0.0,0.8,0.15)]'
              : ''
      "
      :style="cardStyle"
    >
      <TaskDetailPanel
        :key="sessionKey"
        class="h-full"
        :task-id="taskId"
        :show-content="showContent"
        :show-controls="showControls"
        embedded
        @close="requestClose(true)"
        @deleted="requestClose(true, true)"
        @missing="requestClose(true)"
      />
    </div>
  </div>
</template>
