import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { DayOfWeek } from '@/types/api'
import CreateScheduleView from '../CreateScheduleView.vue'
import * as api from '@/api'

vi.mock('@/composables/useCatalog', () => ({
  useCatalog: () => ({
    loadCatalog: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
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

  it('creates one schedule request per selected weekday and omits color and room', async () => {
    const createdCourse = { id: 42, name: 'Math', description: null, userId: 7 }
    const mondaySchedule = { id: 101, courseId: 42, day: 'MONDAY' as DayOfWeek, startTime: '09:00', endTime: '10:00' }
    const wednesdaySchedule = { id: 102, courseId: 42, day: 'WEDNESDAY' as DayOfWeek, startTime: '09:00', endTime: '10:00' }

    vi.mocked(api.coursesApi.create).mockResolvedValueOnce(createdCourse)
    vi.mocked(api.schedulesApi.create)
      .mockResolvedValueOnce(mondaySchedule)
      .mockResolvedValueOnce(wednesdaySchedule)

    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.find('[aria-label="WEDNESDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    await wrapper.find('[aria-label="Confirm"]').trigger('click')
    await flushPromises()

    expect(api.coursesApi.create).toHaveBeenCalledWith({ name: 'Math' })
    expect(api.schedulesApi.create).toHaveBeenNthCalledWith(1, {
      courseId: 42,
      day: 'MONDAY',
      startTime: '09:00',
      endTime: '10:00',
    })
    expect(api.schedulesApi.create).toHaveBeenNthCalledWith(2, {
      courseId: 42,
      day: 'WEDNESDAY',
      startTime: '09:00',
      endTime: '10:00',
    })
  })

  it('does not create schedules when course creation fails', async () => {
    vi.mocked(api.coursesApi.create).mockRejectedValueOnce(new Error('Course unavailable'))

    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Math')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    await wrapper.find('[aria-label="Confirm"]').trigger('click')
    await flushPromises()

    expect(api.schedulesApi.create).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alert"]').text()).toContain('Course unavailable')
  })

  it('keeps failed records and retries only failed schedule requests', async () => {
    const createdCourse = { id: 7, name: 'Science', description: null, userId: 1 }

    vi.mocked(api.coursesApi.create).mockResolvedValueOnce(createdCourse)
    vi.mocked(api.schedulesApi.create)
      .mockResolvedValueOnce({
        id: 201,
        courseId: 7,
        day: 'MONDAY' as DayOfWeek,
        startTime: '09:00',
        endTime: '10:00',
      })
      .mockRejectedValueOnce(new Error('Schedule unavailable'))
      .mockResolvedValueOnce({
        id: 202,
        courseId: 7,
        day: 'WEDNESDAY' as DayOfWeek,
        startTime: '09:00',
        endTime: '10:00',
      })

    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    await wrapper.find('input[type="text"]').setValue('Science')
    await wrapper.find('[aria-label="MONDAY"]').trigger('click')
    await wrapper.find('[aria-label="WEDNESDAY"]').trigger('click')
    await wrapper.findAll('input[type="time"]')[0]!.setValue('09:00')
    await wrapper.findAll('input[type="time"]')[1]!.setValue('10:00')

    await wrapper.find('[aria-label="Confirm"]').trigger('click')
    await flushPromises()

    expect(api.schedulesApi.create).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Retry failed')

    const retryButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Retry'))!
    await retryButton.trigger('click')
    await flushPromises()

    expect(api.schedulesApi.create).toHaveBeenCalledTimes(3)
    expect(api.schedulesApi.create).toHaveBeenLastCalledWith({
      courseId: 7,
      day: 'WEDNESDAY',
      startTime: '09:00',
      endTime: '10:00',
    })
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

    const back = wrapper.find('[aria-label="Go back"]')
    await back.trigger('click')
    await flushPromises()

    expect(weekPreview.props('pendingSlot')).toBeNull()
  })

  it('opens sheet to edit on selectBlock without starting a new class time', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()

    const weekPreview = wrapper.findComponent({ name: 'WeekPreview' })
    await weekPreview.vm.$emit('selectBlock', 'block-0')
    await flushPromises()

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
    expect(wrapper.find('[aria-label="Confirm"]').attributes('style') ?? '').not.toContain('display: none')

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
    expect(wrapper.find('[aria-label="Confirm"]').attributes('style') ?? '').not.toContain('display: none')
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
    expect(wrapper.find('[aria-label="Confirm"]').attributes('style') ?? '').not.toContain('display: none')

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
})
