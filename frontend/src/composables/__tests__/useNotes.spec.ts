import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notesApi } from '@/api'
import { useNotes } from '../useNotes'
import type { NoteSummaryResponse } from '@/types/api'

const summary: NoteSummaryResponse = {
  id: 'note-1',
  courseId: 1,
  title: 'Lecture 7',
  preview: 'Short lecture note',
  truncated: false,
  contentLength: 18,
  entryDate: '2026-10-05',
  createdAt: '2026-10-05T09:30:00Z',
  updatedAt: '2026-10-05T11:00:00Z',
}

describe('useNotes', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useNotes().resetNotes()
  })

  it('loads notes once per intent', async () => {
    const list = vi.spyOn(notesApi, 'list').mockResolvedValue([summary])
    const notes = useNotes()

    await notes.loadNotes()
    await notes.loadNotes()

    expect(list).toHaveBeenCalledTimes(1)
    expect(notes.notes.value).toEqual([summary])
    expect(notes.loading.value).toBe(false)
    expect(notes.error.value).toBeNull()
  })

  it('reloads when forced', async () => {
    const list = vi.spyOn(notesApi, 'list').mockResolvedValue([summary])
    const notes = useNotes()

    await notes.loadNotes()
    await notes.loadNotes(true)

    expect(list).toHaveBeenCalledTimes(2)
  })

  it('stores error message when list fails', async () => {
    vi.spyOn(notesApi, 'list').mockRejectedValue(new Error('Network error'))
    const notes = useNotes()

    await notes.loadNotes()

    expect(notes.notes.value).toEqual([])
    expect(notes.loading.value).toBe(false)
    expect(notes.error.value).toBe('Network error')
  })
})
