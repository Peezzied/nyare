<script setup lang="ts">
// In-page container-transform overlay that hosts TaskDetailPanel.
// MorphModalShell owns the scrim and card chrome; the shared useContainerMorph
// composable inside it owns the choreography: expand from the tapped rect,
// contract back, ephemeral history state for device back gestures.
import TaskDetailPanel from './TaskDetailPanel.vue'
import MorphModalShell from '@/components/ui/MorphModalShell.vue'
import type { TapOriginRect } from '@/types/notesTransition'
import type { TaskResponse } from '@/types/api'

withDefaults(
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
  (e: 'deleted', task: TaskResponse): void
}>()
</script>

<template>
  <MorphModalShell
    :is-open="isOpen"
    :origin-rect="originRect"
    history-key="nyareTaskModal"
    aria-label="Task"
    data-testid="task-modal"
    backdrop-testid="task-modal-backdrop"
    container-testid="task-modal-container"
    @closed="emit('close')"
  >
    <template #default="{ showContent, showControls, sessionKey, requestClose }">
      <TaskDetailPanel
        :key="sessionKey"
        class="h-full"
        :task-id="taskId"
        :show-content="showContent"
        :show-controls="showControls"
        @close="requestClose(true)"
        @deleted="emit('deleted', $event); requestClose(true, true)"
        @missing="requestClose(true)"
      />
    </template>
  </MorphModalShell>
</template>
