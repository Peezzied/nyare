import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, nextTick, reactive } from 'vue'
import type { AcademicEventResponse, TaskResponse } from '@/types/api'
import { toDateKey } from '@/utils/dayKey'
import CalendarView from '../CalendarView.vue'

const mocks = vi.hoisted(() => ({
  push: vi.fn<(route: unknown) => void>(),
  replace: vi.fn<(route: unknown) => void>(),
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

const mockRoute = reactive({
  name: 'calendar',
  params: {} as Record<string, string>,
  query: {} as Record<string, string>,
})

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}))
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
  emits: ['close', 'open-note', 'add-note', 'open-task', 'complete-task'],
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

// The tap only pushes the `?item` route; the modal opens once the route lands.
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
  mockRoute.query = { item: 'task:task-1' }
  await nextTick()
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRoute.name = 'calendar'
  mockRoute.params = {}
  mockRoute.query = {}
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
    mocks.courses.value = [{ id: 1, name: 'CS 201' }]
    // 2026-10-22 is a Thursday, so the expander rebuilds the class DayEvent.
    mocks.schedules.value = [
      { id: 1, courseId: 1, day: 'THURSDAY', startTime: '09:00:00', endTime: '10:30:00' },
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
    mockRoute.query = { item: 'class:1:2026-10-22' }
    await nextTick()

    expect(wrapper.findComponent(EventDetailModalStub).props('item')).toMatchObject({
      kind: 'class',
      entryDate: '2026-10-22',
      notes: [{ id: 'note-1', title: 'Lecture 7' }],
    })
  })

  it('opens a new note prefilled with the class course and day on add-note', async () => {
    mocks.courses.value = [{ id: 1, name: 'CS 201' }]
    mocks.schedules.value = [
      { id: 1, courseId: 1, day: 'THURSDAY', startTime: '09:00:00', endTime: '10:30:00' },
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
    mockRoute.query = { item: 'class:1:2026-10-22' }
    await nextTick()

    wrapper.findComponent(EventDetailModalStub).vm.$emit('add-note')
    await nextTick()

    expect(mocks.replace).toHaveBeenCalledWith({
      name: 'note-new',
      query: { courseId: 1, entryDate: '2026-10-22' },
    })

    mockRoute.name = 'note-new'
    mockRoute.query = {}
    await nextTick()
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

    expect(mocks.replace).toHaveBeenCalledWith({ name: 'note-open', params: { id: 'note-1' } })

    // The detail stays open under the note route until the route itself changes.
    mockRoute.name = 'note-open'
    mockRoute.query = {}
    await nextTick()
    expect(wrapper.findComponent(EventDetailModalStub).props('isOpen')).toBe(false)
  })

  it('routes to the task detail route on open-task', async () => {
    const wrapper = mountContainer()
    await flushPromises()
    await openTaskDetail(wrapper)

    wrapper.findComponent(EventDetailModalStub).vm.$emit('open-task', 'task-1')
    await nextTick()

    expect(mocks.replace).toHaveBeenCalledWith({ name: 'task-detail', params: { id: 'task-1' } })

    mockRoute.name = 'task-detail'
    mockRoute.query = {}
    await nextTick()
    expect(wrapper.findComponent(EventDetailModalStub).props('isOpen')).toBe(false)
  })

  describe('route-driven detail', () => {
    it('pushes the item query route when a chip is tapped', async () => {
      const wrapper = mountContainer()
      await flushPromises()

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

      expect(mocks.push).toHaveBeenCalledWith({
        name: 'calendar',
        query: { item: 'task:task-1' },
      })
    })

    it('reopens the detail when the route returns to the item query', async () => {
      const wrapper = mountContainer()
      await flushPromises()
      await openTaskDetail(wrapper)
      expect(wrapper.findComponent(EventDetailModalStub).props('isOpen')).toBe(true)

      // Simulate the open-task handoff landing on the task route.
      mockRoute.name = 'task-detail'
      mockRoute.query = {}
      await nextTick()
      expect(wrapper.findComponent(EventDetailModalStub).props('isOpen')).toBe(false)

      // Back pops the task route; the item query below reopens the detail.
      mockRoute.name = 'calendar'
      mockRoute.query = { item: 'task:task-1' }
      await nextTick()
      expect(wrapper.findComponent(EventDetailModalStub).props('isOpen')).toBe(true)
    })

    it('clears the item entry on close', async () => {
      const wrapper = mountContainer()
      await flushPromises()
      await openTaskDetail(wrapper)

      wrapper.findComponent(EventDetailModalStub).vm.$emit('close')
      await nextTick()

      // The test environment has no real history back entry, so the fallback
      // strips the query instead of calling router.back().
      expect(mocks.replace).toHaveBeenCalledWith({ name: 'calendar' })
    })
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
