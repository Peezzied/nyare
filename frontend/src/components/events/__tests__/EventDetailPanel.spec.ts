import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { parseDate } from '@internationalized/date'
import EventDetailPanel from '../EventDetailPanel.vue'
import DialogShell from '@/components/ui/DialogShell.vue'
import { ApiError, academicEventsApi } from '@/api'
import { toEventRequest } from '@/utils/eventForm'
import { getCourseColor } from '@/utils/courseColors'
import type { AcademicEventRequest, AcademicEventResponse } from '@/types/api'

const eventsMock = vi.hoisted(() => ({
  events: [] as AcademicEventResponse[],
  getEvent: vi.fn<(id: string) => Promise<AcademicEventResponse>>(),
  createEvent: vi.fn<(request: AcademicEventRequest) => Promise<AcademicEventResponse>>(),
  updateEvent: vi
    .fn<(id: string, request: AcademicEventRequest) => Promise<AcademicEventResponse>>(),
  deleteEvent: vi.fn<(id: string) => Promise<void>>(),
  resetEvents: vi.fn<() => void>(),
}))

const catalogState = vi.hoisted(() => ({
  courses: [{ id: 1, name: 'CS 201' }] as { id: number; name: string; color?: string | null }[],
}))

const archiveState = vi.hoisted(() => ({
  courses: [] as { id: number; name: string; color?: string | null }[],
}))

const notesMock = vi.hoisted(() => ({
  notes: [] as { id: string; title: string; courseId: number; entryDate: string }[],
}))

const routeMock = vi.hoisted(() => ({ query: {} as Record<string, string> }))
const routerMock = vi.hoisted(() => ({ push: vi.fn<() => void>(), replace: vi.fn<() => void>() }))

vi.mock('vue-router', () => ({ useRouter: () => routerMock, useRoute: () => routeMock }))

vi.mock('@/composables/useNotes', () => ({
  useNotes: () => ({
    notes: {
      get value() {
        return notesMock.notes
      },
    },
    loadNotes: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  }),
}))

vi.mock('@/composables/useAcademicEvents', () => ({
  useAcademicEvents: () => ({
    events: {
      get value() {
        return eventsMock.events
      },
    },
    loading: { value: false },
    error: { value: null },
    getEvent: eventsMock.getEvent,
    createEvent: eventsMock.createEvent,
    loadEvents: vi.fn<() => void>(),
    updateEvent: eventsMock.updateEvent,
    deleteEvent: eventsMock.deleteEvent,
    refetchForCourses: vi.fn<() => void>(),
    resetEvents: eventsMock.resetEvents,
  }),
}))

vi.mock('@/composables/useArchive', () => ({
  useArchive: () => ({
    archivedCourses: {
      get value() {
        return archiveState.courses
      },
    },
    isArchived: (courseId: number | null | undefined) =>
      archiveState.courses.some((course) => course.id === courseId),
    loadArchive: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    courseColor: (courseId: number | null | undefined) => getCourseColor(courseId ?? 0),
    resetArchive: vi.fn<() => void>(),
  }),
}))

vi.mock('@/composables/useCatalog', async () => {
  const { ref } = await import('vue')
  const { COURSE_PALETTE_24, getCourseColor } = await import('@/utils/courseColors')
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

// Renders the popover body inline so tests can reach the calendar without
// driving the floating overlay machinery.
const PopoverContentStub = defineComponent({
  name: 'PopoverContent',
  setup(_props, { slots }) {
    return () => h('div', slots.default?.())
  },
})

const CalendarStub = defineComponent({
  name: 'Calendar',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup() {
    return () => h('div', { 'data-testid': 'calendar-stub' })
  },
})

const savedEvent: AcademicEventResponse = {
  id: 'event-1',
  courseId: 1,
  title: 'Midterm',
  description: null,
  deadline: '2026-10-25T09:00:00',
  createdAt: '2026-10-18T09:00:00Z',
}

function mountPanel(props: Partial<{ eventId: string | null }> = {}) {
  return mount(EventDetailPanel, {
    props: { eventId: null, showContent: true, showControls: true, ...props },
    global: { stubs: { PopoverContent: PopoverContentStub, Calendar: CalendarStub } },
  })
}

/**
 * Selects course 1 through the CoursePicker dialog. The dialog content
 * teleports to document.body, so the option query runs against the document.
 */
async function chooseCourseOne(wrapper: ReturnType<typeof mountPanel>) {
  await wrapper.get('[data-testid="event-course"]').trigger('click')
  await flushPromises()
  const option = document.body.querySelector<HTMLElement>('[data-testid="course-option-1"]')
  expect(option).not.toBeNull()
  option!.click()
  await flushPromises()
}

/** Picks a deadline day through the Calendar v-model so the setter also fires. */
async function chooseDeadline(wrapper: ReturnType<typeof mountPanel>, isoDate = '2026-10-25') {
  wrapper.findComponent(CalendarStub).vm.$emit('update:modelValue', parseDate(isoDate))
  await flushPromises()
}

describe('EventDetailPanel create mode', () => {
  beforeEach(() => {
    eventsMock.events = []
    eventsMock.createEvent.mockReset()
    catalogState.courses = [{ id: 1, name: 'CS 201' }]
    archiveState.courses = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clear teleported dialog content left in document.body between tests.
    document.body.innerHTML = ''
  })

  it('renders a blank form titled "New event"', () => {
    const wrapper = mountPanel({ eventId: null })

    expect(wrapper.text()).toContain('New event')
    expect((wrapper.get('[data-testid="event-title"]').element as HTMLTextAreaElement).value).toBe(
      '',
    )
    expect(wrapper.find('[data-testid="event-course"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="event-date"]').text()).toContain('Add date')
    expect((wrapper.get('[data-testid="event-time"]').element as HTMLInputElement).value).toBe(
      '23:59',
    )
    expect(wrapper.find('[data-testid="event-description"]').exists()).toBe(true)
  })

  it('disables save and shows a field message when the title is blank', async () => {
    const wrapper = mountPanel({ eventId: null })

    await chooseCourseOne(wrapper)
    await chooseDeadline(wrapper)

    const save = wrapper.get('[data-testid="event-save"]')
    expect(save.attributes('disabled')).toBeDefined()
    await save.trigger('click')
    await flushPromises()

    expect(eventsMock.createEvent).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="event-title-error"]').exists()).toBe(true)
  })

  it('disables save and shows a field message when the course is unset', async () => {
    const wrapper = mountPanel({ eventId: null })

    await wrapper.get('[data-testid="event-title"]').setValue('Midterm')
    await chooseDeadline(wrapper)

    const save = wrapper.get('[data-testid="event-save"]')
    expect(save.attributes('disabled')).toBeDefined()
    await save.trigger('click')
    await flushPromises()

    expect(eventsMock.createEvent).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="event-course-error"]').exists()).toBe(true)
  })

  it('keeps save disabled until the deadline date is set', async () => {
    const wrapper = mountPanel({ eventId: null })

    await wrapper.get('[data-testid="event-title"]').setValue('Midterm')
    await chooseCourseOne(wrapper)
    expect(wrapper.get('[data-testid="event-save"]').attributes('disabled')).toBeDefined()

    await chooseDeadline(wrapper)
    expect(wrapper.get('[data-testid="event-save"]').attributes('disabled')).toBeUndefined()
  })

  it('explains that a course is required and blocks save when no courses exist', async () => {
    catalogState.courses = []
    const wrapper = mountPanel({ eventId: null })

    expect(wrapper.find('[data-testid="event-course-required"]').exists()).toBe(true)

    await wrapper.get('[data-testid="event-title"]').setValue('Midterm')

    const save = wrapper.get('[data-testid="event-save"]')
    expect(save.attributes('disabled')).toBeDefined()
    await save.trigger('click')
    await flushPromises()

    expect(eventsMock.createEvent).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="event-course-error"]').exists()).toBe(true)
  })

  it('creates the event with toEventRequest(form) and emits close', async () => {
    eventsMock.createEvent.mockResolvedValue(savedEvent)
    const wrapper = mountPanel({ eventId: null })

    await wrapper.get('[data-testid="event-title"]').setValue('Midterm')
    await chooseCourseOne(wrapper)
    await chooseDeadline(wrapper)
    await wrapper.get('[data-testid="event-save"]').trigger('click')
    await flushPromises()

    expect(eventsMock.createEvent).toHaveBeenCalledWith(
      toEventRequest({
        title: 'Midterm',
        courseId: 1,
        description: '',
        deadlineDate: '2026-10-25',
        deadlineTime: '23:59',
      }),
    )
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('keeps entered data and offers a retry when the save fails', async () => {
    eventsMock.createEvent.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = mountPanel({ eventId: null })

    await wrapper.get('[data-testid="event-title"]').setValue('Midterm')
    await chooseCourseOne(wrapper)
    await chooseDeadline(wrapper)
    await wrapper.get('[data-testid="event-save"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="event-error"]').exists()).toBe(true)
    expect(wrapper.emitted('close')).toBeUndefined()
    expect((wrapper.get('[data-testid="event-title"]').element as HTMLTextAreaElement).value).toBe(
      'Midterm',
    )

    eventsMock.createEvent.mockResolvedValueOnce(savedEvent)
    await wrapper.get('[data-testid="event-error-retry"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})

describe('EventDetailPanel view mode', () => {
  const viewEvent: AcademicEventResponse = {
    id: 'event-1',
    courseId: 1,
    noteId: 'note-9',
    title: 'Midterm',
    description: 'Chapters 1 to 5',
    deadline: '2026-10-25T09:00:00',
    createdAt: '2026-10-18T09:00:00Z',
  }

  beforeEach(() => {
    eventsMock.events = [{ ...viewEvent }]
    eventsMock.getEvent.mockReset()
    eventsMock.getEvent.mockImplementation(async (id) => {
      const cached = eventsMock.events.find((e) => e.id === id)
      if (!cached) {
        throw new ApiError(404, 'Not found')
      }
      return cached
    })
    eventsMock.createEvent.mockReset()
    eventsMock.updateEvent.mockReset()
    eventsMock.deleteEvent.mockReset()
    eventsMock.resetEvents.mockReset()
    catalogState.courses = [{ id: 1, name: 'CS 201' }]
    archiveState.courses = []
    notesMock.notes = [{ id: 'note-9', title: 'Lecture 7', courseId: 1, entryDate: '2026-10-18' }]
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('renders the saved event across the header, identity, deadline, and description zones', async () => {
    const wrapper = mountPanel({ eventId: 'event-1' })
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Event')
    expect((wrapper.get('[data-testid="event-title"]').element as HTMLTextAreaElement).value).toBe(
      'Midterm',
    )

    const chip = wrapper.get('[data-testid="event-course-chip"]')
    expect(chip.text()).toContain('CS 201')

    const dateTrigger = wrapper.get('[data-testid="event-date"]')
    expect(dateTrigger.attributes('aria-label')).toBe('Deadline date')
    expect(dateTrigger.text()).toContain('Oct 25, 2026')
    expect((wrapper.get('[data-testid="event-time"]').element as HTMLInputElement).value).toBe(
      '09:00',
    )
    expect(
      (wrapper.get('[data-testid="event-description"]').element as HTMLTextAreaElement).value,
    ).toBe('Chapters 1 to 5')
  })

  it('renders a source note link only when the event has a noteId', async () => {
    const wrapper = mountPanel({ eventId: 'event-1' })
    await flushPromises()

    const link = wrapper.get('[data-testid="event-source-note"]')
    expect(link.text()).toContain('From a note')
    expect(link.attributes('href')).toBe('?note=note-9')
    expect(link.find('svg').exists()).toBe(true)
  })

  it('replaces the note query parameter when the source note link is clicked', async () => {
    const wrapper = mountPanel({ eventId: 'event-1' })
    await flushPromises()

    await wrapper.get('[data-testid="event-source-note"]').trigger('click')

    expect(routerMock.replace).toHaveBeenCalledWith({ query: { note: 'note-9' } })
  })

  it('hides the source note row when the event has no noteId', async () => {
    eventsMock.events = [{ ...viewEvent, noteId: null }]
    const wrapper = mountPanel({ eventId: 'event-1' })
    await flushPromises()

    expect(wrapper.find('[data-testid="event-source-note"]').exists()).toBe(false)
  })

  it('hides the source note row when the linked note was deleted', async () => {
    notesMock.notes = []
    const wrapper = mountPanel({ eventId: 'event-1' })
    await flushPromises()

    expect(wrapper.find('[data-testid="event-source-note"]').exists()).toBe(false)
  })

  it('emits missing when the event answers 404', async () => {
    eventsMock.events = []
    const wrapper = mountPanel({ eventId: 'gone' })
    await flushPromises()

    expect(wrapper.emitted('missing')).toHaveLength(1)
  })

  it('loads an event through getEvent on a cache miss', async () => {
    eventsMock.events = []
    const directEvent: AcademicEventResponse = {
      ...viewEvent,
      id: 'event-direct',
      title: 'Direct',
    }
    eventsMock.getEvent.mockResolvedValue(directEvent)
    const wrapper = mountPanel({ eventId: 'event-direct' })
    await flushPromises()

    expect(eventsMock.getEvent).toHaveBeenCalledWith('event-direct')
    expect((wrapper.get('[data-testid="event-title"]').element as HTMLTextAreaElement).value).toBe(
      'Direct',
    )
  })

  it('saves the complete request with the source noteId and shows the response', async () => {
    eventsMock.updateEvent.mockImplementation(async (id, request) => {
      const saved: AcademicEventResponse = {
        ...viewEvent,
        title: request.title,
        description: request.description ?? null,
        deadline: request.deadline,
      }
      eventsMock.events = eventsMock.events.map((e) => (e.id === id ? saved : e))
      return saved
    })
    const listSpy = vi.spyOn(academicEventsApi, 'list')
    const wrapper = mountPanel({ eventId: 'event-1' })
    await flushPromises()

    await wrapper.get('[data-testid="event-title"]').setValue('Midterm edited')
    await wrapper.get('[data-testid="event-save"]').trigger('click')
    await flushPromises()

    expect(eventsMock.updateEvent).toHaveBeenCalledWith(
      'event-1',
      toEventRequest(
        {
          title: 'Midterm edited',
          courseId: 1,
          description: 'Chapters 1 to 5',
          deadlineDate: '2026-10-25',
          deadlineTime: '09:00',
        },
        'note-9',
      ),
    )
    expect(listSpy).not.toHaveBeenCalled()
    expect(eventsMock.events[0]?.title).toBe('Midterm edited')
    expect((wrapper.get('[data-testid="event-title"]').element as HTMLTextAreaElement).value).toBe(
      'Midterm edited',
    )
    expect(wrapper.get('[data-testid="event-save"]').attributes('disabled')).toBeDefined()
  })

  it('shows the save action disabled until the form is dirty and valid', async () => {
    const wrapper = mountPanel({ eventId: 'event-1' })
    await flushPromises()

    const save = wrapper.get('[data-testid="event-save"]')
    expect(save.attributes('disabled')).toBeDefined()

    await wrapper.get('[data-testid="event-title"]').setValue('Midterm edited')
    expect(save.attributes('disabled')).toBeUndefined()

    await wrapper.get('[data-testid="event-title"]').setValue('Midterm')
    expect(save.attributes('disabled')).toBeDefined()
  })

  it('disables save and shows a field message when an edit clears the title', async () => {
    const wrapper = mountPanel({ eventId: 'event-1' })
    await flushPromises()

    await wrapper.get('[data-testid="event-title"]').setValue('')

    const save = wrapper.get('[data-testid="event-save"]')
    expect(save.attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="event-title-error"]').exists()).toBe(true)

    await save.trigger('click')
    await flushPromises()

    expect(eventsMock.updateEvent).not.toHaveBeenCalled()
  })

  it('keeps entered data and shows a retry when the edit save fails', async () => {
    eventsMock.updateEvent.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = mountPanel({ eventId: 'event-1' })
    await flushPromises()

    await wrapper.get('[data-testid="event-title"]').setValue('Midterm edited')
    await wrapper.get('[data-testid="event-save"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="event-error"]').exists()).toBe(true)
    expect(wrapper.emitted('close')).toBeUndefined()
    expect(wrapper.emitted('deleted')).toBeUndefined()
    expect((wrapper.get('[data-testid="event-title"]').element as HTMLTextAreaElement).value).toBe(
      'Midterm edited',
    )

    eventsMock.updateEvent.mockResolvedValueOnce({ ...viewEvent, title: 'Midterm edited' })
    await wrapper.get('[data-testid="event-error-retry"]').trigger('click')
    await flushPromises()

    expect(eventsMock.updateEvent).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-testid="event-error"]').exists()).toBe(false)
  })

  it('confirms before deleting and emits deleted with the event payload', async () => {
    const wrapper = mountPanel({ eventId: 'event-1' })
    await flushPromises()

    expect(wrapper.find('[data-testid="event-delete-confirm"]').exists()).toBe(false)

    await wrapper.get('[data-testid="event-delete"]').trigger('click')
    await nextTick()

    expect(wrapper.findComponent(DialogShell).exists()).toBe(true)
    await wrapper.get('[data-testid="event-delete-confirm"]').trigger('click')
    await flushPromises()

    // The caller owns the deferred API delete behind the undo toast.
    expect(wrapper.emitted('deleted')?.[0]?.[0]).toEqual(viewEvent)
    expect(eventsMock.deleteEvent).not.toHaveBeenCalled()
  })
})

describe('EventDetailPanel archived course', () => {
  const archivedEvent: AcademicEventResponse = {
    id: 'event-archived',
    courseId: 99,
    title: 'Old exam',
    description: null,
    deadline: '2026-10-25T09:00:00',
    createdAt: '2026-10-18T09:00:00Z',
  }

  beforeEach(() => {
    eventsMock.events = [{ ...archivedEvent }]
    eventsMock.getEvent.mockReset()
    eventsMock.getEvent.mockImplementation(async (id) => {
      const cached = eventsMock.events.find((e) => e.id === id)
      if (!cached) {
        throw new ApiError(404, 'Not found')
      }
      return cached
    })
    eventsMock.resetEvents.mockReset()
    catalogState.courses = [{ id: 1, name: 'CS 201' }]
    archiveState.courses = [{ id: 99, name: 'Legacy 101' }]
    notesMock.notes = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('renders the event read-only and evicts it from the shared list cache', async () => {
    const wrapper = mountPanel({ eventId: 'event-archived' })
    await flushPromises()

    expect(wrapper.get('[data-testid="archived-course-label"]').text()).toContain(
      'Archived course',
    )
    expect(wrapper.find('[data-testid="event-save"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="archived-course-chip"]').text()).toContain('Legacy 101')
    expect(
      wrapper.get('[data-testid="event-title"]').attributes('readonly'),
    ).toBeDefined()
    expect(wrapper.get('[data-testid="event-date"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="event-time"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="event-delete"]').exists()).toBe(false)
    expect(eventsMock.resetEvents).toHaveBeenCalled()
  })
})

describe('EventDetailPanel delete availability', () => {
  beforeEach(() => {
    eventsMock.events = []
    catalogState.courses = [{ id: 1, name: 'CS 201' }]
    archiveState.courses = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('does not render the delete action in create mode', () => {
    const wrapper = mountPanel({ eventId: null })

    expect(wrapper.find('[data-testid="event-delete"]').exists()).toBe(false)
  })
})
