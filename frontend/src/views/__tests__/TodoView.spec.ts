import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import { enableAutoUnmount, mount, flushPromises } from '@vue/test-utils'
import TodoView from '../TodoView.vue'
import TaskContainerModal from '@/components/tasks/TaskContainerModal.vue'
import TaskRow from '@/components/TaskRow.vue'
import { coursesApi, schedulesApi, tasksApi } from '@/api'
import { useCatalog } from '@/composables/useCatalog'
import { useTasks } from '@/composables/useTasks'
import { useToasts } from '@/composables/useToasts'
import type { TaskResponse } from '@/types/api'

const mockPush = vi.fn<(location: unknown) => Promise<void>>(() => Promise.resolve())
const mockReplace = vi.fn<(location: unknown) => Promise<void>>(() => Promise.resolve())
const mockBack = vi.fn<() => void>()
const mockRoute = reactive({
  name: 'tasks',
  params: {} as Record<string, string>,
  query: {} as Record<string, string>,
})

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useRoute: () => mockRoute,
}))

// Stale mounted views share the module-level morph store; unmount every
// wrapper so only the live view consumes the next tap-origin rect.
enableAutoUnmount(afterEach)

/** Resets the route stub and navigation spies between tests. */
function resetRoute() {
  mockPush.mockClear()
  mockReplace.mockClear()
  mockBack.mockClear()
  mockRoute.name = 'tasks'
  mockRoute.params = {}
  mockRoute.query = {}
}

const rowTask: TaskResponse = {
  id: 'task-row-1',
  courseId: 1,
  noteId: null,
  title: 'Study',
  description: null,
  scheduledDate: '2026-10-25',
  duration: null,
  status: 'TODO',
  createdAt: '2026-10-18T09:00:00Z',
  updatedAt: '2026-10-18T09:00:00Z',
}

function mountView() {
  return mount(TodoView, { global: { stubs: { 'transition-group': false } } })
}

/** ISO `YYYY-MM-DD` for the local day `offsetDays` from today. */
function isoDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

describe('TodoView FAB', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetRoute()
    useCatalog().resetCatalog()
    useTasks().resetTasks()
    vi.spyOn(coursesApi, 'list').mockResolvedValue([
      { id: 1, name: 'CS 201', description: null, userId: 1 },
    ])
    vi.spyOn(schedulesApi, 'list').mockResolvedValue([])
    vi.spyOn(tasksApi, 'list').mockResolvedValue([])
  })

  it('renders a 56px add task button with a Plus icon at the bottom right', async () => {
    const wrapper = mountView()
    await flushPromises()

    const fab = wrapper.get('[data-testid="tasks-fab"]')
    expect(fab.attributes('aria-label')).toBe('Add task')
    expect(fab.classes()).toContain('bg-[#00A4C8]')
    expect(fab.classes()).toContain('rounded-2xl')
    expect(fab.classes()).toContain('size-14')
    expect(fab.classes()).toContain('right-4')
    expect(fab.classes()).toContain('bottom-4')
    expect(fab.find('svg').exists()).toBe(true)
  })

  it('routes to task-new on tap and morphs from the FAB rect', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="tasks-fab"]').trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ name: 'task-new' })

    // The router resolves to task-new; the overlay opens and consumes the rect.
    mockRoute.name = 'task-new'
    await nextTick()

    const modal = wrapper.findComponent(TaskContainerModal)
    expect(modal.props('isOpen')).toBe(true)
    expect(modal.props('taskId')).toBeNull()
    expect(modal.props('originRect')).not.toBeNull()
  })

  it('ignores a second tap while the container is open', async () => {
    mockRoute.name = 'task-new'
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="tasks-fab"]').trigger('click')

    expect(mockPush).not.toHaveBeenCalled()
    expect(wrapper.findComponent(TaskContainerModal).props('isOpen')).toBe(true)
  })
})

describe('TodoView row tap', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetRoute()
    useCatalog().resetCatalog()
    useTasks().resetTasks()
    vi.spyOn(coursesApi, 'list').mockResolvedValue([
      { id: 1, name: 'CS 201', description: null, userId: 1 },
    ])
    vi.spyOn(schedulesApi, 'list').mockResolvedValue([])
    vi.spyOn(tasksApi, 'list').mockResolvedValue([rowTask])
  })

  it('routes to the task detail and morphs from the row rect', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findComponent(TaskRow).trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ name: 'task-detail', params: { id: 'task-row-1' } })

    // The router resolves to task-detail; the overlay opens and consumes the rect.
    mockRoute.name = 'task-detail'
    mockRoute.params = { id: 'task-row-1' }
    await nextTick()

    const modal = wrapper.findComponent(TaskContainerModal)
    expect(modal.props('isOpen')).toBe(true)
    expect(modal.props('taskId')).toBe('task-row-1')
    expect(modal.props('originRect')).not.toBeNull()
  })

  it('opens the modal on the task-detail route without a tap rect', async () => {
    mockRoute.name = 'task-detail'
    mockRoute.params = { id: 'task-row-1' }
    const wrapper = mountView()
    await flushPromises()

    const modal = wrapper.findComponent(TaskContainerModal)
    expect(modal.props('isOpen')).toBe(true)
    expect(modal.props('taskId')).toBe('task-row-1')
  })

  it('expands a partly visible row from its visible part', async () => {
    const wrapper = mountView()
    await flushPromises()

    const row = wrapper.findComponent(TaskRow)
    const el = row.element as HTMLElement
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 120,
      left: 16,
      width: 358,
      height: 40,
      right: 374,
      bottom: 160,
      x: 16,
      y: 120,
      toJSON: () => ({}),
    } as DOMRect)

    await row.trigger('click')
    mockRoute.name = 'task-detail'
    mockRoute.params = { id: 'task-row-1' }
    await nextTick()

    const modal = wrapper.findComponent(TaskContainerModal)
    expect(modal.props('originRect')).toEqual({
      top: 120,
      left: 16,
      width: 358,
      height: 40,
      borderRadius: '16px',
    })
  })

  it('does not open the modal when the status checkbox is toggled', async () => {
    const updateStatus = vi
      .spyOn(tasksApi, 'updateStatus')
      .mockResolvedValue({ ...rowTask, status: 'COMPLETED' })
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[role="checkbox"]').trigger('click')
    await flushPromises()

    expect(updateStatus).toHaveBeenCalledWith('task-row-1', 'COMPLETED')
    expect(mockPush).not.toHaveBeenCalled()
    expect(wrapper.findComponent(TaskContainerModal).props('isOpen')).toBe(false)
  })

  it('rolls back the status and pushes a toast when the update fails', async () => {
    vi.spyOn(tasksApi, 'updateStatus').mockRejectedValue(new Error('offline'))
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[role="checkbox"]').trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(TaskRow).props('task').status).toBe('TODO')
    expect(useToasts().toasts.value.some((t) => t.title === 'Could not update task')).toBe(true)
  })
})

describe('TodoView load failure', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetRoute()
    useCatalog().resetCatalog()
    useTasks().resetTasks()
    vi.spyOn(coursesApi, 'list').mockResolvedValue([])
    vi.spyOn(schedulesApi, 'list').mockResolvedValue([])
    vi.spyOn(tasksApi, 'list').mockRejectedValue(new Error('Tasks failed to load'))
  })

  it('shows an alert with a retry button instead of the empty lists', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Tasks failed to load')
    expect(wrapper.text()).not.toContain('No scheduled tasks')
    expect(wrapper.find('ul').exists()).toBe(false)

    vi.spyOn(tasksApi, 'list').mockResolvedValue([rowTask])
    const retry = wrapper.findAll('button').find((b) => b.text() === 'Retry')
    await retry?.trigger('click')
    await flushPromises()

    expect(tasksApi.list).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findComponent(TaskRow).exists()).toBe(true)
  })
})

describe('TodoView dismissal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetRoute()
    useCatalog().resetCatalog()
    useTasks().resetTasks()
    vi.spyOn(coursesApi, 'list').mockResolvedValue([
      { id: 1, name: 'CS 201', description: null, userId: 1 },
    ])
    vi.spyOn(schedulesApi, 'list').mockResolvedValue([])
    vi.spyOn(tasksApi, 'list').mockResolvedValue([rowTask])
  })

  it('keeps the scroll position and active filter after an open and dismiss cycle', async () => {
    mockRoute.name = 'task-detail'
    mockRoute.params = { id: 'task-row-1' }
    const wrapper = mountView()
    await flushPromises()

    const scheduledTab = wrapper.findAll('[role="tab"]').find((tab) => tab.text() === 'Scheduled')
    await scheduledTab?.trigger('click')
    await nextTick()

    const list = wrapper.get('ul')
    const scrollEl = list.element as HTMLElement
    scrollEl.scrollTop = 240

    expect(wrapper.findComponent(TaskContainerModal).props('isOpen')).toBe(true)

    // A close with no list entry behind it replaces the route with /tasks.
    wrapper.findComponent(TaskContainerModal).vm.$emit('close')
    await flushPromises()

    expect(mockReplace).toHaveBeenCalledWith({ name: 'tasks' })
    mockRoute.name = 'tasks'
    mockRoute.params = {}
    await nextTick()

    expect(wrapper.findComponent(TaskContainerModal).props('isOpen')).toBe(false)
    expect(scrollEl.scrollTop).toBe(240)
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Scheduled')
  })

  it('removes the row and pushes an undo toast when the modal reports a deletion', async () => {
    const wrapper = mountView()
    await flushPromises()

    wrapper.findComponent(TaskContainerModal).vm.$emit('deleted', rowTask)
    await nextTick()

    expect(wrapper.findComponent(TaskRow).exists()).toBe(false)
    const toast = useToasts().toasts.value.find((t) => t.title === 'Task deleted')
    expect(toast?.kind).toBe('info')
    expect(toast?.action?.label).toBe('Undo')
  })
})

describe('TodoView Overdue filter', () => {
  const pastDue = (
    id: string,
    offsetDays: number,
    status: TaskResponse['status'] = 'TODO',
  ): TaskResponse => ({ ...rowTask, id, scheduledDate: isoDate(offsetDays), status })

  beforeEach(() => {
    vi.restoreAllMocks()
    resetRoute()
    useCatalog().resetCatalog()
    useTasks().resetTasks()
    vi.spyOn(coursesApi, 'list').mockResolvedValue([
      { id: 1, name: 'CS 201', description: null, userId: 1 },
    ])
    vi.spyOn(schedulesApi, 'list').mockResolvedValue([])
    vi.spyOn(tasksApi, 'list').mockResolvedValue([
      pastDue('recent', -3),
      pastDue('today', 0),
      pastDue('done-past', -5, 'COMPLETED'),
      pastDue('future', 4),
      pastDue('oldest', -10),
    ])
  })

  it('lists past-due incomplete tasks oldest first', async () => {
    const wrapper = mountView()
    await flushPromises()

    const overdueTab = wrapper.findAll('[role="tab"]').find((tab) => tab.text() === 'Overdue')
    await overdueTab?.trigger('click')
    await nextTick()

    const ids = wrapper.findAllComponents(TaskRow).map((row) => row.props('task').id)
    expect(ids).toEqual(['oldest', 'recent'])
  })

  it('shows the empty state when nothing is past due', async () => {
    vi.spyOn(tasksApi, 'list').mockResolvedValue([pastDue('today', 0), pastDue('future', 4)])
    const wrapper = mountView()
    await flushPromises()

    const overdueTab = wrapper.findAll('[role="tab"]').find((tab) => tab.text() === 'Overdue')
    await overdueTab?.trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('No overdue tasks')
    expect(wrapper.findComponent(TaskRow).exists()).toBe(false)
  })
})
