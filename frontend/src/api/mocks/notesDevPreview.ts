// ponytail: isolated dev-only preview. Sample data only, never touches the backend.

import type { NoteSummaryResponse } from '@/types/api'

interface PreviewNote {
  readonly id: string
  readonly courseId: number
  readonly title: string
  readonly content: string
  readonly entryDate: string
  readonly createdAt: string
  readonly updatedAt: string
}

const PREVIEW_NOTES: readonly PreviewNote[] = [
  {
    id: 'note-oop-notes',
    courseId: 1,
    title: 'Notes',
    content: 'Preview text',
    entryDate: '2026-10-06',
    createdAt: '2026-10-06T09:00:00Z',
    updatedAt: '2026-10-06T09:05:00Z',
  },
  {
    id: 'note-calc2-limits',
    courseId: 2,
    title: 'Limits recap',
    content: 'Review one-sided limits and the squeeze theorem...',
    entryDate: '2026-10-05',
    createdAt: '2026-10-05T10:00:00Z',
    updatedAt: '2026-10-05T10:20:00Z',
  },
  {
    id: 'note-coa-pipeline',
    courseId: 3,
    title: 'Pipeline stages',
    content: 'Fetch, decode, execute, memory access...',
    entryDate: '2026-10-03',
    createdAt: '2026-10-03T11:00:00Z',
    updatedAt: '2026-10-03T11:15:00Z',
  },
  {
    id: 'note-philhis-japan',
    courseId: 4,
    title: 'Japanese period',
    content: 'Key events and policies during the occupation...',
    entryDate: '2026-10-02',
    createdAt: '2026-10-02T14:00:00Z',
    updatedAt: '2026-10-02T14:30:00Z',
  },
  {
    id: 'note-oop-lab3',
    courseId: 1,
    title: 'Lab 3 notes',
    content: 'Interfaces versus abstract classes, with examples...',
    entryDate: '2026-09-30',
    createdAt: '2026-09-30T13:00:00Z',
    updatedAt: '2026-09-30T13:20:00Z',
  },
  {
    id: 'note-calc2-integrals',
    courseId: 2,
    title: 'Integrals tips',
    content: 'Substitution first, then integration by parts.',
    entryDate: '2026-09-28',
    createdAt: '2026-09-28T15:00:00Z',
    updatedAt: '2026-09-28T15:10:00Z',
  },
]

const PREVIEW_COURSE_NAMES: ReadonlyMap<number, string> = new Map([
  [1, 'OOP'],
  [2, 'CALC 2'],
  [3, 'COA'],
  [4, 'PHILHIS'],
])

function toPreviewSummary(note: PreviewNote): NoteSummaryResponse {
  return {
    id: note.id,
    courseId: note.courseId,
    title: note.title,
    preview: note.content,
    truncated: false,
    contentLength: note.content.length,
    entryDate: note.entryDate,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }
}

/** Returns sample note cards for the local dev preview. */
export function devPreviewNotes(): NoteSummaryResponse[] {
  return PREVIEW_NOTES.map(toPreviewSummary)
}

/** Returns sample course names for the local dev preview. */
export function devPreviewCourseNames(): Map<number, string> {
  return new Map(PREVIEW_COURSE_NAMES)
}
