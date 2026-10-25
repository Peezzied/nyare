// ponytail: note status derivation and word count utilities.

/** AI processing state of a note. `getNoteProcessingStatus` defines each value. */
export type NoteProcessingStatus = 'draft' | 'unprocessed' | 'dirty' | 'processed' | 'skipped'

/** Note fields that `getNoteProcessingStatus` reads. */
export interface NoteStatusInput {
  /** True when the note exists on the backend. */
  readonly isSaved: boolean
  /** True when the editor holds edits that are not saved yet. */
  readonly isDirty?: boolean
  /** True when the note is excluded from AI processing. */
  readonly excludedFromAi?: boolean
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
 * - 'skipped': Saved note excluded from AI processing.
 * - 'unprocessed': Saved note without a lastProcessedAt timestamp.
 * - 'dirty': Note was edited since last processing or has unsaved client edits.
 * - 'processed': Note is up to date with the AI planner.
 */
export function getNoteProcessingStatus(input: NoteStatusInput): NoteProcessingStatus {
  if (!input.isSaved) {
    return 'draft'
  }
  if (input.excludedFromAi) {
    return 'skipped'
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
        classes: 'border-[#CBD5E1] bg-[#F1F5F9] text-[#527A8C]',
      }
    case 'unprocessed':
      return {
        label: 'Unprocessed',
        classes: 'border-[#FCE793] bg-[#FEF9E7] text-[#B78103]',
      }
    case 'dirty':
      return {
        label: 'Pending update',
        classes: 'border-[#FFCC80] bg-[#FFF3E0] text-[#E65100]',
      }
    case 'processed':
      return {
        label: 'Processed',
        classes: 'border-[#A8DAB5] bg-[#E6F4EA] text-[#0D652D]',
      }
    case 'skipped':
      return {
        label: 'Skipped by AI',
        classes: 'border-[#CBD5E1] bg-[#F1F5F9] text-[#527A8C]',
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
  return clean.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length
}

/**
 * Formats a word count into a human-readable string.
 */
export function formatWordCount(count: number): string {
  return count === 1 ? '1 word' : `${count} words`
}
