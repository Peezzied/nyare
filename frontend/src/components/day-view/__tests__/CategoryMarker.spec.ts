import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryMarker from '../CategoryMarker.vue'
import type { CalendarItemCategory } from '@/types/calendarItemDetail'

function mountMarker(category: CalendarItemCategory, completed?: boolean) {
  return mount(CategoryMarker, { props: { category, completed } })
}

describe('CategoryMarker', () => {
  it('renders no indicator for a class (FR-002)', () => {
    const wrapper = mountMarker('class')

    expect(wrapper.find('[data-testid="marker-indicator"]').exists()).toBe(false)
  })

  it('renders the flag indicator for an event (FR-003)', () => {
    const wrapper = mountMarker('event')

    expect(wrapper.find('[data-testid="marker-indicator"]').exists()).toBe(true)
  })

  it('renders an empty completion box for an open task (FR-004)', () => {
    const wrapper = mountMarker('task', false)

    expect(wrapper.find('[data-testid="marker-indicator"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="marker-check"]').exists()).toBe(false)
  })

  it('renders the checked box for a completed task (FR-004)', () => {
    const wrapper = mountMarker('task', true)

    expect(wrapper.find('[data-testid="marker-check"]').exists()).toBe(true)
  })

  it('hides the indicator glyph from assistive technology', () => {
    const wrapper = mountMarker('event')

    expect(wrapper.find('[data-testid="marker-indicator"]').attributes('aria-hidden')).toBe('true')
  })

  it('exposes the class category name for the parent item label (FR-005)', () => {
    expect(mountMarker('class').text()).toContain('Class')
  })

  it('exposes the event category name for the parent item label (FR-005)', () => {
    expect(mountMarker('event').text()).toContain('Academic event')
  })

  it('exposes the open task category name for the parent item label (FR-005)', () => {
    expect(mountMarker('task', false).text()).toContain('Academic task')
  })

  it('exposes the completed task category name for the parent item label (FR-005)', () => {
    expect(mountMarker('task', true).text()).toContain('Completed academic task')
  })
})
