import { describe, it, expect } from 'vitest'
import { durationToMinutes, minutesToDuration } from '../duration'

describe('duration utilities', () => {
  describe('durationToMinutes', () => {
    it('parses duration with hours and minutes', () => {
      expect(durationToMinutes('PT1H30M')).toBe(90)
    })

    it('parses duration with minutes only', () => {
      expect(durationToMinutes('PT45M')).toBe(45)
    })

    it('parses duration with hours only', () => {
      expect(durationToMinutes('PT2H')).toBe(120)
      expect(durationToMinutes('PT1H')).toBe(60)
    })

    it('parses zero duration', () => {
      expect(durationToMinutes('PT0M')).toBe(0)
      expect(durationToMinutes('PT0S')).toBe(0)
    })

    it('parses duration with days and hours', () => {
      expect(durationToMinutes('P1DT2H')).toBe(1560)
      expect(durationToMinutes('P1D')).toBe(1440)
    })

    it('returns null for null, undefined, or empty string', () => {
      expect(durationToMinutes(null)).toBeNull()
      expect(durationToMinutes(undefined)).toBeNull()
      expect(durationToMinutes('')).toBeNull()
      expect(durationToMinutes('   ')).toBeNull()
    })

    it('returns null for invalid ISO duration strings', () => {
      expect(durationToMinutes('invalid')).toBeNull()
      expect(durationToMinutes('PT')).toBeNull()
      expect(durationToMinutes('P')).toBeNull()
      expect(durationToMinutes('1H30M')).toBeNull()
    })
  })

  describe('minutesToDuration', () => {
    it('formats minutes into hours and minutes', () => {
      expect(minutesToDuration(90)).toBe('PT1H30M')
    })

    it('formats minutes only when under 60 minutes', () => {
      expect(minutesToDuration(45)).toBe('PT45M')
    })

    it('formats exact hours without minutes component', () => {
      expect(minutesToDuration(120)).toBe('PT2H')
      expect(minutesToDuration(60)).toBe('PT1H')
    })

    it('formats zero minutes as PT0M', () => {
      expect(minutesToDuration(0)).toBe('PT0M')
    })

    it('returns null for null, undefined, NaN, or negative values', () => {
      expect(minutesToDuration(null)).toBeNull()
      expect(minutesToDuration(undefined)).toBeNull()
      expect(minutesToDuration(Number.NaN)).toBeNull()
      expect(minutesToDuration(-15)).toBeNull()
    })
  })

  describe('round-trip conversion', () => {
    it('preserves duration minutes across conversions', () => {
      const values = [0, 15, 45, 60, 90, 120, 150]
      for (const val of values) {
        expect(durationToMinutes(minutesToDuration(val))).toBe(val)
      }
    })
  })
})
