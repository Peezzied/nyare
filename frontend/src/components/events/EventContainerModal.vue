<script setup lang="ts">
// In-page container-transform overlay that hosts EventDetailPanel.
// MorphModalShell owns the scrim and card chrome; the shared useContainerMorph
// composable inside it owns the choreography: expand from the tapped rect,
// contract back, ephemeral history state for device back gestures.
import EventDetailPanel from './EventDetailPanel.vue'
import MorphModalShell from '@/components/ui/MorphModalShell.vue'
import type { TapOriginRect } from '@/types/notesTransition'
import type { AcademicEventResponse } from '@/types/api'

withDefaults(
  defineProps<{
    isOpen: boolean
    eventId: string | null
    originRect: TapOriginRect | null
  }>(),
  {
    originRect: null,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'deleted', event: AcademicEventResponse): void
}>()
</script>

<template>
  <MorphModalShell
    :is-open="isOpen"
    :origin-rect="originRect"
    history-key="nyareEventModal"
    aria-label="Event"
    data-testid="event-modal"
    backdrop-testid="event-modal-backdrop"
    container-testid="event-modal-container"
    @closed="emit('close')"
  >
    <template #default="{ showContent, showControls, sessionKey, requestClose }">
      <EventDetailPanel
        :key="sessionKey"
        class="h-full"
        :event-id="eventId"
        :show-content="showContent"
        :show-controls="showControls"
        @close="requestClose(true)"
        @deleted="emit('deleted', $event); requestClose(true, true)"
        @missing="requestClose(true)"
      />
    </template>
  </MorphModalShell>
</template>
