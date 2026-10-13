import { describe, it, expect } from 'vitest'
import {
  COURSE_COLORS,
  COURSE_PALETTE_24,
  DEFAULT_COURSE_COLOR,
  FALLBACK_COURSE_COLOR,
  getCourseBadgeClasses,
  getCourseBadgeClassString,
  getCourseBadgeStyle,
  getCourseColor,
  getCourseColorIndex,
  getCourseDotClass,
  getCourseDotStyle,
} from '../courseColors'

describe('courseColors', () => {
  describe('COURSE_COLORS palette definitions', () => {
    it('contains exactly 24 colors matching Section 4 of DESIGN.md', () => {
      expect(COURSE_COLORS).toHaveLength(24)
      expect(COURSE_PALETTE_24).toBe(COURSE_COLORS)
    })

    it('verifies all 24 color definitions match the Google Calendar parity specification', () => {
      const expected = [
        {
          index: 0,
          name: 'Tomato',
          solid: '#D50000',
          badgeBg: '#FFEBEE',
          badgeText: '#B71C1C',
          badgeBorder: '#EF9A9A',
        },
        {
          index: 1,
          name: 'Flamingo',
          solid: '#E67C73',
          badgeBg: '#FDEAE8',
          badgeText: '#C53929',
          badgeBorder: '#F5B0AA',
        },
        {
          index: 2,
          name: 'Radicchio',
          solid: '#AD1457',
          badgeBg: '#FCE4EC',
          badgeText: '#880E4F',
          badgeBorder: '#F48FB1',
        },
        {
          index: 3,
          name: 'Cherry Blossom',
          solid: '#D81B60',
          badgeBg: '#FCE4EC',
          badgeText: '#AD1457',
          badgeBorder: '#F48FB1',
        },
        {
          index: 4,
          name: 'Tangerine',
          solid: '#F4511E',
          badgeBg: '#FBE9E7',
          badgeText: '#BF360C',
          badgeBorder: '#FFAB91',
        },
        {
          index: 5,
          name: 'Pumpkin',
          solid: '#EF6C00',
          badgeBg: '#FFF3E0',
          badgeText: '#E65100',
          badgeBorder: '#FFCC80',
        },
        {
          index: 6,
          name: 'Mango',
          solid: '#F57C00',
          badgeBg: '#FFF3E0',
          badgeText: '#EF6C00',
          badgeBorder: '#FFE0B2',
        },
        {
          index: 7,
          name: 'Banana',
          solid: '#F6BF26',
          badgeBg: '#FEF9E7',
          badgeText: '#B78103',
          badgeBorder: '#FCE793',
        },
        {
          index: 8,
          name: 'Lemon',
          solid: '#FBC02D',
          badgeBg: '#FFFDE7',
          badgeText: '#F57F17',
          badgeBorder: '#FFF59D',
        },
        {
          index: 9,
          name: 'Citron',
          solid: '#AFB42B',
          badgeBg: '#F9FBE7',
          badgeText: '#827717',
          badgeBorder: '#E6EE9C',
        },
        {
          index: 10,
          name: 'Basil',
          solid: '#0B8043',
          badgeBg: '#E6F4EA',
          badgeText: '#0D652D',
          badgeBorder: '#A8DAB5',
        },
        {
          index: 11,
          name: 'Sage',
          solid: '#33B679',
          badgeBg: '#E8F8F0',
          badgeText: '#1E8E5A',
          badgeBorder: '#A2E2BF',
        },
        {
          index: 12,
          name: 'Avocado',
          solid: '#689F38',
          badgeBg: '#F1F8E9',
          badgeText: '#33691E',
          badgeBorder: '#C5E1A5',
        },
        {
          index: 13,
          name: 'Pistachio',
          solid: '#7CB342',
          badgeBg: '#F1F8E9',
          badgeText: '#558B2F',
          badgeBorder: '#DCEDC8',
        },
        {
          index: 14,
          name: 'Eucalyptus',
          solid: '#00897B',
          badgeBg: '#E0F2F1',
          badgeText: '#004D40',
          badgeBorder: '#80CBC4',
        },
        {
          index: 15,
          name: 'Peacock',
          solid: '#039BE5',
          badgeBg: '#E1F5FE',
          badgeText: '#0277BD',
          badgeBorder: '#81D4FA',
        },
        {
          index: 16,
          name: 'Sky',
          solid: '#29B6F6',
          badgeBg: '#E1F5FE',
          badgeText: '#0288D1',
          badgeBorder: '#B3E5FC',
        },
        {
          index: 17,
          name: 'Blueberry',
          solid: '#3F51B5',
          badgeBg: '#E8EAF6',
          badgeText: '#283593',
          badgeBorder: '#9FA8DA',
        },
        {
          index: 18,
          name: 'Cobalt',
          solid: '#1E88E5',
          badgeBg: '#E3F2FD',
          badgeText: '#1565C0',
          badgeBorder: '#90CAF9',
        },
        {
          index: 19,
          name: 'Grape',
          solid: '#8E24AA',
          badgeBg: '#F3E5F5',
          badgeText: '#6A1B9A',
          badgeBorder: '#CE93D8',
        },
        {
          index: 20,
          name: 'Amethyst',
          solid: '#9C27B0',
          badgeBg: '#F3E5F5',
          badgeText: '#7B1FA2',
          badgeBorder: '#BA68C8',
        },
        {
          index: 21,
          name: 'Lavender',
          solid: '#7986CB',
          badgeBg: '#E8EAF6',
          badgeText: '#3949AB',
          badgeBorder: '#C5CAE9',
        },
        {
          index: 22,
          name: 'Wisteria',
          solid: '#B39DDB',
          badgeBg: '#EDE7F6',
          badgeText: '#512DA8',
          badgeBorder: '#D1C4E9',
        },
        {
          index: 23,
          name: 'Graphite',
          solid: '#616161',
          badgeBg: '#EEEEEE',
          badgeText: '#212121',
          badgeBorder: '#BDBDBD',
        },
      ]

      expected.forEach((item) => {
        const color = COURSE_COLORS[item.index]
        expect(color).toBeDefined()
        expect(color?.name).toBe(item.name)
        expect(color?.solid).toBe(item.solid)
        expect(color?.solidMarker).toBe(item.solid)
        expect(color?.badgeBg).toBe(item.badgeBg)
        expect(color?.badgeBackground).toBe(item.badgeBg)
        expect(color?.badgeText).toBe(item.badgeText)
        expect(color?.badgeBorder).toBe(item.badgeBorder)
        expect(color?.bg).toBe(item.badgeBg)
        expect(color?.text).toBe(item.badgeText)
        expect(color?.border).toBe(item.badgeBorder)
      })
    })
  })

  describe('deterministic index resolution', () => {
    it('resolves direct indices within the 0 to 23 range', () => {
      expect(getCourseColorIndex(0)).toBe(0)
      expect(getCourseColorIndex(5)).toBe(5)
      expect(getCourseColorIndex(23)).toBe(23)
    })

    it('wraps around modulo 24 for values greater than or equal to 24', () => {
      expect(getCourseColorIndex(24)).toBe(0)
      expect(getCourseColorIndex(25)).toBe(1)
      expect(getCourseColorIndex(48)).toBe(0)
      expect(getCourseColorIndex(100)).toBe(4) // 100 % 24 = 4 (Tangerine)
    })

    it('handles negative identifiers gracefully', () => {
      expect(getCourseColorIndex(-1)).toBe(1)
      expect(getCourseColorIndex(-24)).toBe(0)
    })

    it('floors floating-point identifiers', () => {
      expect(getCourseColorIndex(3.9)).toBe(3)
    })

    it('returns default Graphite index (23) for undefined, null, and non-finite inputs', () => {
      expect(getCourseColorIndex(undefined)).toBe(23)
      expect(getCourseColorIndex(null)).toBe(23)
      expect(getCourseColorIndex(Number.NaN)).toBe(23)
    })
  })

  describe('getCourseColor', () => {
    it('returns the correct course definition for valid course identifiers', () => {
      const tomato = getCourseColor(0)
      expect(tomato.name).toBe('Tomato')
      expect(tomato.solid).toBe('#D50000')

      const flamingo = getCourseColor(1)
      expect(flamingo.name).toBe('Flamingo')
      expect(flamingo.solid).toBe('#E67C73')

      const graphite = getCourseColor(23)
      expect(graphite.name).toBe('Graphite')
      expect(graphite.solid).toBe('#616161')
    })

    it('wraps around modulo 24 for large identifiers', () => {
      const wrappedTomato = getCourseColor(24)
      expect(wrappedTomato.name).toBe('Tomato')
      expect(wrappedTomato.index).toBe(0)

      const wrappedFlamingo = getCourseColor(49)
      expect(wrappedFlamingo.name).toBe('Flamingo')
      expect(wrappedFlamingo.index).toBe(1)
    })

    it('returns DEFAULT_COURSE_COLOR when courseId is null or undefined', () => {
      expect(getCourseColor(null)).toBe(DEFAULT_COURSE_COLOR)
      expect(getCourseColor(undefined)).toBe(DEFAULT_COURSE_COLOR)
      expect(DEFAULT_COURSE_COLOR.name).toBe('Graphite')
      expect(FALLBACK_COURSE_COLOR).toBe(DEFAULT_COURSE_COLOR)
    })
  })

  describe('badge background, text, and border classes', () => {
    it('provides discrete Tailwind classes for badge background, text, and border', () => {
      const classes = getCourseBadgeClasses(0)
      expect(classes.bg).toBe('bg-[#FFEBEE]')
      expect(classes.text).toBe('text-[#B71C1C]')
      expect(classes.border).toBe('border-[#EF9A9A]')
    })

    it('provides combined Tailwind class string for badges', () => {
      const classString = getCourseBadgeClassString(0)
      expect(classString).toBe('bg-[#FFEBEE] text-[#B71C1C] border-[#EF9A9A]')
    })

    it('accepts a CourseColorDef object directly in getCourseBadgeClasses', () => {
      const sage = getCourseColor(11)
      const classes = getCourseBadgeClasses(sage)
      expect(classes.bg).toBe('bg-[#E8F8F0]')
      expect(classes.text).toBe('text-[#1E8E5A]')
      expect(classes.border).toBe('border-[#A2E2BF]')
    })

    it('provides fallback badge classes when courseId is undefined or null', () => {
      const classes = getCourseBadgeClasses(null)
      expect(classes.bg).toBe('bg-[#EEEEEE]')
      expect(classes.text).toBe('text-[#212121]')
      expect(classes.border).toBe('border-[#BDBDBD]')
    })
  })

  describe('badge and dot style helpers', () => {
    it('returns inline style object for badges', () => {
      const style = getCourseBadgeStyle(0)
      expect(style.backgroundColor).toBe('#FFEBEE')
      expect(style.color).toBe('#B71C1C')
      expect(style.borderColor).toBe('#EF9A9A')
    })

    it('returns solid marker dot class and style', () => {
      expect(getCourseDotClass(0)).toBe('bg-[#D50000]')
      expect(getCourseDotStyle(0)).toEqual({ backgroundColor: '#D50000' })

      const cobalt = getCourseColor(18)
      expect(getCourseDotClass(cobalt)).toBe('bg-[#1E88E5]')
      expect(getCourseDotStyle(cobalt)).toEqual({ backgroundColor: '#1E88E5' })
    })

    it('returns fallback dot class and style when courseId is null or undefined', () => {
      expect(getCourseDotClass(undefined)).toBe('bg-[#616161]')
      expect(getCourseDotStyle(undefined)).toEqual({ backgroundColor: '#616161' })
    })
  })
})
