import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NoteCard from '../NoteCard.vue'
import type { NoteSummaryResponse } from '@/types/api'

const note: NoteSummaryResponse = {
  id: 'note-1',
  courseId: 1,
  title: 'Lecture 7',
  preview: 'Short lecture note',
  truncated: false,
  contentLength: 18,
  entryDate: '2026-10-06',
  createdAt: '2026-10-06T09:30:00Z',
  updatedAt: '2026-10-06T11:00:00Z',
}

const imageNote: NoteSummaryResponse = {
  ...note,
  id: 'note-2',
  preview: 'Whiteboard ![board](/api/images/abc-123) from class',
}

describe('NoteCard', () => {
  it('renders badge, title, preview, and entry date', () => {
    const wrapper = mount(NoteCard, {
      props: { note, courseName: 'CS 201' },
    })

    expect(wrapper.get('[data-testid="note-course-badge"]').text()).toBe('CS 201')
    expect(wrapper.get('[data-testid="note-title"]').text()).toBe('Lecture 7')
    expect(wrapper.get('[data-testid="note-preview"]').text()).toBe('Short lecture note')
    expect(wrapper.get('[data-testid="note-entry-date"]').text()).toBe('Oct 6')
  })

  it('falls back to course id when course name is missing', () => {
    const wrapper = mount(NoteCard, { props: { note } })

    expect(wrapper.get('[data-testid="note-course-badge"]').text()).toBe('Course 1')
  })

  it('renders image style for notes with image markdown', () => {
    const wrapper = mount(NoteCard, { props: { note: imageNote } })

    const image = wrapper.get('[data-testid="note-image"]')
    expect(image.attributes('src')).toBe('/api/images/abc-123')
    expect(wrapper.get('[data-testid="note-preview"]').text()).not.toContain('![')
  })

  it('renders no image for text notes', () => {
    const wrapper = mount(NoteCard, { props: { note } })

    expect(wrapper.find('[data-testid="note-image"]').exists()).toBe(false)
  })

  it('holds no clickable elements and ignores clicks', async () => {
    const wrapper = mount(NoteCard, { props: { note: imageNote } })

    expect(wrapper.find('a, button').exists()).toBe(false)
    const before = wrapper.html()
    await wrapper.trigger('click')

    expect(wrapper.html()).toBe(before)
    expect(wrapper.get('[data-testid="note-title"]').text()).toBe('Lecture 7')
  })
})
