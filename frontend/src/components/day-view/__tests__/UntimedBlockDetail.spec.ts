import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UntimedBlockDetail from '../UntimedBlockDetail.vue'
import type { NonCourseBlockDetailState } from '@/types/detailModal'

describe('UntimedBlockDetail', () => {
  it('renders title and singular linked note when present', () => {
    const data: NonCourseBlockDetailState = {
      id: 'task-1',
      title: 'Review Chapter 4 Summary',
      itemType: 'task',
      linkedNote: 'Calculus Week 4 Lecture Notes',
    }

    const wrapper = mount(UntimedBlockDetail, {
      props: { data },
    })

    expect(wrapper.text()).toContain('Review Chapter 4 Summary')
    expect(wrapper.text()).toContain('Calculus Week 4 Lecture Notes')
    expect(wrapper.text()).toContain('Linked Note')

    // Prohibited checks: no action buttons or tasks shortcut
    expect(wrapper.text()).not.toContain('Tasks')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('hides linked note container when linkedNote is null', () => {
    const data: NonCourseBlockDetailState = {
      id: 'event-1',
      title: 'Midterm Exam',
      itemType: 'academic-event',
      linkedNote: null,
    }

    const wrapper = mount(UntimedBlockDetail, {
      props: { data },
    })

    expect(wrapper.text()).toContain('Midterm Exam')
    expect(wrapper.text()).not.toContain('Linked Note')
  })
})
