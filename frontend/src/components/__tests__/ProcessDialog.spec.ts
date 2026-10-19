import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ProcessDialog from '../ProcessDialog.vue'
import { useAcademicEvents } from '@/composables/useAcademicEvents'
import { useProcess } from '@/composables/useProcess'
import { useTasks } from '@/composables/useTasks'
import { resetAllCaches } from '@/composables/createCache'
import { academicEventsApi, studyPlannerApi, tasksApi } from '@/api'
import type { StreamProcessCallbacks } from '@/api'
import type {
  AcademicEventResponse,
  PlannerStatusResponse,
  ProcessSummaryResponse,
  TaskResponse,
} from '@/types/api'

const statusPayload: PlannerStatusResponse = {
  hasPendingNotes: true,
  dirtyNoteCount: 2,
  dirtyDates: ['2026-10-01', '2026-10-03'],
  courseNames: ['CS101'],
  pendingNotes: [
    { id: 'note-1', title: null, courseName: 'CS101', entryDate: '2026-10-01' },
    { id: 'note-2', title: 'Graph walkthrough', courseName: 'CS101', entryDate: '2026-10-03' },
  ],
}

const summaryPayload: ProcessSummaryResponse = {
  tasksCreated: 1,
  eventsCreated: 1,
  contextsCreated: 1,
  affectedCourseIds: [1],
}

const taskFixture: TaskResponse = {
  id: 'task-1',
  courseId: 1,
  noteId: 'note-1',
  title: 'Review trees',
  status: 'TODO',
  scheduledDate: '2026-10-20',
  createdAt: '',
  updatedAt: '',
}

const eventFixture: AcademicEventResponse = {
  id: 'event-1',
  courseId: 1,
  noteId: 'note-1',
  title: 'Midterm',
  deadline: '2026-10-22T09:00:00',
  createdAt: '',
}

function mountDialog(open = true) {
  const proc = useProcess()
  const wrapper = mount(ProcessDialog, { props: { open, proc } })
  return { wrapper, proc }
}

describe('ProcessDialog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // The composable state is module-level, so clear it to isolate each test.
    resetAllCaches()
    vi.spyOn(studyPlannerApi, 'status').mockResolvedValue(statusPayload)
  })

  it('shows the pending note details on open', async () => {
    // given
    const { wrapper } = mountDialog()
    await flushPromises()

    // then
    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.text()).toContain('Process pending notes?')
    expect(dialog.text()).toContain('CS101')
    expect(dialog.text()).toContain('Oct 1')
    expect(wrapper.find('[data-testid="process-confirm"]').exists()).toBe(true)
  })

  it('starts the run on confirm and shows the summary', async () => {
    // given
    const stream = vi
      .spyOn(studyPlannerApi, 'streamProcess')
      .mockImplementation(async (callbacks: StreamProcessCallbacks) => {
        callbacks.onInit?.(statusPayload)
        callbacks.onDone(summaryPayload)
      })
    const { wrapper } = mountDialog()
    await flushPromises()

    // when
    await wrapper.get('[data-testid="process-confirm"]').trigger('click')
    await flushPromises()

    // then
    expect(stream).toHaveBeenCalledTimes(1)
    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.text()).toContain('Process complete')
    expect(dialog.text()).toContain('1 tasks')
  })

  it('shows the per-date progress while the run is open', async () => {
    // given
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(
      (callbacks: StreamProcessCallbacks) =>
        new Promise<void>((resolve) => {
          callbacks.onInit?.(statusPayload)
          callbacks.onProgress?.({ date: '2026-10-01', index: 1, total: 2 })
          callbacks.signal?.addEventListener('abort', () => resolve())
        }),
    )
    const { wrapper } = mountDialog()
    await flushPromises()

    // when
    await wrapper.get('[data-testid="process-confirm"]').trigger('click')
    await flushPromises()

    // then
    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.text()).toContain('Processing notes')
    expect(dialog.text()).toContain('1 of 2')
  })

  it('marks the run stopped after Cancel run', async () => {
    // given
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(
      (callbacks: StreamProcessCallbacks) =>
        new Promise<void>((resolve) => {
          callbacks.onInit?.(statusPayload)
          callbacks.signal?.addEventListener('abort', () => resolve())
        }),
    )
    const { wrapper } = mountDialog()
    await flushPromises()

    // when
    await wrapper.get('[data-testid="process-confirm"]').trigger('click')
    await wrapper.get('[data-testid="process-cancel"]').trigger('click')
    await flushPromises()
    await vi.waitFor(() => expect(studyPlannerApi.status).toHaveBeenCalledTimes(2))

    // then
    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.text()).toContain('Process stopped')
    expect(dialog.text()).toContain('Pending notes stay unprocessed')
  })

  it('reveals the processed notes, tasks, and events on Show more', async () => {
    // given
    vi.spyOn(tasksApi, 'list').mockResolvedValue([taskFixture])
    vi.spyOn(academicEventsApi, 'list').mockResolvedValue([eventFixture])
    await useTasks().loadTasks()
    await useAcademicEvents().loadEvents()
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(
      async (callbacks: StreamProcessCallbacks) => {
        callbacks.onInit?.(statusPayload)
        callbacks.onDone(summaryPayload)
      },
    )
    const { wrapper } = mountDialog()
    await flushPromises()

    // when
    await wrapper.get('[data-testid="process-confirm"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="process-show-more"]').trigger('click')

    // then
    const details = wrapper.get('[data-testid="process-details"]')
    expect(details.text()).toContain('Untitled note')
    expect(details.text()).toContain('Graph walkthrough')
    expect(details.text()).toContain('Review trees')
    expect(details.text()).toContain('Midterm')
  })
})
