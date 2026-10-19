import { describe, expect, it } from 'vitest'
import type { TaskResponse } from '@/types/api'
import { minutesToDuration } from '../duration'
import {
  formCanSave,
  formIsDirty,
  formSection,
  fromTask,
  toTaskRequest,
  type TaskFormState,
} from '../taskForm'

function makeTask(overrides: Partial<TaskResponse> = {}): TaskResponse {
  return {
    id: 'task-1',
    courseId: 7,
    title: 'Read chapter 3',
    description: 'Pages 40 to 60',
    scheduledDate: '2026-10-20',
    duration: 'PT1H30M',
    status: 'TODO',
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-15T09:00:00Z',
    ...overrides,
  }
}

function makeForm(overrides: Partial<TaskFormState> = {}): TaskFormState {
  return {
    title: '',
    courseId: null,
    description: '',
    scheduledDate: '',
    durationMinutes: null,
    ...overrides,
  }
}

describe('taskForm', () => {
  describe('formCanSave', () => {
    it('requires a non-blank title after trim', () => {
      expect(formCanSave(makeForm({ title: '   ', courseId: 1 }))).toBe(false)
      expect(formCanSave(makeForm({ title: 'Study', courseId: 1 }))).toBe(true)
    })

    it('requires a course', () => {
      expect(formCanSave(makeForm({ title: 'Study' }))).toBe(false)
    })
  })

  describe('fromTask', () => {
    it('maps a loaded task to form state and converts the duration', () => {
      expect(fromTask(makeTask())).toEqual({
        title: 'Read chapter 3',
        courseId: 7,
        description: 'Pages 40 to 60',
        scheduledDate: '2026-10-20',
        durationMinutes: 90,
      })
    })

    it('maps missing optional fields to empty strings and null', () => {
      const form = fromTask(makeTask({ description: null, scheduledDate: null, duration: null }))
      expect(form.description).toBe('')
      expect(form.scheduledDate).toBe('')
      expect(form.durationMinutes).toBeNull()
    })
  })

  describe('toTaskRequest', () => {
    it('trims the title and carries the status', () => {
      const request = toTaskRequest(makeForm({ title: '  Study now  ', courseId: 3 }), 'TODO')
      expect(request.title).toBe('Study now')
      expect(request.status).toBe('TODO')
      expect(request.courseId).toBe(3)
    })

    it('maps empty description and date to null', () => {
      const request = toTaskRequest(
        makeForm({ title: 'Study', courseId: 3, description: '   ', scheduledDate: '' }),
        'TODO',
      )
      expect(request.description).toBeNull()
      expect(request.scheduledDate).toBeNull()
    })

    it('maps a Not set duration to null and a set duration to ISO-8601', () => {
      expect(toTaskRequest(makeForm({ title: 'Study', courseId: 3 }), 'TODO').duration).toBeNull()
      expect(
        toTaskRequest(makeForm({ title: 'Study', courseId: 3, durationMinutes: 45 }), 'TODO')
          .duration,
      ).toBe('PT45M')
    })
  })

  describe('durationMinutes roundtrip', () => {
    it('preserves minutes across fromTask and toTaskRequest', () => {
      for (const minutes of [15, 45, 60, 90, 120, 150]) {
        const iso = minutesToDuration(minutes)
        expect(fromTask(makeTask({ duration: iso })).durationMinutes).toBe(minutes)
        expect(
          toTaskRequest(makeForm({ title: 'Study', courseId: 3, durationMinutes: minutes }), 'TODO')
            .duration,
        ).toBe(iso)
      }
    })
  })

  describe('formIsDirty', () => {
    it('treats a blank new task as clean', () => {
      expect(formIsDirty(makeForm(), null)).toBe(false)
    })

    it('treats a new task as dirty after any input', () => {
      expect(formIsDirty(makeForm({ title: 'Study' }), null)).toBe(true)
      expect(formIsDirty(makeForm({ courseId: 3 }), null)).toBe(true)
      expect(formIsDirty(makeForm({ description: 'Notes' }), null)).toBe(true)
      expect(formIsDirty(makeForm({ scheduledDate: '2026-10-20' }), null)).toBe(true)
      expect(formIsDirty(makeForm({ durationMinutes: 30 }), null)).toBe(true)
    })

    it('treats an unchanged loaded task as clean', () => {
      const task = makeTask()
      expect(formIsDirty(fromTask(task), task)).toBe(false)
    })

    it('detects a change against a loaded task', () => {
      const task = makeTask()
      expect(formIsDirty({ ...fromTask(task), title: 'Read chapter 4' }, task)).toBe(true)
    })
  })

  describe('formSection', () => {
    it('derives SCHEDULED from a date', () => {
      expect(formSection(makeForm({ scheduledDate: '2026-10-20' }))).toBe('SCHEDULED')
    })

    it('derives LATER from a duration without a date', () => {
      expect(formSection(makeForm({ durationMinutes: 45 }))).toBe('LATER')
    })

    it('derives BACKLOG from neither date nor duration', () => {
      expect(formSection(makeForm())).toBe('BACKLOG')
    })
  })
})
