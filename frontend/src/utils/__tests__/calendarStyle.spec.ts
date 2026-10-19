import { describe, it, expect, afterEach } from 'vitest'
import { getHourHeight } from '../calendarStyle'

const HOUR_HEIGHT_VAR = '--calendar-hour-height'

afterEach(() => {
  document.documentElement.style.removeProperty(HOUR_HEIGHT_VAR)
})

describe('getHourHeight', () => {
  it('falls back to 48 when the variable is unset', () => {
    expect(getHourHeight()).toBe(48)
  })

  it('reads the pixel value from the variable', () => {
    document.documentElement.style.setProperty(HOUR_HEIGHT_VAR, '80px')
    expect(getHourHeight()).toBe(80)
  })

  it('falls back when the value is not a positive number', () => {
    document.documentElement.style.setProperty(HOUR_HEIGHT_VAR, '0px')
    expect(getHourHeight()).toBe(48)
  })
})
