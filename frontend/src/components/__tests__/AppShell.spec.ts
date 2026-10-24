import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, reactive, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import AppShell from '../AppShell.vue'
import type { ShellHeaderConfig } from '@/composables/useShellHeader'
import { academicEventsApi, notesApi, studyPlannerApi, tasksApi } from '@/api'
import { resetAllCaches } from '@/composables/createCache'
import { useNotes } from '@/composables/useNotes'
import { useNotifications } from '@/composables/useNotifications'
import type {
  NoteSummaryResponse,
  PlannerStatusResponse,
  ProcessSummaryResponse,
} from '@/types/api'
import { routerKey, routeLocationKey } from 'vue-router'

const mockPush = vi.fn<(path: string) => Promise<void>>(() => Promise.resolve())
const mockReplace = vi.fn<(loc: { query?: Record<string, string> }) => Promise<void>>(() =>
  Promise.resolve(),
)
const mockBack = vi.fn<() => void>()
const mockRoute = reactive({
  path: '/tasks',
  query: {} as Record<string, string>,
})

const stubHeaderConfig = ref<ShellHeaderConfig>({ title: 'Tasks' })

vi.mock('vue-router', async () => {
  const { shellHeaderKey } = await import('@/composables/useShellHeader')
  const { inject } = await import('vue')
  const routerKey = Symbol('routerKey')
  const routeLocationKey = Symbol('routeLocationKey')
  const routerStub = {
    push: (path: string) => mockPush(path),
    replace: (loc: { query?: Record<string, string> }) => mockReplace(loc),
    back: () => mockBack(),
  }
  return {
    useRouter: () => routerStub,
    useRoute: () => mockRoute,
    // The routed child configures the header, like a real view does.
    RouterView: defineComponent({
      name: 'StubView',
      setup() {
        const header = inject(shellHeaderKey, undefined)
        if (header) Object.assign(header, stubHeaderConfig.value)
        return () => h('div', { 'data-testid': 'stub-view' })
      },
    }),
    routerKey,
    routeLocationKey,
  }
})

function statusWith(dirtyNoteCount: number): PlannerStatusResponse {
  return {
    hasPendingNotes: dirtyNoteCount > 0,
    dirtyNoteCount,
    dirtyDates: [],
    courseNames: [],
    pendingNotes: [],
  }
}

const NoteEditorModalStub = defineComponent({
  name: 'NoteEditorModal',
  props: ['isOpen', 'noteId', 'originRect'],
  emits: ['close'],
  template: '<div data-testid="note-editor-modal-stub" />',
})

function mountShell() {
  return mount(AppShell, {
    global: {
      stubs: {
        NoteEditorModal: NoteEditorModalStub,
      },
      provide: {
        [routerKey]: { push: mockPush },
        [routeLocationKey]: { path: '/tasks' },
      },
    },
  })
}

describe('AppShell', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetAllCaches()
    mockPush.mockClear()
    mockReplace.mockClear()
    mockBack.mockClear()
    mockRoute.query = {}
    stubHeaderConfig.value = { title: 'Tasks' }
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
    // The shell's Process button refreshes the planner status on mount.
    vi.spyOn(studyPlannerApi, 'status').mockResolvedValue(statusWith(0))
  })

  it('renders the shared chrome around the routed view', async () => {
    const wrapper = mountShell()
    await flushPromises()

    expect(wrapper.find('[data-testid="app-header"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="app-header-title"]').text()).toBe('Tasks')
    expect(wrapper.find('[data-testid="stub-view"]').exists()).toBe(true)
    expect(wrapper.find('nav[aria-label="Main navigation"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="duckota-fab"]').exists()).toBe(true)
  })

  it('renders the default account menu and routes to select-account', async () => {
    const wrapper = mountShell()

    await wrapper.get('[data-testid="topbar-menu"]').trigger('click')
    await flushPromises()

    const item = document.querySelector<HTMLElement>('[data-testid="select-account-item"]')
    expect(item).not.toBeNull()
    expect(item!.textContent).toContain('Select Account')

    item!.click()
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith('/select-account')
  })

  it('navigates to the notes tab from the bottom navigation', async () => {
    const wrapper = mountShell()

    await wrapper.get('nav[aria-label="Main navigation"]').get('[data-id="notes"]').trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/notes')
  })

  it('renders view-provided header regions over the defaults', async () => {
    stubHeaderConfig.value = {
      title: 'Friday, Oct 17',
      left: () => h('button', { 'data-testid': 'custom-left' }),
      right: () => h('button', { 'data-testid': 'custom-right' }),
    }

    const wrapper = mountShell()
    await flushPromises()

    expect(wrapper.get('[data-testid="app-header-title"]').text()).toBe('Friday, Oct 17')
    expect(wrapper.find('[data-testid="custom-left"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="custom-right"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="topbar-menu"]').exists()).toBe(false)
  })

  it('shows the pending note count as a badge and starts Process on confirm', async () => {
    // given
    vi.spyOn(studyPlannerApi, 'status').mockResolvedValue(statusWith(2))
    const stream = vi.spyOn(studyPlannerApi, 'streamProcess').mockResolvedValue(undefined)

    const wrapper = mountShell()
    await flushPromises()

    const fab = wrapper.get('[data-testid="duckota-fab"]')
    expect(fab.text()).toContain('2')

    // when
    await fab.trigger('click')
    await flushPromises()

    // The click opens the confirmation dialog; it does not start the run.
    expect(stream).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="process-confirm"]').trigger('click')
    await flushPromises()

    // then
    expect(stream).toHaveBeenCalledTimes(1)
  })

  it('stays disabled when no notes are pending', async () => {
    // given
    const stream = vi.spyOn(studyPlannerApi, 'streamProcess').mockResolvedValue(undefined)

    const wrapper = mountShell()
    await flushPromises()

    const fab = wrapper.get('[data-testid="duckota-fab"]')
    expect(fab.attributes('disabled')).toBeDefined()

    // when
    await fab.trigger('click')

    // then
    expect(stream).not.toHaveBeenCalled()
  })

  it('refetches tasks and events for affected courses when the run finishes', async () => {
    // given
    vi.spyOn(studyPlannerApi, 'status').mockResolvedValue(statusWith(1))
    const taskList = vi.spyOn(tasksApi, 'list').mockResolvedValue([])
    const eventList = vi.spyOn(academicEventsApi, 'list').mockResolvedValue([])
    const summary: ProcessSummaryResponse = {
      tasksCreated: 2,
      eventsCreated: 1,
      contextsCreated: 1,
      affectedCourseIds: [7],
    }
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(async (callbacks) => {
      callbacks.onDone(summary)
    })

    const wrapper = mountShell()
    await flushPromises()

    // when
    await wrapper.get('[data-testid="duckota-fab"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="process-confirm"]').trigger('click')
    await flushPromises()

    // then
    expect(taskList).toHaveBeenCalledWith({ courseId: 7 })
    expect(eventList).toHaveBeenCalledWith({ courseId: 7 })
  })

  function noteSummary(courseId: number, title: string): NoteSummaryResponse {
    return {
      id: `note-${courseId}`,
      courseId,
      title,
      preview: 'draft',
      truncated: false,
      contentLength: 5,
      entryDate: '2026-10-20',
      createdAt: '2026-10-20T09:00:00Z',
      updatedAt: '2026-10-20T09:00:00Z',
    }
  }

  async function runProcessWithSummary(summary: ProcessSummaryResponse) {
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(async (callbacks) => {
      callbacks.onDone(summary)
    })
    const wrapper = mountShell()
    await flushPromises()
    await wrapper.get('[data-testid="duckota-fab"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="process-confirm"]').trigger('click')
    await flushPromises()
  }

  it('force-reloads notes when an affected course holds an untitled note', async () => {
    // given
    vi.spyOn(studyPlannerApi, 'status').mockResolvedValue(statusWith(1))
    vi.spyOn(tasksApi, 'list').mockResolvedValue([])
    vi.spyOn(academicEventsApi, 'list').mockResolvedValue([])
    const noteList = vi.spyOn(notesApi, 'list').mockResolvedValue([noteSummary(7, 'Untitled Note')])
    await useNotes().loadNotes()

    // when
    await runProcessWithSummary({
      tasksCreated: 1,
      eventsCreated: 0,
      contextsCreated: 0,
      affectedCourseIds: [7],
    })

    // then: the initial load plus the forced reload after the run
    expect(noteList).toHaveBeenCalledTimes(2)
  })

  it('keeps the notes cache when untitled notes sit outside affected courses', async () => {
    // given
    vi.spyOn(studyPlannerApi, 'status').mockResolvedValue(statusWith(1))
    vi.spyOn(tasksApi, 'list').mockResolvedValue([])
    vi.spyOn(academicEventsApi, 'list').mockResolvedValue([])
    const noteList = vi
      .spyOn(notesApi, 'list')
      .mockResolvedValue([noteSummary(9, 'Untitled Note'), noteSummary(7, 'Lecture 7')])
    await useNotes().loadNotes()

    // when
    await runProcessWithSummary({
      tasksCreated: 1,
      eventsCreated: 0,
      contextsCreated: 0,
      affectedCourseIds: [7],
    })

    // then: only the initial load ran
    expect(noteList).toHaveBeenCalledTimes(1)
  })

  it('reopens the run summary when the done bubble is tapped', async () => {
    // given
    vi.spyOn(studyPlannerApi, 'status').mockResolvedValue(statusWith(1))
    vi.spyOn(tasksApi, 'list').mockResolvedValue([])
    vi.spyOn(academicEventsApi, 'list').mockResolvedValue([])
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(async (callbacks) => {
      callbacks.onDone({ tasksCreated: 1, eventsCreated: 0, contextsCreated: 0 })
    })
    const wrapper = mountShell()
    await flushPromises()
    await wrapper.get('[data-testid="duckota-fab"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="process-confirm"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="process-close"]').trigger('click')
    await flushPromises()

    // when
    await wrapper.get('[data-testid="duckota-bubble"]').trigger('click')
    await flushPromises()

    // then
    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.text()).toContain('Process complete')
    expect(dialog.text()).toContain('1 tasks')
    expect(dialog.text()).not.toContain('Process pending notes?')
  })

  it('displays promoted tasks in done bubble when tasksPromoted is greater than zero', async () => {
    // given
    vi.spyOn(studyPlannerApi, 'status').mockResolvedValue(statusWith(1))
    vi.spyOn(tasksApi, 'list').mockResolvedValue([])
    vi.spyOn(academicEventsApi, 'list').mockResolvedValue([])
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(async (callbacks) => {
      callbacks.onDone({ tasksCreated: 2, tasksPromoted: 1, eventsCreated: 1, contextsCreated: 0 })
    })
    const wrapper = mountShell()
    await flushPromises()
    await wrapper.get('[data-testid="duckota-fab"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="process-confirm"]').trigger('click')
    await flushPromises()

    // then
    const bubble = wrapper.get('[data-testid="duckota-bubble"]')
    expect(bubble.text()).toContain('2 tasks (1 promoted)')
    wrapper.unmount()
  })

  it('opens a done record from the notification center on the summary', async () => {
    // given: a finished run record that maps to no live proc state
    vi.useFakeTimers()
    window.matchMedia = vi
      .fn<(query: string) => MediaQueryList>()
      .mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn<() => void>(),
        removeListener: vi.fn<() => void>(),
        addEventListener: vi.fn<() => void>(),
        removeEventListener: vi.fn<() => void>(),
        dispatchEvent: vi.fn<() => boolean>(),
      }))
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
    vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const notifications = useNotifications()
    const recId = notifications.openRecord()
    notifications.patchRecord(recId, {
      status: 'done',
      finishedAt: '2026-10-20T09:01:00Z',
      noteCount: 1,
      pendingNotes: [
        { id: 'note-1', title: 'Lecture', courseName: 'CS101', entryDate: '2026-10-20' },
      ],
      summary: { tasksCreated: 3, tasksPromoted: 1, eventsCreated: 1, contextsCreated: 0 },
    })
    const wrapper = mountShell()
    await flushPromises()

    // when
    await wrapper.get('[data-testid="notifications-button"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="notification-done"]').text()).toContain(
      '3 tasks (1 promoted)',
    )
    await wrapper.get('[data-testid="notification-done"]').trigger('click')
    await vi.advanceTimersByTimeAsync(240)
    await flushPromises()

    // then
    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.text()).toContain('Process complete')
    expect(dialog.text()).toContain('3 tasks (1 promoted)')
    vi.useRealTimers()
  })

  it('does not open the dialog for records without item lists', async () => {
    // given: cancelled, failed, and empty done records carry no lists to inspect
    vi.useFakeTimers()
    window.matchMedia = vi
      .fn<(query: string) => MediaQueryList>()
      .mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn<() => void>(),
        removeListener: vi.fn<() => void>(),
        addEventListener: vi.fn<() => void>(),
        removeEventListener: vi.fn<() => void>(),
        dispatchEvent: vi.fn<() => boolean>(),
      }))
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
    vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const notifications = useNotifications()
    const cancelled = notifications.openRecord()
    notifications.patchRecord(cancelled, {
      status: 'cancelled',
      finishedAt: '2026-10-20T09:01:00Z',
    })
    const failed = notifications.openRecord()
    notifications.patchRecord(failed, {
      status: 'error',
      finishedAt: '2026-10-20T09:02:00Z',
      error: 'Stream broke',
    })
    const emptyDone = notifications.openRecord()
    notifications.patchRecord(emptyDone, {
      status: 'done',
      finishedAt: '2026-10-20T09:03:00Z',
      pendingNotes: [],
      summary: { tasksCreated: 0, tasksPromoted: 0, eventsCreated: 0, contextsCreated: 0 },
    })
    const wrapper = mountShell()
    await flushPromises()

    // when
    await wrapper.get('[data-testid="notifications-button"]').trigger('click')
    await flushPromises()
    for (const testid of ['notification-cancelled', 'notification-error', 'notification-done']) {
      await wrapper.get(`[data-testid="${testid}"]`).trigger('click')
      await vi.advanceTimersByTimeAsync(240)
      await flushPromises()

      // then: the center stays open and no Process dialog appears
      expect(wrapper.find('[data-testid="process-close"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="notification-center"]').exists()).toBe(true)
    }
    vi.useRealTimers()
  })

  it('opens NoteEditorModal when route.query.note is present', async () => {
    mockRoute.query = { note: 'note-123' }
    const wrapper = mountShell()
    await flushPromises()

    const modal = wrapper.findComponent({ name: 'NoteEditorModal' })
    expect(modal.exists()).toBe(true)
    expect(modal.props('isOpen')).toBe(true)
    expect(modal.props('noteId')).toBe('note-123')
  })

  it('removes note query via router.replace when NoteEditorModal closes', async () => {
    mockRoute.query = { note: 'note-123', courseId: '1', entryDate: '2026-10-24' }
    const wrapper = mountShell()
    await flushPromises()

    const modal = wrapper.findComponent({ name: 'NoteEditorModal' })
    modal.vm.$emit('close')
    await flushPromises()

    expect(mockReplace).toHaveBeenCalledWith({ query: {} })
  })
})
