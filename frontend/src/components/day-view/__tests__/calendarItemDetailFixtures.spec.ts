import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CalendarItemDetail from '../CalendarItemDetail.vue'
import CategoryMarker from '../CategoryMarker.vue'
import { CALENDAR_ITEM_DETAIL_FIXTURES } from '@/api/mocks/calendarItemDetailFixtures'

function fixture(name: string) {
  const found = CALENDAR_ITEM_DETAIL_FIXTURES.find((entry) => entry.name === name)
  if (!found) throw new Error(`Missing fixture: ${name}`)
  return found
}

function render(name: string) {
  return mount(CalendarItemDetail, { props: { item: fixture(name).item } })
}

describe('CALENDAR_ITEM_DETAIL_FIXTURES', () => {
  it('covers every named state from the mock data contract', () => {
    const names = CALENDAR_ITEM_DETAIL_FIXTURES.map((entry) => entry.name)

    expect(names).toEqual([
      'class-with-window',
      'class-with-notes',
      'task-with-note-and-duration',
      'task-without-note',
      'task-without-duration',
      'task-without-scheduled-date',
      'task-completed',
      'event-with-note',
      'event-without-note',
      'marker-class',
      'marker-event',
      'marker-task-open',
      'marker-task-completed',
      'week-overflow-day',
    ])
  })

  it('gives every detail state a time window (SC-004)', () => {
    for (const entry of CALENDAR_ITEM_DETAIL_FIXTURES) {
      expect(entry.item.timeWindow).not.toBeNull()
    }
  })

  it('never gives a class or an event a duration (FR-017)', () => {
    for (const entry of CALENDAR_ITEM_DETAIL_FIXTURES) {
      if (entry.item.kind === 'task') continue
      expect(entry.item.duration).toBeNull()
    }
  })
})

describe('detail states', () => {
  it('shows note, complete control, time window and duration together', () => {
    const wrapper = render('task-with-note-and-duration')

    expect(wrapper.find('[data-testid="note-control"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="complete-control"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="detail-time-window"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="detail-duration"]').exists()).toBe(true)
  })

  it('hides the note control without a source note (FR-018)', () => {
    expect(render('task-without-note').find('[data-testid="note-control"]').exists()).toBe(false)
  })

  it('hides the duration without a known value (FR-019)', () => {
    expect(render('task-without-duration').find('[data-testid="detail-duration"]').exists()).toBe(
      false,
    )
  })

  it('shows the plan-category label when no scheduled date exists', () => {
    expect(
      render('task-without-scheduled-date').find('[data-testid="detail-time-window"]').text(),
    ).toBe('Later')
  })

  it('disables the complete control on a completed task (FR-010)', () => {
    expect(
      render('task-completed').find('[data-testid="complete-control"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('shows the event note and no duration (FR-014, FR-017)', () => {
    const wrapper = render('event-with-note')

    expect(wrapper.find('[data-testid="note-control"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="detail-duration"]').exists()).toBe(false)
  })

  it('hides the note control on a note-less event', () => {
    const wrapper = render('event-without-note')

    expect(wrapper.find('[data-testid="note-control"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="complete-control"]').exists()).toBe(false)
  })

  it('shows only the time window for a class (FR-002)', () => {
    const wrapper = render('class-with-window')

    expect(wrapper.find('[data-testid="detail-time-window"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="detail-duration"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="note-control"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="complete-control"]').exists()).toBe(false)
  })

  it('lists the linked notes and the add-note action for a class', () => {
    const wrapper = render('class-with-notes')

    expect(wrapper.findAll('[data-testid="note-control"]')).toHaveLength(2)
    expect(wrapper.find('[data-testid="add-note-control"]').exists()).toBe(true)
  })

  it('keeps the add-note action on a class without notes', () => {
    expect(render('class-with-window').find('[data-testid="add-note-control"]').exists()).toBe(true)
  })

  it('hides the add-note action on tasks and events', () => {
    for (const entry of CALENDAR_ITEM_DETAIL_FIXTURES) {
      if (entry.item.kind === 'class') continue
      const wrapper = mount(CalendarItemDetail, { props: { item: entry.item } })
      expect(wrapper.find('[data-testid="add-note-control"]').exists()).toBe(false)
    }
  })
})

describe('marker states', () => {
  function renderMarker(name: string) {
    const marker = fixture(name).marker
    if (!marker) throw new Error(`Missing marker: ${name}`)
    return mount(CategoryMarker, {
      props: { category: marker.category, completed: marker.completed },
    })
  }

  it('renders no indicator for the class marker (FR-002)', () => {
    expect(renderMarker('marker-class').find('[data-testid="marker-indicator"]').exists()).toBe(
      false,
    )
  })

  it('renders the flag for the event marker (FR-003)', () => {
    expect(renderMarker('marker-event').find('[data-testid="marker-indicator"]').exists()).toBe(
      true,
    )
  })

  it('renders an empty box for the open task marker (FR-004)', () => {
    const wrapper = renderMarker('marker-task-open')

    expect(wrapper.find('[data-testid="marker-indicator"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="marker-check"]').exists()).toBe(false)
  })

  it('renders a checked box for the completed task marker (FR-004)', () => {
    expect(
      renderMarker('marker-task-completed').find('[data-testid="marker-check"]').exists(),
    ).toBe(true)
  })

  it('exposes more items than the week cell shows for the overflow day (FR-024)', () => {
    expect(fixture('week-overflow-day').markers?.length).toBeGreaterThan(2)
  })

  it('names every marker category for the parent accessible name (FR-005)', () => {
    expect(fixture('marker-class').marker?.label).toBe('Class')
    expect(fixture('marker-event').marker?.label).toBe('Academic event')
    expect(fixture('marker-task-open').marker?.label).toBe('Academic task')
    expect(fixture('marker-task-completed').marker?.label).toBe('Completed academic task')
  })
})
