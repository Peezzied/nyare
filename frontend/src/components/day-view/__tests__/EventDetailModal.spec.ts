import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EventDetailModal from '../EventDetailModal.vue'
import type { CourseBlockDetailState, TapOriginRect } from '@/types/detailModal'

describe('EventDetailModal', () => {
  const sampleOriginRect: TapOriginRect = {
    top: 100,
    left: 20,
    width: 350,
    height: 80,
  }

  const sampleCourseData: CourseBlockDetailState = {
    courseId: 1,
    courseName: 'Web Systems and Technologies',
    colorDot: 'bg-[#80C2F8]',
    timeWindow: '08:00 AM - 10:00 AM',
    tasksTarget: '/tasks',
    notesTarget: '/notes',
  }

  beforeEach(() => {
    vi.useFakeTimers()
    document.body.style.overflow = ''
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.style.overflow = ''
  })

  it('renders dialog with accessibility attributes when isOpen is true', () => {
    const wrapper = mount(EventDetailModal, {
      props: {
        isOpen: true,
        originRect: sampleOriginRect,
        kind: 'course',
        data: sampleCourseData,
      },
    })

    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')
  })

  it('does not render overlay container when isOpen is false', () => {
    const wrapper = mount(EventDetailModal, {
      props: {
        isOpen: false,
        originRect: sampleOriginRect,
        kind: 'course',
        data: sampleCourseData,
      },
    })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('locks body scroll when opened and restores scroll on unmount', async () => {
    const wrapper = mount(EventDetailModal, {
      props: {
        isOpen: true,
        originRect: sampleOriginRect,
        kind: 'course',
        data: sampleCourseData,
      },
    })

    expect(document.body.style.overflow).toBe('hidden')

    wrapper.unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(EventDetailModal, {
      props: {
        isOpen: true,
        originRect: sampleOriginRect,
        kind: 'course',
        data: sampleCourseData,
      },
    })

    const closeBtn = wrapper.find('button[aria-label="Close detail view"]')
    expect(closeBtn.exists()).toBe(true)
    await closeBtn.trigger('click')

    vi.advanceTimersByTime(250)
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close event when backdrop is clicked', async () => {
    const wrapper = mount(EventDetailModal, {
      props: {
        isOpen: true,
        originRect: sampleOriginRect,
        kind: 'course',
        data: sampleCourseData,
      },
    })

    const backdrop = wrapper.find('[data-testid="modal-backdrop"]')
    expect(backdrop.exists()).toBe(true)
    expect(backdrop.classes()).toContain('bg-black/20')
    await backdrop.trigger('click')

    vi.advanceTimersByTime(250)
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits close event when Escape key is pressed', async () => {
    const wrapper = mount(EventDetailModal, {
      props: {
        isOpen: true,
        originRect: sampleOriginRect,
        kind: 'course',
        data: sampleCourseData,
      },
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    vi.advanceTimersByTime(250)
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
