import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import TodoView from '../TodoView.vue'
import TaskContainerModal from '@/components/tasks/TaskContainerModal.vue'
import TaskRow from '@/components/TaskRow.vue'
import { coursesApi, schedulesApi, tasksApi } from '@/api'
import { useCatalog } from '@/composables/useCatalog'
import { useTasks } from '@/composables/useTasks'
import { useToasts } from '@/composables/useToasts'
import type { TaskResponse } from '@/types/api'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn<() => Promise<void>>() }),
}))

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
  return mount(TodoView)
}

describe('TodoView FAB', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
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
    expect(fab.classes()).toContain('bg-primary')
    expect(fab.classes()).toContain('rounded-2xl')
    expect(fab.classes()).toContain('h-14')
    expect(fab.classes()).toContain('w-14')
    expect(fab.classes()).toContain('right-4')
    expect(fab.classes()).toContain('bottom-4')
    expect(fab.find('svg').exists()).toBe(true)
  })

  it('captures the FAB rect and opens the create modal on tap', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="tasks-fab"]').trigger('click')

    const modal = wrapper.findComponent(TaskContainerModal)
    expect(modal.props('isOpen')).toBe(true)
    expect(modal.props('taskId')).toBeNull()
    expect(modal.props('originRect')).not.toBeNull()
  })

  it('ignores a second tap while the container is open', async () => {
    const wrapper = mountView()
    await flushPromises()

    const fab = wrapper.get('[data-testid="tasks-fab"]')
    await fab.trigger('click')

    const modal = wrapper.findComponent(TaskContainerModal)
    const firstOrigin = modal.props('originRect')

    await fab.trigger('click')

    expect(modal.props('isOpen')).toBe(true)
    expect(modal.props('originRect')).toBe(firstOrigin)
  })
})

describe('TodoView row tap', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useCatalog().resetCatalog()
    useTasks().resetTasks()
    vi.spyOn(coursesApi, 'list').mockResolvedValue([
      { id: 1, name: 'CS 201', description: null, userId: 1 },
    ])
    vi.spyOn(schedulesApi, 'list').mockResolvedValue([])
    vi.spyOn(tasksApi, 'list').mockResolvedValue([rowTask])
  })

  it('opens the modal with the tapped task and its row rect', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.findComponent(TaskRow).trigger('click')

    const modal = wrapper.findComponent(TaskContainerModal)
    expect(modal.props('isOpen')).toBe(true)
    expect(modal.props('taskId')).toBe('task-row-1')
    expect(modal.props('originRect')).not.toBeNull()
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
    useCatalog().resetCatalog()
    useTasks().resetTasks()
    vi.spyOn(coursesApi, 'list').mockResolvedValue([
      { id: 1, name: 'CS 201', description: null, userId: 1 },
    ])
    vi.spyOn(schedulesApi, 'list').mockResolvedValue([])
    vi.spyOn(tasksApi, 'list').mockResolvedValue([rowTask])
  })

  it('keeps the scroll position and active filter after an open and dismiss cycle', async () => {
    const wrapper = mountView()
    await flushPromises()

    const scheduledTab = wrapper.findAll('[role="tab"]').find((tab) => tab.text() === 'Scheduled')
    await scheduledTab?.trigger('click')
    await nextTick()

    const list = wrapper.get('ul')
    const scrollEl = list.element as HTMLElement
    scrollEl.scrollTop = 240

    await wrapper.findComponent(TaskRow).trigger('click')
    await flushPromises()
    expect(wrapper.findComponent(TaskContainerModal).props('isOpen')).toBe(true)

    wrapper.findComponent(TaskContainerModal).vm.$emit('close')
    await flushPromises()

    expect(wrapper.findComponent(TaskContainerModal).props('isOpen')).toBe(false)
    expect(scrollEl.scrollTop).toBe(240)
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Scheduled')
  })
})
