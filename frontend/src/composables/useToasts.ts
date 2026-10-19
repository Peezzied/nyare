import { ref } from 'vue'
import type { Ref } from 'vue'

/** Visual tone of one toast. */
export type ToastKind = 'info' | 'success' | 'error'

/** One transient message in the toast shelf. */
export interface Toast {
  id: string
  kind: ToastKind
  title: string
  detail?: string
}

// Module-level, so toasts survive navigation between views.
const toasts = ref<Toast[]>([])
const timers = new Map<string, ReturnType<typeof setTimeout>>()

/** State and actions that `useToasts` returns. */
export interface UseToasts {
  /** Live toasts, oldest first. */
  toasts: Ref<Toast[]>
  /** Shows a toast. It dismisses itself after `durationMs`. */
  pushToast: (toast: Omit<Toast, 'id'>, durationMs?: number) => void
  /** Removes a toast now. */
  dismissToast: (id: string) => void
}

/** Shared transient toast list. Components call `pushToast`; `ToastShelf` renders it. */
export function useToasts(): UseToasts {
  function dismissToast(id: string): void {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function pushToast(toast: Omit<Toast, 'id'>, durationMs = 4000): void {
    const id = crypto.randomUUID()
    toasts.value.push({ ...toast, id })
    timers.set(
      id,
      setTimeout(() => dismissToast(id), durationMs),
    )
  }

  return { toasts, pushToast, dismissToast }
}
