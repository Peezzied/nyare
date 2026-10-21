import { describe, it, expect } from 'vitest'
import { devPreviewCourseNames, devPreviewNotes } from '../notesDevPreview'

describe('notesDevPreview', () => {
  it('returns the seven sample cards without calling the API', () => {
    const notes = devPreviewNotes()
    const byId = new Map(notes.map((note) => [note.id, note]))

    expect(notes.length).toBe(7)
    expect(byId.get('note-oop-notes')?.title).toBe('Notes')
    expect(byId.get('note-calc2-limits')?.preview).toContain('squeeze theorem')
    expect(byId.get('note-coa-pipeline')?.preview).toContain('Fetch, decode')
    expect(byId.get('note-philhis-japan')?.preview).toContain('occupation')
    expect(byId.get('note-oop-lab3')?.title).toBe('Lab 3 notes')
    expect(byId.get('note-calc2-integrals')?.entryDate).toBe('2026-09-28')
    expect(byId.get('note-calc2-board')?.preview.match(/!\[/g)?.length).toBe(2)
  })

  it('returns the sample course names', () => {
    const names = devPreviewCourseNames()

    expect(names.get(1)).toBe('OOP')
    expect(names.get(2)).toBe('CALC 2')
    expect(names.get(3)).toBe('COA')
    expect(names.get(4)).toBe('PHILHIS')
  })
})
