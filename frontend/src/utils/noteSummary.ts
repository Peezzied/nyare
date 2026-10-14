// ponytail: note preview mapping for the note summary list.

import type { NoteResponse, NoteSummaryResponse } from '@/types/api'

export const NOTE_PREVIEW_MAX_LENGTH = 200

export function toNoteSummary(note: NoteResponse): NoteSummaryResponse {
  const content = note.content ?? ''
  const truncated = content.length > NOTE_PREVIEW_MAX_LENGTH
  const preview = truncated ? content.slice(0, NOTE_PREVIEW_MAX_LENGTH) : content
  return {
    id: note.id,
    courseId: note.courseId,
    title: note.title,
    preview,
    truncated,
    contentLength: content.length,
    entryDate: note.entryDate,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }
}
