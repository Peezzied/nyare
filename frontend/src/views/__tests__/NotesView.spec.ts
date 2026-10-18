
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import NotesView from '../NotesView.vue'
import NoteEditorModal from '@/components/notes/NoteEditorModal.vue'
import { coursesApi, schedulesApi, notesApi } from '@/api'
import { useCatalog } from '@/composables/useCatalog'
import { useNotes } from '@/composables/useNotes'
import { routerKey, routeLocationKey } from 'vue-router'
import type { NoteSummaryResponse } from '@/types/api'

const mockPush = vi.fn<(path: string | { name: string; params?: { id: string } }) => Promise<void>>(
  () => Promise.resolve(),
)

vi.mock('vue-router', () => {
  const routerKey = Symbol('routerKey')
  const routeLocationKey = Symbol('routeLocationKey')
  const routerStub = {
    push: (path: string | { name: string; params?: { id: string } }) =>
      mockPush(path),
  }
  return {
    useRouter: () => routerStub,
    routerKey,
    routeLocationKey,
  }
})

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

// NoteEditor uses useRoute, which the vue-router mock above does not provide.
const NoteEditorStub = defineComponent({
  name: 'NoteEditor',
  setup() {
    return () => h('div', { 'data-testid': 'note-editor-stub' })
  },
})

const globalStubs = { stubs: { NoteEditor: NoteEditorStub } }

function mountView() {
  return mount(NotesView, { global: globalStubs })
}

describe('NotesView', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubEnv('VITE_USE_MOCKS', 'false')
    useCatalog().resetCatalog()
    useNotes().resetNotes()
    mockPush.mockClear()
  })

  it('renders cards in the grid', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
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

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="note-image"]').exists()).toBe(true)
  })

  it('shows isolated preview cards when dev API returns empty', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([])

    const wrapper = mountView()
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

    const wrapper = mountView()
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
      const wrapper = mountView()
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

    const wrapper = mountView()
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

    const wrapper = mountView()
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

    const wrapper = mountView()
    await flushPromises()

    const fab = wrapper.get('[data-testid="notes-fab"]')

    expect(fab.classes()).toContain('bg-primary')
    expect(fab.classes()).toContain('rounded-2xl')

    await fab.trigger('click')

    const modal = wrapper.findComponent(NoteEditorModal)
    expect(modal.props('isOpen')).toBe(true)
    expect(modal.props('noteId')).toBeNull()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('hides the picture preview card outside mock mode', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="picture-note-card"]').exists()).toBe(false)
  })

  it('shows the picture preview card in mock mode', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])
    vi.stubEnv('VITE_USE_MOCKS', 'true')

    try {
      const wrapper = mountView()
      await flushPromises()

      expect(wrapper.find('[data-testid="picture-note-card"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Board snapshot')
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('opens the editor modal for the clicked note without routing', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="note-card"]').trigger('click')
    await flushPromises()

    const modal = wrapper.findComponent(NoteEditorModal)
    expect(modal.props('isOpen')).toBe(true)
    expect(modal.props('noteId')).toBe('note-1')
    expect(wrapper.find('[data-testid="note-editor-modal"]').exists()).toBe(true)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('ignores a second open trigger while the modal is open', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="note-card"]').trigger('click')
    await flushPromises()

    await wrapper.get('[data-testid="notes-fab"]').trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(NoteEditorModal).props('noteId')).toBe('note-1')
  })

  it('closes the modal on popstate without a route push and preserves scroll', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
    const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="note-card"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="note-editor-modal"]').exists()).toBe(true)

    window.dispatchEvent(new Event('popstate'))
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.find('[data-testid="note-editor-modal"]').exists()).toBe(false)
    expect(mockPush).not.toHaveBeenCalled()
    expect(scrollSpy).not.toHaveBeenCalled()

    wrapper.unmount()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('refreshes the notes list when the editor saves', async () => {
    mockCatalog()
    const list = vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    expect(list).toHaveBeenCalledTimes(1)

    await wrapper.findComponent(NoteEditorModal).vm.$emit('saved', 'note-1')
    await flushPromises()

    expect(list).toHaveBeenCalledTimes(2)
  })

  it('performs no action on the top bar search click', async () => {
    mockCatalog()
    const list = vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="topbar-search"]').trigger('click')
    await flushPromises()

    expect(list).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-testid="notes-grid"]').exists()).toBe(true)
  })

  it('opens the shared hamburger drawer from the top bar menu button', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="topbar-menu"]').trigger('click')

    const menu = document.querySelector<HTMLElement>('[data-testid="account-menu"]')
    expect(menu).not.toBeNull()
    expect(menu?.textContent).toContain('Select Account')
    expect(menu?.querySelector('[data-testid="nyare-wordmark"]')).not.toBeNull()
    expect(menu?.querySelector('[data-testid="menu-profile-avatar"]')).not.toBeNull()

    wrapper.unmount()
  })

  it('navigates to select-account from the shared hamburger drawer', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="topbar-menu"]').trigger('click')
    const item = document.querySelector<HTMLElement>('[data-testid="select-account-item"]')
    expect(item).not.toBeNull()
    item?.click()
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith('/select-account')
    expect(wrapper.get('[data-testid="topbar-menu"]').attributes('aria-expanded')).toBe('false')
    await vi.waitFor(() => {
      expect(document.querySelector('[data-testid="account-menu"]')).toBeNull()
    })

    wrapper.unmount()
  })

  it('renders the bottom navigation with the notes tab active', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mount(NotesView, {
      global: {
        provide: {
          [routerKey]: { push: mockPush },
          [routeLocationKey]: { path: '/notes' },
        },
      },
    })
    await flushPromises()

    const tab = wrapper.get('nav[aria-label="Main navigation"]').get('[data-id="notes"]')
    expect(tab.attributes('data-active')).toBe('true')
    expect(tab.attributes('aria-current')).toBe('page')
  })

  it('navigates to the calendar from the bottom navigation', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mount(NotesView, {
      global: {
        provide: {
          [routerKey]: { push: mockPush },
          [routeLocationKey]: { path: '/notes' },
        },
      },
    })
    await flushPromises()

    await wrapper
      .get('nav[aria-label="Main navigation"]')
      .get('[data-id="calendar"]')
      .trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/calendar')
  })
})
