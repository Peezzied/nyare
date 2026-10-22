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
    notes: [{ id: 'note-1', title: 'Lecture 7: Self-Balancing Trees' }],
    entryDate: null,
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
    const wrapper = mount(CalendarItemDetail, { props: { item: view({ notes: [] }) } })

    expect(wrapper.find('[data-testid="note-control"]').exists()).toBe(false)
  })

  it('names the note control after the note title', () => {
    const wrapper = mount(CalendarItemDetail, { props: { item: view() } })

    const control = wrapper.find('[data-testid="note-control"]')
    expect(control.text()).toContain('Lecture 7: Self-Balancing Trees')
    expect(control.attributes('aria-label')).toContain('Lecture 7: Self-Balancing Trees')
  })

  it('emits open-note with the linked note ref', async () => {
    const wrapper = mount(CalendarItemDetail, { props: { item: view() } })

    await wrapper.find('[data-testid="note-control"]').trigger('click')

    expect(wrapper.emitted('open-note')).toEqual([
      [{ id: 'note-1', title: 'Lecture 7: Self-Balancing Trees' }],
    ])
  })

  it('renders one control per linked note for a class', () => {
    const wrapper = mount(CalendarItemDetail, {
      props: {
        item: view({
          kind: 'class',
          task: null,
          duration: null,
          notes: [
            { id: 'note-1', title: 'Lecture 7: Self-Balancing Trees' },
            { id: 'note-2', title: 'AVL recap before the lab' },
          ],
          entryDate: '2026-10-22',
        }),
      },
    })

    expect(wrapper.findAll('[data-testid="note-control"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('AVL recap before the lab')
  })

  it('shows the add-note control only when the item has an entryDate', () => {
    const classItem = mount(CalendarItemDetail, {
      props: { item: view({ kind: 'class', task: null, entryDate: '2026-10-22' }) },
    })
    const taskItem = mount(CalendarItemDetail, { props: { item: view() } })

    expect(classItem.find('[data-testid="add-note-control"]').exists()).toBe(true)
    expect(taskItem.find('[data-testid="add-note-control"]').exists()).toBe(false)
  })

  it('emits add-note when the quick action is tapped', async () => {
    const wrapper = mount(CalendarItemDetail, {
      props: { item: view({ kind: 'class', task: null, entryDate: '2026-10-22' }) },
    })

    await wrapper.find('[data-testid="add-note-control"]').trigger('click')

    expect(wrapper.emitted('add-note')).toHaveLength(1)
  })

  it('hides the complete control for a class and an event', () => {
    const wrapper = mount(CalendarItemDetail, {
      props: { item: view({ kind: 'event', task: null, duration: null }) },
    })

    expect(wrapper.find('[data-testid="complete-control"]').exists()).toBe(false)
  })

  it('shows the open-in-todo control only for task items', () => {
    const taskItem = mount(CalendarItemDetail, { props: { item: view() } })
    const eventItem = mount(CalendarItemDetail, {
      props: { item: view({ kind: 'event', task: null }) },
    })

    expect(taskItem.find('[data-testid="open-task-control"]').exists()).toBe(true)
    expect(eventItem.find('[data-testid="open-task-control"]').exists()).toBe(false)
  })

  it('emits open-task with the task id', async () => {
    const wrapper = mount(CalendarItemDetail, { props: { item: view() } })

    await wrapper.find('[data-testid="open-task-control"]').trigger('click')

    expect(wrapper.emitted('open-task')).toEqual([['task-1']])
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

  it('shows the delete control only for event items', () => {
    const eventItem = mount(CalendarItemDetail, {
      props: { item: view({ kind: 'event', task: null, duration: null }) },
    })
    const taskItem = mount(CalendarItemDetail, { props: { item: view() } })
    const classItem = mount(CalendarItemDetail, {
      props: { item: view({ kind: 'class', task: null, duration: null }) },
    })

    expect(eventItem.find('[data-testid="delete-event-control"]').exists()).toBe(true)
    expect(taskItem.find('[data-testid="delete-event-control"]').exists()).toBe(false)
    expect(classItem.find('[data-testid="delete-event-control"]').exists()).toBe(false)
  })

  it('emits deleted after the confirm dialog accepts', async () => {
    const wrapper = mount(CalendarItemDetail, {
      props: { item: view({ kind: 'event', task: null, duration: null }) },
    })

    await wrapper.find('[data-testid="delete-event-control"]').trigger('click')
    expect(wrapper.text()).toContain('Are you sure you want to delete this event?')

    await wrapper.find('[data-testid="delete-event-confirm"]').trigger('click')

    expect(wrapper.emitted('deleted')).toHaveLength(1)
  })

  it('keeps the event when the confirm dialog cancels', async () => {
    const wrapper = mount(CalendarItemDetail, {
      props: { item: view({ kind: 'event', task: null, duration: null }) },
    })

    await wrapper.find('[data-testid="delete-event-control"]').trigger('click')
    await wrapper.find('[data-testid="delete-event-cancel"]').trigger('click')

    expect(wrapper.emitted('deleted')).toBeUndefined()
  })

  it('colors the dot from the course id', () => {
    const wrapper = mount(CalendarItemDetail, { props: { item: view({ courseId: 2 }) } })

    expect(wrapper.find('[data-testid="detail-color-dot"]').attributes('style')).toContain(
      'background-color',
    )
  })
})
