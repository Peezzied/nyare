import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskRow from '../TaskRow.vue'
import { useCatalog } from '@/composables/useCatalog'
import type { TaskResponse } from '@/types/api'

function createSampleTask(overrides: Partial<TaskResponse> = {}): TaskResponse {
  return {
    id: 'task-test-1',
    courseId: 1,
    noteId: null,
    title: 'Implement archive',
    description: null,
    scheduledDate: '2026-10-21',
    duration: 'PT30M',
    status: 'TODO',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
    ...overrides,
  }
}

describe('TaskRow due date icon and overlay label', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-21T12:00:00Z'))
    useCatalog().resetCatalog()
  })

  it('renders a Sun icon and colorized "Today" badge in ocean cyan when task is due today', () => {
    const task = createSampleTask({ scheduledDate: '2026-10-21' })
    const wrapper = mount(TaskRow, {
      props: {
        task,
        courseName: 'CS 201',
        dueDate: '2026-10-21',
        time: '',
      },
    })

    const badge = wrapper.find('.rounded-full.bg-slate-900\\/90')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('Today')
    expect(badge.classes()).toContain('absolute')
    expect(badge.classes()).toContain('-bottom-1')
    expect(badge.classes()).toContain('border-sky-500/30')
    expect((badge.element as HTMLElement).style.color).toBe('rgb(56, 189, 248)')

    const svg = wrapper.find('.size-6')
    expect(svg.exists()).toBe(true)
    expect(svg.find('circle').exists()).toBe(true)
    expect((svg.element as SVGElement).style.color).toBe('rgb(0, 164, 200)')
  })

  it('renders a Calendar icon and colorized date badge for future date', () => {
    const task = createSampleTask({ scheduledDate: '2026-10-25' })
    const wrapper = mount(TaskRow, {
      props: {
        task,
        courseName: 'CS 201',
        dueDate: '2026-10-25',
        time: '',
      },
    })

    const badge = wrapper.find('.rounded-full.bg-slate-900\\/90')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('10/25')
    expect(badge.classes()).toContain('border-emerald-500/30')
    expect((badge.element as HTMLElement).style.color).toBe('rgb(52, 211, 153)')

    const svg = wrapper.find('.size-6')
    expect(svg.exists()).toBe(true)
    expect((svg.element as SVGElement).style.color).toBe('rgb(16, 185, 129)')
  })

  it('renders a Calendar icon and colorized coral red badge for overdue date', () => {
    const task = createSampleTask({ scheduledDate: '2026-10-19' })
    const wrapper = mount(TaskRow, {
      props: {
        task,
        courseName: 'CS 201',
        dueDate: '2026-10-19',
        time: '',
      },
    })

    const badge = wrapper.find('.rounded-full.bg-slate-900\\/90')
    expect(badge.exists()).toBe(true)
    expect(badge.classes()).toContain('border-red-500/30')
    expect((badge.element as HTMLElement).style.color).toBe('rgb(248, 113, 113)')

    const svg = wrapper.find('.size-6')
    expect((svg.element as SVGElement).style.color).toBe('rgb(239, 68, 68)')
  })

  it('renders no overlay badge when dueDate is null', () => {
    const task = createSampleTask({ scheduledDate: null })
    const wrapper = mount(TaskRow, {
      props: {
        task,
        courseName: 'CS 201',
        dueDate: null,
        time: '',
      },
    })

    const badge = wrapper.find('.rounded-full.bg-slate-900\\/90')
    expect(badge.exists()).toBe(false)
  })

  it('renders duration next to the compact icon badge', () => {
    const task = createSampleTask({ duration: 'PT30M' })
    const wrapper = mount(TaskRow, {
      props: {
        task,
        courseName: 'CS 201',
        dueDate: '2026-10-21',
        time: '',
      },
    })

    expect(wrapper.text()).toContain('30m')
  })
})
