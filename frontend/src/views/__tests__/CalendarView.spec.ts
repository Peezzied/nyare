import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import type { AcademicEventResponse, TaskResponse } from '@/types/api'
import { toDateKey } from '@/utils/dayKey'
import CalendarView from '../CalendarView.vue'

const mocks = vi.hoisted(() => ({
  push: vi.fn<(route: unknown) => void>(),
  loadNotes: vi.fn<() => Promise<void>>(),
  loadCatalog: vi.fn<() => Promise<void>>(),
  loadTasks: vi.fn<() => Promise<void>>(),
  loadEvents: vi.fn<() => Promise<void>>(),
  updateStatus: vi.fn<(id: string, status: string) => Promise<TaskResponse>>(),
  // Shared stand-ins for the refs the container touches.
  tasks: { value: [] as TaskResponse[] },
  events: { value: [] as AcademicEventResponse[] },
  notes: {
    value: [] as {
      id: string
      title: string | null
      courseId?: number
      entryDate?: string
    }[],
  },
  courses: { value: [] as unknown[] },
  schedules: { value: [] as unknown[] },
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/api/tasks', () => ({
  tasksApi: { updateStatus: mocks.updateStatus },
}))
vi.mock('@/composables/useTasks', async () => {
  const { ref } = await import('vue')
  mocks.tasks = ref<TaskResponse[]>([])
  return { useTasks: () => ({ tasks: mocks.tasks, loadTasks: mocks.loadTasks }) }
})
vi.mock('@/composables/useAcademicEvents', async () => {
  const { ref } = await import('vue')
  mocks.events = ref<AcademicEventResponse[]>([])
  return { useAcademicEvents: () => ({ events: mocks.events, loadEvents: mocks.loadEvents }) }
})
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
  props: { untimedItems: { type: Array, default: () => [] } },
  emits: ['select-course', 'select-untimed'],
  template: '<div />',
})

const DaySwiperStub = defineComponent({
  name: 'DaySwiper',
  props: { selectedDate: { type: Date, default: () => new Date() } },
  template: '<div><slot :date="selectedDate" /></div>',
})

const EventDetailModalStub = defineComponent({
  name: 'EventDetailModal',
  props: { isOpen: Boolean, originRect: Object, item: Object },
  emits: ['close', 'open-note', 'add-note', 'complete-task'],
  template: '<div />',
})

function mountContainer() {
  return mount(CalendarView, {
    global: {
      renderStubDefaultSlot: true,
      stubs: {
        DayViewHeader: true,
        BurgerMenu: true,
        DaySwiper: DaySwiperStub,
        WeekCalendar: true,
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
  mocks.tasks.value = [OPEN_TASK]
  mocks.events.value = []
  mocks.loadTasks.mockResolvedValue(undefined)
  mocks.loadEvents.mockResolvedValue(undefined)
  mocks.loadNotes.mockResolvedValue(undefined)
  mocks.loadCatalog.mockResolvedValue(undefined)
  mocks.notes.value = [{ id: 'note-1', title: 'Lecture 7: Self-Balancing Trees' }]
})

describe('CalendarView detail', () => {
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
      notes: [{ id: 'note-1', title: 'Lecture 7: Self-Balancing Trees' }],
      task: { id: 'task-1', completed: false },
    })
  })

  it('builds the class detail with same-day linked notes', async () => {
    mocks.notes.value = [
      { id: 'note-1', title: 'Lecture 7', courseId: 1, entryDate: '2026-10-22' },
      { id: 'note-2', title: 'Older lecture', courseId: 1, entryDate: '2026-10-15' },
    ]
    const wrapper = mountContainer()
    await flushPromises()

    wrapper.findComponent(ScheduleCalendarStub).vm.$emit(
      'select-course',
      {
        id: '1',
        courseId: 1,
        title: 'CS 201 - Data Structures & Algorithms',
        start: '2026-10-22 09:00',
        end: '2026-10-22 10:30',
        detail: '',
      },
      null,
    )
    await nextTick()

    expect(wrapper.findComponent(EventDetailModalStub).props('item')).toMatchObject({
      kind: 'class',
      entryDate: '2026-10-22',
      notes: [{ id: 'note-1', title: 'Lecture 7' }],
    })
  })

  it('opens a new note prefilled with the class course and day on add-note', async () => {
    const wrapper = mountContainer()
    await flushPromises()

    wrapper.findComponent(ScheduleCalendarStub).vm.$emit(
      'select-course',
      {
        id: '1',
        courseId: 1,
        title: 'CS 201 - Data Structures & Algorithms',
        start: '2026-10-22 09:00',
        end: '2026-10-22 10:30',
        detail: '',
      },
      null,
    )
    await nextTick()

    wrapper.findComponent(EventDetailModalStub).vm.$emit('add-note')
    await nextTick()

    expect(mocks.push).toHaveBeenCalledWith({
      name: 'note-new',
      query: { courseId: 1, entryDate: '2026-10-22' },
    })
    expect(wrapper.findComponent(EventDetailModalStub).props('isOpen')).toBe(false)
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
    expect(mocks.loadTasks).toHaveBeenCalledTimes(1)
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

  it('shows an alert with retry when the calendar data fails to load', async () => {
    mocks.loadTasks.mockRejectedValue(new Error('Tasks failed to load'))
    const wrapper = mountContainer()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Tasks failed to load')

    mocks.loadTasks.mockResolvedValue(undefined)
    const retry = wrapper.findAll('button').find((b) => b.text() === 'Retry')
    await retry?.trigger('click')
    await flushPromises()

    expect(mocks.loadTasks).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('shows a new untimed item when the shared tasks cache changes after mount', async () => {
    const wrapper = mountContainer()
    await flushPromises()

    mocks.tasks.value = [
      ...mocks.tasks.value,
      {
        ...OPEN_TASK,
        id: 'task-2',
        title: 'Review graph proofs',
        scheduledDate: toDateKey(new Date()),
      },
    ]
    await nextTick()

    expect(wrapper.findComponent(ScheduleCalendarStub).props('untimedItems')).toContainEqual(
      expect.objectContaining({ id: 'task-2', title: 'Review graph proofs' }),
    )
  })
})
