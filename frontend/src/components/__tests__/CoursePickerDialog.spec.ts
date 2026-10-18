import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CoursePickerDialog from '../CoursePickerDialog.vue'
import type { CourseResponse, ScheduleResponse } from '@/types/api'

describe('CoursePickerDialog.vue', () => {
  const sampleCourses: CourseResponse[] = [
    { id: 1, name: 'Data Structures & Algorithms' },
    { id: 2, name: 'Web Development' },
  ]

  const sampleSchedules: ScheduleResponse[] = [
    { id: 101, courseId: 1, day: 'MONDAY', startTime: '09:00', endTime: '10:00' },
    { id: 102, courseId: 1, day: 'WEDNESDAY', startTime: '09:00', endTime: '10:00' },
  ]

  it('renders course list with color dot, title, and formatted schedule', () => {
    const wrapper = mount(CoursePickerDialog, {
      props: {
        open: true,
        courses: sampleCourses,
        schedules: sampleSchedules,
        selectedCourseId: null,
      },
      global: {
        // The real DialogContent teleports to document.body. These stubs render the content inside the wrapper.
        stubs: {
          Dialog: { template: '<div><slot /></div>' },
          DialogContent: { template: '<div data-slot="dialog-content"><slot /></div>' },
          DialogHeader: { template: '<div><slot /></div>' },
          DialogTitle: { template: '<div><slot /></div>' },
          DialogDescription: { template: '<div><slot /></div>' },
        },
      },
    })

    const options = wrapper.findAll('button[data-testid^="course-option-"]')
    expect(options).toHaveLength(2)

    // First course has schedule Mo, We
    const firstOption = wrapper.find('[data-testid="course-option-1"]')
    expect(firstOption.text()).toContain('Data Structures & Algorithms')
    expect(firstOption.text()).toContain('Mo, We')

    // Second course has no schedule
    const secondOption = wrapper.find('[data-testid="course-option-2"]')
    expect(secondOption.text()).toContain('Web Development')
    expect(secondOption.text()).toContain('No set schedule')
  })

  it('emits "select" and "update:open" with false when a course is chosen', async () => {
    const wrapper = mount(CoursePickerDialog, {
      props: {
        open: true,
        courses: sampleCourses,
        schedules: sampleSchedules,
        selectedCourseId: null,
      },
      global: {
        stubs: {
          Dialog: { template: '<div><slot /></div>' },
          DialogContent: { template: '<div><slot /></div>' },
          DialogHeader: { template: '<div><slot /></div>' },
          DialogTitle: { template: '<div><slot /></div>' },
          DialogDescription: { template: '<div><slot /></div>' },
        },
      },
    })

    const firstOption = wrapper.find('[data-testid="course-option-1"]')
    await firstOption.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]).toEqual([1])
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
  })

  it('highlights the selected course with check indicator and styling', () => {
    const wrapper = mount(CoursePickerDialog, {
      props: {
        open: true,
        courses: sampleCourses,
        schedules: sampleSchedules,
        selectedCourseId: 1,
      },
      global: {
        stubs: {
          Dialog: { template: '<div><slot /></div>' },
          DialogContent: { template: '<div><slot /></div>' },
          DialogHeader: { template: '<div><slot /></div>' },
          DialogTitle: { template: '<div><slot /></div>' },
          DialogDescription: { template: '<div><slot /></div>' },
        },
      },
    })

    const selectedOption = wrapper.find('[data-testid="course-option-1"]')
    expect(selectedOption.attributes('aria-selected')).toBe('true')
    expect(selectedOption.find('[data-testid="selected-check"]').exists()).toBe(true)

    const unselectedOption = wrapper.find('[data-testid="course-option-2"]')
    expect(unselectedOption.attributes('aria-selected')).toBe('false')
    expect(unselectedOption.find('[data-testid="selected-check"]').exists()).toBe(false)
  })

  it('displays empty state when course list is empty', () => {
    const wrapper = mount(CoursePickerDialog, {
      props: {
        open: true,
        courses: [],
        schedules: [],
      },
      global: {
        stubs: {
          Dialog: { template: '<div><slot /></div>' },
          DialogContent: { template: '<div><slot /></div>' },
          DialogHeader: { template: '<div><slot /></div>' },
          DialogTitle: { template: '<div><slot /></div>' },
          DialogDescription: { template: '<div><slot /></div>' },
        },
      },
    })

    expect(wrapper.find('[data-testid="empty-course-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No courses available')
  })
})
