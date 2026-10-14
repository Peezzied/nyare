import { describe, it, expect } from 'vitest'
import { extractFirstImageUrl, stripImageMarkdown } from '../noteImage'

describe('extractFirstImageUrl', () => {
  it('returns image URL from markdown', () => {
    expect(extractFirstImageUrl('See ![board](/api/images/abc-123) today')).toBe(
      '/api/images/abc-123',
    )
  })

  it('returns first URL when several images exist', () => {
    expect(extractFirstImageUrl('![one](https://example.com/1.png) ![two](/api/images/b)')).toBe(
      'https://example.com/1.png',
    )
  })

  it('returns null when no image exists', () => {
    expect(extractFirstImageUrl('Plain lecture note')).toBeNull()
  })

  it('rejects unsafe URL schemes', () => {
    expect(extractFirstImageUrl('![x](javascript:alert(1))')).toBeNull()
  })

  it('returns null for missing input', () => {
    expect(extractFirstImageUrl(null)).toBeNull()
    expect(extractFirstImageUrl(undefined)).toBeNull()
  })
})

describe('stripImageMarkdown', () => {
  it('removes image syntax and keeps words', () => {
    expect(stripImageMarkdown('See ![board](/api/images/a) today')).toBe('See  today')
  })

  it('returns empty string for missing input', () => {
    expect(stripImageMarkdown(null)).toBe('')
    expect(stripImageMarkdown(undefined)).toBe('')
  })
})
