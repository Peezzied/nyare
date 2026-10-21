import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import ToastItem from '../ToastItem.vue'
import type { Toast } from '@/composables/useToasts'

const toast: Toast = { id: 't1', kind: 'success', title: 'Saved', detail: 'Course added' }

function dispatchPointer(el: Element, type: string, init: PointerEventInit) {
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...init }))
}

function mountToast(t: Toast = toast) {
  const wrapper = mount(ToastItem, { props: { toast: t } })
  const el = wrapper.get('[data-testid="toast"]').element as HTMLElement
  el.setPointerCapture = () => {}
  return { wrapper, el }
}

describe('ToastItem', () => {
  it('emits dismiss on tap', async () => {
    const { wrapper } = mountToast()
    await wrapper.get('[data-testid="toast"]').trigger('click')
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('emits dismiss and flies out right on a right swipe past the threshold', async () => {
    const { wrapper, el } = mountToast()
    dispatchPointer(el, 'pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 40 })
    dispatchPointer(el, 'pointermove', { pointerId: 1, clientX: 180, clientY: 44 })
    dispatchPointer(el, 'pointerup', { pointerId: 1, clientX: 180, clientY: 44 })
    await nextTick()
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    expect(el.style.transform).toBe('translateX(480px)')
  })

  it('emits dismiss and flies out left on a left swipe past the threshold', async () => {
    const { wrapper, el } = mountToast()
    dispatchPointer(el, 'pointerdown', { button: 0, pointerId: 1, clientX: 200, clientY: 40 })
    dispatchPointer(el, 'pointermove', { pointerId: 1, clientX: 110, clientY: 40 })
    dispatchPointer(el, 'pointerup', { pointerId: 1, clientX: 110, clientY: 40 })
    await nextTick()
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    expect(el.style.transform).toBe('translateX(-480px)')
  })

  it('snaps back without dismissing on a sub-threshold drag', async () => {
    const { wrapper, el } = mountToast()
    dispatchPointer(el, 'pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 40 })
    dispatchPointer(el, 'pointermove', { pointerId: 1, clientX: 140, clientY: 42 })
    dispatchPointer(el, 'pointerup', { pointerId: 1, clientX: 140, clientY: 42 })
    await nextTick()
    expect(wrapper.emitted('dismiss')).toBeUndefined()
    expect(el.style.transform).toBe('')
  })

  it('yields to vertical scroll and does not dismiss', async () => {
    const { wrapper, el } = mountToast()
    dispatchPointer(el, 'pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 40 })
    dispatchPointer(el, 'pointermove', { pointerId: 1, clientX: 130, clientY: 120 })
    dispatchPointer(el, 'pointerup', { pointerId: 1, clientX: 130, clientY: 120 })
    await nextTick()
    expect(wrapper.emitted('dismiss')).toBeUndefined()
  })

  it('runs the action and dismisses once when its button is tapped', async () => {
    const onClick = vi.fn<() => void>()
    const { wrapper } = mountToast({
      id: 't2',
      kind: 'info',
      title: 'Task deleted',
      action: { label: 'Undo', onClick },
    })
    await wrapper.get('[data-testid="toast-action"]').trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('emits dismiss from the close button without running the action', async () => {
    const onClick = vi.fn<() => void>()
    const { wrapper } = mountToast({
      id: 't3',
      kind: 'info',
      title: 'Task deleted',
      action: { label: 'Undo', onClick },
    })
    await wrapper.get('[data-testid="toast-dismiss"]').trigger('click')
    expect(onClick).not.toHaveBeenCalled()
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })

  it('emits pause and resume on hover and focus', async () => {
    const { wrapper, el } = mountToast()
    await wrapper.get('[data-testid="toast"]').trigger('mouseenter')
    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await wrapper.get('[data-testid="toast"]').trigger('mouseleave')
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    expect(wrapper.emitted('pause')).toHaveLength(2)
    expect(wrapper.emitted('resume')).toHaveLength(2)
  })
})
