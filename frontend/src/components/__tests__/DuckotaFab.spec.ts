import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import DuckotaFab from '../DuckotaFab.vue'
import { academicEventsApi, studyPlannerApi, tasksApi } from '@/api'
import { resetAllCaches } from '@/composables/createCache'
import type { PlannerStatusResponse, ProcessSummaryResponse } from '@/types/api'

function statusWith(dirtyNoteCount: number): PlannerStatusResponse {
  return {
    hasPendingNotes: dirtyNoteCount > 0,
    dirtyNoteCount,
    dirtyDates: [],
    courseNames: [],
    pendingNotes: [],
  }
}

describe('DuckotaFab', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetAllCaches()
  })

  it('shows the pending note count as a badge and starts Process on click', async () => {
    // given
    vi.spyOn(studyPlannerApi, 'status').mockResolvedValue(statusWith(2))
    const stream = vi.spyOn(studyPlannerApi, 'streamProcess').mockResolvedValue(undefined)

    const wrapper = mount(DuckotaFab)
    await flushPromises()

    const fab = wrapper.get('[data-testid="duckota-fab"]')
    expect(fab.text()).toContain('2')

    // when
    await fab.trigger('click')

    // then
    expect(stream).toHaveBeenCalledTimes(1)
  })

  it('stays disabled when no notes are pending', async () => {
    // given
    vi.spyOn(studyPlannerApi, 'status').mockResolvedValue(statusWith(0))
    const stream = vi.spyOn(studyPlannerApi, 'streamProcess').mockResolvedValue(undefined)

    const wrapper = mount(DuckotaFab)
    await flushPromises()

    const fab = wrapper.get('[data-testid="duckota-fab"]')
    expect(fab.attributes('disabled')).toBeDefined()

    // when
    await fab.trigger('click')

    // then
    expect(stream).not.toHaveBeenCalled()
  })

  it('refetches tasks and events for affected courses when the run finishes', async () => {
    // given
    vi.spyOn(studyPlannerApi, 'status').mockResolvedValue(statusWith(1))
    const taskList = vi.spyOn(tasksApi, 'list').mockResolvedValue([])
    const eventList = vi.spyOn(academicEventsApi, 'list').mockResolvedValue([])
    const summary: ProcessSummaryResponse = {
      tasksCreated: 2,
      eventsCreated: 1,
      contextsCreated: 1,
      affectedCourseIds: [7],
    }
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(async (callbacks) => {
      callbacks.onDone(summary)
    })

    const wrapper = mount(DuckotaFab)
    await flushPromises()

    // when
    await wrapper.get('[data-testid="duckota-fab"]').trigger('click')
    await flushPromises()

    // then
    expect(taskList).toHaveBeenCalledWith({ courseId: 7 })
    expect(eventList).toHaveBeenCalledWith({ courseId: 7 })
  })
})
