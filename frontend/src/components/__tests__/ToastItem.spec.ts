import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import ToastItem from '../ToastItem.vue'
import type { Toast } from '@/composables/useToasts'

const toast: Toast = { id: 't1', kind: 'success', title: 'Saved', detail: 'Course added' }

function dispatchPointer(el: Element, type: string, init: PointerEventInit) {
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, ...init }))
}

function mountToast() {
  const wrapper = mount(ToastItem, { props: { toast } })
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
})
