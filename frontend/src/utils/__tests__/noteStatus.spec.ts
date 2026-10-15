import { describe, it, expect } from 'vitest'
import {
  getNoteProcessingStatus,
  getNoteStatusConfig,
  countWords,
  formatWordCount,
} from '../noteStatus'

describe('noteStatus utility', () => {
  describe('getNoteProcessingStatus', () => {
    it('returns draft when note is not saved', () => {
      const status = getNoteProcessingStatus({ isSaved: false })
      expect(status).toBe('draft')
    })

    it('returns unprocessed when note is saved but has no lastProcessedAt', () => {
      const status = getNoteProcessingStatus({
        isSaved: true,
        lastProcessedAt: null,
      })
      expect(status).toBe('unprocessed')
    })

    it('returns dirty when isDirty flag is true', () => {
      const status = getNoteProcessingStatus({
        isSaved: true,
        lastProcessedAt: '2026-10-13T10:00:00Z',
        updatedAt: '2026-10-13T09:00:00Z',
        isDirty: true,
      })
      expect(status).toBe('dirty')
    })

    it('returns dirty when updatedAt is newer than lastProcessedAt', () => {
      const status = getNoteProcessingStatus({
        isSaved: true,
        lastProcessedAt: '2026-10-13T10:00:00Z',
        updatedAt: '2026-10-13T10:05:00Z',
        isDirty: false,
      })
      expect(status).toBe('dirty')
    })

    it('returns processed when lastProcessedAt is equal to or newer than updatedAt', () => {
      const status = getNoteProcessingStatus({
        isSaved: true,
        lastProcessedAt: '2026-10-13T10:00:00Z',
        updatedAt: '2026-10-13T10:00:00Z',
        isDirty: false,
      })
      expect(status).toBe('processed')
    })
  })

  describe('getNoteStatusConfig', () => {
    it('returns correct label and styling for draft', () => {
      const config = getNoteStatusConfig('draft')
      expect(config.label).toBe('Draft')
      expect(config.classes).toContain('bg-slate-100')
    })

    it('returns correct label and styling for unprocessed', () => {
      const config = getNoteStatusConfig('unprocessed')
      expect(config.label).toBe('Unprocessed')
      expect(config.classes).toContain('bg-amber-50')
    })

    it('returns correct label and styling for dirty', () => {
      const config = getNoteStatusConfig('dirty')
      expect(config.label).toBe('Pending update')
      expect(config.classes).toContain('bg-orange-50')
    })

    it('returns correct label and styling for processed', () => {
      const config = getNoteStatusConfig('processed')
      expect(config.label).toBe('Processed')
      expect(config.classes).toContain('bg-emerald-50')
    })
  })

  describe('countWords and formatWordCount', () => {
    it('handles empty and whitespace-only text', () => {
      expect(countWords('')).toBe(0)
      expect(countWords(null)).toBe(0)
      expect(countWords('   \n\t  ')).toBe(0)
    })

    it('counts plain words correctly', () => {
      expect(countWords('Hello world')).toBe(2)
      expect(countWords('This is a simple test note.')).toBe(6)
    })

    it('strips markdown formatting and images when counting', () => {
      const markdown = '# Heading 1\n\n**Bold text** with *italics* and `inline code`.\n![alt](https://example.com/img.png)'
      expect(countWords(markdown)).toBe(9)
    })

    it('formats singular and plural word counts', () => {
      expect(formatWordCount(0)).toBe('0 words')
      expect(formatWordCount(1)).toBe('1 word')
      expect(formatWordCount(42)).toBe('42 words')
    })
  })
})
