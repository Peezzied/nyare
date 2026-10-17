import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TodoView from '../TodoView.vue'
import { coursesApi, schedulesApi } from '@/api'
import { tasksApi } from '@/api/tasks'
import { useCatalog } from '@/composables/useCatalog'
import { routerKey, routeLocationKey } from 'vue-router'
import type { TaskResponse } from '@/types/api'

const task: TaskResponse = {
  id: 'task-1',
  courseId: 1,
  noteId: null,
  title: 'Read chapter 4',
  description: null,
  scheduledDate: null,
  duration: null,
  status: 'TODO',
  planCategory: null,
  createdAt: '2026-10-10T09:00:00Z',
  updatedAt: '2026-10-10T09:00:00Z',
}

const mockPush = vi.fn<(path: string) => Promise<void>>(() => Promise.resolve())

vi.mock('vue-router', () => {
  const routerKey = Symbol('routerKey')
  const routeLocationKey = Symbol('routeLocationKey')
  const routerStub = {
    push: (path: string) => mockPush(path),
  }
  return {
    useRouter: () => routerStub,
    routerKey,
    routeLocationKey,
  }
})

describe('TodoView', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useCatalog().resetCatalog()
  })

  function mountView(): ReturnType<typeof mount> {
    return mount(TodoView, {
      global: {
        provide: {
          [routerKey]: { push: mockPush },
          [routeLocationKey]: { path: '/tasks' },
        },
      },
    })
  }

  function mockData(): void {
    vi.spyOn(coursesApi, 'list').mockResolvedValue([
      { id: 1, name: 'CS 201', description: null, userId: 1 },
    ])
    vi.spyOn(schedulesApi, 'list').mockResolvedValue([])
    vi.spyOn(tasksApi, 'list').mockResolvedValue([task])
  }

  it('renders the bottom navigation with the tasks tab active', async () => {
    mockData()

    const wrapper = mountView()
    await flushPromises()

    const tab = wrapper.get('nav[aria-label="Main navigation"]').get('[data-id="tasks"]')
    expect(tab.attributes('data-active')).toBe('true')
    expect(tab.attributes('aria-current')).toBe('page')
  })

  it('navigates to the calendar from the bottom navigation', async () => {
    mockData()

    const wrapper = mountView()
    await flushPromises()

    await wrapper
      .get('nav[aria-label="Main navigation"]')
      .get('[data-id="calendar"]')
      .trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/calendar')
  })

  it('does not repeat the list fetch after bar navigation emulation', async () => {
    mockData()

    const wrapper = mountView()
    await flushPromises()

    const list = vi.mocked(tasksApi.list)
    await wrapper.get('nav[aria-label="Main navigation"]').get('[data-id="notes"]').trigger('click')

    expect(list).toHaveBeenCalledTimes(1)
  })
})
