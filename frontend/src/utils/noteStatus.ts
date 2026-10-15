// ponytail: note status derivation and word count utilities.

/** AI processing state of a note. `getNoteProcessingStatus` defines each value. */
export type NoteProcessingStatus = 'draft' | 'unprocessed' | 'dirty' | 'processed'

/** Note fields that `getNoteProcessingStatus` reads. */
export interface NoteStatusInput {
  /** True when the note exists on the backend. */
  readonly isSaved: boolean
  /** True when the editor holds edits that are not saved yet. */
  readonly isDirty?: boolean
  readonly updatedAt?: string | null
  readonly lastProcessedAt?: string | null
}

/** Label and Tailwind classes for a note status badge. */
export interface NoteStatusConfig {
  readonly label: string
  readonly classes: string
}

/**
 * Derives the AI processing status of a note.
 * - 'draft': Note is not yet saved to the backend.
 * - 'unprocessed': Saved note without a lastProcessedAt timestamp.
 * - 'dirty': Note was edited since last processing or has unsaved client edits.
 * - 'processed': Note is up to date with the AI planner.
 */
export function getNoteProcessingStatus(input: NoteStatusInput): NoteProcessingStatus {
  if (!input.isSaved) {
    return 'draft'
  }
  if (!input.lastProcessedAt) {
    return 'unprocessed'
  }
  if (input.isDirty) {
    return 'dirty'
  }
  // Skip the timestamp check when either timestamp fails to parse.
  if (input.updatedAt) {
    const updated = new Date(input.updatedAt).getTime()
    const processed = new Date(input.lastProcessedAt).getTime()
    if (!Number.isNaN(updated) && !Number.isNaN(processed) && updated > processed) {
      return 'dirty'
    }
  }
  return 'processed'
}

/**
 * Returns label and Tailwind classes for a processing status badge.
 */
export function getNoteStatusConfig(status: NoteProcessingStatus): NoteStatusConfig {
  switch (status) {
    case 'draft':
      return {
        label: 'Draft',
        classes: 'border-slate-300 bg-slate-100 text-slate-600',
      }
    case 'unprocessed':
      return {
        label: 'Unprocessed',
        classes: 'border-amber-300 bg-amber-50 text-amber-700',
      }
    case 'dirty':
      return {
        label: 'Pending update',
        classes: 'border-orange-300 bg-orange-50 text-orange-700',
      }
    case 'processed':
      return {
        label: 'Processed',
        classes: 'border-emerald-300 bg-emerald-50 text-emerald-700',
      }
  }
}

/**
 * Calculates word count from markdown content.
 * Strips markdown symbols and image references before splitting.
 */
export function countWords(content?: string | null): number {
  if (!content || !content.trim()) {
    return 0
  }
  const clean = content
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#*_~>`-]/g, ' ')
    .trim()

  if (!clean) {
    return 0
  }
  // Count only tokens with a letter or digit, so leftover punctuation does not count as a word.
  return clean
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token))
    .length
}

/**
 * Formats a word count into a human-readable string.
 */
export function formatWordCount(count: number): string {
  return count === 1 ? '1 word' : `${count} words`
}
