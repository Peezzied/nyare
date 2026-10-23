import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, reactive } from 'vue'
import { mount } from '@vue/test-utils'
import NoteOpenView from '../NoteOpenView.vue'
import NoteEditorModal from '@/components/notes/NoteEditorModal.vue'
import { takeNoteMorphOrigin } from '@/composables/useNoteTransition'

const mockRoute = reactive({ name: 'note-open', params: { id: 'note-1' } as Record<string, string> })
const mockBack = vi.fn<() => void>()
const mockReplace = vi.fn<(location: { name: string }) => Promise<void>>(() => Promise.resolve())

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
}))

describe('NoteOpenView', () => {
  beforeEach(() => {
    takeNoteMorphOrigin()
    mockBack.mockClear()
    mockReplace.mockClear()
    window.history.replaceState(null, '')
  })

  it('opens the note editor for the route id', () => {
    const wrapper = mount(NoteOpenView, { shallow: true })

    expect(wrapper.findComponent(NoteEditorModal).props('noteId')).toBe('note-1')
    expect(wrapper.findComponent(NoteEditorModal).props('isOpen')).toBe(true)
  })

  it('returns through history when the note route has a back entry', async () => {
    window.history.replaceState({ back: '/tasks/task-1' }, '')

    const wrapper = mount(NoteOpenView, { shallow: true })
    wrapper.findComponent(NoteEditorModal).vm.$emit('close')
    await nextTick()

    expect(mockBack).toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('falls back to the calendar when the note route has no back entry', async () => {
    const wrapper = mount(NoteOpenView, { shallow: true })
    wrapper.findComponent(NoteEditorModal).vm.$emit('close')
    await nextTick()

    expect(mockReplace).toHaveBeenCalledWith({ name: 'calendar' })
    expect(mockBack).not.toHaveBeenCalled()
  })
})
