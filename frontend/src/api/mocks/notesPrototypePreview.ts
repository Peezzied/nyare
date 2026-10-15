// ponytail: visual-prototype preview data. Mock mode only, never production.

import { COURSE_PALETTE_24, type CoursePaletteColor } from '@/constants/palette'
import type { NoteSummaryResponse } from '@/types/api'
import picturePhotoUrl from '@/assets/preview/photo-note-placeholder.svg'

/** Enables prototype preview cards. Reads the mock flag at call time. */
export function prototypePreviewEnabled(): boolean {
  return import.meta.env.VITE_USE_MOCKS === 'true'
}

const PROTOTYPE_BADGE_IDS: Record<number, string> = {
  1: 'flamingo',
  2: 'sky',
  3: 'banana',
  4: 'sage',
}

/** Returns the reference badge color for a prototype course. Returns undefined otherwise. */
export function prototypeBadgeFor(courseId: number): CoursePaletteColor | undefined {
  const id = PROTOTYPE_BADGE_IDS[courseId]
  if (!id) {
    return undefined
  }
  return COURSE_PALETTE_24.find((color) => color.id === id)
}

export interface PictureNotePreview {
  readonly note: NoteSummaryResponse
  readonly photoUrl: string
}

/** Standalone picture-note example. Renders only when preview is enabled. */
export const pictureNotePreview: PictureNotePreview = {
  note: {
    id: 'preview-picture-note',
    courseId: 2,
    title: 'Board snapshot',
    preview: 'Formulas from the review session.',
    truncated: false,
    contentLength: 33,
    entryDate: '2026-09-28',
    createdAt: '2026-09-28T10:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
  },
  photoUrl: picturePhotoUrl,
}
