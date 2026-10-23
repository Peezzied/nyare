import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, reactive, toValue } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { routerKey, routeLocationKey } from 'vue-router'
import NotesView from '../NotesView.vue'
import NoteEditorModal from '@/components/notes/NoteEditorModal.vue'
import AppHeader from '@/components/AppHeader.vue'
import NavigationBar from '@/components/NavigationBar.vue'
import { coursesApi, schedulesApi, notesApi } from '@/api'
import { useCatalog } from '@/composables/useCatalog'
import { useNotes } from '@/composables/useNotes'
import { provideShellHeader } from '@/composables/useShellHeader'
import type { NoteSummaryResponse } from '@/types/api'

const mockPush = vi.fn<(path: string | { name: string; params?: { id: string } }) => Promise<void>>(
  () => Promise.resolve(),
)
const mockReplace = vi.fn<(location: { name: string }) => Promise<void>>(() => Promise.resolve())
const mockRoute = reactive({
  name: 'notes',
  params: {} as Record<string, string>,
  query: {} as Record<string, string>,
})

vi.mock('vue-router', () => {
  const routerKey = Symbol('routerKey')
  const routeLocationKey = Symbol('routeLocationKey')
  const routerStub = {
    push: (path: string | { name: string; params?: { id: string } }) => mockPush(path),
    replace: (location: { name: string }) => mockReplace(location),
  }
  return {
    useRouter: () => routerStub,
    useRoute: () => mockRoute,
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

// The modal hosts the async NoteEditor; stub it so tests skip the heavy editor.
const NoteEditorStub = defineComponent({
  name: 'NoteEditor',
  setup() {
    return () => h('div', { 'data-testid': 'note-editor-stub' })
  },
})

const globalStubs = { stubs: { NoteEditor: NoteEditorStub } }

// NotesView contributes its top bar through the shared shell header, so it renders
// inside AppShell in the real app. This harness stands in for the shell chrome.
const ShellHarness = defineComponent({
  setup() {
    const header = provideShellHeader()

    return () =>
      h('div', [
        h(
          AppHeader,
          { title: toValue(header.title) },
          {
            left: () => (header.left ? h(header.left) : null),
            right: () => (header.right ? h(header.right) : null),
          },
        ),
        h(NotesView),
        h(NavigationBar),
      ])
  },
})

function mountView(provide: Record<PropertyKey, unknown> = {}) {
  return mount(ShellHarness, { global: { ...globalStubs, provide } })
}

describe('NotesView', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubEnv('VITE_USE_MOCKS', 'false')
    useCatalog().resetCatalog()
    useNotes().resetNotes()
    mockPush.mockClear()
    mockReplace.mockClear()
    mockRoute.name = 'notes'
    mockRoute.params = {}
    mockRoute.query = {}
  })

  afterEach(() => {
    vi.useRealTimers()
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
    vi.stubEnv('VITE_USE_MOCKS', 'true')

    try {
      const wrapper = mountView()
      await flushPromises()

      expect(wrapper.findAll('[data-testid="note-card"]').length).toBe(7)
      expect(wrapper.find('[data-testid="note-image"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Limits recap')
      expect(wrapper.text()).toContain('Pipeline stages')
      expect(wrapper.find('[data-testid="notes-empty"]').exists()).toBe(false)
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('prefers real API notes over preview data', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.findAll('[data-testid="note-card"]').length).toBe(1)
    expect(wrapper.text()).toContain('Lecture 7')
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
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('renders error state with retry when load fails', async () => {
    mockCatalog()
    const list = vi.spyOn(notesApi, 'list').mockRejectedValue(new Error('Network error'))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="notes-error"]').exists()).toBe(true)

    list.mockResolvedValue([summary])
    await wrapper.find('[data-testid="notes-error"] button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="notes-grid"]').exists()).toBe(true)
  })

  it('opens a new note from the floating plus button', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    const fab = wrapper.get('[data-testid="notes-fab"]')

    expect(fab.classes()).toContain('bg-[#00A4C8]')
    expect(fab.classes()).toContain('rounded-2xl')

    await fab.trigger('click')

    expect(mockPush).toHaveBeenCalledWith({ name: 'note-new' })
  })

  it('routes to the note editor for the clicked note', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="note-card"]').trigger('click')
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith({ name: 'note-edit', params: { id: 'note-1' } })
  })

  it('opens the editor modal when the route targets a note', async () => {
    mockRoute.name = 'note-edit'
    mockRoute.params = { id: 'note-1' }
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    const modal = wrapper.findComponent(NoteEditorModal)
    expect(modal.props('isOpen')).toBe(true)
    expect(modal.props('noteId')).toBe('note-1')
    expect(wrapper.find('[data-testid="note-editor-modal"]').exists()).toBe(true)
  })

  it('ignores a second open trigger while the modal is open', async () => {
    mockRoute.name = 'note-edit'
    mockRoute.params = { id: 'note-1' }
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="note-card"]').trigger('click')
    await flushPromises()

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('returns to the notes list route when the modal closes', async () => {
    mockRoute.name = 'note-edit'
    mockRoute.params = { id: 'note-1' }
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    await wrapper.findComponent(NoteEditorModal).vm.$emit('close')
    await flushPromises()

    expect(mockReplace).toHaveBeenCalledWith({ name: 'notes' })
  })

  it('does not refetch the notes list when the editor saves', async () => {
    mockRoute.name = 'note-edit'
    mockRoute.params = { id: 'note-1' }
    mockCatalog()
    const list = vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    expect(list).toHaveBeenCalledTimes(1)

    await wrapper.findComponent(NoteEditorModal).vm.$emit('saved', 'note-1')
    await flushPromises()

    // saveNote already upserts the saved DTO into the cached list (FR-006).
    expect(list).toHaveBeenCalledTimes(1)
  })

  // Fake timers drive the 300 ms debounce in useServerSearch; under them
  // flushPromises (setImmediate) never resolves, so the test advances the clock.
  it('queries the server after 300 ms and restores the cached list when cleared', async () => {
    vi.useFakeTimers()
    mockCatalog()
    const matching: NoteSummaryResponse = { ...summary, id: 'note-9', title: 'Calculus drill' }
    const list = vi.spyOn(notesApi, 'list').mockImplementation((params) =>
      Promise.resolve(params?.q ? [matching] : [summary]),
    )

    const wrapper = mountView()
    await vi.advanceTimersByTimeAsync(0)

    const input = wrapper.get('input[aria-label="Search"]')
    await input.setValue('calc')
    await vi.advanceTimersByTimeAsync(300)

    expect(list).toHaveBeenCalledWith({ q: 'calc' })
    expect(wrapper.text()).toContain('Calculus drill')
    expect(wrapper.text()).not.toContain('Lecture 7')

    await input.setValue('')
    await vi.advanceTimersByTimeAsync(300)

    expect(wrapper.text()).toContain('Lecture 7')
  })

  it('opens the account menu from the top bar menu button', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="topbar-menu"]').trigger('click')
    await flushPromises()

    const menu = document.querySelector<HTMLElement>('[data-testid="account-menu"]')
    expect(menu).not.toBeNull()
    expect(menu?.querySelector('[data-testid="select-account-item"]')).not.toBeNull()

    wrapper.unmount()
  })

  it('navigates to select-account from the account menu', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="topbar-menu"]').trigger('click')
    await flushPromises()

    const item = document.querySelector<HTMLElement>('[data-testid="select-account-item"]')
    expect(item).not.toBeNull()
    item?.click()
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith('/select-account')
    await vi.waitFor(() => {
      expect(document.querySelector('[data-testid="account-menu"]')).toBeNull()
    })

    wrapper.unmount()
  })

  it('renders the bottom navigation with the notes tab active', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView({
      [routerKey]: { push: mockPush },
      [routeLocationKey]: { path: '/notes' },
    })
    await flushPromises()

    const tab = wrapper.get('nav[aria-label="Main navigation"]').get('[data-id="notes"]')
    expect(tab.attributes('data-active')).toBe('true')
    expect(tab.attributes('aria-current')).toBe('page')
  })

  it('navigates to the calendar from the bottom navigation', async () => {
    mockCatalog()
    vi.spyOn(notesApi, 'list').mockResolvedValue([summary])

    const wrapper = mountView({
      [routerKey]: { push: mockPush },
      [routeLocationKey]: { path: '/notes' },
    })
    await flushPromises()

    await wrapper
      .get('nav[aria-label="Main navigation"]')
      .get('[data-id="calendar"]')
      .trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/calendar')
  })
})
