// ponytail: pure event-form state mapping between the form and AcademicEventRequest.

import type { AcademicEventRequest, AcademicEventResponse } from '@/types/api'

/** Editable academic event form state. */
export interface EventFormState {
  /** Required after trim. */
  title: string
  /** Required course. */
  courseId: number | null
  /** Empty becomes `null` in the request. */
  description: string
  /** `YYYY-MM-DD`. Required. */
  deadlineDate: string
  /** `HH:mm` in 24-hour time. Required. */
  deadlineTime: string
}

/** Default deadline time for a new event: the end of the deadline day. */
export const DEFAULT_DEADLINE_TIME = '23:59'

const EMPTY_FORM: EventFormState = {
  title: '',
  courseId: null,
  description: '',
  deadlineDate: '',
  deadlineTime: DEFAULT_DEADLINE_TIME,
}

/** Converts a loaded event into form state, splitting the local date-time deadline. */
export function fromEvent(event: AcademicEventResponse): EventFormState {
  const [date, time] = event.deadline.split('T')
  return {
    title: event.title,
    courseId: event.courseId,
    description: event.description ?? '',
    deadlineDate: date ?? '',
    deadlineTime: time ? time.slice(0, 5) : DEFAULT_DEADLINE_TIME,
  }
}

/** Builds an event request from the form. `noteId` keeps the source-note link on edit. */
export function toEventRequest(form: EventFormState, noteId?: string | null): AcademicEventRequest {
  const description = form.description.trim()
  return {
    // formCanSave() guards this before a save.
    courseId: form.courseId as number,
    noteId: noteId ?? null,
    title: form.title.trim(),
    description: description ? description : null,
    deadline: `${form.deadlineDate}T${form.deadlineTime}:00`,
  }
}

/** Reports whether the form differs from the loaded event. A null event is new. */
export function formIsDirty(form: EventFormState, event: AcademicEventResponse | null): boolean {
  const base = event ? fromEvent(event) : EMPTY_FORM
  return (
    form.title !== base.title ||
    form.courseId !== base.courseId ||
    form.description !== base.description ||
    form.deadlineDate !== base.deadlineDate ||
    form.deadlineTime !== base.deadlineTime
  )
}

/** Reports whether the form has a non-blank title, a course, and a full deadline. */
export function formCanSave(form: EventFormState): boolean {
  return (
    form.title.trim().length > 0 &&
    form.courseId !== null &&
    form.deadlineDate.length > 0 &&
    form.deadlineTime.length > 0
  )
}
