
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import NotesView from '../NotesView.vue'
import { coursesApi, schedulesApi, notesApi } from '@/api'
import { useCatalog } from '@/composables/useCatalog'
import { useNotes } from '@/composables/useNotes'
import type { NoteSummaryResponse } from '@/types/api'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

const summary: NoteSummaryResponse = {
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

function mockCatalog(): void {
  vi.spyOn(coursesApi, 'list').mockResolvedValue([
    { id: 1, name: 'CS 201', description: null, userId: 1 },
  ])
  vi.spyOn(schedulesApi, 'list').mockResolvedValue([])
}

describe('NotesView', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubEnv('VITE_USE_MOCKS', 'false')
    useCatalog().resetCatalog()
    useNotes().resetNotes()
    push.mockClear()
  })

  it('renders cards in the grid', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mount(NotesView)
    await flushPromises()

    expect(wrapper.find('[data-testid="notes-grid"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="note-card"]').length).toBe(1)
    expect(wrapper.text()).toContain('Lecture 7')
  })

  it('renders image-style cards in the grid', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([
      {
        ...summary,
        id: 'note-2',
        title: 'Lab 2',
        preview: 'Sketch ![wave](/sketch.png) from class',
      },
    ])

    const wrapper = mount(NotesView)
    await flushPromises()

    expect(wrapper.find('[data-testid="note-image"]').exists()).toBe(true)
  })

  it('shows isolated preview cards when dev API returns empty', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([])

    const wrapper = mount(NotesView)
    await flushPromises()

    expect(wrapper.findAll('[data-testid="note-card"]').length).toBe(6)
    expect(wrapper.text()).toContain('Limits recap')
    expect(wrapper.text()).toContain('Pipeline stages')
    expect(wrapper.find('[data-testid="picture-note-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="notes-empty"]').exists()).toBe(false)
  })

  it('prefers real API notes over preview data', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mount(NotesView)
    await flushPromises()

    expect(wrapper.findAll('[data-testid="note-card"]').length).toBe(1)
    expect(wrapper.text()).toContain('Lecture 7')
    expect(wrapper.find('[data-testid="picture-note-card"]').exists()).toBe(false)
  })

  it('keeps the empty state in production builds', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([])
    vi.stubEnv('DEV', false)

    try {
      const wrapper = mount(NotesView)
      await flushPromises()

      expect(wrapper.find('[data-testid="notes-empty"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="notes-grid"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="picture-note-card"]').exists()).toBe(false)
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('renders error state with retry when load fails', async () => {
    mockCatalog()
    const list = vi.spyOn(notesApi, 'list').mockRejectedValue(
      new Error('Network error'),
    )

    const wrapper = mount(NotesView)
    await flushPromises()

    expect(wrapper.find('[data-testid="notes-error"]').exists()).toBe(true)

    list.mockResolvedValue([summary])
    await wrapper.find('[data-testid="notes-error"] button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="notes-grid"]').exists()).toBe(true)
  })

  it('keeps a compact cream header without a plus button', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mount(NotesView)
    await flushPromises()

    const topbar = wrapper.get('[data-testid="notes-topbar"]')

    expect(topbar.classes()).toContain('sticky')
    expect(topbar.classes()).toContain('bg-app-bg')
    expect(topbar.classes()).not.toContain('bg-[#0B8043]')
    expect(wrapper.find('[data-testid="topbar-menu"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="topbar-search"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="topbar-add"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="notes-title"]').classes()).toContain('text-center')
    expect(wrapper.get('[data-testid="notes-title"]').text()).toBe('Notes')
  })

  it('opens a new note from the floating plus button', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mount(NotesView)
    await flushPromises()

    const fab = wrapper.get('[data-testid="notes-fab"]')

    expect(fab.classes()).toContain('bg-primary')
    expect(fab.classes()).toContain('rounded-2xl')

    await fab.trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'note-new' })
  })

  it('hides the picture preview card outside mock mode', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mount(NotesView)
    await flushPromises()

    expect(wrapper.find('[data-testid="picture-note-card"]').exists()).toBe(false)
  })

  it('shows the picture preview card in mock mode', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])
    vi.stubEnv('VITE_USE_MOCKS', 'true')

    try {
      const wrapper = mount(NotesView)
      await flushPromises()

      expect(wrapper.find('[data-testid="picture-note-card"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Board snapshot')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('opens the editor for the clicked note', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mount(NotesView)
    await flushPromises()

    await wrapper.get('[data-testid="note-card"]').trigger('click')

    expect(push).toHaveBeenCalledWith({
      name: 'note-edit',
      params: { id: 'note-1' },
    })
  })
})
