<script setup lang="ts">
// In-page container-transform overlay that hosts NoteEditor. The shared
// useContainerMorph composable owns the choreography: expand from the tapped rect
// over 320ms, contract back over 240ms, ephemeral history state for device back
// gestures, reduced motion falls back to an opacity crossfade.
import { ref } from 'vue'
import NoteEditor from '@/views/NoteEditor.vue'
import type { TapOriginRect } from '@/types/notesTransition'
import { useContainerMorph } from '@/composables/useNoteTransition'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    noteId: string | null
    originRect: TapOriginRect | null
  }>(),
  {
    originRect: null,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', noteId: string): void
}>()

const editorRef = ref<{ requestBack?: () => void } | null>(null)

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
  historyKey: 'nyareNoteModal',
  onDismiss: () => {
    if (!editorRef.value?.requestBack) {
      return false
    }
    editorRef.value.requestBack()
    return true
  },
  onClosed: () => emit('close'),
})
</script>

<template>
  <div
    v-if="isOpen || phase === 'collapsing'"
    ref="rootRef"
    data-testid="note-editor-modal"
    tabindex="-1"
    class="fixed inset-0 z-50 overflow-hidden outline-none"
    role="dialog"
    aria-modal="true"
    aria-label="Note editor"
    @keydown.esc="dismiss(true)"
  >
    <!-- Background layer: subtle dark scrim -->
    <div
      data-testid="note-modal-backdrop"
      class="absolute inset-0 bg-black/20 transition-opacity duration-300"
      :class="isExpanded ? 'opacity-100' : 'opacity-0'"
      @click="dismiss(true)"
    />

    <!-- Full-screen expanding container -->
    <div
      ref="containerRef"
      data-testid="note-modal-container"
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
      <NoteEditor
        ref="editorRef"
        :key="sessionKey"
        embedded
        class="h-full"
        :note-id="noteId"
        :show-content="showContent"
        :show-controls="showControls"
        @close="requestClose(true)"
        @saved="emit('saved', $event)"
      />
    </div>
  </div>
</template>
