import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PictureNoteCard from '../PictureNoteCard.vue'

const props = {
  photoUrl: '/preview-photo.svg',
  courseId: 2,
  courseName: 'CALC 2',
  title: 'Board snapshot',
  text: 'Formulas from the review session.',
  entryDate: '2026-09-28',
}

describe('PictureNoteCard', () => {
  it('renders white card with badge, photo, title, text, and long date', () => {
    const wrapper = mount(PictureNoteCard, { props })
    const card = wrapper.get('[data-testid="picture-note-card"]')

    expect(card.classes()).toContain('bg-card')
    expect(card.classes()).not.toContain('bg-text-main')
    expect(wrapper.get('[data-testid="picture-note-badge"]').text()).toBe('CALC 2')
    expect(wrapper.get('[data-testid="picture-note-badge"]').classes()).toContain('rounded-full')
    expect(wrapper.get('[data-testid="picture-note-photo"]').attributes('src')).toBe(
      '/preview-photo.svg',
    )
    expect(wrapper.get('[data-testid="picture-note-title"]').text()).toBe('Board snapshot')
    expect(wrapper.get('[data-testid="picture-note-text"]').text()).toBe(
      'Formulas from the review session.',
    )
    expect(wrapper.get('[data-testid="picture-note-date"]').text()).toBe('September 28')
  })

  it('falls back to course id when course name is missing', () => {
    const wrapper = mount(PictureNoteCard, {
      props: { ...props, courseName: undefined },
    })

    expect(wrapper.get('[data-testid="picture-note-badge"]').text()).toBe('Course 2')
  })

  it('emits open with the DOM event on click and Enter', async () => {
    const wrapper = mount(PictureNoteCard, { props })

    expect(wrapper.find('a, button').exists()).toBe(false)

    await wrapper.trigger('click')
    await wrapper.trigger('keydown.enter')

    const emitted = wrapper.emitted('open')
    expect(emitted).toHaveLength(2)
    expect(emitted![0]![0]).toBeInstanceOf(Event)
    expect(emitted![1]![0]).toBeInstanceOf(Event)
  })
})
