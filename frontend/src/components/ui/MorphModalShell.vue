<script setup lang="ts">
// Shared chrome of the container-morph overlays (note editor, task detail): a
// scrim plus the card that expands from the tapped rect. useContainerMorph
// owns the choreography; transition durations below derive from its constants
// so the card animation never drifts from the timers.
import { computed } from 'vue'
import type { TapOriginRect } from '@/types/notesTransition'
import {
  COLLAPSE_DURATION_MS,
  EXPAND_DURATION_MS,
  REDUCED_MOTION_DURATION_MS,
  useContainerMorph,
} from '@/composables/useNoteTransition'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    originRect: TapOriginRect | null
    /** Marker stored in the ephemeral history entry, e.g. 'nyareNoteModal'. */
    historyKey: string
    backdropTestid?: string
    containerTestid?: string
    /** Intercepts Escape, backdrop, and device back; return true to keep the overlay open. */
    onDismiss?: () => boolean
  }>(),
  {
    originRect: null,
    backdropTestid: undefined,
    containerTestid: undefined,
    onDismiss: undefined,
  },
)

const emit = defineEmits<{
  /** Fires when the collapse finishes; the host re-emits its close event. */
  (e: 'closed'): void
}>()

const {
  rootRef,
  containerRef,
  phase,
  isTransitioning,
  isExpanded,
  showContent,
  showControls,
  cardStyle,
  fadeMode,
  sessionKey,
  dismiss,
  requestClose,
} = useContainerMorph({
  isOpen: () => props.isOpen,
  originRect: () => props.originRect,
  historyKey: props.historyKey,
  onDismiss: () => props.onDismiss?.() ?? false,
  onClosed: () => emit('closed'),
})

const containerMotion = computed(() => {
  if (fadeMode.value) {
    return {
      class: ['transition-opacity', isExpanded.value ? 'opacity-100' : 'opacity-0'],
      style: { transitionDuration: `${REDUCED_MOTION_DURATION_MS}ms` },
    }
  }
  if (isTransitioning.value && phase.value === 'expanding') {
    return {
      class: 'transition-all',
      style: {
        transitionDuration: `${EXPAND_DURATION_MS}ms`,
        transitionTimingFunction: 'cubic-bezier(0.05,0.7,0.1,1.0)',
      },
    }
  }
  if (isTransitioning.value && phase.value === 'collapsing') {
    return {
      class: 'transition-all',
      style: {
        transitionDuration: `${COLLAPSE_DURATION_MS}ms`,
        transitionTimingFunction: 'cubic-bezier(0.3,0.0,0.8,0.15)',
      },
    }
  }
  return { class: '', style: undefined }
})
</script>

<template>
  <div
    v-if="isOpen || phase === 'collapsing'"
    ref="rootRef"
    tabindex="-1"
    class="fixed inset-0 z-50 overflow-hidden outline-none"
    role="dialog"
    aria-modal="true"
    @keydown.esc="dismiss(true)"
  >
    <!-- Background layer: subtle dark scrim -->
    <div
      :data-testid="backdropTestid"
      class="absolute inset-0 bg-scrim transition-opacity duration-300"
      :class="isExpanded ? 'opacity-100' : 'opacity-0'"
      @click="dismiss(true)"
    />

    <!-- Full-screen expanding container -->
    <div
      ref="containerRef"
      :data-testid="containerTestid"
      class="fixed overflow-hidden bg-app-bg will-change-[top,left,width,height,border-radius]"
      :class="containerMotion.class"
      :style="[cardStyle, containerMotion.style]"
    >
      <slot
        :show-content="showContent"
        :show-controls="showControls"
        :session-key="sessionKey"
        :request-close="requestClose"
      />
    </div>
  </div>
</template>
