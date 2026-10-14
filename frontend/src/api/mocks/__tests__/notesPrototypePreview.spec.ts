import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  pictureNotePreview,
  prototypeBadgeFor,
  prototypePreviewEnabled,
} from '../notesPrototypePreview'

describe('notesPrototypePreview', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('stays disabled outside mock mode', () => {
    expect(prototypePreviewEnabled()).toBe(false)
  })

  it('enables preview in mock mode', () => {
    vi.stubEnv('VITE_USE_MOCKS', 'true')

    expect(prototypePreviewEnabled()).toBe(true)
  })

  it('maps prototype courses to reference badge colors', () => {
    expect(prototypeBadgeFor(1)?.id).toBe('flamingo')
    expect(prototypeBadgeFor(2)?.id).toBe('sky')
    expect(prototypeBadgeFor(3)?.id).toBe('banana')
    expect(prototypeBadgeFor(4)?.id).toBe('sage')
    expect(prototypeBadgeFor(99)).toBeUndefined()
  })

  it('provides the picture-note example with a bundled photo', () => {
    expect(pictureNotePreview.note.courseId).toBe(2)
    expect(pictureNotePreview.note.title).toBe('Board snapshot')
    expect(pictureNotePreview.note.preview).toBe('Formulas from the review session.')
    expect(pictureNotePreview.note.entryDate).toBe('2026-09-28')
    expect(typeof pictureNotePreview.photoUrl).toBe('string')
    expect(pictureNotePreview.photoUrl.length).toBeGreaterThan(0)
    expect(pictureNotePreview.photoUrl.startsWith('/api/')).toBe(false)
    expect(pictureNotePreview.photoUrl.startsWith('http')).toBe(false)
  })
})
