import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { CourseResponse, DayOfWeek, ScheduleResponse, UserResponse } from '@/types/api'
import { coursesApi, schedulesApi } from '@/api'
import CreateScheduleView from '../CreateScheduleView.vue'
import { useAuth } from '@/composables/useAuth'
import { useOnboarding } from '@/composables/useOnboarding'
import { authApi } from '@/api'
import { useCourseDrafts } from '@/composables/useCourseDrafts'
import { createCourseEditor, type CourseEditor } from '@/composables/useCourseEditor'
import type { TimeBlockDraft } from '@/components/TimeBlockCard.vue'
import type { PendingSlot } from '@/utils/weekPreview'
import { toast } from 'vue-sonner'

vi.mock('vue-sonner', () => ({
  Toaster: {
    name: 'Toaster',
    template: '<div data-testid="sonner-toaster" />',
  },
  toast: {
    success: vi.fn<(message: string) => void>(),
    error: vi.fn<(message: string, options?: unknown) => void>(),
  },
}))

interface ExposedScheduleView {
  courseName: string
  stage: 'partial' | 'full'
  pendingSlot: PendingSlot | null
  hasUnsavedChanges: boolean
  blocks: TimeBlockDraft[]
  editors: CourseEditor[]
  activeEditorId: string
  isOpen: boolean
}

const mockCourses = ref<Partial<CourseResponse>[]>([])
const mockSchedules = ref<Partial<ScheduleResponse>[]>([])
const mockLoadCatalog = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
const mockDeleteCourse = vi.fn<(id: number) => Promise<void>>(async (id: number) => {
  mockCourses.value = mockCourses.value.filter((c) => c.id !== id)
  mockSchedules.value = mockSchedules.value.filter((s) => s.courseId !== id)
})

vi.mock('@/composables/useCatalog', () => ({
  useCatalog: () => ({
    courses: mockCourses,
    schedules: mockSchedules,
    loadCatalog: mockLoadCatalog,
    deleteCourse: mockDeleteCourse,
    applyCourseCreated: vi.fn<(course: unknown) => void>((course: unknown) => {
      mockCourses.value.push(course as Partial<CourseResponse>)
    }),
    applyCourseDeleted: vi.fn<(id: unknown) => void>((id: unknown) => {
      mockCourses.value = mockCourses.value.filter((c) => c.id !== id)
      mockSchedules.value = mockSchedules.value.filter((s) => s.courseId !== id)
    }),
    applyScheduleCreated: vi.fn<(schedule: unknown) => void>((schedule: unknown) => {
      mockSchedules.value.push(schedule as Partial<ScheduleResponse>)
    }),
  }),
}))

vi.mock('@/api', () => ({
  authApi: {
    register: vi.fn<(request: unknown) => Promise<unknown>>(),
    login: vi.fn<(request: unknown) => Promise<unknown>>(),
  },
  coursesApi: {
    create: vi.fn<(request: unknown) => Promise<unknown>>(),
    delete: vi.fn<(id: number) => Promise<void>>(),
    list: vi.fn<() => Promise<unknown[]>>(),
  },
  schedulesApi: {
    create: vi.fn<(request: unknown) => Promise<unknown>>(),
    list: vi.fn<() => Promise<unknown[]>>(),
  },
}))

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/create-schedule', component: CreateScheduleView },
      { path: '/welcome', component: { template: '<div />' } },
      { path: '/:pathMatch(.*)*', redirect: '/create-schedule' },
    ],
  })
}

describe('CreateScheduleView', () => {
  let router: ReturnType<typeof makeRouter>
  let nextCourseId = 1

  beforeEach(() => {
    router = makeRouter()
    vi.clearAllMocks()
    mockCourses.value = []
    mockSchedules.value = []
    mockLoadCatalog.mockResolvedValue(undefined)
    // Most cases exercise a sessioned account; the registration path test
    // clears the session and supplies a welcome name explicitly.
    const sessionUser: UserResponse = {
      id: 7,
      username: 'existing_student',
      createdAt: '2026-10-19T09:00:00Z',
      updatedAt: '2026-10-19T09:00:00Z',
    }
    useAuth().clearSessionUser()
    useAuth().setSessionUser(sessionUser)
    useOnboarding().resetOnboarding()
    vi.mocked(authApi.register).mockResolvedValue(sessionUser)
    vi.mocked(authApi.login).mockResolvedValue(sessionUser)
    useCourseDrafts().resetDrafts()
    nextCourseId = 1
    vi.mocked(coursesApi.create).mockImplementation(
      (request: unknown) =>
        Promise.resolve({ id: nextCourseId++, ...(request as object) }) as Promise<CourseResponse>,
    )
    vi.mocked(coursesApi.delete).mockResolvedValue(undefined)
    vi.mocked(schedulesApi.create).mockImplementation(
      (request: unknown) =>
        Promise.resolve({ ...(request as object) }) as Promise<ScheduleResponse>,
    )
  })

  // Submitting runs through a confirm dialog; this helper completes it.
  async function submitAll(wrapper: ReturnType<typeof mount>) {
    await wrapper.find('[aria-label="Submit schedule"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="submit-confirm"]').trigger('click')
    await flushPromises()
  }

  it('renders onboarding step progress with the schedule step active', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    const progress = wrapper.find('[role="group"][aria-label="Step 3 of 3"]')
    expect(progress.exists()).toBe(true)
    expect(progress.find('[aria-current="step"]').attributes('data-step')).toBe('3')
    expect(wrapper.find('h1').text()).toBe('Create a Schedule')
  })

  it('navigates to a completed onboarding step when its dot is clicked', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    const push = vi.spyOn(router, 'push')
    await wrapper.find('[data-step="2"]').trigger('click')
    expect(push).toHaveBeenCalledWith('/welcome')
  })

  it('guards completed-step navigation behind the discard dialog when dirty', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    await wrapper.find('input[type="text"]').setValue('History')

    await wrapper.find('[data-step="2"]').trigger('click')
    expect(wrapper.text()).toContain('Discard')
    expect(router.currentRoute.value.path).toBe('/create-schedule')
  })

  it('renders back button', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.find('[aria-label="Go back"]').exists()).toBe(true)
  })

  it('renders a course name input and confirm button', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Submit schedule"]').exists()).toBe(true)
  })

  it('renders course name input above color with dot to the left', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    const nameInput = wrapper.find('input[type="text"]')
    expect(nameInput.classes()).toContain('text-2xl')
    expect(nameInput.classes()).toContain('font-bold')
    const color = wrapper.find('[data-testid="color-toggle"]')
    expect(color.exists()).toBe(true)
    expect(color.text()).toContain('Tomato')
    expect(color.find('span.rounded-full').exists()).toBe(true)
  })

  it('uses a compact color dropdown beside a color preview', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.find('select').exists()).toBe(false)
    const trigger = wrapper.find('[data-testid="color-toggle"]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.text()).toContain('Tomato')
    await trigger.trigger('click')
    await flushPromises()

    const swatches = wrapper.findAll('[data-testid="color-swatch"]')
    expect(swatches.length).toBe(24)
    expect(swatches.some((swatch) => swatch.attributes('aria-pressed') === 'true')).toBe(true)
  })

  it('allows multiple weekdays inside one time block', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.find('[aria-label="WEDNESDAY"]').trigger('click')
    await wrapper.find('[aria-label="FRIDAY"]').trigger('click')

    const pressed = wrapper
      .findAll('button[aria-pressed="true"]')
      .map((button) => button.attributes('aria-label'))
    expect(pressed).toContain('MONDAY')
    expect(pressed).toContain('WEDNESDAY')
    expect(pressed).toContain('FRIDAY')
  })

  it('back button navigates to /welcome', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    const push = vi.spyOn(router, 'push')
    const back = wrapper.find('[aria-label="Go back"]')
    await back.trigger('click')
    expect(push).toHaveBeenCalledWith('/welcome')
  })

  it('adds independent block cards using the add action', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('[data-testid="add-another-time"]').trigger('click')
    expect(wrapper.findAll('article').length).toBe(2)
  })

  it('asks for confirmation before submitting and keeps editing on cancel', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    await wrapper.find('[aria-label="Submit schedule"]').trigger('click')
    await flushPromises()

    expect(wrapper.findComponent({ name: 'DialogShell' }).props('open')).toBe(true)
    expect(wrapper.text()).toContain('Submit your schedule?')
    expect(coursesApi.create).not.toHaveBeenCalled()

    await wrapper.find('[data-testid="submit-cancel"]').trigger('click')
    await flushPromises()
    expect(coursesApi.create).not.toHaveBeenCalled()
  })

  it('persists course and schedules through the api on Submit', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.find('[aria-label="WEDNESDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    await submitAll(wrapper)
    await flushPromises()

    expect(coursesApi.create).toHaveBeenCalledWith({ name: 'Math', color: 'tomato' })
    expect(schedulesApi.create).toHaveBeenCalledTimes(2)
    expect(schedulesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 1, day: 'MONDAY', startTime: '09:00', endTime: '10:00' }),
    )
    expect(schedulesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: 1,
        day: 'WEDNESDAY',
        startTime: '09:00',
        endTime: '10:00',
      }),
    )

    // Persisted drafts unstage after a successful flush
    const { draftCourses, draftSchedules } = useCourseDrafts()
    expect(draftCourses.value).toHaveLength(0)
    expect(draftSchedules.value).toHaveLength(0)
    expect(wrapper.find('[data-testid="sonner-toaster"]').exists()).toBe(true)
    expect(toast.success).toHaveBeenCalledWith('Course and schedule saved successfully.')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    // A sessioned account never registers; it already exists.
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('registers and logs in a sessionless visitor on Submit', async () => {
    useAuth().clearSessionUser()
    useOnboarding().setStudentName('Alice')
    const replace = vi.spyOn(router, 'replace')
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    await submitAll(wrapper)
    await flushPromises()

    // Registration is deferred to Submit: the welcome name becomes the username.
    expect(authApi.register).toHaveBeenCalledWith({ username: 'Alice' })
    expect(authApi.login).toHaveBeenCalledWith({ username: 'existing_student' })
    expect(coursesApi.create).toHaveBeenCalledWith({ name: 'Math', color: 'tomato' })
    expect(replace).toHaveBeenCalledWith('/calendar')
  })

  it('redirects a sessionless visitor without a welcome name back to welcome', async () => {
    useAuth().clearSessionUser()
    const replace = vi.spyOn(router, 'replace')
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    // The missing welcome name redirects before the confirm dialog opens.
    await wrapper.find('[aria-label="Submit schedule"]').trigger('click')
    await flushPromises()

    expect(authApi.register).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledWith('/welcome')
  })

  it('blocks save and displays duplicate message when course name already exists', async () => {
    mockCourses.value = [{ id: 1, name: 'CS 101' }]
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('cs 101')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    await submitAll(wrapper)
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith(
      'A course named "cs 101" already exists.',
      expect.objectContaining({ action: expect.objectContaining({ label: 'Open course' }) }),
    )
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(useCourseDrafts().draftCourses.value).toHaveLength(0)
  })

  it('keeps staged course in known set and allows retry of same course without duplicate error', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Physics 101')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    await submitAll(wrapper)
    await flushPromises()

    expect(useCourseDrafts().draftCourses.value).toHaveLength(0)
    expect(coursesApi.create).toHaveBeenCalledWith({ name: 'Physics 101', color: 'tomato' })

    // Re-saving the same form instance does not flag duplicate against itself
    await submitAll(wrapper)
    await flushPromises()
    expect(toast.success).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    // But a new attempt with the same name is blocked; the persisted course
    // landed in the catalog and collides with the duplicate name.
    const wrapper2 = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    await wrapper2.find('[data-testid="add-course"]').trigger('click')
    await wrapper2.find('input[type="text"]').setValue('physics 101')
    await wrapper2.find('[aria-label="TUESDAY"]').trigger('click')
    await wrapper2.findAll('input[type="time"]')[0]!.setValue('11:00')
    await wrapper2.findAll('input[type="time"]')[1]!.setValue('12:00')

    await submitAll(wrapper2)
    await flushPromises()
    expect(toast.error).toHaveBeenCalledWith(
      'A course named "physics 101" already exists.',
      expect.objectContaining({ action: expect.objectContaining({ label: 'Open course' }) }),
    )
    expect(wrapper2.find('[role="alert"]').exists()).toBe(false)
  })

  it('allows save to proceed when catalog cannot be loaded (FR-016)', async () => {
    mockCourses.value = [{ id: 1, name: 'CS 101' }]
    mockLoadCatalog.mockRejectedValueOnce(new Error('Network failure'))

    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('cs 101')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    await submitAll(wrapper)
    await flushPromises()

    expect(coursesApi.create).toHaveBeenCalledWith({ name: 'cs 101', color: 'tomato' })
    expect(useCourseDrafts().draftCourses.value).toHaveLength(0)
  })

  it('blocks save when class time clashes with a known course on the same weekday', async () => {
    mockCourses.value = [{ id: 1, name: 'CS 101' }]
    mockSchedules.value = [
      { id: 10, courseId: 1, day: 'MONDAY' as DayOfWeek, startTime: '09:00', endTime: '10:00' },
    ]

    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math 201')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:30')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:30')

    // The clashing weekday is stripped during time entry, so the editor fails
    // validation and Submit never opens the confirm dialog.
    await wrapper.find('[aria-label="Submit schedule"]').trigger('click')
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith('A class time clashes with CS 101 on MONDAY.')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(useCourseDrafts().draftCourses.value).toHaveLength(0)
  })

  it('blocks save when two sibling blocks in the same course overlap on the same weekday', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Biology')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:30')

    await wrapper.find('[data-testid="add-another-time"]').trigger('click')
    const cards = wrapper.findAllComponents({ name: 'TimeBlockCard' })
    expect(cards).toHaveLength(2)

    await cards[1]!.find('[aria-label="MONDAY"]').trigger('click')
    await cards[1]!.findAll('input[type="time"]')[0]!.setValue('10:00')
    await cards[1]!.findAll('input[type="time"]')[1]!.setValue('11:00')

    // The overlapping weekday is stripped during time entry, so the editor
    // fails validation and Submit never opens the confirm dialog.
    await wrapper.find('[aria-label="Submit schedule"]').trigger('click')
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith('Two time blocks for this course overlap on MONDAY.')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('protects unsaved changes on close with confirm dialog', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    const dialogBefore = wrapper.findComponent({ name: 'DiscardDraftConfirmDialog' })
    expect(dialogBefore.props('open')).toBe(false)

    // Make an edit (type a title)
    await wrapper.find('input[type="text"]').setValue('Draft Course')

    // Click Go Back
    await wrapper.find('[aria-label="Go back"]').trigger('click')
    await flushPromises()

    const dialog = wrapper.findComponent({ name: 'DiscardDraftConfirmDialog' })
    expect(dialog.props('open')).toBe(true)

    // Choose Keep editing
    await dialog.vm.$emit('keepEditing')
    await flushPromises()
    expect(dialog.props('open')).toBe(false)
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe(
      'Draft Course',
    )

    // Click Go Back again, and choose Discard
    await wrapper.find('[aria-label="Go back"]').trigger('click')
    await flushPromises()
    expect(dialog.props('open')).toBe(true)

    await dialog.vm.$emit('discard')
    await flushPromises()
    expect(dialog.props('open')).toBe(false)
    expect(wrapper.find('input[type="text"]').exists()).toBe(false)
    expect((wrapper.vm as unknown as ExposedScheduleView).courseName).toBe('')
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('closes immediately without dialog when form is untouched or already saved', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    // Untouched close
    await wrapper.find('[aria-label="Go back"]').trigger('click')
    await flushPromises()
    expect(wrapper.findComponent({ name: 'DiscardDraftConfirmDialog' }).props('open')).toBe(false)
    expect(wrapper.emitted('close')).toHaveLength(1)

    // Mount fresh and save successfully
    const wrapper2 = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    await wrapper2.find('input[type="text"]').setValue('Saved Course')
    await wrapper2.find('[aria-label="FRIDAY"]').trigger('click')
    await wrapper2.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper2.findAll('input[type="time"]')[1]!.setValue('10:00')
    await submitAll(wrapper2)
    await flushPromises()

    // Now close - should not prompt
    await wrapper2.find('[aria-label="Go back"]').trigger('click')
    await flushPromises()
    expect(wrapper2.findComponent({ name: 'DiscardDraftConfirmDialog' }).props('open')).toBe(false)
    expect(wrapper2.emitted('close')).toHaveLength(1)
  })

  it('opens the discard dialog on Go back when staged drafts exist', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    // A staged draft outside the editors is session work Submit has not persisted.
    useCourseDrafts().stageCourse({
      tempId: 'staged-only',
      name: 'Staged Course',
      colorId: 'tomato',
      schedules: [],
    })
    await flushPromises()

    expect((wrapper.vm as unknown as ExposedScheduleView).hasUnsavedChanges).toBe(true)

    await wrapper.find('[aria-label="Go back"]').trigger('click')
    await flushPromises()

    const dialog = wrapper.findComponent({ name: 'DiscardDraftConfirmDialog' })
    expect(dialog.props('open')).toBe(true)
  })

  it('clears staged drafts when the discard dialog confirms', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    useCourseDrafts().stageCourse({
      tempId: 'staged-only',
      name: 'Staged Course',
      colorId: 'tomato',
      schedules: [],
    })
    await flushPromises()

    await wrapper.find('[aria-label="Go back"]').trigger('click')
    await flushPromises()

    const dialog = wrapper.findComponent({ name: 'DiscardDraftConfirmDialog' })
    await dialog.vm.$emit('discard')
    await flushPromises()

    expect(useCourseDrafts().draftCourses.value).toHaveLength(0)
    expect(wrapper.emitted('close')).toBeDefined()
  })

  it('clears selected weekday when block time change introduces a clash', async () => {
    mockCourses.value = [{ id: 1, name: 'CS 101' }]
    mockSchedules.value = [
      { id: 10, courseId: 1, day: 'MONDAY' as DayOfWeek, startTime: '09:00', endTime: '10:00' },
    ]

    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    // Initially select Monday at non-clashing time 14:00-15:00
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    const timeInputs = wrapper.findAll('input[type="time"]')
    await timeInputs[0]!.setValue('14:00')
    await timeInputs[1]!.setValue('15:00')

    const card = wrapper.findComponent({ name: 'TimeBlockCard' })
    expect(card.props('block').selectedDays).toContain('MONDAY')

    // Change start time to 09:30 which clashes with CS 101 (09:00-10:00)
    await timeInputs[0]!.setValue('09:30')
    await timeInputs[1]!.setValue('10:30')
    await flushPromises()

    // Monday should be cleared from selectedDays and marked unavailable
    expect(card.props('block').selectedDays).not.toContain('MONDAY')
    expect(card.props('unavailableDays')).toContain('MONDAY')
  })

  it('disables add-another-time action when all seven weekdays clash', async () => {
    mockCourses.value = [{ id: 1, name: 'CS 101' }]
    const days: DayOfWeek[] = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ]
    mockSchedules.value = days.map((day, idx) => ({
      id: idx + 1,
      courseId: 1,
      day,
      startTime: '09:00',
      endTime: '10:00',
    }))

    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    const timeInputs = wrapper.findAll('input[type="time"]')
    await timeInputs[0]!.setValue('09:00')
    await timeInputs[1]!.setValue('10:00')
    await flushPromises()

    const addBtn = wrapper.find('[data-testid="add-another-time"]')
    expect(addBtn.attributes('disabled')).toBeDefined()
  })

  it('renders a week calendar preview grid in the background', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.find('[role="grid"]').exists()).toBe(true)
    expect(wrapper.find('[role="grid"]').attributes('aria-label')).toBe('Week preview')
  })

  it('updates preview blocks when course name and class times are changed', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    const nameInput = wrapper.find('input[type="text"]')
    await nameInput.setValue('CS 101')

    const mondayBtn = wrapper.find('button[aria-label="MONDAY"]')
    await mondayBtn.trigger('click')

    const timeInputs = wrapper.findAll('input[type="time"]')
    await timeInputs[0]!.setValue('09:00')
    await timeInputs[1]!.setValue('10:00')

    expect(wrapper.find('[role="grid"]').text()).toContain('CS 101')
  })

  it('handles empty-space tap in preview to prefill class time and set pendingSlot', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    const weekPreview = wrapper.findComponent({ name: 'WeekPreview' })
    expect(weekPreview.exists()).toBe(true)

    await weekPreview.vm.$emit('selectSlot', {
      day: 'MONDAY',
      startTime: '10:00',
      endTime: '11:00',
    })
    await flushPromises()

    const startInput = wrapper.find('input[type="time"]')
    expect((startInput.element as HTMLInputElement).value).toBe('10:00')
    expect((wrapper.vm as unknown as ExposedScheduleView).stage).toBe('partial')
    expect((wrapper.vm as unknown as ExposedScheduleView).pendingSlot).toEqual({
      day: 'MONDAY',
      startTime: '10:00',
      endTime: '11:00',
    })
  })

  it('clears pendingSlot and discards pending draft when drawer closes without saving', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    const weekPreview = wrapper.findComponent({ name: 'WeekPreview' })
    await weekPreview.vm.$emit('selectSlot', {
      day: 'MONDAY',
      startTime: '10:00',
      endTime: '11:00',
    })
    await flushPromises()

    expect((wrapper.vm as unknown as ExposedScheduleView).pendingSlot).not.toBeNull()
    expect((wrapper.vm as unknown as ExposedScheduleView).hasUnsavedChanges).toBe(false)

    const back = wrapper.find('[aria-label="Go back"]')
    await back.trigger('click')
    await flushPromises()

    const dialog = wrapper.findComponent({ name: 'DiscardDraftConfirmDialog' })
    expect(dialog.props('open')).toBe(false)
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect((wrapper.vm as unknown as ExposedScheduleView).pendingSlot).toBeNull()
  })

  it('shows discard dialog when closing after user modified a prefilled slot', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    const weekPreview = wrapper.findComponent({ name: 'WeekPreview' })
    await weekPreview.vm.$emit('selectSlot', {
      day: 'MONDAY',
      startTime: '10:00',
      endTime: '11:00',
    })
    await flushPromises()

    const timeInputs = wrapper.findAll('input[type="time"]')
    await timeInputs[0]!.setValue('09:00')
    await flushPromises()

    expect((wrapper.vm as unknown as ExposedScheduleView).hasUnsavedChanges).toBe(true)

    const back = wrapper.find('[aria-label="Go back"]')
    await back.trigger('click')
    await flushPromises()

    const dialog = wrapper.findComponent({ name: 'DiscardDraftConfirmDialog' })
    expect(dialog.props('open')).toBe(true)
  })

  it('applies a block drag move to the owning editor', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    const vm = wrapper.vm as unknown as ExposedScheduleView
    const blockId = `${vm.activeEditorId}/${vm.blocks[0]!.id}`
    const weekPreview = wrapper.findComponent({ name: 'WeekPreview' })
    await weekPreview.vm.$emit('moveBlock', blockId, 'MONDAY', {
      day: 'TUESDAY',
      startTime: '11:00',
      endTime: '12:00',
    })
    await flushPromises()

    expect(vm.blocks[0]!.selectedDays).toEqual(['TUESDAY'])
    expect(vm.blocks[0]!.startTime).toBe('11:00')
    expect(vm.blocks[0]!.endTime).toBe('12:00')
  })

  it('opens sheet in partial mode on selectBlock without starting a new class time', async () => {
    const wrapper = mount(CreateScheduleView, {
      props: { initialStage: 'full' },
      global: { plugins: [router] },
    })
    await router.isReady()
    expect((wrapper.vm as unknown as ExposedScheduleView).stage).toBe('full')

    const weekPreview = wrapper.findComponent({ name: 'WeekPreview' })
    await weekPreview.vm.$emit('selectBlock', 'block-0')
    await flushPromises()

    expect((wrapper.vm as unknown as ExposedScheduleView).stage).toBe('partial')
    expect((wrapper.vm as unknown as ExposedScheduleView).pendingSlot).toBeNull()
  })

  it('renders as a bottom sheet drawer with drawer content and no title', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.find('[data-slot="drawer-content"]').exists()).toBe(true)
    expect(wrapper.find('[data-slot="drawer-title"]').exists()).toBe(false)
  })

  it('emits update:open and close events when closed', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    const back = wrapper.find('[aria-label="Go back"]')
    await back.trigger('click')
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('starts in partial view with course details read-only and class times loaded in DOM', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    const input = wrapper.find('input[type="text"]')
    expect(input.attributes('readonly')).toBeDefined()
    expect(wrapper.find('[aria-labelledby="time-blocks-heading"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Submit schedule"]').exists()).toBe(true)

    const content = wrapper.find('[data-slot="drawer-content"]')
    expect(content.classes().some((cls) => cls.includes('rounded-none'))).toBe(false)
  })

  it('extends to full view without rounded corners when drag bar is clicked and toggles back', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    const dragBar = wrapper.find('[data-testid="drag-bar-trigger"]')
    expect(dragBar.exists()).toBe(true)

    // Click drag bar to extend to full view
    await dragBar.trigger('click')
    await flushPromises()

    const input = wrapper.find('input[type="text"]')
    expect(input.attributes('readonly')).toBeUndefined()
    expect(wrapper.find('[aria-labelledby="time-blocks-heading"]').exists()).toBe(true)

    const content = wrapper.find('[data-slot="drawer-content"]')
    expect(content.classes().some((cls) => cls.includes('rounded-none'))).toBe(true)

    // Click drag bar again to collapse to partial view
    await dragBar.trigger('click')
    await flushPromises()

    expect(wrapper.find('input[type="text"]').attributes('readonly')).toBeDefined()
    expect(content.classes().some((cls) => cls.includes('rounded-none'))).toBe(false)
  })

  it('triggers full view when partial course details section is clicked', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    expect(wrapper.find('input[type="text"]').attributes('readonly')).toBeDefined()

    const section = wrapper.find('[data-testid="course-details-section"]')
    await section.trigger('click')
    await flushPromises()

    expect(wrapper.find('input[type="text"]').attributes('readonly')).toBeUndefined()
  })

  it('switches between stages on vertical swipe gestures', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    const content = wrapper.find('[data-slot="drawer-content"]')

    // Swipe up (deltaY negative)
    await content.trigger('touchstart', {
      touches: [{ clientX: 100, clientY: 200 }],
    })
    await content.trigger('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    })
    await flushPromises()

    expect(wrapper.find('input[type="text"]').attributes('readonly')).toBeUndefined()

    // Swipe down (deltaY positive)
    await content.trigger('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }],
    })
    await content.trigger('touchend', {
      changedTouches: [{ clientX: 100, clientY: 200 }],
    })
    await flushPromises()

    expect(wrapper.find('input[type="text"]').attributes('readonly')).toBeDefined()
  })

  it('reverts to saved snapshot on discard without clearing course from week view', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    // Create and save course
    await wrapper.find('input[type="text"]').setValue('Physics 101')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')
    await submitAll(wrapper)
    await flushPromises()

    const weekPreview = wrapper.findComponent({ name: 'WeekPreview' })
    expect(weekPreview.props('blocks')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Physics 101',
          day: 'MONDAY',
          startTime: '09:00',
          endTime: '10:00',
        }),
      ]),
    )

    // Edit the course name
    await wrapper.find('input[type="text"]').setValue('Physics 101 Modified')
    await flushPromises()
    expect((wrapper.vm as unknown as ExposedScheduleView).hasUnsavedChanges).toBe(true)

    // Click Go back to trigger discard dialog
    await wrapper.find('[aria-label="Go back"]').trigger('click')
    await flushPromises()

    const dialog = wrapper.findComponent({ name: 'DiscardDraftConfirmDialog' })
    expect(dialog.props('open')).toBe(true)

    // Confirm discard
    await dialog.vm.$emit('discard')
    await flushPromises()

    // Form reverts to snapshot
    expect((wrapper.vm as unknown as ExposedScheduleView).courseName).toBe('Physics 101')
    // Week preview still contains the saved course
    expect(weekPreview.props('blocks')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Physics 101',
          day: 'MONDAY',
          startTime: '09:00',
          endTime: '10:00',
        }),
      ]),
    )
  })

  it('does not show discard dialog when opening and dismissing saved course without edits', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    // Save a course
    await wrapper.find('input[type="text"]').setValue('Chemistry 101')
    await wrapper.find('[aria-label="TUESDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('11:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('12:00')
    await submitAll(wrapper)
    await flushPromises()

    expect((wrapper.vm as unknown as ExposedScheduleView).hasUnsavedChanges).toBe(false)

    // Dismiss drawer without edits
    await wrapper.find('[aria-label="Go back"]').trigger('click')
    await flushPromises()

    const dialog = wrapper.findComponent({ name: 'DiscardDraftConfirmDialog' })
    expect(dialog.props('open')).toBe(false)
  })

  it('includes other staged courses from useCourseDrafts in week preview blocks', async () => {
    const { stageCourse } = useCourseDrafts()
    stageCourse({
      tempId: 'draft-staged-1',
      name: 'Biology 101',
      colorId: 'lavender',
      schedules: [
        {
          day: 'FRIDAY',
          startTime: '14:00',
          endTime: '15:30',
        },
      ],
    })

    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    const weekPreview = wrapper.findComponent({ name: 'WeekPreview' })
    expect(weekPreview.props('blocks')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Biology 101',
          day: 'FRIDAY',
          startTime: '14:00',
          endTime: '15:30',
        }),
      ]),
    )
  })

  it('saves multiple courses at once through the course dock', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    // Save Math first so adding a course is not blocked by the dirty guard
    await wrapper.find('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="add-course"]').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[data-testid="course-chip"]')).toHaveLength(2)

    await wrapper.find('input[type="text"]').setValue('History')
    await wrapper.find('[aria-label="TUESDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('11:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('12:00')

    await submitAll(wrapper)
    await flushPromises()

    expect(coursesApi.create).toHaveBeenCalledTimes(2)
    expect(coursesApi.create).toHaveBeenCalledWith({ name: 'Math', color: 'tomato' })
    expect(coursesApi.create).toHaveBeenCalledWith({ name: 'History', color: 'tomato' })
    expect(schedulesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ day: 'MONDAY', startTime: '09:00', endTime: '10:00' }),
    )
    expect(schedulesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ day: 'TUESDAY', startTime: '11:00', endTime: '12:00' }),
    )

    const { draftCourses, draftSchedules } = useCourseDrafts()
    expect(draftCourses.value).toHaveLength(0)
    expect(draftSchedules.value).toHaveLength(0)
    expect(toast.success).toHaveBeenCalledWith('All courses and schedules saved successfully.')
  })

  it('swaps the drawer form when a different course chip is tapped', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')
    await wrapper.find('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="add-course"]').trigger('click')
    await flushPromises()
    await wrapper.find('input[type="text"]').setValue('History')

    // History is dirty: the switch is blocked by the guard dialog
    const chips = wrapper.findAll('[data-testid="course-chip"]')
    await chips[0]!.find('button').trigger('click')
    await flushPromises()

    const guardDialog = wrapper
      .findAllComponents({ name: 'DiscardDraftConfirmDialog' })
      .find((d) => d.props('open'))
    expect(guardDialog?.props('message')).toBe('You have unsaved changes to History.')

    // Discard reverts History and completes the pending switch to Math
    await guardDialog!.vm.$emit('discard')
    await flushPromises()
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Math')

    // Math is saved and clean, so switching back runs without a prompt
    await chips[1]!.find('button').trigger('click')
    await flushPromises()
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('')
    expect(
      wrapper.findAllComponents({ name: 'DiscardDraftConfirmDialog' }).some((d) => d.props('open')),
    ).toBe(false)
  })

  it('removes a saved course via the active chip remove action', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    await wrapper.find('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="add-course"]').trigger('click')
    await flushPromises()
    await wrapper.find('input[type="text"]').setValue('History')
    await wrapper.find('[aria-label="TUESDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('11:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('12:00')

    await submitAll(wrapper)
    await flushPromises()
    expect(useCourseDrafts().draftCourses.value).toHaveLength(0)

    // The active chip is History; remove it and confirm
    await wrapper.find('[data-testid="remove-course"]').trigger('click')
    await flushPromises()

    const removeDialog = wrapper
      .findAllComponents({ name: 'DiscardDraftConfirmDialog' })
      .find((d) => d.props('title') === 'Remove course?')
    expect(removeDialog?.props('open')).toBe(true)

    await removeDialog!.vm.$emit('discard')
    await flushPromises()

    expect(wrapper.findAll('[data-testid="course-chip"]')).toHaveLength(1)
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Math')
    // Persisted course is deleted on the backend as well
    expect(mockDeleteCourse).toHaveBeenCalledWith(2)
    expect(mockCourses.value.map((c) => c.name)).toEqual(['Math'])
  })

  it('saves only the active course via the drawer save button', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    // Math is dirty: adding a course prompts; discarding reverts it
    await wrapper.find('[data-testid="add-course"]').trigger('click')
    await flushPromises()
    const guardDialog = wrapper
      .findAllComponents({ name: 'DiscardDraftConfirmDialog' })
      .find((d) => d.props('open'))
    await guardDialog!.vm.$emit('discard')
    await flushPromises()

    await wrapper.find('input[type="text"]').setValue('History')
    await wrapper.find('[aria-label="TUESDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('11:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('12:00')

    // Active editor is History; the drawer save button stages only it
    await wrapper.find('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    const { draftCourses } = useCourseDrafts()
    expect(draftCourses.value).toHaveLength(1)
    expect(draftCourses.value[0]?.name).toBe('History')
    expect(toast.success).toHaveBeenCalledWith(
      'Course kept for this session. Use Submit to save it to your account.',
    )

    // Math was reverted to an untouched editor; Submit flushes only History
    await submitAll(wrapper)
    await flushPromises()
    expect(coursesApi.create).toHaveBeenCalledWith({ name: 'History', color: 'tomato' })
    expect(coursesApi.create).toHaveBeenCalledTimes(1)
    expect(draftCourses.value).toHaveLength(0)
  })

  it('blocks adding a course while the active course has unsaved changes', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[data-testid="add-course"]').trigger('click')
    await flushPromises()

    const dialog = wrapper
      .findAllComponents({ name: 'DiscardDraftConfirmDialog' })
      .find((d) => d.props('open'))
    expect(dialog?.props('message')).toBe('You have unsaved changes to Math.')
    expect(wrapper.findAll('[data-testid="course-chip"]')).toHaveLength(1)

    // Keep editing stays on the dirty course drawer
    await dialog!.vm.$emit('keepEditing')
    await flushPromises()
    expect(wrapper.findAll('[data-testid="course-chip"]')).toHaveLength(1)
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Math')
    expect((wrapper.vm as unknown as ExposedScheduleView).stage).toBe('full')
  })

  it('closes only the drawer via the drawer close button and reopens via its chip', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    const push = vi.spyOn(router, 'push')
    const vm = wrapper.vm as unknown as ExposedScheduleView

    await wrapper.find('[aria-label="Close drawer"]').trigger('click')
    await flushPromises()

    expect(vm.isOpen).toBe(false)
    expect(push).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/create-schedule')

    await wrapper.find('[data-testid="course-chip"] button').trigger('click')
    await flushPromises()
    expect(vm.isOpen).toBe(true)
  })

  it('still navigates back after the drawer is closed', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    const push = vi.spyOn(router, 'push')

    await wrapper.find('[aria-label="Close drawer"]').trigger('click')
    await flushPromises()
    await wrapper.find('[aria-label="Go back"]').trigger('click')

    expect(push).toHaveBeenCalledWith('/welcome')
  })

  it('shows an add-course hint in the dock until a second course exists', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    const hint = wrapper.find('[data-testid="add-course-hint"]')
    expect(hint.exists()).toBe(true)

    await hint.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[data-testid="course-chip"]')).toHaveLength(2)
    expect(wrapper.find('[data-testid="add-course-hint"]').exists()).toBe(false)
  })

  it('discards active course edits and runs the deferred add after confirm', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[data-testid="add-course"]').trigger('click')
    await flushPromises()

    const dialog = wrapper
      .findAllComponents({ name: 'DiscardDraftConfirmDialog' })
      .find((d) => d.props('open'))
    await dialog!.vm.$emit('discard')
    await flushPromises()

    // The reverted first editor stays blank; a fresh editor becomes active
    expect(wrapper.findAll('[data-testid="course-chip"]')).toHaveLength(2)
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('')
    expect(wrapper.findAll('[data-testid="course-chip"]')[0]!.text()).toContain('New course')
  })

  it('keep editing on global discard activates the dirty course drawer', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    // A non-active dirty editor can only exist through injected state; the
    // dialog must navigate to its drawer rather than leave it hidden
    const stray = createCourseEditor()
    stray.name = 'Stray course'
    ;(wrapper.vm as unknown as ExposedScheduleView).editors.push(stray)
    await flushPromises()

    await wrapper.find('[aria-label="Go back"]').trigger('click')
    await flushPromises()

    const dialog = wrapper
      .findAllComponents({ name: 'DiscardDraftConfirmDialog' })
      .find((d) => d.props('open'))
    await dialog!.vm.$emit('keepEditing')
    await flushPromises()

    expect((wrapper.vm as unknown as ExposedScheduleView).activeEditorId).toBe(stray.id)
    expect((wrapper.vm as unknown as ExposedScheduleView).stage).toBe('full')
  })

  it('toast action button opens the conflicting course drawer', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    const firstEditorId = (wrapper.vm as unknown as ExposedScheduleView).activeEditorId
    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')
    await wrapper.find('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="add-course"]').trigger('click')
    await flushPromises()

    await wrapper.find('input[type="text"]').setValue('math')
    await wrapper.find('[aria-label="TUESDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('11:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('12:00')

    ;(wrapper.vm as unknown as ExposedScheduleView).stage = 'partial'
    await flushPromises()

    await submitAll(wrapper)
    await flushPromises()

    // The conflict check reports the first clashing editor (Math)
    const call = vi.mocked(toast.error).mock.calls[0]!
    const action = (call[1] as { action: { onClick: () => void } }).action
    action.onClick()
    await flushPromises()

    expect((wrapper.vm as unknown as ExposedScheduleView).activeEditorId).toBe(firstEditorId)
    expect((wrapper.vm as unknown as ExposedScheduleView).stage).toBe('full')
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Math')
  })

  it('opens the drawer on chip switch and ignores taps on the active chip', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')
    await wrapper.find('[data-testid="save-course"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="add-course"]').trigger('click')
    await flushPromises()
    ;(wrapper.vm as unknown as ExposedScheduleView).stage = 'partial'
    await flushPromises()

    // Switching to Math via its chip opens the drawer full
    const chips = wrapper.findAll('[data-testid="course-chip"]')
    await chips[0]!.find('button').trigger('click')
    await flushPromises()
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('Math')
    expect((wrapper.vm as unknown as ExposedScheduleView).stage).toBe('full')

    // Tapping the already-active chip is a no-op
    ;(wrapper.vm as unknown as ExposedScheduleView).stage = 'partial'
    await flushPromises()
    await chips[0]!.find('button').trigger('click')
    await flushPromises()
    expect((wrapper.vm as unknown as ExposedScheduleView).stage).toBe('partial')
    expect(
      wrapper.findAllComponents({ name: 'DiscardDraftConfirmDialog' }).some((d) => d.props('open')),
    ).toBe(false)
  })

  it('shows plural discard message when multiple courses have unsaved changes', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')

    const stray = createCourseEditor()
    stray.name = 'History'
    ;(wrapper.vm as unknown as ExposedScheduleView).editors.push(stray)
    await flushPromises()

    await wrapper.find('[aria-label="Go back"]').trigger('click')
    await flushPromises()

    const dialog = wrapper
      .findAllComponents({ name: 'DiscardDraftConfirmDialog' })
      .find((d) => d.props('open'))
    expect(dialog?.props('message')).toBe('This discards unsaved changes across 2 courses.')
  })
})
