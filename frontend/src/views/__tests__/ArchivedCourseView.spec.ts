import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, ref, toValue } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import ArchivedCourseView from '../ArchivedCourseView.vue'
import AppHeader from '@/components/AppHeader.vue'
import { provideShellHeader } from '@/composables/useShellHeader'
import { COURSE_PALETTE_24, getCourseColor } from '@/constants/palette'
import type { ArchivedCourseContent } from '@/composables/useArchive'
import type { CourseResponse } from '@/types/api'

const mockPush = vi.fn<(to: unknown) => Promise<void>>(() => Promise.resolve())
const mockBack = vi.fn<() => void>()
const routeParams: Record<string, string> = { courseId: '1' }

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useRoute: () => ({ params: routeParams }),
}))

const mockArchivedCourses = ref<CourseResponse[]>([])
const mockLoadArchive = vi.fn<() => Promise<void>>()
const mockLoadCourseContent = vi.fn<(courseId: number) => Promise<ArchivedCourseContent>>()
const mockApplyCourseRemoved = vi.fn<(id: number) => void>((id: number) => {
  mockArchivedCourses.value = mockArchivedCourses.value.filter((c) => c.id !== id)
})

vi.mock('@/composables/useArchive', () => ({
  useArchive: () => ({
    archivedCourses: mockArchivedCourses,
    loadArchive: mockLoadArchive,
    loadCourseContent: mockLoadCourseContent,
    applyCourseRemoved: mockApplyCourseRemoved,
    // Mirrors the real resolver: a stored slug wins, else the derived color.
    courseColor: (courseId: number | undefined | null) => {
      const slug = mockArchivedCourses.value.find((c) => c.id === courseId)?.color
      return (
        (slug ? COURSE_PALETTE_24.find((c) => c.id === slug) : undefined) ??
        getCourseColor(courseId ?? 0)
      )
    },
  }),
}))

const mockUnarchiveCourses = vi.fn<(ids: number[]) => Promise<void>>(() => Promise.resolve())

vi.mock('@/composables/useCatalog', () => ({
  useCatalog: () => ({
    unarchiveCourses: mockUnarchiveCourses,
    // TaskRow and NoteCard resolve badge colors through the catalog.
    courseColor: (courseId: number | undefined | null) => getCourseColor(courseId ?? 0),
  }),
}))

const mockPushToast = vi.fn<(toast: unknown) => void>()

vi.mock('@/composables/useToasts', () => ({
  useToasts: () => ({ pushToast: mockPushToast }),
}))

enableAutoUnmount(afterEach)

// ArchivedCourseView contributes its top bar through the shared shell header,
// so it renders inside AppShell in the real app. This harness stands in for
// the shell chrome.
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
        h(ArchivedCourseView),
      ])
  },
})

const algebra: CourseResponse = {
  id: 1,
  name: 'Algebra',
  description: null,
  userId: 1,
  archivedAt: '2026-10-01T09:00:00',
}

const content: ArchivedCourseContent = {
  schedules: [
    { id: 12, courseId: 1, day: 'WEDNESDAY', startTime: '13:00:00', endTime: '14:30:00' },
    { id: 11, courseId: 1, day: 'MONDAY', startTime: '09:00:00', endTime: '10:30:00' },
  ],
  notes: [
    {
      id: 'note-1',
      courseId: 1,
      title: 'Limits intro',
      preview: 'Epsilon and delta',
      truncated: false,
      contentLength: 18,
      entryDate: '2026-09-29',
      createdAt: '2026-09-29T10:00:00Z',
      updatedAt: '2026-09-29T10:00:00Z',
    },
  ],
  tasks: [
    {
      id: 'task-1',
      courseId: 1,
      noteId: null,
      title: 'Problem set 3',
      description: null,
      scheduledDate: '2026-10-05',
      duration: null,
      status: 'TODO',
      createdAt: '2026-09-30T10:00:00Z',
      updatedAt: '2026-09-30T10:00:00Z',
    },
  ],
  events: [
    {
      id: 'event-1',
      courseId: 1,
      noteId: null,
      title: 'Midterm exam',
      description: null,
      deadline: '2099-10-20T09:00:00',
      createdAt: '2026-09-30T10:00:00Z',
    },
  ],
}

function mountView() {
  return mount(ShellHarness)
}

describe('ArchivedCourseView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockArchivedCourses.value = [algebra]
    routeParams.courseId = '1'
    mockLoadArchive.mockResolvedValue(undefined)
    mockLoadCourseContent.mockResolvedValue(content)
    mockUnarchiveCourses.mockResolvedValue(undefined)
  })

  it('renders the snapshot sections read-only once the content loads', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(mockLoadCourseContent).toHaveBeenCalledWith(1)
    expect(wrapper.get('[data-testid="archived-course-meta"]').text()).toContain(
      'Archived Oct 01',
    )
    expect(wrapper.get('[data-testid="archived-course-meta"]').text()).toContain('Read-only')

    const times = wrapper.findAll('[data-testid="archived-course-time"]')
    expect(times).toHaveLength(2)
    expect(times[0]!.text()).toContain('Mon')
    expect(times[0]!.text()).toContain('09:00–10:30')
    expect(times[1]!.text()).toContain('Wed')
    expect(times[1]!.text()).toContain('13:00–14:30')

    expect(wrapper.get('[data-testid="archived-course-notes"]').text()).toContain('Limits intro')
    expect(wrapper.get('[data-testid="archived-course-tasks"]').text()).toContain('Problem set 3')
    expect(wrapper.get('[data-testid="archived-course-events"]').text()).toContain('Midterm exam')

    // Read-only snapshot: the task row hides its status checkbox and swipe actions.
    expect(
      wrapper.find('[data-testid="archived-course-tasks"] [role="checkbox"]').exists(),
    ).toBe(false)
    expect(wrapper.find('[data-swipe-exclude]').exists()).toBe(false)
  })

  it('restores the course from the header unarchive action', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="archived-course-unarchive"]').trigger('click')
    await flushPromises()

    expect(mockUnarchiveCourses).toHaveBeenCalledWith([1])
    expect(mockApplyCourseRemoved).toHaveBeenCalledWith(1)
    expect(mockPushToast).toHaveBeenCalledWith({ kind: 'success', title: 'Course restored.' })
    expect(mockPush).toHaveBeenCalledWith({ name: 'archive' })
  })

  it('shows the not-found state when the course is missing from the archive', async () => {
    routeParams.courseId = '9'

    const wrapper = mountView()
    await flushPromises()

    // The archive list and course content fan out concurrently (FR-002); a
    // missing course still lands on the not-found state and never uses it.
    expect(mockLoadCourseContent).toHaveBeenCalledWith(9)
    const notFound = wrapper.get('[data-testid="archived-course-not-found"]')
    expect(notFound.text()).toContain('Course not found in the archive.')
    expect(wrapper.find('[data-testid="archived-course-unarchive"]').exists()).toBe(false)

    await notFound.get('button').trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ name: 'archive' })
  })

  it('shows an error state and retries the load', async () => {
    mockLoadArchive.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mountView()
    await flushPromises()

    const errorBox = wrapper.get('[data-testid="archived-course-error"]')
    expect(errorBox.text()).toContain('Archived course failed to load.')

    mockLoadArchive.mockResolvedValue(undefined)
    await errorBox.get('button').trigger('click')
    await flushPromises()

    expect(mockLoadArchive).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-testid="archived-course-schedules"]').exists()).toBe(true)
  })
})
