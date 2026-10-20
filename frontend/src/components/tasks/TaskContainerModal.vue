<script setup lang="ts">
// In-page container-transform overlay that hosts TaskDetailPanel. The shared
// useContainerMorph composable owns the choreography: expand from the tapped rect
// over 320ms, contract back over 240ms, ephemeral history state for device back
// gestures, reduced motion falls back to an opacity crossfade.
import TaskDetailPanel from './TaskDetailPanel.vue'
import type { TapOriginRect } from '@/types/notesTransition'
import { useContainerMorph } from '@/composables/useNoteTransition'

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
  historyKey: 'nyareTaskModal',
  onClosed: () => emit('close'),
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
    @keydown.esc="dismiss(true)"
  >
    <!-- Background layer: subtle dark scrim -->
    <div
      data-testid="task-modal-backdrop"
      class="absolute inset-0 bg-black/20 transition-opacity duration-300"
      :class="isExpanded ? 'opacity-100' : 'opacity-0'"
      @click="dismiss(true)"
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
