import { describe, it, expect } from 'vitest'
import { NOTE_PREVIEW_MAX_LENGTH, toNoteSummary } from '../noteSummary'
import type { NoteResponse } from '@/types/api'

function buildNote(content: string): NoteResponse {
  return {
    id: 'note-1',
    courseId: 1,
    title: 'Lecture Note',
    content,
    entryDate: '2026-10-05',
    createdAt: '2026-10-05T09:30:00Z',
    updatedAt: '2026-10-05T11:00:00Z',
    lastProcessedAt: null,
  }
}

describe('toNoteSummary', () => {
  it('maps full fields for short content', () => {
    const summary = toNoteSummary(buildNote('Short lecture note'))

    expect(summary).toEqual({
      id: 'note-1',
      courseId: 1,
      title: 'Lecture Note',
      preview: 'Short lecture note',
      truncated: false,
      contentLength: 18,
      entryDate: '2026-10-05',
      createdAt: '2026-10-05T09:30:00Z',
      updatedAt: '2026-10-05T11:00:00Z',
    })
  })

  it('truncates long content at the preview limit', () => {
    const content = 'x'.repeat(NOTE_PREVIEW_MAX_LENGTH + 1)
    const summary = toNoteSummary(buildNote(content))

    expect(summary.preview).toBe('x'.repeat(NOTE_PREVIEW_MAX_LENGTH))
    expect(summary.truncated).toBe(true)
    expect(summary.contentLength).toBe(NOTE_PREVIEW_MAX_LENGTH + 1)
  })

  it('keeps content at exactly the limit untruncated', () => {
    const summary = toNoteSummary(buildNote('y'.repeat(NOTE_PREVIEW_MAX_LENGTH)))

    expect(summary.truncated).toBe(false)
    expect(summary.preview.length).toBe(NOTE_PREVIEW_MAX_LENGTH)
  })
})
