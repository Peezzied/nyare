import { describe, expect, it } from 'vitest'
import { resolveSwipe } from '../swipeGesture'

describe('resolveSwipe', () => {
  it('maps a fast left swipe to the next day (+1) per spec acceptance scenario 1', () => {
    expect(resolveSwipe(-80, 5, 150)).toBe(1)
  })

  it('maps a fast right swipe to the previous day (-1) per spec acceptance scenario 2', () => {
    expect(resolveSwipe(80, 5, 150)).toBe(-1)
  })

  it('returns 0 for sub-threshold displacement (snap back, no date change)', () => {
    expect(resolveSwipe(-20, 2, 150)).toBe(0)
    expect(resolveSwipe(29, 0, 100)).toBe(0)
  })

  it('returns 0 when the gesture exceeds the 300ms window', () => {
    expect(resolveSwipe(-120, 5, 450)).toBe(0)
  })

  it('yields to vertical scrolling when |dy| exceeds |dx|', () => {
    expect(resolveSwipe(-60, 120, 150)).toBe(0)
    expect(resolveSwipe(10, -200, 150)).toBe(0)
  })

  it('commits exactly at the 30px threshold inside the time window', () => {
    expect(resolveSwipe(-30, 0, 300)).toBe(1)
    expect(resolveSwipe(30, 0, 300)).toBe(-1)
  })
})
