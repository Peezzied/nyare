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

  it('shows course details in a 70/30 row', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    const grid = wrapper.find('.grid')
    expect(grid.classes()).toContain('grid-cols-[minmax(0,3fr)_minmax(0,2fr)]')
  })

  it('uses a compact color dropdown beside a color preview', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.find('select').exists()).toBe(false)
    const trigger = wrapper.find('[data-testid="color-toggle"]')
    expect(trigger.exists()).toBe(true)
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
    const mondaySchedule = {
      id: 101,
      courseId: 42,
      day: 'MONDAY' as DayOfWeek,
      startTime: '09:00',
      endTime: '10:00',
    }
    const wednesdaySchedule = {
      id: 102,
      courseId: 42,
      day: 'WEDNESDAY' as DayOfWeek,
      startTime: '09:00',
      endTime: '10:00',
    }

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

    const retryButton = wrapper.findAll('button').find((button) => button.text().includes('Retry'))!
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

  it('does not render a calendar grid', async () => {
    const wrapper = mount(CreateScheduleView, { global: { plugins: [router] } })
    await router.isReady()
    expect(wrapper.find('[role="grid"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="calendar"]').exists()).toBe(false)
  })
})
