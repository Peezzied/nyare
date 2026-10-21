import { ref } from 'vue'
import type { Ref } from 'vue'

/** Visual tone of one toast. */
export type ToastKind = 'info' | 'success' | 'error' | 'loading'

/** One trailing action a toast offers, e.g. Undo. */
export interface ToastAction {
  label: string
  onClick: () => void
}

/** One transient message in the toast shelf. */
export interface Toast {
  id: string
  kind: ToastKind
  title: string
  detail?: string
  /** Trailing button. Selecting it dismisses the toast too. */
  action?: ToastAction
  /** Runs on tap, swipe, close, or programmatic dismiss — never on timeout. */
  onDismiss?: () => void
  /** Runs only when the toast expires on its own. */
  onAutoClose?: () => void
}

interface ToastTimer {
  timeout: ReturnType<typeof setTimeout> | null
  remaining: number
  startedAt: number
}

// Module-level, so toasts survive navigation between views.
const toasts = ref<Toast[]>([])
const timers = new Map<string, ToastTimer>()

function removeToast(id: string): Toast | undefined {
  const index = toasts.value.findIndex((t) => t.id === id)
  return index === -1 ? undefined : toasts.value.splice(index, 1)[0]
}

/** State and actions that `useToasts` returns. */
export interface UseToasts {
  /** Live toasts, oldest first. */
  toasts: Ref<Toast[]>
  /** Shows a toast. It dismisses itself after `durationMs`. Returns its id. */
  pushToast: (toast: Omit<Toast, 'id'>, durationMs?: number) => string
  /** Removes a toast now and runs its `onDismiss`. */
  dismissToast: (id: string) => void
  /** Holds the expiry timer while the pointer or focus is on the toast. */
  pauseToast: (id: string) => void
  /** Restarts the expiry timer with the time that remained at pause. */
  resumeToast: (id: string) => void
}

/** Shared transient toast list. Components call `pushToast`; `ToastShelf` renders it. */
export function useToasts(): UseToasts {
  function clearTimer(id: string): void {
    const entry = timers.get(id)
    if (entry?.timeout) {
      clearTimeout(entry.timeout)
    }
    timers.delete(id)
  }

  function dismissToast(id: string): void {
    clearTimer(id)
    removeToast(id)?.onDismiss?.()
  }

  function expireToast(id: string): void {
    timers.delete(id)
    removeToast(id)?.onAutoClose?.()
  }

  function pushToast(toast: Omit<Toast, 'id'>, durationMs = 4000): string {
    const id = crypto.randomUUID()
    toasts.value.push({ ...toast, id })
    timers.set(id, {
      timeout: setTimeout(() => expireToast(id), durationMs),
      remaining: durationMs,
      startedAt: Date.now(),
    })
    return id
  }

  function pauseToast(id: string): void {
    const entry = timers.get(id)
    if (!entry?.timeout) {
      return
    }
    clearTimeout(entry.timeout)
    entry.timeout = null
    entry.remaining = Math.max(0, entry.remaining - (Date.now() - entry.startedAt))
  }

  function resumeToast(id: string): void {
    const entry = timers.get(id)
    if (!entry || entry.timeout !== null) {
      return
    }
    entry.startedAt = Date.now()
    entry.timeout = setTimeout(() => expireToast(id), entry.remaining)
  }

  return { toasts, pushToast, dismissToast, pauseToast, resumeToast }
}
