import { useTasks } from './useTasks'
import { useToasts } from './useToasts'
import type { TaskResponse } from '@/types/api'

/**
 * Removes the row now and commits the API delete when the undo toast lapses.
 * The toast's Undo action or a failed commit restores the row in place.
 */
export function useUndoableTaskDelete() {
  const { tasks, deleteTask } = useTasks()

  function deleteTaskWithUndo(task: TaskResponse) {
    const index = tasks.value.findIndex((t) => t.id === task.id)
    tasks.value = tasks.value.filter((t) => t.id !== task.id)

    let cancelled = false
    const restore = () => {
      cancelled = true
      const next = [...tasks.value]
      next.splice(Math.min(Math.max(index, 0), next.length), 0, task)
      tasks.value = next
    }
    const commit = () => {
      if (cancelled) {
        return
      }
      deleteTask(task.id).catch((err) => {
        restore()
        useToasts().pushToast({
          kind: 'error',
          title: err instanceof Error ? err.message : 'Could not delete task',
        })
      })
    }
    useToasts().pushToast(
      {
        kind: 'info',
        title: 'Task deleted',
        action: { label: 'Undo', onClick: restore },
        onAutoClose: commit,
        onDismiss: commit,
      },
      5000,
    )
  }

  return { deleteTaskWithUndo }
}
