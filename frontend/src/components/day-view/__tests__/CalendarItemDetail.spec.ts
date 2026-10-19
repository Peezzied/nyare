import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CalendarItemDetail from '../CalendarItemDetail.vue'
import type { CalendarItemDetailView } from '@/types/calendarItemDetail'

function view(overrides: Partial<CalendarItemDetailView> = {}): CalendarItemDetailView {
  return {
    kind: 'task',
    id: 'task-1',
    title: 'Implement AVL Tree Rotations',
    courseId: 1,
    timeWindow: 'Oct 22, 2026',
    duration: '1.5hr',
    note: { id: 'note-1', title: 'Lecture 7: Self-Balancing Trees' },
    task: { id: 'task-1', completed: false },
    ...overrides,
  }
}

describe('CalendarItemDetail', () => {
  it('shows the time window when the item has one', () => {
    const wrapper = mount(CalendarItemDetail, { props: { item: view() } })

    expect(wrapper.find('[data-testid="detail-time-window"]').text()).toBe('Oct 22, 2026')
  })

  it('hides the time window when it is null (FR-022)', () => {
    const wrapper = mount(CalendarItemDetail, { props: { item: view({ timeWindow: null }) } })

    expect(wrapper.find('[data-testid="detail-time-window"]').exists()).toBe(false)
  })

  it('shows the duration when the item has one', () => {
    const wrapper = mount(CalendarItemDetail, { props: { item: view() } })

    expect(wrapper.find('[data-testid="detail-duration"]').text()).toBe('1.5hr')
  })

  it('hides the duration when it is null (FR-019)', () => {
    const wrapper = mount(CalendarItemDetail, { props: { item: view({ duration: null }) } })

    expect(wrapper.find('[data-testid="detail-duration"]').exists()).toBe(false)
  })

  it('hides the note control when the item has no note (FR-018)', () => {
    const wrapper = mount(CalendarItemDetail, { props: { item: view({ note: null }) } })

    expect(wrapper.find('[data-testid="note-control"]').exists()).toBe(false)
  })

  it('names the note control after the note title', () => {
    const wrapper = mount(CalendarItemDetail, { props: { item: view() } })

    const control = wrapper.find('[data-testid="note-control"]')
    expect(control.text()).toContain('Lecture 7: Self-Balancing Trees')
    expect(control.attributes('aria-label')).toContain('Lecture 7: Self-Balancing Trees')
  })

  it('keeps a generic note label when the cached title is unknown', () => {
    const wrapper = mount(CalendarItemDetail, {
      props: { item: view({ note: { id: 'note-gone', title: null } }) },
    })

    expect(wrapper.find('[data-testid="note-control"]').exists()).toBe(true)
  })

  it('emits open-note with the linked note ref', async () => {
    const wrapper = mount(CalendarItemDetail, { props: { item: view() } })

    await wrapper.find('[data-testid="note-control"]').trigger('click')

    expect(wrapper.emitted('open-note')).toEqual([
      [{ id: 'note-1', title: 'Lecture 7: Self-Balancing Trees' }],
    ])
  })

  it('hides the complete control for a class and an event', () => {
    const wrapper = mount(CalendarItemDetail, {
      props: { item: view({ kind: 'event', task: null, duration: null }) },
    })

    expect(wrapper.find('[data-testid="complete-control"]').exists()).toBe(false)
  })

  it('emits complete-task with the task id', async () => {
    const wrapper = mount(CalendarItemDetail, { props: { item: view() } })

    await wrapper.find('[data-testid="complete-control"]').trigger('click')

    expect(wrapper.emitted('complete-task')).toEqual([['task-1']])
  })

  it('disables the complete control when the task is already completed', () => {
    const wrapper = mount(CalendarItemDetail, {
      props: { item: view({ task: { id: 'task-1', completed: true } }) },
    })

    expect(wrapper.find('[data-testid="complete-control"]').attributes('disabled')).toBeDefined()
  })

  it('colors the dot from the course id', () => {
    const wrapper = mount(CalendarItemDetail, { props: { item: view({ courseId: 2 }) } })

    expect(wrapper.find('[data-testid="detail-color-dot"]').attributes('style')).toContain(
      'background-color',
    )
  })
})
