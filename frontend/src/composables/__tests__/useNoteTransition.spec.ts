import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  calculateTargetStyle,
  getOriginStyle,
  isReducedMotion,
  toTapOriginRect,
} from '../useNoteTransition'

function mockMatchMedia(matches: boolean): void {
  window.matchMedia = vi
    .fn<(query: string) => MediaQueryList>()
    .mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn<() => void>(),
      removeListener: vi.fn<() => void>(),
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
      dispatchEvent: vi.fn<() => boolean>(),
    }))
}

describe('useNoteTransition', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('isReducedMotion', () => {
    it('returns true when prefers-reduced-motion matches', () => {
      mockMatchMedia(true)
      expect(isReducedMotion()).toBe(true)
    })

    it('returns false when prefers-reduced-motion does not match', () => {
      mockMatchMedia(false)
      expect(isReducedMotion()).toBe(false)
    })
  })

  describe('calculateTargetStyle', () => {
    it('returns full-viewport geometry from innerWidth and innerHeight', () => {
      vi.stubGlobal('innerWidth', 480)
      vi.stubGlobal('innerHeight', 800)

      expect(calculateTargetStyle()).toEqual({
        top: '0px',
        left: '0px',
        width: '480px',
        height: '800px',
        borderRadius: '0px',
      })
    })

    it('prefers visualViewport height over innerHeight', () => {
      vi.stubGlobal('innerWidth', 480)
      vi.stubGlobal('innerHeight', 800)
      vi.stubGlobal('visualViewport', { height: 620 })

      expect(calculateTargetStyle().height).toBe('620px')
    })

    it('falls back to 390x844 when window metrics are unavailable', () => {
      vi.stubGlobal('innerWidth', 0)
      vi.stubGlobal('innerHeight', 0)

      expect(calculateTargetStyle()).toEqual({
        top: '0px',
        left: '0px',
        width: '390px',
        height: '844px',
        borderRadius: '0px',
      })
    })
  })

  describe('getOriginStyle', () => {
    it('maps the origin rect and border radius to pixel styles', () => {
      expect(
        getOriginStyle({ top: 10, left: 20, width: 160, height: 90, borderRadius: '16px' }),
      ).toEqual({
        top: '10px',
        left: '20px',
        width: '160px',
        height: '90px',
        borderRadius: '16px',
      })
    })

    it('returns the target style when origin is null', () => {
      vi.stubGlobal('innerWidth', 480)
      vi.stubGlobal('innerHeight', 800)

      expect(getOriginStyle(null)).toEqual(calculateTargetStyle())
    })
  })

  describe('toTapOriginRect', () => {
    it('builds a rect from getBoundingClientRect and computed border radius', () => {
      const el = document.createElement('div')
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        top: 12,
        left: 34,
        width: 56,
        height: 78,
        right: 90,
        bottom: 90,
        x: 34,
        y: 12,
        toJSON: () => ({}),
      })

      // jsdom returns an empty computed borderRadius, so the helper falls back to 16px
      expect(toTapOriginRect(el)).toEqual({
        top: 12,
        left: 34,
        width: 56,
        height: 78,
        borderRadius: '16px',
      })
    })
  })
})
