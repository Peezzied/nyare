import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, ref, toValue } from 'vue'
import { DOMWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import ManageCoursesView from '../ManageCoursesView.vue'
import AppHeader from '@/components/AppHeader.vue'
import CourseEditorDrawer from '@/components/CourseEditorDrawer.vue'
import { provideShellHeader } from '@/composables/useShellHeader'
import { useToasts } from '@/composables/useToasts'
import type { ToastKind } from '@/composables/useToasts'
import { COURSE_PALETTE_24, getCourseColor } from '@/utils/courseColors'
import { coursesApi, schedulesApi } from '@/api'
import { ApiError } from '@/api/client'
import type { CourseEditor } from '@/composables/useCourseEditor'
import type { CourseResponse, ScheduleResponse } from '@/types/api'

const mockPush = vi.fn<(to: unknown) => Promise<void>>(() => Promise.resolve())
let routeLeaveGuard: ((to: { fullPath: string }) => boolean) | null = null

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  onBeforeRouteLeave: (cb: (to: { fullPath: string }) => boolean) => {
    routeLeaveGuard = cb
  },
}))

vi.mock('@/api', () => ({
  coursesApi: {
    create: vi.fn<(request: unknown) => Promise<CourseResponse>>(),
    update: vi.fn<(id: number, request: unknown) => Promise<CourseResponse>>(),
    delete: vi.fn<(id: number) => Promise<void>>(),
    archive: vi.fn<(id: number) => Promise<CourseResponse>>(),
    archiveAll: vi.fn<() => Promise<CourseResponse[]>>(),
    unarchiveMany: vi.fn<(ids: number[]) => Promise<CourseResponse[]>>(),
  },
  schedulesApi: {
    create: vi.fn<(request: unknown) => Promise<ScheduleResponse>>(),
    update: vi.fn<(id: number, request: unknown) => Promise<ScheduleResponse>>(),
    delete: vi.fn<(id: number) => Promise<void>>(),
  },
}))

const mockCourses = ref<CourseResponse[]>([])
const mockSchedules = ref<ScheduleResponse[]>([])
const mockLoadCatalog = vi.fn<() => Promise<void>>()

// Apply helpers mutate the fixture refs so tests see the catalog updates the
// real useCatalog would make.
vi.mock('@/composables/useCatalog', () => ({
  useCatalog: () => ({
    courses: mockCourses,
    schedules: mockSchedules,
    loadCatalog: mockLoadCatalog,
    // Mirrors the real resolver: a stored slug wins, else the derived color.
    courseColor: (courseId: number) => {
      const slug = mockCourses.value.find((c) => c.id === courseId)?.color
      return (
        (slug ? COURSE_PALETTE_24.find((c) => c.id === slug) : undefined) ??
        getCourseColor(courseId)
      )
    },
    deleteCourse: vi.fn<(id: number) => Promise<void>>(async (id: number) => {
      await coursesApi.delete(id)
      mockCourses.value = mockCourses.value.filter((c) => c.id !== id)
      mockSchedules.value = mockSchedules.value.filter((s) => s.courseId !== id)
    }),
    archiveCourse: vi.fn<(id: number) => Promise<void>>(async (id: number) => {
      await coursesApi.archive(id)
      mockCourses.value = mockCourses.value.filter((c) => c.id !== id)
      mockSchedules.value = mockSchedules.value.filter((s) => s.courseId !== id)
    }),
    archiveAllCourses: vi.fn<() => Promise<number[]>>(async () => {
      const archived = await coursesApi.archiveAll()
      for (const course of archived) {
        mockCourses.value = mockCourses.value.filter((c) => c.id !== course.id)
        mockSchedules.value = mockSchedules.value.filter((s) => s.courseId !== course.id)
      }
      return archived.map((course) => course.id)
    }),
    unarchiveCourses: vi.fn<(ids: number[]) => Promise<void>>(async (ids: number[]) => {
      const restored = await coursesApi.unarchiveMany(ids)
      const byId = new Map(mockCourses.value.map((c) => [c.id, c]))
      for (const course of restored) {
        byId.set(course.id, course)
      }
      mockCourses.value = [...byId.values()].sort((a, b) => a.id - b.id)
    }),
    applyCourseCreated: vi.fn<(course: CourseResponse) => void>((course: CourseResponse) => {
      mockCourses.value = [...mockCourses.value, course]
    }),
    applyCourseUpdated: vi.fn<(course: CourseResponse) => void>((course: CourseResponse) => {
      mockCourses.value = mockCourses.value.map((c) => (c.id === course.id ? course : c))
    }),
    applyCourseDeleted: vi.fn<(id: number) => void>((id: number) => {
      mockCourses.value = mockCourses.value.filter((c) => c.id !== id)
      mockSchedules.value = mockSchedules.value.filter((s) => s.courseId !== id)
    }),
    applyScheduleCreated: vi.fn<(schedule: ScheduleResponse) => void>(
      (schedule: ScheduleResponse) => {
        mockSchedules.value = [...mockSchedules.value, schedule]
      },
    ),
    applyScheduleUpdated: vi.fn<(schedule: ScheduleResponse) => void>(
      (schedule: ScheduleResponse) => {
        mockSchedules.value = mockSchedules.value.map((s) => (s.id === schedule.id ? schedule : s))
      },
    ),
    applyScheduleDeleted: vi.fn<(id: number) => void>((id: number) => {
      mockSchedules.value = mockSchedules.value.filter((s) => s.id !== id)
    }),
  }),
}))

// The editor drawer portals to document.body; unmounting removes its nodes.
enableAutoUnmount(afterEach)

// ManageCoursesView contributes its top bar through the shared shell header, so
// it renders inside AppShell in the real app. This harness stands in for the
// shell chrome.
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
        h(ManageCoursesView),
      ])
  },
})

interface ExposedManageCoursesView {
  addingCourse: boolean
  editingCourse: CourseResponse | null
  deletingCourse: CourseResponse | null
  archivingCourse: CourseResponse | null
  archiveAllOpen: boolean
  editingEditor: CourseEditor | null
  editorOpen: boolean
}

/** Titles of the toasts currently on the shared shelf, optionally one kind. */
function toastTitles(kind?: ToastKind): string[] {
  return useToasts()
    .toasts.value.filter((t) => !kind || t.kind === kind)
    .map((t) => t.title)
}

const algebra: CourseResponse = { id: 1, name: 'Algebra', description: null, userId: 1 }
const biology: CourseResponse = { id: 2, name: 'Biology', description: null, userId: 1 }
const chemistry: CourseResponse = { id: 3, name: 'Chemistry', description: null, userId: 1 }

const algebraMonday: ScheduleResponse = {
  id: 11,
  courseId: 1,
  day: 'MONDAY',
  startTime: '09:00:00',
  endTime: '10:30:00',
}

function mountView() {
  return mount(ShellHarness)
}

function viewVm(wrapper: ReturnType<typeof mountView>) {
  return wrapper.findComponent(ManageCoursesView).vm as unknown as ExposedManageCoursesView
}

async function openEditor(wrapper: ReturnType<typeof mountView>, index = 0) {
  await wrapper.findAll('[data-testid="manage-course-edit"]')[index]!.trigger('click')
  await flushPromises()
}

/** The drawer portals to document.body, so its DOM lives outside the wrapper. */
function drawerBody() {
  return new DOMWrapper(document.body)
}

/** Finds a button by its text inside the view (the discard dialog stays inline). */
function viewButton(wrapper: ReturnType<typeof mountView>, label: string) {
  return wrapper.findAll('button').find((b) => b.text() === label)
}

describe('ManageCoursesView', () => {
  let nextScheduleId = 100
  let nextCourseId = 50

  beforeEach(() => {
    vi.clearAllMocks()
    useToasts().toasts.value.splice(0)
    mockCourses.value = []
    mockSchedules.value = []
    routeLeaveGuard = null
    mockLoadCatalog.mockResolvedValue(undefined)
    nextScheduleId = 100
    nextCourseId = 50
    vi.mocked(coursesApi.create).mockImplementation(
      (request) =>
        Promise.resolve({
          id: nextCourseId++,
          description: null,
          userId: 1,
          ...(request as object),
        }) as Promise<CourseResponse>,
    )
    vi.mocked(coursesApi.delete).mockResolvedValue(undefined)
    vi.mocked(coursesApi.archiveAll).mockResolvedValue([])
    vi.mocked(coursesApi.unarchiveMany).mockResolvedValue([])
    vi.mocked(coursesApi.update).mockImplementation(
      (id, request) => Promise.resolve({ id, ...(request as object) }) as Promise<CourseResponse>,
    )
    vi.mocked(schedulesApi.create).mockImplementation(
      (request) =>
        Promise.resolve({
          id: nextScheduleId++,
          ...(request as object),
        }) as Promise<ScheduleResponse>,
    )
    vi.mocked(schedulesApi.update).mockImplementation(
      (id, request) => Promise.resolve({ id, ...(request as object) }) as Promise<ScheduleResponse>,
    )
    vi.mocked(schedulesApi.delete).mockResolvedValue(undefined)
  })

  it('lists every course with its color dot and name', async () => {
    mockCourses.value = [algebra, biology]
    mockSchedules.value = [
      { id: 13, courseId: 2, day: 'WEDNESDAY', startTime: '11:00:00', endTime: '12:00:00' },
    ]

    const wrapper = mountView()
    await flushPromises()

    const cards = wrapper.findAll('[data-testid="manage-course-card"]')
    expect(cards).toHaveLength(2)
    expect(cards[0]!.text()).toContain('Algebra')
    expect(cards[1]!.text()).toContain('Biology')

    const dot = cards[0]!.get('span[style]')
    expect(dot.attributes('style')).toContain('background-color')
    expect(getCourseColor(1).solid).toBe('#E67C73')
  })

  it('shows class times in weekday order with start and end times', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [
      { id: 11, courseId: 1, day: 'THURSDAY', startTime: '13:00:00', endTime: '14:30:00' },
      { id: 12, courseId: 1, day: 'MONDAY', startTime: '09:00:00', endTime: '10:30:00' },
    ]

    const wrapper = mountView()
    await flushPromises()

    const rows = wrapper.findAll('[data-testid="manage-course-time"]')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.text()).toContain('Mon')
    expect(rows[0]!.text()).toContain('09:00–10:30')
    expect(rows[1]!.text()).toContain('Thu')
    expect(rows[1]!.text()).toContain('13:00–14:30')
  })

  it('shows a "No class times" label for a course without schedules', async () => {
    mockCourses.value = [chemistry]

    const wrapper = mountView()
    await flushPromises()

    const card = wrapper.get('[data-testid="manage-course-card"]')
    expect(card.text()).toContain('Chemistry')
    expect(card.text()).toContain('No class times')
  })

  it('shows the empty state with an add action when the student has no courses', async () => {
    const wrapper = mountView()
    await flushPromises()

    const empty = wrapper.get('[data-testid="manage-empty-state"]')
    expect(empty.text()).toContain('No courses yet')
    expect(wrapper.find('[data-testid="manage-course-card"]').exists()).toBe(false)

    await empty.get('button').trigger('click')
    expect(viewVm(wrapper).addingCourse).toBe(true)
  })

  it('sets the editing course when the edit button is tapped', async () => {
    mockCourses.value = [algebra, biology]

    const wrapper = mountView()
    await flushPromises()

    const editButtons = wrapper.findAll('[data-testid="manage-course-edit"]')
    expect(editButtons).toHaveLength(2)
    await editButtons[1]!.trigger('click')

    expect(viewVm(wrapper).editingCourse?.id).toBe(2)
    expect(viewVm(wrapper).editingCourse?.name).toBe('Biology')
  })

  it('sets the deleting course when the delete button is tapped', async () => {
    mockCourses.value = [algebra]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="manage-course-delete"]').trigger('click')
    expect(viewVm(wrapper).deletingCourse?.id).toBe(1)
  })

  it('routes back to the calendar and exposes the header add action', async () => {
    mockCourses.value = [algebra]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="manage-courses-back"]').trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ name: 'calendar' })

    await wrapper.get('[data-testid="manage-add-course"]').trigger('click')
    expect(viewVm(wrapper).addingCourse).toBe(true)
  })

  it('shows an error state with retry and a toast when the catalog load fails', async () => {
    mockLoadCatalog.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mountView()
    await flushPromises()

    expect(toastTitles('error')).toContain('Courses failed to load.')
    const errorBox = wrapper.get('[data-testid="manage-courses-error"]')

    mockCourses.value = [algebra]
    mockLoadCatalog.mockResolvedValue(undefined)
    await errorBox.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="manage-course-card"]').exists()).toBe(true)
    expect(mockLoadCatalog).toHaveBeenCalledTimes(2)
  })

  it('opens the editor drawer pre-filled with the saved name and class times', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    const drawer = drawerBody()
    expect(
      (drawer.get<HTMLInputElement>('#course-name-input').element as HTMLInputElement).value,
    ).toBe('Algebra')
    expect(drawer.get('button[aria-label="MONDAY"]').attributes('aria-pressed')).toBe('true')
    expect(drawer.find('[data-testid="color-toggle"]').exists()).toBe(true)

    const editor = viewVm(wrapper).editingEditor
    expect(editor?.persistedId).toBe(1)
    expect(editor?.blocks).toHaveLength(1)
    expect(editor?.blocks[0]?.selectedDays).toEqual(['MONDAY'])
    expect(editor?.blocks[0]?.startTime).toBe('09:00:00')
    expect(editor?.blocks[0]?.endTime).toBe('10:30:00')
  })

  it('saves an edited class time through schedulesApi.update and applies it to the catalog', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]
    vi.mocked(schedulesApi.update).mockResolvedValue({
      id: 11,
      courseId: 1,
      day: 'TUESDAY',
      startTime: '13:00',
      endTime: '14:30',
    })

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    const drawer = drawerBody()
    await drawer.get('button[aria-label="MONDAY"]').trigger('click')
    await drawer.get('button[aria-label="TUESDAY"]').trigger('click')
    const times = drawer.findAll('input[type="time"]')
    await times[0]!.setValue('13:00')
    await times[1]!.setValue('14:30')
    await drawer.get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(schedulesApi.update).toHaveBeenCalledWith(11, {
      courseId: 1,
      day: 'TUESDAY',
      startTime: '13:00',
      endTime: '14:30',
    })
    expect(schedulesApi.create).not.toHaveBeenCalled()
    expect(schedulesApi.delete).not.toHaveBeenCalled()
    expect(coursesApi.update).not.toHaveBeenCalled()
    expect(mockSchedules.value).toEqual([
      { id: 11, courseId: 1, day: 'TUESDAY', startTime: '13:00', endTime: '14:30' },
    ])
    expect(toastTitles('success')).toContain('Course updated.')
    expect(viewVm(wrapper).editingCourse).toBeNull()
    expect(drawerBody().find('#course-name-input').exists()).toBe(false)
  })

  it('creates a class time through schedulesApi.create for an added block', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]
    vi.mocked(schedulesApi.create).mockResolvedValue({
      id: 12,
      courseId: 1,
      day: 'WEDNESDAY',
      startTime: '14:00',
      endTime: '15:30',
    })

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    const drawer = drawerBody()
    await drawer.get('[data-testid="add-another-time"]').trigger('click')
    await flushPromises()

    const cards = drawer.findAll('[data-testid="time-block-card"]')
    expect(cards).toHaveLength(2)
    await cards[1]!.get('button[aria-label="WEDNESDAY"]').trigger('click')
    const times = cards[1]!.findAll('input[type="time"]')
    await times[0]!.setValue('14:00')
    await times[1]!.setValue('15:30')

    await drawer.get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(schedulesApi.create).toHaveBeenCalledWith({
      courseId: 1,
      day: 'WEDNESDAY',
      startTime: '14:00',
      endTime: '15:30',
    })
    expect(schedulesApi.update).not.toHaveBeenCalled()
    expect(schedulesApi.delete).not.toHaveBeenCalled()
    expect(mockSchedules.value.some((s) => s.id === 12)).toBe(true)
    expect(toastTitles('success')).toContain('Course updated.')
  })

  it('deletes removed class times through schedulesApi.delete on save', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [
      algebraMonday,
      { id: 12, courseId: 1, day: 'THURSDAY', startTime: '13:00:00', endTime: '14:30:00' },
    ]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    const drawer = drawerBody()
    const cards = drawer.findAll('[data-testid="time-block-card"]')
    expect(cards).toHaveLength(2)
    await cards[1]!.get('[aria-label="Delete time block"]').trigger('click')
    await drawer.get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(schedulesApi.delete).toHaveBeenCalledWith(12)
    expect(schedulesApi.update).not.toHaveBeenCalled()
    expect(schedulesApi.create).not.toHaveBeenCalled()
    expect(mockSchedules.value).toEqual([algebraMonday])
    expect(toastTitles('success')).toContain('Course updated.')
  })

  it('saves a course after its last class time is removed', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    const drawer = drawerBody()
    await drawer.get('[aria-label="Delete time block"]').trigger('click')
    await flushPromises()
    expect(drawer.findAll('[data-testid="time-block-card"]')).toHaveLength(0)

    await drawer.get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(schedulesApi.delete).toHaveBeenCalledWith(11)
    expect(mockSchedules.value).toEqual([])
    expect(wrapper.get('[data-testid="manage-course-card"]').text()).toContain('No class times')
  })

  it('blocks the save when a start time is not before its end time', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    const drawer = drawerBody()
    const times = drawer.findAll('input[type="time"]')
    await times[1]!.setValue('08:00')
    await flushPromises()

    expect(drawer.get('[data-testid="save-course"]').attributes('disabled')).toBeDefined()

    // The disabled button still guards a programmatic save.
    wrapper.findComponent(CourseEditorDrawer).vm.$emit('save')
    await flushPromises()

    expect(toastTitles('error').some((t) => t.includes('end time after its start time'))).toBe(true)
    expect(drawer.get('[role="alert"]').text()).toBe('End time must be after start time.')
    expect(schedulesApi.update).not.toHaveBeenCalled()
    expect(schedulesApi.create).not.toHaveBeenCalled()
    expect(schedulesApi.delete).not.toHaveBeenCalled()
    expect(viewVm(wrapper).editingCourse?.id).toBe(1)
  })

  it('blocks the save when a class time clashes with another course', async () => {
    mockCourses.value = [algebra, biology]
    mockSchedules.value = [
      algebraMonday,
      { id: 21, courseId: 2, day: 'MONDAY', startTime: '09:30:00', endTime: '11:00:00' },
    ]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    await drawerBody().get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(toastTitles('error')).toContain('A class time clashes with Biology on MONDAY.')
    expect(coursesApi.update).not.toHaveBeenCalled()
    expect(schedulesApi.update).not.toHaveBeenCalled()
    expect(viewVm(wrapper).editingCourse?.id).toBe(1)
  })

  it('keeps the drawer open with the entered values when the save fails', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]
    vi.mocked(schedulesApi.update).mockRejectedValue(new Error('Server exploded'))

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    const drawer = drawerBody()
    const times = drawer.findAll('input[type="time"]')
    await times[1]!.setValue('11:00')
    await drawer.get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(toastTitles('error')).toContain('Server exploded')
    expect(viewVm(wrapper).editingCourse?.id).toBe(1)
    expect(viewVm(wrapper).editorOpen).toBe(true)
    expect(viewVm(wrapper).editingEditor?.blocks[0]?.endTime).toBe('11:00')
    expect(mockSchedules.value).toEqual([algebraMonday])
    expect(drawerBody().find('#course-name-input').exists()).toBe(true)
  })

  it('renames the course through coursesApi.update without touching class times', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]
    vi.mocked(coursesApi.update).mockResolvedValue({ ...algebra, name: 'Algebra II' })

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    expect(viewVm(wrapper).editingEditor?.persistedId).toBe(1)

    await drawerBody().get<HTMLInputElement>('#course-name-input').setValue('Algebra II')
    await drawerBody().get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(coursesApi.update).toHaveBeenCalledTimes(1)
    expect(coursesApi.update).toHaveBeenCalledWith(1, {
      name: 'Algebra II',
      color: 'flamingo',
    })
    expect(schedulesApi.update).not.toHaveBeenCalled()
    expect(schedulesApi.create).not.toHaveBeenCalled()
    expect(schedulesApi.delete).not.toHaveBeenCalled()
    expect(mockCourses.value[0]?.id).toBe(1)
    expect(mockCourses.value[0]?.name).toBe('Algebra II')
    expect(wrapper.get('[data-testid="manage-course-card"]').text()).toContain('Algebra II')
    expect(mockLoadCatalog).toHaveBeenCalledTimes(1)
  })

  it('keeps the stored description when the course is renamed', async () => {
    mockCourses.value = [{ ...algebra, description: 'Lecture course' }]
    mockSchedules.value = [algebraMonday]
    vi.mocked(coursesApi.update).mockResolvedValue({
      ...algebra,
      name: 'Algebra II',
      description: 'Lecture course',
    })

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    await drawerBody().get<HTMLInputElement>('#course-name-input').setValue('Algebra II')
    await drawerBody().get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(coursesApi.update).toHaveBeenCalledWith(1, {
      name: 'Algebra II',
      description: 'Lecture course',
      color: 'flamingo',
    })
  })

  it('colors the course card dot with the stored catalog color', async () => {
    mockCourses.value = [{ ...algebra, color: 'peacock' }]

    const wrapper = mountView()
    await flushPromises()

    const dot = wrapper.get('[data-testid="manage-course-card"]').get('span[style]')
    expect(dot.attributes('style')).toContain('background-color: rgb(3, 155, 229)')
  })

  it('seeds the editor from the stored color and sends a new pick on update', async () => {
    mockCourses.value = [{ ...algebra, color: 'peacock' }]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    expect(viewVm(wrapper).editingEditor?.colorId).toBe('peacock')

    const drawer = drawerBody()
    await drawer.get('[data-testid="color-toggle"]').trigger('click')
    await flushPromises()
    await drawer.get('[data-testid="color-swatch"][data-color-id="grape"]').trigger('click')
    await drawer.get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(coursesApi.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ name: 'Algebra', color: 'grape' }),
    )
    expect(mockCourses.value[0]?.color).toBe('grape')
    expect(toastTitles('success')).toContain('Course updated.')
  })

  it('sends the picked color when a new course is created', async () => {
    const wrapper = mountView()
    await flushPromises()
    await wrapper.get('[data-testid="manage-add-course"]').trigger('click')
    await flushPromises()

    const drawer = drawerBody()
    await drawer.get<HTMLInputElement>('#course-name-input').setValue('Music')
    await drawer.get('[data-testid="color-toggle"]').trigger('click')
    await flushPromises()
    await drawer.get('[data-testid="color-swatch"][data-color-id="peacock"]').trigger('click')
    await drawer.get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(coursesApi.create).toHaveBeenCalledWith({ name: 'Music', color: 'peacock' })
    expect(mockCourses.value[0]?.color).toBe('peacock')
    expect(toastTitles('success')).toContain('Course added.')
  })

  it('blocks the save when the course name is blank', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    const drawer = drawerBody()
    await drawer.get<HTMLInputElement>('#course-name-input').setValue(' ')
    await flushPromises()

    expect(drawer.get('[data-testid="save-course"]').attributes('disabled')).toBeDefined()

    // The disabled button still guards a programmatic save.
    wrapper.findComponent(CourseEditorDrawer).vm.$emit('save')
    await flushPromises()

    expect(toastTitles('error')).toContain('Enter a course name before saving.')
    expect(coursesApi.update).not.toHaveBeenCalled()
    expect(schedulesApi.update).not.toHaveBeenCalled()
    expect(schedulesApi.create).not.toHaveBeenCalled()
    expect(schedulesApi.delete).not.toHaveBeenCalled()
    expect(viewVm(wrapper).editingCourse?.id).toBe(1)
    expect(mockCourses.value[0]?.name).toBe('Algebra')
  })

  it('asks to discard unsaved edits and keeps them on keep editing', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    const drawer = drawerBody()
    await drawer.findAll('input[type="time"]')[1]!.setValue('11:00')
    await drawer.get('[aria-label="Close drawer"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Discard changes?')
    expect(viewVm(wrapper).editingCourse?.id).toBe(1)

    await viewButton(wrapper, 'Keep editing')!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Discard changes?')
    expect(viewVm(wrapper).editorOpen).toBe(true)
    expect(viewVm(wrapper).editingEditor?.blocks[0]?.endTime).toBe('11:00')
  })

  it('discards unsaved edits and closes the drawer on discard', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    const drawer = drawerBody()
    await drawer.findAll('input[type="time"]')[1]!.setValue('11:00')
    await drawer.get('[aria-label="Close drawer"]').trigger('click')
    await flushPromises()

    await viewButton(wrapper, 'Discard')!.trigger('click')
    await flushPromises()

    expect(viewVm(wrapper).editingCourse).toBeNull()
    expect(viewVm(wrapper).editorOpen).toBe(false)
    expect(drawerBody().find('#course-name-input').exists()).toBe(false)
    expect(schedulesApi.update).not.toHaveBeenCalled()
  })

  // The drawer lifts above the 4rem bottom chrome in partial mode but covers
  // it in full mode; a permanent lift leaves the nav bar showing underneath.
  it('covers the bottom bar in full mode and lifts above it in partial mode', async () => {
    mockCourses.value = [algebra]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    const lifted = 'data-[swipe-direction=down]:bottom-[calc(4rem+env(safe-area-inset-bottom))]'
    const content = () => drawerBody().get('[data-slot="drawer-content"]')

    expect(content().classes()).not.toContain(lifted)

    wrapper.findComponent(CourseEditorDrawer).vm.$emit('update:stage', 'partial')
    await flushPromises()

    expect(content().classes()).toContain(lifted)
  })

  // The drawer must stay mounted across the open -> closed transition so the
  // slide-out animation can run; unmounting cancels it (close snaps shut).
  it('keeps the drawer mounted through the close transition', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    await drawerBody().get('[aria-label="Close drawer"]').trigger('click')
    await flushPromises()

    const drawer = wrapper.findComponent(CourseEditorDrawer)
    expect(drawer.exists()).toBe(true)
    expect(drawer.props('open')).toBe(false)
  })

  it('drops a course deleted elsewhere only when the rename call answers 404', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]
    vi.mocked(coursesApi.update).mockRejectedValue(new ApiError(404, 'Course not found'))

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    await drawerBody().get<HTMLInputElement>('#course-name-input').setValue('Algebra II')
    await drawerBody().get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(toastTitles('error')).toContain('This course no longer exists.')
    expect(mockCourses.value).toEqual([])
    expect(mockSchedules.value).toEqual([])
    expect(viewVm(wrapper).editingCourse).toBeNull()
    expect(wrapper.find('[data-testid="manage-course-card"]').exists()).toBe(false)
  })

  it('evicts the course and closes the drawer when a schedule call answers 404', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]
    vi.mocked(schedulesApi.update).mockRejectedValue(new ApiError(404, 'Schedule not found'))

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)

    const drawer = drawerBody()
    await drawer.findAll('input[type="time"]')[1]!.setValue('11:00')
    await drawer.get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(toastTitles('error')).toContain('Schedule not found')
    expect(mockCourses.value).toEqual([])
    expect(mockSchedules.value).toEqual([])
    expect(viewVm(wrapper).editingCourse).toBeNull()
    expect(viewVm(wrapper).editorOpen).toBe(false)
    expect(wrapper.find('[data-testid="manage-course-card"]').exists()).toBe(false)
  })

  it('guards the back action behind the discard dialog when edits are unsaved', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)
    await drawerBody().findAll('input[type="time"]')[1]!.setValue('11:00')

    await wrapper.get('[data-testid="manage-courses-back"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Discard changes?')
    expect(mockPush).not.toHaveBeenCalled()

    await viewButton(wrapper, 'Discard')!.trigger('click')
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith({ name: 'calendar' })
    expect(viewVm(wrapper).editingCourse).toBeNull()
  })

  it('guards switching to another course behind the discard dialog when edits are unsaved', async () => {
    mockCourses.value = [algebra, biology]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)
    await drawerBody().findAll('input[type="time"]')[1]!.setValue('11:00')

    await wrapper.findAll('[data-testid="manage-course-edit"]')[1]!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Discard changes?')
    expect(viewVm(wrapper).editingCourse?.id).toBe(1)

    await viewButton(wrapper, 'Keep editing')!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Discard changes?')
    expect(viewVm(wrapper).editingCourse?.id).toBe(1)

    await wrapper.findAll('[data-testid="manage-course-edit"]')[1]!.trigger('click')
    await flushPromises()
    await viewButton(wrapper, 'Discard')!.trigger('click')
    await flushPromises()

    expect(viewVm(wrapper).editingCourse?.id).toBe(2)
    expect(viewVm(wrapper).editingEditor?.name).toBe('Biology')
  })

  it('guards the delete action behind the discard dialog when edits are unsaved', async () => {
    mockCourses.value = [algebra, biology]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)
    await drawerBody().findAll('input[type="time"]')[1]!.setValue('11:00')

    await wrapper.findAll('[data-testid="manage-course-delete"]')[1]!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Discard changes?')
    expect(viewVm(wrapper).deletingCourse).toBeNull()

    await viewButton(wrapper, 'Discard')!.trigger('click')
    await flushPromises()

    expect(viewVm(wrapper).deletingCourse?.id).toBe(2)
    expect(wrapper.text()).toContain('Delete course?')
  })

  it('guards the add-course action behind the discard dialog when edits are unsaved', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)
    await drawerBody().findAll('input[type="time"]')[1]!.setValue('11:00')

    await wrapper.get('[data-testid="manage-add-course"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Discard changes?')
    expect(viewVm(wrapper).addingCourse).toBe(false)

    await viewButton(wrapper, 'Discard')!.trigger('click')
    await flushPromises()

    expect(viewVm(wrapper).addingCourse).toBe(true)
  })

  it('cancels a route leave when edits are unsaved and navigates on discard', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)
    await drawerBody().findAll('input[type="time"]')[1]!.setValue('11:00')

    expect(routeLeaveGuard).not.toBeNull()
    expect(routeLeaveGuard!({ fullPath: '/calendar' })).toBe(false)
    await flushPromises()

    expect(wrapper.text()).toContain('Discard changes?')
    expect(mockPush).not.toHaveBeenCalled()

    await viewButton(wrapper, 'Discard')!.trigger('click')
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith('/calendar')
  })

  it('opens a blank editor without a color picker when add course is tapped', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="manage-add-course"]').trigger('click')
    await flushPromises()

    expect(viewVm(wrapper).addingCourse).toBe(true)
    expect(viewVm(wrapper).editingCourse).toBeNull()
    expect(viewVm(wrapper).editorOpen).toBe(true)

    const editor = viewVm(wrapper).editingEditor
    expect(editor?.name).toBe('')
    expect(editor?.persistedId).toBeUndefined()

    const drawer = drawerBody()
    expect(
      (drawer.get<HTMLInputElement>('#course-name-input').element as HTMLInputElement).value,
    ).toBe('')
    expect(drawer.find('[data-testid="color-toggle"]').exists()).toBe(true)
  })

  it('creates the course and then its class times in order on save', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]
    vi.mocked(coursesApi.create).mockResolvedValue({
      id: 7,
      name: 'Physics',
      description: null,
      userId: 1,
    })
    vi.mocked(schedulesApi.create).mockResolvedValue({
      id: 70,
      courseId: 7,
      day: 'TUESDAY',
      startTime: '14:00',
      endTime: '15:30',
    })

    const wrapper = mountView()
    await flushPromises()
    await wrapper.get('[data-testid="manage-add-course"]').trigger('click')
    await flushPromises()

    const drawer = drawerBody()
    await drawer.get<HTMLInputElement>('#course-name-input').setValue('Physics')
    await drawer.get('button[aria-label="TUESDAY"]').trigger('click')
    const times = drawer.findAll('input[type="time"]')
    await times[0]!.setValue('14:00')
    await times[1]!.setValue('15:30')
    await drawer.get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(coursesApi.create).toHaveBeenCalledTimes(1)
    expect(coursesApi.create).toHaveBeenCalledWith({ name: 'Physics', color: 'tomato' })
    expect(schedulesApi.create).toHaveBeenCalledWith({
      courseId: 7,
      day: 'TUESDAY',
      startTime: '14:00',
      endTime: '15:30',
    })
    const courseCallOrder = vi.mocked(coursesApi.create).mock.invocationCallOrder[0]!
    const scheduleCallOrder = vi.mocked(schedulesApi.create).mock.invocationCallOrder[0]!
    expect(courseCallOrder).toBeLessThan(scheduleCallOrder)

    expect(coursesApi.update).not.toHaveBeenCalled()
    expect(mockCourses.value).toContainEqual({
      id: 7,
      name: 'Physics',
      description: null,
      userId: 1,
    })
    expect(mockSchedules.value.some((s) => s.id === 70 && s.courseId === 7)).toBe(true)
    expect(wrapper.text()).toContain('Physics')
    expect(viewVm(wrapper).addingCourse).toBe(false)
    expect(viewVm(wrapper).editorOpen).toBe(false)
    expect(drawerBody().find('#course-name-input').exists()).toBe(false)
    expect(toastTitles('success')).toContain('Course added.')
  })

  it('creates a course without class times when the block stays blank', async () => {
    const wrapper = mountView()
    await flushPromises()
    await wrapper.get('[data-testid="manage-add-course"]').trigger('click')
    await flushPromises()

    const drawer = drawerBody()
    await drawer.get<HTMLInputElement>('#course-name-input').setValue('Art')
    await drawer.get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(coursesApi.create).toHaveBeenCalledWith({ name: 'Art', color: 'tomato' })
    expect(schedulesApi.create).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="manage-course-card"]').text()).toContain('No class times')
    expect(toastTitles('success')).toContain('Course added.')
  })

  it('keeps the drawer open with the entered values when the create fails', async () => {
    vi.mocked(coursesApi.create).mockRejectedValue(new Error('Create failed'))

    const wrapper = mountView()
    await flushPromises()
    await wrapper.get('[data-testid="manage-add-course"]').trigger('click')
    await flushPromises()

    const drawer = drawerBody()
    await drawer.get<HTMLInputElement>('#course-name-input').setValue('Art')
    await drawer.get('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    expect(toastTitles('error')).toContain('Create failed')
    expect(viewVm(wrapper).addingCourse).toBe(true)
    expect(viewVm(wrapper).editorOpen).toBe(true)
    expect(viewVm(wrapper).editingEditor?.name).toBe('Art')
    expect(mockCourses.value).toEqual([])
  })

  it('shows the cascade warning and deletes the course on confirm', async () => {
    mockCourses.value = [algebra, biology]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('[data-testid="manage-course-delete"]')[0]!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Delete course?')
    expect(wrapper.text()).toContain(
      'This deletes Algebra and all its notes, tasks, events, and class times.',
    )

    await viewButton(wrapper, 'Delete')!.trigger('click')
    await flushPromises()

    expect(coursesApi.delete).toHaveBeenCalledTimes(1)
    expect(coursesApi.delete).toHaveBeenCalledWith(1)
    expect(mockCourses.value).toEqual([biology])
    expect(mockSchedules.value).toEqual([])
    expect(viewVm(wrapper).deletingCourse).toBeNull()
    expect(wrapper.findAll('[data-testid="manage-course-card"]')).toHaveLength(1)
    expect(toastTitles('success')).toContain('Course deleted.')
  })

  it('keeps the course when the student cancels the delete', async () => {
    mockCourses.value = [algebra]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="manage-course-delete"]').trigger('click')
    await flushPromises()
    expect(viewVm(wrapper).deletingCourse?.id).toBe(1)

    await viewButton(wrapper, 'Keep course')!.trigger('click')
    await flushPromises()

    expect(coursesApi.delete).not.toHaveBeenCalled()
    expect(viewVm(wrapper).deletingCourse).toBeNull()
    expect(wrapper.get('[data-testid="manage-course-card"]').text()).toContain('Algebra')
  })

  it('keeps the course and shows an error when the delete fails', async () => {
    mockCourses.value = [algebra]
    vi.mocked(coursesApi.delete).mockRejectedValue(new Error('Delete failed'))

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="manage-course-delete"]').trigger('click')
    await flushPromises()
    await viewButton(wrapper, 'Delete')!.trigger('click')
    await flushPromises()

    expect(toastTitles('error')).toContain('Delete failed')
    expect(viewVm(wrapper).deletingCourse).toBeNull()
    expect(wrapper.get('[data-testid="manage-course-card"]').text()).toContain('Algebra')
    expect(mockCourses.value).toEqual([algebra])
  })

  it('closes the editor when the student deletes the course it edits', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()
    await openEditor(wrapper)
    expect(viewVm(wrapper).editingCourse?.id).toBe(1)

    await wrapper.get('[data-testid="manage-course-delete"]').trigger('click')
    await flushPromises()
    await viewButton(wrapper, 'Delete')!.trigger('click')
    await flushPromises()

    expect(coursesApi.delete).toHaveBeenCalledWith(1)
    expect(viewVm(wrapper).editingCourse).toBeNull()
    expect(viewVm(wrapper).editorOpen).toBe(false)
    expect(drawerBody().find('#course-name-input').exists()).toBe(false)
  })

  it('opens the archive confirm dialog when the archive button is tapped', async () => {
    mockCourses.value = [algebra]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="manage-course-archive"]').trigger('click')
    await flushPromises()

    expect(viewVm(wrapper).archivingCourse?.id).toBe(1)
    expect(wrapper.text()).toContain('Archive course?')
    expect(wrapper.text()).toContain(
      'Archive Algebra? Its notes, tasks, events, and class times leave your active views.',
    )
    expect(coursesApi.archive).not.toHaveBeenCalled()
  })

  it('archives the course and removes it from the list on confirm', async () => {
    mockCourses.value = [algebra, biology]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('[data-testid="manage-course-archive"]')[0]!.trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="manage-archive-confirm"]').trigger('click')
    await flushPromises()

    expect(coursesApi.archive).toHaveBeenCalledTimes(1)
    expect(coursesApi.archive).toHaveBeenCalledWith(1)
    expect(mockCourses.value).toEqual([biology])
    expect(mockSchedules.value).toEqual([])
    expect(viewVm(wrapper).archivingCourse).toBeNull()
    expect(wrapper.findAll('[data-testid="manage-course-card"]')).toHaveLength(1)
    expect(toastTitles('success')).toContain('Course archived.')
  })

  it('keeps the course and calls nothing when the student cancels the archive', async () => {
    mockCourses.value = [algebra]
    mockSchedules.value = [algebraMonday]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="manage-course-archive"]').trigger('click')
    await flushPromises()
    expect(viewVm(wrapper).archivingCourse?.id).toBe(1)

    await wrapper.get('[data-testid="manage-archive-cancel"]').trigger('click')
    await flushPromises()

    expect(coursesApi.archive).not.toHaveBeenCalled()
    expect(viewVm(wrapper).archivingCourse).toBeNull()
    expect(mockCourses.value).toEqual([algebra])
    expect(mockSchedules.value).toEqual([algebraMonday])
    expect(wrapper.get('[data-testid="manage-course-card"]').text()).toContain('Algebra')
  })

  it('hides the archive-all action when the student has no courses', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="manage-archive-all"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="manage-empty-state"]').text()).toContain('No courses yet')
  })

  it('states the course count in the archive-all confirm dialog', async () => {
    mockCourses.value = [algebra, biology]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="manage-archive-all"]').trigger('click')
    await flushPromises()

    expect(viewVm(wrapper).archiveAllOpen).toBe(true)
    expect(wrapper.text()).toContain('Archive all courses?')
    expect(wrapper.text()).toContain(
      'Archive all 2 courses? Notes, tasks, events, and class times leave your active views.',
    )
    expect(coursesApi.archiveAll).not.toHaveBeenCalled()
  })

  it('keeps every course when the student cancels the archive-all dialog', async () => {
    mockCourses.value = [algebra, biology]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="manage-archive-all"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="manage-archive-all-cancel"]').trigger('click')
    await flushPromises()

    expect(coursesApi.archiveAll).not.toHaveBeenCalled()
    expect(viewVm(wrapper).archiveAllOpen).toBe(false)
    expect(mockCourses.value).toEqual([algebra, biology])
    expect(wrapper.findAll('[data-testid="manage-course-card"]')).toHaveLength(2)
  })

  it('archives every course and offers an Undo toast for 8 seconds on confirm', async () => {
    mockCourses.value = [algebra, biology]
    mockSchedules.value = [algebraMonday]
    const archivedAt = '2026-10-08T00:00:00'
    vi.mocked(coursesApi.archiveAll).mockResolvedValue([
      { ...algebra, archivedAt },
      { ...biology, archivedAt },
    ])

    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="manage-archive-all"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="manage-archive-all-confirm"]').trigger('click')
    await flushPromises()

    expect(coursesApi.archiveAll).toHaveBeenCalledTimes(1)
    expect(mockCourses.value).toEqual([])
    expect(mockSchedules.value).toEqual([])
    expect(viewVm(wrapper).archiveAllOpen).toBe(false)
    expect(wrapper.findAll('[data-testid="manage-course-card"]')).toHaveLength(0)
    expect(wrapper.get('[data-testid="manage-empty-state"]').text()).toContain('No courses yet')
    const undoToast = useToasts().toasts.value.find((t) => t.title === 'Archived 2 courses')
    expect(undoToast?.kind).toBe('info')
    expect(undoToast?.action?.label).toBe('Undo')
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 8000)
    timeoutSpy.mockRestore()
  })

  it('unarchives exactly the bulk-archived courses when the student selects Undo', async () => {
    mockCourses.value = [algebra, biology, chemistry]
    const archivedAt = '2026-10-08T00:00:00'
    vi.mocked(coursesApi.archiveAll).mockResolvedValue([
      { ...algebra, archivedAt },
      { ...biology, archivedAt },
    ])
    vi.mocked(coursesApi.unarchiveMany).mockResolvedValue([
      { ...algebra, archivedAt: null },
      { ...biology, archivedAt: null },
    ])

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="manage-archive-all"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="manage-archive-all-confirm"]').trigger('click')
    await flushPromises()

    expect(mockCourses.value).toEqual([chemistry])

    const undoToast = useToasts().toasts.value.find((t) => t.title === 'Archived 2 courses')
    expect(undoToast?.action?.label).toBe('Undo')
    undoToast?.action?.onClick()
    await flushPromises()

    expect(coursesApi.unarchiveMany).toHaveBeenCalledWith([1, 2])
    expect(mockCourses.value).toEqual([
      { ...algebra, archivedAt: null },
      { ...biology, archivedAt: null },
      chemistry,
    ])
    expect(toastTitles('success')).toContain('Courses restored.')
    expect(wrapper.findAll('[data-testid="manage-course-card"]')).toHaveLength(3)
  })

  it('keeps every course and shows an error toast when the bulk archive fails', async () => {
    mockCourses.value = [algebra, biology]
    mockSchedules.value = [algebraMonday]
    vi.mocked(coursesApi.archiveAll).mockRejectedValue(new Error('Archive failed'))

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="manage-archive-all"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="manage-archive-all-confirm"]').trigger('click')
    await flushPromises()

    expect(toastTitles('error')).toContain('Archive failed')
    expect(mockCourses.value).toEqual([algebra, biology])
    expect(mockSchedules.value).toEqual([algebraMonday])
    expect(wrapper.findAll('[data-testid="manage-course-card"]')).toHaveLength(2)
    expect(useToasts().toasts.value.some((t) => t.action !== undefined)).toBe(false)
  })

  it('dismisses the Undo toast when the student leaves the page', async () => {
    mockCourses.value = [algebra]
    vi.mocked(coursesApi.archiveAll).mockResolvedValue([
      { ...algebra, archivedAt: '2026-10-08T00:00:00' },
    ])

    const wrapper = mountView()
    await flushPromises()
    await wrapper.get('[data-testid="manage-archive-all"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="manage-archive-all-confirm"]').trigger('click')
    await flushPromises()

    expect(routeLeaveGuard).not.toBeNull()
    expect(routeLeaveGuard!({ fullPath: '/archive' })).toBe(true)
    expect(useToasts().toasts.value).toHaveLength(0)
  })
})
