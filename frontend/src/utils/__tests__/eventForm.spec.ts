import { describe, expect, it } from 'vitest'
import type { AcademicEventResponse } from '@/types/api'
import {
  DEFAULT_DEADLINE_TIME,
  formCanSave,
  formIsDirty,
  fromEvent,
  toEventRequest,
  type EventFormState,
} from '../eventForm'

function makeEvent(overrides: Partial<AcademicEventResponse> = {}): AcademicEventResponse {
  return {
    id: 'event-1',
    courseId: 7,
    noteId: 'note-1',
    title: 'CS 201 Midterm',
    description: 'Covers chapters 1 to 5',
    deadline: '2026-10-22T09:00:00',
    createdAt: '2026-10-15T09:00:00Z',
    ...overrides,
  }
}

function makeForm(overrides: Partial<EventFormState> = {}): EventFormState {
  return {
    title: '',
    courseId: null,
    description: '',
    deadlineDate: '',
    deadlineTime: DEFAULT_DEADLINE_TIME,
    ...overrides,
  }
}

function makeValidForm(overrides: Partial<EventFormState> = {}): EventFormState {
  return makeForm({
    title: 'Exam',
    courseId: 3,
    deadlineDate: '2026-10-22',
    deadlineTime: '09:00',
    ...overrides,
  })
}

describe('eventForm', () => {
  describe('formCanSave', () => {
    it('requires a non-blank title after trim', () => {
      expect(formCanSave(makeValidForm({ title: '   ' }))).toBe(false)
      expect(formCanSave(makeValidForm())).toBe(true)
    })

    it('requires a course', () => {
      expect(formCanSave(makeValidForm({ courseId: null }))).toBe(false)
    })

    it('requires a deadline date', () => {
      expect(formCanSave(makeValidForm({ deadlineDate: '' }))).toBe(false)
    })

    it('requires a deadline time', () => {
      expect(formCanSave(makeValidForm({ deadlineTime: '' }))).toBe(false)
    })
  })

  describe('fromEvent', () => {
    it('splits the deadline into date and HH:mm parts', () => {
      expect(fromEvent(makeEvent())).toEqual({
        title: 'CS 201 Midterm',
        courseId: 7,
        description: 'Covers chapters 1 to 5',
        deadlineDate: '2026-10-22',
        deadlineTime: '09:00',
      })
    })

    it('uses the default time when the deadline has no time part', () => {
      const form = fromEvent(makeEvent({ deadline: '2026-10-22' }))
      expect(form.deadlineDate).toBe('2026-10-22')
      expect(form.deadlineTime).toBe(DEFAULT_DEADLINE_TIME)
    })

    it('maps a missing description to an empty string', () => {
      expect(fromEvent(makeEvent({ description: null })).description).toBe('')
    })
  })

  describe('toEventRequest', () => {
    it('trims the title and emits the deadline with seconds', () => {
      const request = toEventRequest(makeValidForm({ title: '  Final exam  ' }), 'note-9')
      expect(request.title).toBe('Final exam')
      expect(request.courseId).toBe(3)
      expect(request.noteId).toBe('note-9')
      expect(request.deadline).toBe('2026-10-22T09:00:00')
    })

    it('maps a blank description to null', () => {
      const request = toEventRequest(makeValidForm({ description: '   ' }))
      expect(request.description).toBeNull()
    })

    it('defaults noteId to null when omitted', () => {
      expect(toEventRequest(makeValidForm()).noteId).toBeNull()
    })
  })

  describe('formIsDirty', () => {
    it('treats a blank new event as clean', () => {
      expect(formIsDirty(makeForm(), null)).toBe(false)
    })

    it('treats a new event as dirty after any input', () => {
      expect(formIsDirty(makeForm({ title: 'Exam' }), null)).toBe(true)
      expect(formIsDirty(makeForm({ courseId: 3 }), null)).toBe(true)
      expect(formIsDirty(makeForm({ description: 'Notes' }), null)).toBe(true)
      expect(formIsDirty(makeForm({ deadlineDate: '2026-10-22' }), null)).toBe(true)
      expect(formIsDirty(makeForm({ deadlineTime: '09:00' }), null)).toBe(true)
    })

    it('treats an unchanged loaded event as clean', () => {
      const event = makeEvent()
      expect(formIsDirty(fromEvent(event), event)).toBe(false)
    })

    it('detects a change against a loaded event', () => {
      const event = makeEvent()
      expect(formIsDirty({ ...fromEvent(event), title: 'Final exam' }, event)).toBe(true)
      expect(formIsDirty({ ...fromEvent(event), deadlineTime: '10:30' }, event)).toBe(true)
    })
  })
})
