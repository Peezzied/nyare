import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CourseBlockDetail from '../CourseBlockDetail.vue'
import type { CourseBlockDetailState } from '@/types/detailModal'

describe('CourseBlockDetail', () => {
  const sampleData: CourseBlockDetailState = {
    courseId: 101,
    courseName: 'Data Structures and Algorithms',
    colorDot: 'bg-[#7CE19D]',
    timeWindow: '10:00 AM - 12:00 PM',
    tasksTarget: '/tasks',
    notesTarget: '/notes',
  }

  it('renders strictly the course name, time window, and color dot', () => {
    const wrapper = mount(CourseBlockDetail, {
      props: {
        data: sampleData,
      },
    })

    expect(wrapper.text()).toContain('Data Structures and Algorithms')
    expect(wrapper.text()).toContain('10:00 AM - 12:00 PM')

    const dot = wrapper.find('.rounded-full.ring-2')
    expect(dot.exists()).toBe(true)
    expect(dot.classes()).toContain('bg-[#7CE19D]')

    // Prohibited information checks
    expect(wrapper.text()).not.toContain('Room')
    expect(wrapper.text()).not.toContain('Instructor')
    expect(wrapper.text()).not.toContain('Professor')
  })

  it('renders tactile 3D buttons for Tasks and Notes and emits navigate on click', async () => {
    const wrapper = mount(CourseBlockDetail, {
      props: {
        data: sampleData,
      },
    })

    const buttons = wrapper.findAll('button')
    const tasksBtn = buttons.find((btn) => btn.text().includes('Tasks'))
    const notesBtn = buttons.find((btn) => btn.text().includes('Notes'))

    expect(tasksBtn).toBeDefined()
    expect(notesBtn).toBeDefined()

    await tasksBtn!.trigger('click')
    expect(wrapper.emitted('navigate')).toBeTruthy()
    expect(wrapper.emitted('navigate')![0]).toEqual(['/tasks'])

    await notesBtn!.trigger('click')
    expect(wrapper.emitted('navigate')![1]).toEqual(['/notes'])
  })
})
