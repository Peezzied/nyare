import { useAcademicEvents } from './useAcademicEvents'
import { useToasts } from './useToasts'
import type { AcademicEventResponse } from '@/types/api'

/**
 * Removes the event now and commits the API delete when the undo toast lapses.
 * The toast's Undo action or a failed commit restores the event in place.
 */
export function useUndoableEventDelete() {
  const { events, deleteEvent } = useAcademicEvents()

  function deleteEventWithUndo(event: AcademicEventResponse) {
    const index = events.value.findIndex((e) => e.id === event.id)
    events.value = events.value.filter((e) => e.id !== event.id)

    let cancelled = false
    const restore = () => {
      cancelled = true
      const next = [...events.value]
      next.splice(Math.min(Math.max(index, 0), next.length), 0, event)
      events.value = next
    }
    const commit = () => {
      if (cancelled) {
        return
      }
      deleteEvent(event.id).catch((err) => {
        restore()
        useToasts().pushToast({
          kind: 'error',
          title: err instanceof Error ? err.message : 'Could not delete event',
        })
      })
    }
    useToasts().pushToast(
      {
        kind: 'info',
        title: 'Event deleted',
        action: { label: 'Undo', onClick: restore },
        onAutoClose: commit,
        onDismiss: commit,
      },
      5000,
    )
  }

  return { deleteEventWithUndo }
}
