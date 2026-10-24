import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, ref, toValue } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import ArchiveView from '../ArchiveView.vue'
import AppHeader from '@/components/AppHeader.vue'
import { provideShellHeader } from '@/composables/useShellHeader'
import { COURSE_PALETTE_24, getCourseColor } from '@/utils/courseColors'
import type { CourseResponse } from '@/types/api'

const mockPush = vi.fn<(to: unknown) => Promise<void>>(() => Promise.resolve())
const mockBack = vi.fn<() => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}))

const mockArchivedCourses = ref<CourseResponse[]>([])
const mockLoadArchive = vi.fn<() => Promise<void>>()
const mockApplyCourseRemoved = vi.fn<(id: number) => void>((id: number) => {
  mockArchivedCourses.value = mockArchivedCourses.value.filter((c) => c.id !== id)
})
// Mirrors the real delete: the API call succeeds, then the row leaves the cache.
const mockDeleteArchivedCourse = vi.fn<(id: number) => Promise<void>>(async (id: number) => {
  mockApplyCourseRemoved(id)
})
// Mirrors the real bulk delete: everything leaves the cache, 0 failures.
const mockDeleteAllArchived = vi.fn<() => Promise<number>>(async () => {
  mockArchivedCourses.value = []
  return 0
})

vi.mock('@/composables/useArchive', () => ({
  useArchive: () => ({
    archivedCourses: mockArchivedCourses,
    loadArchive: mockLoadArchive,
    applyCourseRemoved: mockApplyCourseRemoved,
    deleteArchivedCourse: mockDeleteArchivedCourse,
    deleteAllArchived: mockDeleteAllArchived,
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
  }),
}))

const mockPushToast = vi.fn<(toast: unknown) => void>()

vi.mock('@/composables/useToasts', () => ({
  useToasts: () => ({ pushToast: mockPushToast }),
}))

enableAutoUnmount(afterEach)

// ArchiveView contributes its top bar through the shared shell header, so it
// renders inside AppShell in the real app. This harness stands in for the
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
        h(ArchiveView),
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

const biology: CourseResponse = {
  id: 2,
  name: 'Biology',
  description: null,
  userId: 1,
  archivedAt: '2026-10-05T14:30:00',
}

function mountView() {
  return mount(ShellHarness)
}

describe('ArchiveView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockArchivedCourses.value = []
    mockLoadArchive.mockResolvedValue(undefined)
    mockUnarchiveCourses.mockResolvedValue(undefined)
  })

  it('lists every archived course with its color swatch, name, and archive date', async () => {
    mockArchivedCourses.value = [algebra, biology]

    const wrapper = mountView()
    await flushPromises()

    expect(mockLoadArchive).toHaveBeenCalledTimes(1)
    const rows = wrapper.findAll('[data-testid="archive-course-row"]')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.text()).toContain('Algebra')
    expect(rows[0]!.text()).toContain('Archived Oct 01')
    expect(rows[1]!.text()).toContain('Biology')
    expect(rows[1]!.text()).toContain('Archived Oct 05')

    const swatch = rows[0]!.get('span[style]')
    expect(swatch.attributes('style')).toContain('background-color')
  })

  it('shows the empty state when the student has no archived courses', async () => {
    const wrapper = mountView()
    await flushPromises()

    const empty = wrapper.get('[data-testid="archive-empty-state"]')
    expect(empty.text()).toContain('No archived courses')
    expect(wrapper.find('[data-testid="archive-course-row"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="archive-delete-all"]').exists()).toBe(false)
  })

  it('restores the course from the row unarchive action without navigating', async () => {
    mockArchivedCourses.value = [algebra, biology]

    const wrapper = mountView()
    await flushPromises()

    const rows = wrapper.findAll('[data-testid="archive-course-row"]')
    await rows[0]!.get('[data-testid="archive-course-unarchive"]').trigger('click')
    await flushPromises()

    expect(mockUnarchiveCourses).toHaveBeenCalledWith([1])
    expect(mockApplyCourseRemoved).toHaveBeenCalledWith(1)
    expect(mockPushToast).toHaveBeenCalledWith({ kind: 'success', title: 'Course restored.' })
    // The click stays on the button and never reaches the row navigation.
    expect(mockPush).not.toHaveBeenCalled()

    const remaining = wrapper.findAll('[data-testid="archive-course-row"]')
    expect(remaining).toHaveLength(1)
    expect(remaining[0]!.text()).toContain('Biology')
  })

  it('keeps the course and shows an error toast when the unarchive fails', async () => {
    mockArchivedCourses.value = [algebra]
    mockUnarchiveCourses.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="archive-course-unarchive"]').trigger('click')
    await flushPromises()

    expect(mockApplyCourseRemoved).not.toHaveBeenCalled()
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'error', title: 'Could not restore the course.' }),
    )
    expect(wrapper.findAll('[data-testid="archive-course-row"]')).toHaveLength(1)
  })

  it('shows the cascade warning and deletes the course on confirm', async () => {
    mockArchivedCourses.value = [algebra, biology]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('[data-testid="archive-course-delete"]')[0]!.trigger('click')
    await flushPromises()

    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.text()).toContain(
      'This deletes Algebra and all its notes, tasks, events, and class times.',
    )

    await wrapper.get('[data-testid="archive-delete-confirm"]').trigger('click')
    await flushPromises()

    expect(mockDeleteArchivedCourse).toHaveBeenCalledTimes(1)
    expect(mockDeleteArchivedCourse).toHaveBeenCalledWith(1)
    expect(mockPushToast).toHaveBeenCalledWith({ kind: 'success', title: 'Course deleted.' })
    // The click stays on the button and never reaches the row navigation.
    expect(mockPush).not.toHaveBeenCalled()

    const remaining = wrapper.findAll('[data-testid="archive-course-row"]')
    expect(remaining).toHaveLength(1)
    expect(remaining[0]!.text()).toContain('Biology')
  })

  it('keeps the course when the student cancels the delete', async () => {
    mockArchivedCourses.value = [algebra]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="archive-course-delete"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="archive-delete-cancel"]').trigger('click')
    await flushPromises()

    expect(mockDeleteArchivedCourse).not.toHaveBeenCalled()
    expect(wrapper.findAll('[data-testid="archive-course-row"]')).toHaveLength(1)
  })

  it('keeps the course and shows an error toast when the delete fails', async () => {
    mockArchivedCourses.value = [algebra]
    mockDeleteArchivedCourse.mockRejectedValueOnce(new Error('Delete failed'))

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="archive-course-delete"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="archive-delete-confirm"]').trigger('click')
    await flushPromises()

    expect(mockApplyCourseRemoved).not.toHaveBeenCalled()
    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'error', title: 'Could not delete the course.' }),
    )
    expect(wrapper.findAll('[data-testid="archive-course-row"]')).toHaveLength(1)
  })

  it('empties the archive after the student confirms the delete-all dialog', async () => {
    mockArchivedCourses.value = [algebra, biology]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="archive-delete-all"]').trigger('click')
    await flushPromises()

    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.text()).toContain('all 2 archived courses')

    await wrapper.get('[data-testid="archive-delete-confirm"]').trigger('click')
    await flushPromises()

    expect(mockDeleteAllArchived).toHaveBeenCalledTimes(1)
    expect(mockDeleteArchivedCourse).not.toHaveBeenCalled()
    expect(mockPushToast).toHaveBeenCalledWith({ kind: 'success', title: 'Archive emptied.' })
    expect(wrapper.findAll('[data-testid="archive-course-row"]')).toHaveLength(0)
  })

  it('reports the count when some bulk deletes fail', async () => {
    mockArchivedCourses.value = [algebra, biology]
    mockDeleteAllArchived.mockImplementationOnce(async () => {
      mockArchivedCourses.value = [biology]
      return 1
    })

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="archive-delete-all"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="archive-delete-confirm"]').trigger('click')
    await flushPromises()

    expect(mockPushToast).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'error', title: 'Could not delete 1 course.' }),
    )
    expect(wrapper.findAll('[data-testid="archive-course-row"]')).toHaveLength(1)
  })

  it('opens the archived course snapshot when a row is tapped', async () => {
    mockArchivedCourses.value = [algebra, biology]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.findAll('[data-testid="archive-course-row"]')[1]!.trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ name: 'archived-course', params: { courseId: 2 } })
  })

  it('routes back to the calendar from the header', async () => {
    mockArchivedCourses.value = [algebra]

    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-testid="archive-back"]').trigger('click')
    expect(mockPush).toHaveBeenCalledWith({ name: 'calendar' })
  })

  it('shows an error state and retries the archive load', async () => {
    mockLoadArchive.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mountView()
    await flushPromises()

    const errorBox = wrapper.get('[data-testid="archive-error"]')
    expect(errorBox.text()).toContain('Archive failed to load.')

    mockArchivedCourses.value = [algebra]
    mockLoadArchive.mockResolvedValue(undefined)
    await errorBox.get('button').trigger('click')
    await flushPromises()

    expect(mockLoadArchive).toHaveBeenCalledTimes(2)
    expect(wrapper.find('[data-testid="archive-course-row"]').exists()).toBe(true)
  })
})
