import { describe, expect, it } from 'vitest'
import { caretScrollDelta } from '@/utils/caretFollow'

describe('caretScrollDelta', () => {
  it('returns a positive delta when the caret is below the band', () => {
    expect(caretScrollDelta(700, 724, 0, 700)).toBe(32)
  })

  it('returns a negative delta when the caret is above the band', () => {
    expect(caretScrollDelta(20, 44, 100, 700)).toBe(-88)
  })

  it('returns zero when the caret is inside the band', () => {
    expect(caretScrollDelta(300, 324, 0, 700)).toBe(0)
  })

  it('returns a delta when the caret sits inside the padding zone', () => {
    expect(caretScrollDelta(690, 694, 0, 700)).toBe(2)
  })
})
