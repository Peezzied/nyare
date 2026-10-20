import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notesApi, studyPlannerApi } from '@/api'
import { useNotes } from '../useNotes'
import type { NoteResponse, NoteSummaryResponse } from '@/types/api'

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

  it('saveNote resolves with the saved note when the planner status refresh fails', async () => {
    const saved: NoteResponse = {
      id: 'note-9',
      courseId: 1,
      title: 'Lecture 8',
      content: 'Full note content',
      entryDate: '2026-10-05',
      createdAt: '2026-10-05T09:30:00Z',
      updatedAt: '2026-10-05T11:00:00Z',
    }
    vi.spyOn(notesApi, 'create').mockResolvedValue(saved)
    vi.spyOn(studyPlannerApi, 'status').mockRejectedValue(new Error('status down'))
    const notes = useNotes()

    await expect(notes.saveNote({ courseId: 1, content: 'Full note content' })).resolves.toEqual(
      saved,
    )
    expect(notes.notes.value.some((n) => n.id === 'note-9')).toBe(true)
  })
})
