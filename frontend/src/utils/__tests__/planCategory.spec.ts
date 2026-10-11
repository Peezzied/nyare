import { describe, it, expect } from 'vitest'
import { getPlanCategory } from '../planCategory'

describe('getPlanCategory', () => {
  it('derives SCHEDULED when a scheduled date is set', () => {
    expect(getPlanCategory({ scheduledDate: '2026-10-10', duration: 'PT1H30M' })).toBe('SCHEDULED')
    expect(getPlanCategory({ scheduledDate: '2026-10-10', duration: null })).toBe('SCHEDULED')
  })

  it('derives LATER for dateless work with a duration', () => {
    expect(getPlanCategory({ scheduledDate: null, duration: 'PT1H' })).toBe('LATER')
    expect(getPlanCategory({ duration: 'PT45M' })).toBe('LATER')
  })

  it('derives BACKLOG when neither date nor duration is set', () => {
    expect(getPlanCategory({ scheduledDate: null, duration: null })).toBe('BACKLOG')
    expect(getPlanCategory({})).toBe('BACKLOG')
    expect(getPlanCategory({ scheduledDate: '', duration: '' })).toBe('BACKLOG')
  })
})
