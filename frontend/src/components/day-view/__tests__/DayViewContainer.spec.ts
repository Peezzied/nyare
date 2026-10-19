import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import type { AcademicEventResponse, TaskResponse } from '@/types/api'
import DayViewContainer from '../DayViewContainer.vue'

const mocks = vi.hoisted(() => ({
  push: vi.fn<(route: unknown) => void>(),
  loadNotes: vi.fn<() => Promise<void>>(),
  loadCatalog: vi.fn<() => Promise<void>>(),
  listTasks: vi.fn<() => Promise<TaskResponse[]>>(),
  listEvents: vi.fn<() => Promise<AcademicEventResponse[]>>(),
  updateStatus: vi.fn<(id: string, status: string) => Promise<TaskResponse>>(),
  // Read-only stand-ins for the refs the container touches.
  notes: { value: [] as { id: string; title: string | null }[] },
  courses: { value: [] as unknown[] },
  schedules: { value: [] as unknown[] },
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/api/tasks', () => ({
  tasksApi: { list: mocks.listTasks, updateStatus: mocks.updateStatus },
}))
vi.mock('@/api/academicEvents', () => ({ academicEventsApi: { list: mocks.listEvents } }))
vi.mock('@/composables/useCatalog', () => ({
  useCatalog: () => ({
    courses: mocks.courses,
    schedules: mocks.schedules,
    loadCatalog: mocks.loadCatalog,
  }),
}))
vi.mock('@/composables/useNotes', () => ({
  useNotes: () => ({ notes: mocks.notes, loadNotes: mocks.loadNotes }),
}))

const OPEN_TASK: TaskResponse = {
  id: 'task-1',
  courseId: 1,
  noteId: 'note-1',
  title: 'Implement AVL Tree Rotations',
  description: null,
  scheduledDate: '2026-10-14',
  duration: 'PT1H30M',
  status: 'TODO',
  planCategory: 'SCHEDULED',
  createdAt: '2026-10-05T12:00:00Z',
  updatedAt: '2026-10-05T12:00:00Z',
}

const ScheduleCalendarStub = defineComponent({
  name: 'ScheduleCalendar',
  emits: ['select-course', 'select-untimed'],
  template: '<div />',
})

const EventDetailModalStub = defineComponent({
  name: 'EventDetailModal',
  props: { isOpen: Boolean, originRect: Object, item: Object },
  emits: ['close', 'open-note', 'complete-task'],
  template: '<div />',
})

function mountContainer() {
  return mount(DayViewContainer, {
    global: {
      renderStubDefaultSlot: true,
      stubs: {
        DayViewHeader: true,
        BurgerMenu: true,
        DaySwiper: true,
        WeekCalendar: true,
        DayPeek: true,
        WeekPeek: true,
        NavigationBar: true,
        ScheduleCalendar: ScheduleCalendarStub,
        EventDetailModal: EventDetailModalStub,
      },
    },
  })
}

type Wrapper = ReturnType<typeof mountContainer>

async function openTaskDetail(wrapper: Wrapper) {
  wrapper.findComponent(ScheduleCalendarStub).vm.$emit(
    'select-untimed',
    {
      id: 'task-1',
      title: 'Implement AVL Tree Rotations',
      category: 'task',
      courseId: 1,
      completed: false,
      date: '2026-10-14',
    },
    null,
  )
  await nextTick()
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.listTasks.mockResolvedValue([OPEN_TASK])
  mocks.listEvents.mockResolvedValue([])
  mocks.loadNotes.mockResolvedValue(undefined)
  mocks.loadCatalog.mockResolvedValue(undefined)
  mocks.notes.value = [{ id: 'note-1', title: 'Lecture 7: Self-Balancing Trees' }]
})

describe('DayViewContainer detail', () => {
  it('builds the detail view for a tapped task chip (FR-006)', async () => {
    const wrapper = mountContainer()
    await flushPromises()

    const modal = wrapper.findComponent(EventDetailModalStub)
    expect(modal.props('isOpen')).toBe(false)

    await openTaskDetail(wrapper)

    expect(modal.props('isOpen')).toBe(true)
    expect(modal.props('item')).toMatchObject({
      kind: 'task',
      id: 'task-1',
      title: 'Implement AVL Tree Rotations',
      timeWindow: 'Oct 14, 2026',
      duration: '1.5hr',
      note: { id: 'note-1', title: 'Lecture 7: Self-Balancing Trees' },
      task: { id: 'task-1', completed: false },
    })
  })

  it('reads the notes from the shared cache instead of a second list call', async () => {
    mountContainer()
    await flushPromises()

    expect(mocks.loadNotes).toHaveBeenCalledTimes(1)
  })

  it('completes a task with one write and patches the cache (FR-010, FR-011)', async () => {
    mocks.updateStatus.mockResolvedValue({ ...OPEN_TASK, status: 'COMPLETED' })
    const wrapper = mountContainer()
    await flushPromises()
    await openTaskDetail(wrapper)

    wrapper.findComponent(EventDetailModalStub).vm.$emit('complete-task', 'task-1')
    await flushPromises()

    expect(mocks.updateStatus).toHaveBeenCalledTimes(1)
    expect(mocks.updateStatus).toHaveBeenCalledWith('task-1', 'COMPLETED')
    expect(mocks.listTasks).toHaveBeenCalledTimes(1)
    expect(wrapper.findComponent(EventDetailModalStub).props('item')).toMatchObject({
      task: { id: 'task-1', completed: true },
    })
  })

  it('keeps the prior state and shows an alert when the write fails', async () => {
    mocks.updateStatus.mockRejectedValue(new Error('offline'))
    const wrapper = mountContainer()
    await flushPromises()
    await openTaskDetail(wrapper)

    wrapper.findComponent(EventDetailModalStub).vm.$emit('complete-task', 'task-1')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('Could not complete')
    expect(wrapper.findComponent(EventDetailModalStub).props('item')).toMatchObject({
      task: { id: 'task-1', completed: false },
    })
    expect(wrapper.findComponent(EventDetailModalStub).props('isOpen')).toBe(true)
  })

  it('opens the note editor for a linked note (FR-009)', async () => {
    const wrapper = mountContainer()
    await flushPromises()
    await openTaskDetail(wrapper)

    wrapper.findComponent(EventDetailModalStub).vm.$emit('open-note', {
      id: 'note-1',
      title: 'Lecture 7: Self-Balancing Trees',
    })
    await nextTick()

    expect(mocks.push).toHaveBeenCalledWith({ name: 'note-edit', params: { id: 'note-1' } })
    expect(wrapper.findComponent(EventDetailModalStub).props('isOpen')).toBe(false)
  })
})
