// ponytail: pure task-form state mapping between the form and TaskRequest.

import type { PlanCategory, TaskRequest, TaskResponse, TaskStatus } from '@/types/api'
import { durationToMinutes, minutesToDuration } from './duration'
import { getPlanCategory } from './planCategory'

/** Editable task form state. */
export interface TaskFormState {
  /** Required after trim. */
  title: string
  /** Required course. */
  courseId: number | null
  /** Empty becomes `null` in the request. */
  description: string
  /** `YYYY-MM-DD`. Empty becomes `null`. */
  scheduledDate: string
  /** `null` means "Not set". */
  durationMinutes: number | null
}

const EMPTY_FORM: TaskFormState = {
  title: '',
  courseId: null,
  description: '',
  scheduledDate: '',
  durationMinutes: null,
}

/** Converts a loaded task into form state, including the ISO-8601 duration. */
export function fromTask(task: TaskResponse): TaskFormState {
  return {
    title: task.title,
    courseId: task.courseId,
    description: task.description ?? '',
    scheduledDate: task.scheduledDate ?? '',
    durationMinutes: durationToMinutes(task.duration ?? null),
  }
}

/** Builds a task request from the form. Empty optional fields become `null`. */
export function toTaskRequest(form: TaskFormState, status: TaskStatus): TaskRequest {
  const description = form.description.trim()
  return {
    // formCanSave() guards this before a save.
    courseId: form.courseId as number,
    title: form.title.trim(),
    description: description ? description : null,
    scheduledDate: form.scheduledDate ? form.scheduledDate : null,
    duration: minutesToDuration(form.durationMinutes),
    status,
  }
}

/** Reports whether the form differs from the loaded task. A null task is new. */
export function formIsDirty(form: TaskFormState, task: TaskResponse | null): boolean {
  const base = task ? fromTask(task) : EMPTY_FORM
  return (
    form.title !== base.title ||
    form.courseId !== base.courseId ||
    form.description !== base.description ||
    form.scheduledDate !== base.scheduledDate ||
    form.durationMinutes !== base.durationMinutes
  )
}

/** Reports whether the form has a non-blank title and a course. */
export function formCanSave(form: TaskFormState): boolean {
  return form.title.trim().length > 0 && form.courseId !== null
}

/** Derives the Scheduled, Later, or Backlog section of the current form. */
export function formSection(form: TaskFormState): PlanCategory {
  return getPlanCategory({
    scheduledDate: form.scheduledDate,
    duration: minutesToDuration(form.durationMinutes),
  })
}
