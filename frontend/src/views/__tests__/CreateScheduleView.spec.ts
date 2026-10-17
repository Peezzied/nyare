import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { DayOfWeek } from '@/types/api'
import CreateScheduleView from '../CreateScheduleView.vue'
import { useCourseDrafts } from '@/composables/useCourseDrafts'
import { toast } from 'vue-sonner'

vi.mock('vue-sonner', () => ({
  Toaster: {
    name: 'Toaster',
    template: '<div data-testid="sonner-toaster" />',
  },
  toast: {
    success: vi.fn<(message: string) => void>(),
    error: vi.fn<(message: string) => void>(),
  },
}))

const mockCourses = ref<any[]>([])
const mockSchedules = ref<any[]>([])
const mockLoadCatalog = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)

vi.mock('@/composables/useCatalog', () => ({
  useCatalog: () => ({
    courses: mockCourses,
    schedules: mockSchedules,
    loadCatalog: mockLoadCatalog,
    applyCourseCreated: vi.fn<(course: unknown) => void>(),
    applyScheduleCreated: vi.fn<(schedule: unknown) => void>(),
  }),
}))

vi.mock('@/api', () => ({
  coursesApi: {
    create: vi.fn<(request: unknown) => Promise<unknown>>(),
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

  beforeEach(() => {
    router = makeRouter()
    vi.clearAllMocks()
    mockCourses.value = []
    mockSchedules.value = []
    mockLoadCatalog.mockResolvedValue(undefined)
    useCourseDrafts().resetDrafts()
  })

  it('does not render step progress for the direct create route', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
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
    expect(wrapper.find('[aria-label="Confirm"]').exists()).toBe(true)
  })

  it('renders course name input above color with dot to the left', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    const nameInput = wrapper.find('input[type="text"]')
    expect(nameInput.classes()).toContain('text-lg')
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
    expect(push).toHaveBeenCalledWith('/schedule')
  })

  it('adds independent block cards using the add action', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('[data-testid="add-another-time"]').trigger('click')
    expect(wrapper.findAll('article').length).toBe(2)
  })

  it('stages course and schedules in useCourseDrafts on save', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.find('[aria-label="WEDNESDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    await wrapper.find('[aria-label="Confirm"]').trigger('click')
    await flushPromises()

    const { draftCourses, draftSchedules } = useCourseDrafts()
    expect(draftCourses.value).toHaveLength(1)
    expect(draftCourses.value[0]?.name).toBe('Math')
    expect(draftSchedules.value).toHaveLength(2)
    expect(draftSchedules.value.map((s) => s.day)).toEqual(['MONDAY', 'WEDNESDAY'])
    expect(wrapper.find('[data-testid="sonner-toaster"]').exists()).toBe(true)
    expect(toast.success).toHaveBeenCalledWith('Course and schedule saved successfully.')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('blocks save and displays duplicate message when course name already exists', async () => {
    mockCourses.value = [{ id: 1, name: 'CS 101' }]
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('cs 101')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    await wrapper.find('[aria-label="Confirm"]').trigger('click')
    await flushPromises()

    expect(toast.error).toHaveBeenCalledWith('A course named "cs 101" already exists.')
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

    await wrapper.find('[aria-label="Confirm"]').trigger('click')
    await flushPromises()

    expect(useCourseDrafts().draftCourses.value).toHaveLength(1)

    // Re-saving the same form instance does not flag duplicate against itself
    await wrapper.find('[aria-label="Confirm"]').trigger('click')
    await flushPromises()
    expect(toast.success).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    // But a new attempt with the same name is blocked
    const wrapper2 = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    await wrapper2.find('input[type="text"]').setValue('physics 101')
    await wrapper2.find('[aria-label="TUESDAY"]').trigger('click')
    await wrapper2.findAll('input[type="time"]')[0]!.setValue('11:00')
    await wrapper2.findAll('input[type="time"]')[1]!.setValue('12:00')

    await wrapper2.find('[aria-label="Confirm"]').trigger('click')
    await flushPromises()
    expect(toast.error).toHaveBeenCalledWith('A course named "physics 101" already exists.')
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

    await wrapper.find('[aria-label="Confirm"]').trigger('click')
    await flushPromises()

    expect(useCourseDrafts().draftCourses.value).toHaveLength(1)
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

    await wrapper.find('[aria-label="Confirm"]').trigger('click')
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

    await wrapper.find('[aria-label="Confirm"]').trigger('click')
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
    expect((wrapper.vm as any).courseName).toBe('')
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
    await wrapper2.find('[aria-label="Confirm"]').trigger('click')
    await flushPromises()

    // Now close - should not prompt
    await wrapper2.find('[aria-label="Go back"]').trigger('click')
    await flushPromises()
    expect(wrapper2.findComponent({ name: 'DiscardDraftConfirmDialog' }).props('open')).toBe(false)
    expect(wrapper2.emitted('close')).toHaveLength(1)
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

  it('handles empty-space tap in preview to prefill class time, set pendingSlot, and show drawer in full mode', async () => {
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
    expect((wrapper.vm as any).stage).toBe('full')
    expect(weekPreview.props('pendingSlot')).toEqual({
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

    expect(weekPreview.props('pendingSlot')).not.toBeNull()
    expect((wrapper.vm as any).hasUnsavedChanges).toBe(false)

    const back = wrapper.find('[aria-label="Go back"]')
    await back.trigger('click')
    await flushPromises()

    const dialog = wrapper.findComponent({ name: 'DiscardDraftConfirmDialog' })
    expect(dialog.props('open')).toBe(false)
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(weekPreview.props('pendingSlot')).toBeNull()
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

    expect((wrapper.vm as any).hasUnsavedChanges).toBe(true)

    const back = wrapper.find('[aria-label="Go back"]')
    await back.trigger('click')
    await flushPromises()

    const dialog = wrapper.findComponent({ name: 'DiscardDraftConfirmDialog' })
    expect(dialog.props('open')).toBe(true)
  })

  it('opens sheet in partial mode on selectBlock without starting a new class time', async () => {
    const wrapper = mount(CreateScheduleView, {
      props: { initialStage: 'full' },
      global: { plugins: [router] },
    })
    await router.isReady()
    expect((wrapper.vm as any).stage).toBe('full')

    const weekPreview = wrapper.findComponent({ name: 'WeekPreview' })
    await weekPreview.vm.$emit('selectBlock', 'block-0')
    await flushPromises()

    expect((wrapper.vm as any).stage).toBe('partial')
    expect(weekPreview.props('pendingSlot')).toBeNull()
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
    expect(wrapper.find('[aria-label="Confirm"]').attributes('style')).toContain('display: none')

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
    expect(wrapper.find('[aria-label="Confirm"]').attributes('style') ?? '').not.toContain(
      'display: none',
    )

    const content = wrapper.find('[data-slot="drawer-content"]')
    expect(content.classes().some((cls) => cls.includes('rounded-none'))).toBe(true)

    // Click drag bar again to collapse to partial view
    await dragBar.trigger('click')
    await flushPromises()

    expect(wrapper.find('input[type="text"]').attributes('readonly')).toBeDefined()
    expect(wrapper.find('[aria-label="Confirm"]').attributes('style')).toContain('display: none')
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
    expect(wrapper.find('[aria-label="Confirm"]').attributes('style') ?? '').not.toContain(
      'display: none',
    )
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
    expect(wrapper.find('[aria-label="Confirm"]').attributes('style') ?? '').not.toContain(
      'display: none',
    )

    // Swipe down (deltaY positive)
    await content.trigger('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }],
    })
    await content.trigger('touchend', {
      changedTouches: [{ clientX: 100, clientY: 200 }],
    })
    await flushPromises()

    expect(wrapper.find('input[type="text"]').attributes('readonly')).toBeDefined()
    expect(wrapper.find('[aria-label="Confirm"]').attributes('style')).toContain('display: none')
  })

  it('reverts to saved snapshot on discard without clearing course from week view', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    // Create and save course
    await wrapper.find('input[type="text"]').setValue('Physics 101')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')
    await wrapper.find('[aria-label="Confirm"]').trigger('click')
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
    expect((wrapper.vm as any).hasUnsavedChanges).toBe(true)

    // Click Go back to trigger discard dialog
    await wrapper.find('[aria-label="Go back"]').trigger('click')
    await flushPromises()

    const dialog = wrapper.findComponent({ name: 'DiscardDraftConfirmDialog' })
    expect(dialog.props('open')).toBe(true)

    // Confirm discard
    await dialog.vm.$emit('discard')
    await flushPromises()

    // Form reverts to snapshot
    expect((wrapper.vm as any).courseName).toBe('Physics 101')
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
    await wrapper.find('[aria-label="Confirm"]').trigger('click')
    await flushPromises()

    expect((wrapper.vm as any).hasUnsavedChanges).toBe(false)

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
})
