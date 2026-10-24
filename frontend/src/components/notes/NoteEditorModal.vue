<script setup lang="ts">
// In-page container-transform overlay that hosts NoteEditor. MorphModalShell
// owns the scrim and card chrome; the shared useContainerMorph composable
// inside it owns the choreography: expand from the tapped rect, contract back,
// ephemeral history state for device back gestures.
import { ref } from 'vue'
import NoteEditor from '@/views/NoteEditor.vue'
import MorphModalShell from '@/components/ui/MorphModalShell.vue'
import type { TapOriginRect } from '@/types/notesTransition'

withDefaults(
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

/** Keeps the overlay open when the editor wants to intercept back (unsaved changes). */
function onDismiss(): boolean {
  if (!editorRef.value?.requestBack) {
    return false
  }
  editorRef.value.requestBack()
  return true
}
</script>

<template>
  <MorphModalShell
    :is-open="isOpen"
    :origin-rect="originRect"
    history-key="nyareNoteModal"
    aria-label="Note editor"
    data-testid="note-editor-modal"
    backdrop-testid="note-modal-backdrop"
    container-testid="note-modal-container"
    :on-dismiss="onDismiss"
    @closed="emit('close')"
  >
    <template #default="{ showContent, showControls, sessionKey, requestClose }">
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
    </template>
  </MorphModalShell>
</template>
