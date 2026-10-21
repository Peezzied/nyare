import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { useToasts } from '../useToasts'

describe('useToasts', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToasts().toasts.value.splice(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pushToast returns the id and expiry fires onAutoClose only', () => {
    const onDismiss = vi.fn<() => void>()
    const onAutoClose = vi.fn<() => void>()
    const id = useToasts().pushToast(
      { kind: 'info', title: 'Gone soon', onDismiss, onAutoClose },
      5000,
    )
    expect(useToasts().toasts.value[0]?.id).toBe(id)
    vi.advanceTimersByTime(5000)
    expect(useToasts().toasts.value).toHaveLength(0)
    expect(onAutoClose).toHaveBeenCalledTimes(1)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('dismissToast fires onDismiss only', () => {
    const onDismiss = vi.fn<() => void>()
    const onAutoClose = vi.fn<() => void>()
    const id = useToasts().pushToast({ kind: 'success', title: 'Done', onDismiss, onAutoClose })
    useToasts().dismissToast(id)
    expect(useToasts().toasts.value).toHaveLength(0)
    expect(onDismiss).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(10000)
    expect(onAutoClose).not.toHaveBeenCalled()
  })

  it('pauseToast holds expiry and resumeToast continues with the remainder', () => {
    const onAutoClose = vi.fn<() => void>()
    const id = useToasts().pushToast({ kind: 'info', title: 'Wait', onAutoClose }, 5000)
    vi.advanceTimersByTime(3000)
    useToasts().pauseToast(id)
    vi.advanceTimersByTime(10000)
    expect(useToasts().toasts.value).toHaveLength(1)
    useToasts().resumeToast(id)
    vi.advanceTimersByTime(1999)
    expect(useToasts().toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(useToasts().toasts.value).toHaveLength(0)
    expect(onAutoClose).toHaveBeenCalledTimes(1)
  })
})
