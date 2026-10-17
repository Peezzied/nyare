import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DaySwiper from '../DaySwiper.vue'
import { h } from 'vue'

describe('DaySwiper', () => {
  const baseDate = new Date(2026, 9, 17) // Oct 17, 2026

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function dispatchPointer(el: Element, type: string, init: PointerEventInit) {
    const ev = new PointerEvent(type, { bubbles: true, cancelable: true, ...init })
    el.dispatchEvent(ev)
  }

  it('renders default slot content', () => {
    const wrapper = mount(DaySwiper, {
      props: {
        selectedDate: baseDate,
        stepDays: 1,
      },
      slots: {
        default: () => h('div', { class: 'calendar-content' }, 'Calendar Surface'),
      },
    })

    expect(wrapper.text()).toContain('Calendar Surface')
  })

  it('slides the track and commits date change on drag exceeding threshold', async () => {
    const wrapper = mount(DaySwiper, {
      props: {
        selectedDate: baseDate,
        stepDays: 1,
      },
      slots: {
        default: () => h('div', { class: 'calendar-content' }, 'Calendar Surface'),
      },
      attachTo: document.body,
    })

    // Mock getBoundingClientRect on viewport
    vi.spyOn(wrapper.element, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 400,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 400,
      toJSON: () => {},
    })

    const el = wrapper.element

    // Drag left by 150px (exceeds 400 * 0.25 = 100px threshold)
    dispatchPointer(el, 'pointerdown', { isPrimary: true, pointerId: 1, clientX: 200, clientY: 100 })
    dispatchPointer(el, 'pointermove', { isPrimary: true, pointerId: 1, clientX: 50, clientY: 100 })
    dispatchPointer(el, 'pointerup', { isPrimary: true, pointerId: 1, clientX: 50, clientY: 100 })

    // Fast-forward settle timer (SETTLE_MS = 220 + 20)
    vi.advanceTimersByTime(250)

    const emitted = wrapper.emitted('changeDate')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toBeInstanceOf(Date)
    const newDate = emitted?.[0]?.[0] as Date
    expect(newDate.getDate()).toBe(18) // Oct 18, 2026

    wrapper.unmount()
  })

  it('emits previous day on right swipe', async () => {
    const wrapper = mount(DaySwiper, {
      props: {
        selectedDate: baseDate,
        stepDays: 1,
      },
      slots: {
        default: () => h('div', { class: 'calendar-content' }, 'Calendar Surface'),
      },
      attachTo: document.body,
    })

    vi.spyOn(wrapper.element, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 400,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 400,
      toJSON: () => {},
    })

    const el = wrapper.element

    // Drag right by 150px
    dispatchPointer(el, 'pointerdown', { isPrimary: true, pointerId: 1, clientX: 100, clientY: 100 })
    dispatchPointer(el, 'pointermove', { isPrimary: true, pointerId: 1, clientX: 250, clientY: 100 })
    dispatchPointer(el, 'pointerup', { isPrimary: true, pointerId: 1, clientX: 250, clientY: 100 })

    vi.advanceTimersByTime(250)

    const emitted = wrapper.emitted('changeDate')
    expect(emitted).toBeTruthy()
    const newDate = emitted?.[0]?.[0] as Date
    expect(newDate.getDate()).toBe(16) // Oct 16, 2026

    wrapper.unmount()
  })

  it('does not emit changeDate when drag is under threshold and slow', async () => {
    const wrapper = mount(DaySwiper, {
      props: {
        selectedDate: baseDate,
        stepDays: 1,
      },
      slots: {
        default: () => h('div', { class: 'calendar-content' }, 'Calendar Surface'),
      },
      attachTo: document.body,
    })

    vi.spyOn(wrapper.element, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 400,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 400,
      toJSON: () => {},
    })

    const el = wrapper.element

    // Drag only 20px
    dispatchPointer(el, 'pointerdown', { isPrimary: true, pointerId: 1, clientX: 200, clientY: 100 })
    // Advance time so it's not a quick swipe
    vi.advanceTimersByTime(500)
    dispatchPointer(el, 'pointermove', { isPrimary: true, pointerId: 1, clientX: 180, clientY: 100 })
    dispatchPointer(el, 'pointerup', { isPrimary: true, pointerId: 1, clientX: 180, clientY: 100 })

    vi.advanceTimersByTime(250)

    expect(wrapper.emitted('changeDate')).toBeFalsy()

    wrapper.unmount()
  })

  it('measures and passes gutterLeft to peek slot during drag', async () => {
    let capturedPeekProps: Record<string, unknown> | null = null
    const wrapper = mount(DaySwiper, {
      props: {
        selectedDate: baseDate,
        stepDays: 7,
      },
      slots: {
        default: () =>
          h('div', { class: 'calendar-content' }, [
            h('div', { class: 'sx__time-grid-day', id: 'col1' }),
          ]),
        peek: (slotProps) => {
          capturedPeekProps = slotProps
          return h('div', { class: 'peek-content' }, 'Peek')
        },
      },
      attachTo: document.body,
    })

    vi.spyOn(wrapper.element, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 400,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 400,
      toJSON: () => {},
    })

    const col1 = wrapper.find('#col1').element
    vi.spyOn(col1, 'getBoundingClientRect').mockReturnValue({
      x: 55,
      y: 0,
      width: 48,
      height: 800,
      top: 0,
      left: 55,
      bottom: 800,
      right: 103,
      toJSON: () => {},
    })

    const el = wrapper.element
    dispatchPointer(el, 'pointerdown', { isPrimary: true, pointerId: 1, clientX: 200, clientY: 100 })
    dispatchPointer(el, 'pointermove', { isPrimary: true, pointerId: 1, clientX: 100, clientY: 100 })

    await wrapper.vm.$nextTick()

    expect(capturedPeekProps).not.toBeNull()
    const peekProps = capturedPeekProps as unknown as { gutterLeft: number }
    expect(peekProps.gutterLeft).toBe(55)

    wrapper.unmount()
  })
})
