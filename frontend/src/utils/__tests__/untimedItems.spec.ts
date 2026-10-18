import { describe, expect, it } from 'vitest'
import { Temporal } from 'temporal-polyfill'
import type { AcademicEventResponse, TaskResponse } from '@/types/api'
import { deriveUntimedItems, toSxFullDayEvent } from '../untimedItems'

interface UntimedDayItem {
  id: string
  title: string
  category: 'task' | 'event'
  courseId: number
  completed: boolean
  date: string
}

function makeTask(overrides: Partial<TaskResponse> & { id: string }): TaskResponse {
  return {
    courseId: 1,
    title: 'Sample task',
    status: 'TODO',
    createdAt: '2026-10-13T08:00:00',
    updatedAt: '2026-10-13T08:00:00',
    ...overrides
  }
}

function makeEvent(overrides: Partial<AcademicEventResponse> & { id: string }): AcademicEventResponse {
  return {
    courseId: 4,
    title: 'Sample event',
    deadline: '2026-10-14',
    createdAt: '2026-10-13T08:00:00',
    ...overrides
  }
}

describe('deriveUntimedItems', () => {
  it('includes a task scheduled on the active date with task category and date', () => {
    const tasks = [
      makeTask({ id: 't-1', courseId: 1, title: 'Review OOP lab notes', scheduledDate: '2026-10-14' })
    ]
    const result: UntimedDayItem[] = deriveUntimedItems(tasks, [], '2026-10-14')
    expect(result).toHaveLength(1)
    expect(result[0]?.category).toBe('task')
    expect(result[0]?.date).toBe('2026-10-14')
  })

  it('excludes a task with a different scheduledDate', () => {
    const tasks = [
      makeTask({ id: 't-3', courseId: 3, title: 'Read COA chapter 4', scheduledDate: '2026-10-15' })
    ]
    const result: UntimedDayItem[] = deriveUntimedItems(tasks, [], '2026-10-14')
    expect(result).toHaveLength(0)
  })

  it('excludes tasks with null or undefined scheduledDate', () => {
    const tasks = [
      makeTask({ id: 't-null', scheduledDate: null }),
      makeTask({ id: 't-undef', scheduledDate: undefined })
    ]
    const result: UntimedDayItem[] = deriveUntimedItems(tasks, [], '2026-10-14')
    expect(result).toHaveLength(0)
  })

  it('includes an event on deadline date with event category and completed false', () => {
    const events = [
      makeEvent({ id: 'e-1', courseId: 4, title: 'RPH paper deadline', deadline: '2026-10-14' })
    ]
    const result: UntimedDayItem[] = deriveUntimedItems([], events, '2026-10-14')
    expect(result).toHaveLength(1)
    expect(result[0]?.category).toBe('event')
    expect(result[0]?.completed).toBe(false)
  })

  it('excludes an event with a different deadline', () => {
    const events = [makeEvent({ id: 'e-9', deadline: '2026-10-15' })]
    const result: UntimedDayItem[] = deriveUntimedItems([], events, '2026-10-14')
    expect(result).toHaveLength(0)
  })

  it('matches an event deadline that carries a clock time', () => {
    const events = [makeEvent({ id: 'e-10', deadline: '2026-10-14T09:00:00' })]
    const result: UntimedDayItem[] = deriveUntimedItems([], events, '2026-10-14')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('e-10')
    expect(result[0]?.category).toBe('event')
  })

  it('excludes a timed deadline that falls on another day', () => {
    const events = [makeEvent({ id: 'e-11', deadline: '2026-10-15T23:59:00' })]
    expect(deriveUntimedItems([], events, '2026-10-14')).toHaveLength(0)
  })

  it('maps COMPLETED tasks to completed true and TODO or IN_PROGRESS to false', () => {
    const tasks = [
      makeTask({ id: 't-done', scheduledDate: '2026-10-14', status: 'COMPLETED' }),
      makeTask({ id: 't-todo', scheduledDate: '2026-10-14', status: 'TODO' }),
      makeTask({ id: 't-prog', scheduledDate: '2026-10-14', status: 'IN_PROGRESS' })
    ]
    const result: UntimedDayItem[] = deriveUntimedItems(tasks, [], '2026-10-14')
    expect(result.find((item) => item.id === 't-done')?.completed).toBe(true)
    expect(result.find((item) => item.id === 't-todo')?.completed).toBe(false)
    expect(result.find((item) => item.id === 't-prog')?.completed).toBe(false)
  })

  it('passes courseId and title through verbatim', () => {
    const tasks = [
      makeTask({
        id: 't-2',
        courseId: 2,
        title: 'Very long calculus problem set title that exceeds the compact pill bounds',
        scheduledDate: '2026-10-14'
      })
    ]
    const events = [
      makeEvent({ id: 'e-2', courseId: 2, title: 'CALC quiz', deadline: '2026-10-14' })
    ]
    const result: UntimedDayItem[] = deriveUntimedItems(tasks, events, '2026-10-14')
    expect(result.find((item) => item.id === 't-2')).toMatchObject({
      courseId: 2,
      title: 'Very long calculus problem set title that exceeds the compact pill bounds'
    })
    expect(result.find((item) => item.id === 'e-2')).toMatchObject({
      courseId: 2,
      title: 'CALC quiz'
    })
  })
})

describe('toSxFullDayEvent', () => {
  it('emits PlainDate start and end on the same date for untimed items', () => {
    const event = toSxFullDayEvent({
      id: 't-1',
      title: 'Review OOP lab notes',
      category: 'task',
      courseId: 1,
      completed: false,
      date: '2026-10-14'
    })
    expect(event.start).toBeInstanceOf(Temporal.PlainDate)
    expect(event.end).toBeInstanceOf(Temporal.PlainDate)
    expect(event.start.toString()).toBe('2026-10-14')
    expect(event.end.toString()).toBe('2026-10-14')
  })

  it('carries the raw item for the dateGridEvent slot', () => {
    const item = {
      id: 'e-1',
      title: 'RPH paper deadline',
      category: 'event' as const,
      courseId: 4,
      completed: false,
      date: '2026-10-14'
    }
    const event = toSxFullDayEvent(item)
    expect(event.id).toBe('e-1')
    expect(event.title).toBe('RPH paper deadline')
    expect((event as unknown as { _raw: unknown })._raw).toEqual(item)
  })
})
