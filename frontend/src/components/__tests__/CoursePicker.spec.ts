import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import CoursePicker from '../CoursePicker.vue'
import CoursePickerDialog from '../CoursePickerDialog.vue'
import { getCourseBadgeStyle } from '@/utils/courseColors'
import type { CourseResponse, ScheduleResponse } from '@/types/api'

const sampleCourses: CourseResponse[] = [
  { id: 1, name: 'Data Structures & Algorithms' },
  { id: 2, name: 'Web Development' },
]

const sampleSchedules: ScheduleResponse[] = [
  { id: 101, courseId: 1, day: 'MONDAY', startTime: '09:00', endTime: '10:00' },
]

// The inner CoursePickerDialog teleports to document.body, so dialog queries run against the document.
function mountPicker(
  props: Partial<{
    modelValue: number | null
    courses: CourseResponse[]
    schedules: ScheduleResponse[]
    emptyLabel: string
  }> = {},
) {
  return mount(CoursePicker, {
    props: {
      modelValue: null,
      courses: sampleCourses,
      schedules: sampleSchedules,
      ...props,
    },
    attachTo: document.body,
  })
}

describe('CoursePicker.vue', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the dashed pill with the Required label when no course is selected', () => {
    const wrapper = mountPicker({ modelValue: null })

    const trigger = wrapper.get('button')
    expect(trigger.text()).toContain('Required')
    expect(trigger.classes()).toContain('border-dashed')
    expect(trigger.classes()).toContain('text-red-600')

    wrapper.unmount()
  })

  it('renders a custom emptyLabel on the dashed pill', () => {
    const wrapper = mountPicker({ modelValue: null, emptyLabel: 'Pick a course' })

    expect(wrapper.get('button').text()).toContain('Pick a course')

    wrapper.unmount()
  })

  it('renders the course name with badge colors when a course is selected', () => {
    const wrapper = mountPicker({ modelValue: 1 })

    const trigger = wrapper.get('button')
    expect(trigger.text()).toContain('Data Structures & Algorithms')
    expect(trigger.classes()).not.toContain('border-dashed')

    // jsdom normalizes hex colors, so compare against a probe element.
    const badge = getCourseBadgeStyle(1)
    const probe = document.createElement('span')
    probe.style.backgroundColor = badge.backgroundColor
    probe.style.color = badge.color
    expect(trigger.element.style.backgroundColor).toBe(probe.style.backgroundColor)
    expect(trigger.element.style.color).toBe(probe.style.color)

    wrapper.unmount()
  })

  it('opens the course picker modal when the trigger is clicked', async () => {
    const wrapper = mountPicker()

    expect(document.body.querySelector('[data-testid="course-picker-modal"]')).toBeNull()

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(document.body.querySelector('[data-testid="course-picker-modal"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="course-option-1"]')).not.toBeNull()

    wrapper.unmount()
  })

  it('emits update:modelValue with the course id and closes the dialog on selection', async () => {
    const wrapper = mountPicker({ modelValue: null })

    await wrapper.get('button').trigger('click')
    await flushPromises()

    const option = document.body.querySelector<HTMLElement>('[data-testid="course-option-2"]')
    expect(option).not.toBeNull()
    option!.click()
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2])
    expect(wrapper.findComponent(CoursePickerDialog).props('open')).toBe(false)

    wrapper.unmount()
  })

  it('shows the empty-course state inside the dialog when no courses exist', async () => {
    const wrapper = mountPicker({ courses: [] })

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(document.body.querySelector('[data-testid="empty-course-state"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="course-options-list"]')).toBeNull()

    wrapper.unmount()
  })
})
