import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import TaskDetailPanel from '../TaskDetailPanel.vue'
import { Checkbox } from '@/components/ui/checkbox'
import DialogShell from '@/components/ui/DialogShell.vue'
import { ApiError, tasksApi } from '@/api'
import { toTaskRequest } from '@/utils/taskForm'
import { formatDuration } from '@/utils/taskUrgency'
import { getCourseColor } from '@/utils/courseColors'
import type { TaskRequest, TaskResponse, TaskStatus } from '@/types/api'

const tasksMock = vi.hoisted(() => ({
  tasks: [] as TaskResponse[],
  getTask: vi.fn<(id: string) => Promise<TaskResponse>>(),
  createTask: vi.fn<(request: TaskRequest) => Promise<TaskResponse>>(),
  updateTask: vi.fn<(id: string, request: TaskRequest) => Promise<TaskResponse>>(),
  updateTaskStatus: vi.fn<(id: string, status: TaskStatus) => Promise<TaskResponse>>(),
  deleteTask: vi.fn<(id: string) => Promise<void>>(),
}))

const catalogState = vi.hoisted(() => ({
  courses: [{ id: 1, name: 'CS 201' }] as { id: number; name: string; color?: string | null }[],
}))

vi.mock('@/composables/useTasks', () => ({
  useTasks: () => ({
    tasks: {
      get value() {
        return tasksMock.tasks
      },
    },
    loading: { value: false },
    error: { value: null },
    getTask: tasksMock.getTask,
    createTask: tasksMock.createTask,
    loadTasks: vi.fn<() => void>(),
    updateTask: tasksMock.updateTask,
    updateTaskStatus: tasksMock.updateTaskStatus,
    deleteTask: tasksMock.deleteTask,
    refetchForCourses: vi.fn<() => void>(),
    resetTasks: vi.fn<() => void>(),
  }),
}))

vi.mock('@/composables/useCatalog', async () => {
  const { ref } = await import('vue')
  const { COURSE_PALETTE_24, getCourseColor } = await import('@/constants/palette')
  return {
    useCatalog: () => ({
      courses: ref(catalogState.courses),
      schedules: ref([]),
      loaded: ref(true),
      loadCatalog: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      courseColor: (courseId: number | null) => {
        const slug = catalogState.courses.find((c) => c.id === courseId)?.color
        return (
          (slug ? COURSE_PALETTE_24.find((c) => c.id === slug) : undefined) ??
          getCourseColor(courseId ?? 0)
        )
      },
      applyCourseCreated: vi.fn<() => void>(),
      applyCourseDeleted: vi.fn<() => void>(),
      applyScheduleCreated: vi.fn<() => void>(),
      applyScheduleUpdated: vi.fn<() => void>(),
      applyScheduleDeleted: vi.fn<() => void>(),
      resetCatalog: vi.fn<() => void>(),
    }),
  }
})

const savedTask: TaskResponse = {
  id: 'task-1',
  courseId: 1,
  title: 'Study',
  description: null,
  scheduledDate: null,
  duration: null,
  status: 'TODO',
  createdAt: '2026-10-18T09:00:00Z',
  updatedAt: '2026-10-18T09:00:00Z',
}

function mountPanel(props: Partial<{ taskId: string | null }> = {}) {
  return mount(TaskDetailPanel, {
    props: { taskId: null, showContent: true, showControls: true, embedded: true, ...props },
  })
}

/**
 * Selects course 1 through the CoursePicker dialog. The dialog content
 * teleports to document.body, so the option query runs against the document.
 */
async function chooseCourseOne(wrapper: ReturnType<typeof mountPanel>) {
  await wrapper.get('[data-testid="task-course"]').trigger('click')
  await flushPromises()
  const option = document.body.querySelector<HTMLElement>('[data-testid="course-option-1"]')
  expect(option).not.toBeNull()
  option!.click()
  await flushPromises()
}

describe('TaskDetailPanel create mode', () => {
  beforeEach(() => {
    tasksMock.tasks = []
    tasksMock.createTask.mockReset()
    tasksMock.updateTaskStatus.mockReset()
    catalogState.courses = [{ id: 1, name: 'CS 201' }]
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clear teleported dialog content left in document.body between tests.
    document.body.innerHTML = ''
  })

  it('renders a blank form titled "New task"', () => {
    const wrapper = mountPanel({ taskId: null })

    expect(wrapper.text()).toContain('New task')
    expect((wrapper.get('[data-testid="task-title"]').element as HTMLTextAreaElement).value).toBe(
      '',
    )
    expect(wrapper.find('[data-testid="task-course"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="task-date"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="task-duration"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="task-description"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="task-section"]').attributes('aria-label')).toBe(
      'Plan section: Backlog',
    )
  })

  it('disables save and shows a field message when the title is blank', async () => {
    const wrapper = mountPanel({ taskId: null })

    await chooseCourseOne(wrapper)

    const save = wrapper.get('[data-testid="task-save"]')
    expect(save.attributes('disabled')).toBeDefined()
    await save.trigger('click')
    await flushPromises()

    expect(tasksMock.createTask).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="task-title-error"]').exists()).toBe(true)
  })

  it('disables save and shows a field message when the course is unset', async () => {
    const wrapper = mountPanel({ taskId: null })

    await wrapper.get('[data-testid="task-title"]').setValue('Study')

    const save = wrapper.get('[data-testid="task-save"]')
    expect(save.attributes('disabled')).toBeDefined()
    await save.trigger('click')
    await flushPromises()

    expect(tasksMock.createTask).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="task-course-error"]').exists()).toBe(true)
  })

  it('clears the field messages as the user fixes each field', async () => {
    const wrapper = mountPanel({ taskId: null })

    await wrapper.get('[data-testid="task-title"]').setValue('Study')
    expect(wrapper.find('[data-testid="task-course-error"]').exists()).toBe(true)

    await chooseCourseOne(wrapper)
    expect(wrapper.find('[data-testid="task-course-error"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="task-save"]').attributes('disabled')).toBeUndefined()

    await wrapper.get('[data-testid="task-title"]').setValue('')
    expect(wrapper.find('[data-testid="task-title-error"]').exists()).toBe(true)

    await wrapper.get('[data-testid="task-title"]').setValue('Study')
    expect(wrapper.find('[data-testid="task-title-error"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="task-save"]').attributes('disabled')).toBeUndefined()
  })

  it('explains that a course is required and blocks save when no courses exist', async () => {
    catalogState.courses = []
    const wrapper = mountPanel({ taskId: null })

    expect(wrapper.find('[data-testid="task-course-required"]').exists()).toBe(true)

    await wrapper.get('[data-testid="task-title"]').setValue('Study')

    const save = wrapper.get('[data-testid="task-save"]')
    expect(save.attributes('disabled')).toBeDefined()
    await save.trigger('click')
    await flushPromises()

    expect(tasksMock.createTask).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="task-course-error"]').exists()).toBe(true)
  })

  it('creates the task with toTaskRequest(form, "TODO") and emits close', async () => {
    tasksMock.createTask.mockResolvedValue(savedTask)
    const wrapper = mountPanel({ taskId: null })

    await wrapper.get('[data-testid="task-title"]').setValue('Study')
    await chooseCourseOne(wrapper)
    await wrapper.get('[data-testid="task-save"]').trigger('click')
    await flushPromises()

    expect(tasksMock.createTask).toHaveBeenCalledWith(
      toTaskRequest(
        { title: 'Study', courseId: 1, description: '', scheduledDate: '', durationMinutes: null },
        'TODO',
      ),
    )
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('keeps entered data and offers a retry when the save fails', async () => {
    tasksMock.createTask.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = mountPanel({ taskId: null })

    await wrapper.get('[data-testid="task-title"]').setValue('Study')
    await chooseCourseOne(wrapper)
    await wrapper.get('[data-testid="task-save"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="task-error"]').exists()).toBe(true)
    expect(wrapper.emitted('close')).toBeUndefined()
    expect((wrapper.get('[data-testid="task-title"]').element as HTMLTextAreaElement).value).toBe(
      'Study',
    )

    tasksMock.createTask.mockResolvedValueOnce(savedTask)
    await wrapper.get('[data-testid="task-error-retry"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})

describe('TaskDetailPanel view mode', () => {
  const viewTask: TaskResponse = {
    id: 'task-1',
    courseId: 1,
    noteId: 'note-9',
    title: 'Study',
    description: 'Read pages 10 to 20',
    scheduledDate: '2026-10-25',
    duration: 'PT1H30M',
    status: 'TODO',
    createdAt: '2026-10-18T09:00:00Z',
    updatedAt: '2026-10-18T09:00:00Z',
  }

  beforeEach(() => {
    tasksMock.tasks = [{ ...viewTask }]
    tasksMock.getTask.mockReset()
    tasksMock.getTask.mockImplementation(async (id) => {
      const cached = tasksMock.tasks.find((t) => t.id === id)
      if (!cached) {
        throw new ApiError(404, 'Not found')
      }
      return cached
    })
    tasksMock.createTask.mockReset()
    tasksMock.updateTask.mockReset()
    tasksMock.updateTaskStatus.mockReset()
    tasksMock.deleteTask.mockReset()
    catalogState.courses = [{ id: 1, name: 'CS 201' }]
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the saved task across the header, identity, plan, and description zones', async () => {
    const wrapper = mountPanel({ taskId: 'task-1' })
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Task')
    expect((wrapper.get('[data-testid="task-title"]').element as HTMLTextAreaElement).value).toBe(
      'Study',
    )

    const checkbox = wrapper.get('[data-testid="task-complete"]')
    expect(checkbox.attributes('aria-label')).toBe('Mark task as completed')
    expect(wrapper.get('[role="checkbox"]').attributes('data-state')).toBe('unchecked')

    const chip = wrapper.get('[data-testid="task-course-chip"]')
    expect(chip.text()).toContain('CS 201')
    const color = getCourseColor(1)
    const probe = document.createElement('span')
    probe.style.color = color.text
    probe.style.backgroundColor = color.badgeBg
    expect((chip.element as HTMLElement).style.color).toBe(probe.style.color)
    expect((chip.element as HTMLElement).style.backgroundColor).toBe(probe.style.backgroundColor)

    const dateTrigger = wrapper.get('[data-testid="task-date"]')
    expect(dateTrigger.attributes('aria-label')).toBe('Scheduled date')
    expect(dateTrigger.text()).toContain('Oct 25, 2026')
    expect((wrapper.get('[data-testid="task-duration"]').element as HTMLSelectElement).value).toBe(
      '90',
    )
    expect(wrapper.text()).toContain(formatDuration('PT1H30M'))
    expect(
      (wrapper.get('[data-testid="task-description"]').element as HTMLTextAreaElement).value,
    ).toBe('Read pages 10 to 20')
    expect(wrapper.get('[data-testid="task-section"]').attributes('aria-label')).toBe(
      'Plan section: Scheduled',
    )
  })

  it('renders a source note link only when the task has a noteId', async () => {
    const wrapper = mountPanel({ taskId: 'task-1' })
    await flushPromises()

    const link = wrapper.get('[data-testid="task-source-note"]')
    expect(link.text()).toContain('From a note')
    expect(link.attributes('href')).toBe('/notes/note-9')
    expect(link.find('svg').exists()).toBe(true)
  })

  it('hides the source note row when the task has no noteId', async () => {
    tasksMock.tasks = [{ ...viewTask, noteId: null }]
    const wrapper = mountPanel({ taskId: 'task-1' })
    await flushPromises()

    expect(wrapper.find('[data-testid="task-source-note"]').exists()).toBe(false)
  })

  it('emits missing when the task answers 404', async () => {
    tasksMock.tasks = []
    const wrapper = mountPanel({ taskId: 'gone' })
    await flushPromises()

    expect(wrapper.emitted('missing')).toHaveLength(1)
  })

  it('loads a task through getTask on a cache miss', async () => {
    tasksMock.tasks = []
    const directTask: TaskResponse = { ...viewTask, id: 'task-direct', title: 'Direct' }
    tasksMock.getTask.mockResolvedValue(directTask)
    const wrapper = mountPanel({ taskId: 'task-direct' })
    await flushPromises()

    expect(tasksMock.getTask).toHaveBeenCalledWith('task-direct')
    expect((wrapper.get('[data-testid="task-title"]').element as HTMLTextAreaElement).value).toBe(
      'Direct',
    )
  })

  it('toggles the status through updateTaskStatus and reflects the new state', async () => {
    tasksMock.updateTaskStatus.mockResolvedValue({ ...viewTask, status: 'COMPLETED' })
    const wrapper = mountPanel({ taskId: 'task-1' })
    await flushPromises()

    wrapper.findComponent(Checkbox).vm.$emit('update:modelValue', true)
    await flushPromises()

    expect(tasksMock.updateTaskStatus).toHaveBeenCalledWith('task-1', 'COMPLETED')
    expect(wrapper.get('[role="checkbox"]').attributes('data-state')).toBe('checked')
  })

  it('rolls the status back when updateTaskStatus fails', async () => {
    tasksMock.updateTaskStatus.mockRejectedValue(new Error('Network error'))
    const wrapper = mountPanel({ taskId: 'task-1' })
    await flushPromises()

    wrapper.findComponent(Checkbox).vm.$emit('update:modelValue', true)
    await flushPromises()

    expect(wrapper.get('[role="checkbox"]').attributes('data-state')).toBe('unchecked')
  })

  it('saves the complete request with the current status and shows the response', async () => {
    tasksMock.updateTask.mockImplementation(async (id, request) => {
      const saved: TaskResponse = {
        ...viewTask,
        title: request.title,
        description: request.description ?? null,
        scheduledDate: request.scheduledDate ?? null,
        duration: request.duration ?? null,
        status: request.status ?? viewTask.status,
      }
      tasksMock.tasks = tasksMock.tasks.map((t) => (t.id === id ? saved : t))
      return saved
    })
    const listSpy = vi.spyOn(tasksApi, 'list')
    const wrapper = mountPanel({ taskId: 'task-1' })
    await flushPromises()

    await wrapper.get('[data-testid="task-title"]').setValue('Study edited')
    await wrapper.get('[data-testid="task-save"]').trigger('click')
    await flushPromises()

    expect(tasksMock.updateTask).toHaveBeenCalledWith(
      'task-1',
      toTaskRequest(
        {
          title: 'Study edited',
          courseId: 1,
          description: 'Read pages 10 to 20',
          scheduledDate: '2026-10-25',
          durationMinutes: 90,
        },
        'TODO',
      ),
    )
    expect(listSpy).not.toHaveBeenCalled()
    expect(tasksMock.tasks[0]?.title).toBe('Study edited')
    expect((wrapper.get('[data-testid="task-title"]').element as HTMLTextAreaElement).value).toBe(
      'Study edited',
    )
    expect(wrapper.get('[data-testid="task-save"]').attributes('disabled')).toBeDefined()
  })

  it('carries the current status when the task is already completed', async () => {
    tasksMock.tasks = [{ ...viewTask, status: 'COMPLETED' }]
    tasksMock.updateTask.mockResolvedValue({
      ...viewTask,
      status: 'COMPLETED',
      title: 'Done study',
    })
    const wrapper = mountPanel({ taskId: 'task-1' })
    await flushPromises()

    await wrapper.get('[data-testid="task-title"]').setValue('Done study')
    await wrapper.get('[data-testid="task-save"]').trigger('click')
    await flushPromises()

    expect(tasksMock.updateTask).toHaveBeenCalledWith(
      'task-1',
      toTaskRequest(
        {
          title: 'Done study',
          courseId: 1,
          description: 'Read pages 10 to 20',
          scheduledDate: '2026-10-25',
          durationMinutes: 90,
        },
        'COMPLETED',
      ),
    )
  })

  it('shows the save action disabled until the form is dirty and valid', async () => {
    const wrapper = mountPanel({ taskId: 'task-1' })
    await flushPromises()

    const save = wrapper.get('[data-testid="task-save"]')
    expect(save.attributes('disabled')).toBeDefined()

    await wrapper.get('[data-testid="task-title"]').setValue('Study edited')
    expect(save.attributes('disabled')).toBeUndefined()

    await wrapper.get('[data-testid="task-title"]').setValue('Study')
    expect(save.attributes('disabled')).toBeDefined()
  })

  it('disables save and shows a field message when an edit clears the title', async () => {
    const wrapper = mountPanel({ taskId: 'task-1' })
    await flushPromises()

    await wrapper.get('[data-testid="task-title"]').setValue('')

    const save = wrapper.get('[data-testid="task-save"]')
    expect(save.attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="task-title-error"]').exists()).toBe(true)

    await save.trigger('click')
    await flushPromises()

    expect(tasksMock.updateTask).not.toHaveBeenCalled()
  })

  it('keeps entered data and shows a retry when the edit save fails', async () => {
    tasksMock.updateTask.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = mountPanel({ taskId: 'task-1' })
    await flushPromises()

    await wrapper.get('[data-testid="task-title"]').setValue('Study edited')
    await wrapper.get('[data-testid="task-save"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="task-error"]').exists()).toBe(true)
    expect(wrapper.emitted('close')).toBeUndefined()
    expect(wrapper.emitted('deleted')).toBeUndefined()
    expect((wrapper.get('[data-testid="task-title"]').element as HTMLTextAreaElement).value).toBe(
      'Study edited',
    )

    tasksMock.updateTask.mockResolvedValueOnce({ ...viewTask, title: 'Study edited' })
    await wrapper.get('[data-testid="task-error-retry"]').trigger('click')
    await flushPromises()

    expect(tasksMock.updateTask).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-testid="task-error"]').exists()).toBe(false)
  })

  it('confirms before deleting and emits deleted with the task payload', async () => {
    const wrapper = mountPanel({ taskId: 'task-1' })
    await flushPromises()

    expect(wrapper.find('[data-testid="task-delete-confirm"]').exists()).toBe(false)

    await wrapper.get('[data-testid="task-delete"]').trigger('click')
    await nextTick()

    expect(wrapper.findComponent(DialogShell).exists()).toBe(true)
    await wrapper.get('[data-testid="task-delete-confirm"]').trigger('click')
    await flushPromises()

    // The caller owns the deferred API delete behind the undo toast.
    expect(wrapper.emitted('deleted')?.[0]?.[0]).toEqual(viewTask)
    expect(tasksMock.deleteTask).not.toHaveBeenCalled()
  })
})

describe('TaskDetailPanel delete availability', () => {
  beforeEach(() => {
    tasksMock.tasks = []
    catalogState.courses = [{ id: 1, name: 'CS 201' }]
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not render the delete action in create mode', () => {
    const wrapper = mountPanel({ taskId: null })

    expect(wrapper.find('[data-testid="task-delete"]').exists()).toBe(false)
  })
})
