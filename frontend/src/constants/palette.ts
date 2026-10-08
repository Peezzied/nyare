export interface CoursePaletteColor {
  id: string
  name: string
  solid: string
  bg: string
  text: string
  border: string
}

export const COURSE_PALETTE_24: readonly CoursePaletteColor[] = [
  // Warm Reds & Corals
  { id: 'tomato', name: 'Tomato', solid: '#D50000', bg: '#FFEBEE', text: '#B71C1C', border: '#EF9A9A' },
  { id: 'flamingo', name: 'Flamingo', solid: '#E67C73', bg: '#FDEAE8', text: '#C53929', border: '#F5B0AA' },
  { id: 'radicchio', name: 'Radicchio', solid: '#AD1457', bg: '#FCE4EC', text: '#880E4F', border: '#F48FB1' },
  { id: 'cherry', name: 'Cherry Blossom', solid: '#D81B60', bg: '#FCE4EC', text: '#AD1457', border: '#F48FB1' },

  // Oranges & Ambers
  { id: 'tangerine', name: 'Tangerine', solid: '#F4511E', bg: '#FBE9E7', text: '#BF360C', border: '#FFAB91' },
  { id: 'pumpkin', name: 'Pumpkin', solid: '#EF6C00', bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },
  { id: 'mango', name: 'Mango', solid: '#F57C00', bg: '#FFF3E0', text: '#EF6C00', border: '#FFE0B2' },

  // Yellows & Limes
  { id: 'banana', name: 'Banana', solid: '#F6BF26', bg: '#FEF9E7', text: '#B78103', border: '#FCE793' },
  { id: 'lemon', name: 'Lemon', solid: '#FBC02D', bg: '#FFFDE7', text: '#F57F17', border: '#FFF59D' },
  { id: 'citron', name: 'Citron', solid: '#AFB42B', bg: '#F9FBE7', text: '#827717', border: '#E6EE9C' },

  // Greens
  { id: 'basil', name: 'Basil', solid: '#0B8043', bg: '#E6F4EA', text: '#0D652D', border: '#A8DAB5' },
  { id: 'sage', name: 'Sage', solid: '#33B679', bg: '#E8F8F0', text: '#1E8E5A', border: '#A2E2BF' },
  { id: 'avocado', name: 'Avocado', solid: '#689F38', bg: '#F1F8E9', text: '#33691E', border: '#C5E1A5' },
  { id: 'pistachio', name: 'Pistachio', solid: '#7CB342', bg: '#F1F8E9', text: '#558B2F', border: '#DCEDC8' },
  { id: 'eucalyptus', name: 'Eucalyptus', solid: '#00897B', bg: '#E0F2F1', text: '#004D40', border: '#80CBC4' },

  // Blues & Cyans
  { id: 'peacock', name: 'Peacock', solid: '#039BE5', bg: '#E1F5FE', text: '#0277BD', border: '#81D4FA' },
  { id: 'sky', name: 'Sky', solid: '#29B6F6', bg: '#E1F5FE', text: '#0288D1', border: '#B3E5FC' },
  { id: 'blueberry', name: 'Blueberry', solid: '#3F51B5', bg: '#E8EAF6', text: '#283593', border: '#9FA8DA' },
  { id: 'cobalt', name: 'Cobalt', solid: '#1E88E5', bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },

  // Purples & Violets
  { id: 'grape', name: 'Grape', solid: '#8E24AA', bg: '#F3E5F5', text: '#6A1B9A', border: '#CE93D8' },
  { id: 'amethyst', name: 'Amethyst', solid: '#9C27B0', bg: '#F3E5F5', text: '#7B1FA2', border: '#BA68C8' },
  { id: 'lavender', name: 'Lavender', solid: '#7986CB', bg: '#E8EAF6', text: '#3949AB', border: '#C5CAE9' },
  { id: 'wisteria', name: 'Wisteria', solid: '#B39DDB', bg: '#EDE7F6', text: '#512DA8', border: '#D1C4E9' },

  // Neutrals & Earth
  { id: 'graphite', name: 'Graphite', solid: '#616161', bg: '#EEEEEE', text: '#212121', border: '#BDBDBD' }
] as const

/**
 * Returns a deterministic course palette color based on course ID or index.
 */
export function getCourseColor(courseIdOrIndex: number): CoursePaletteColor {
  const index = Math.abs(courseIdOrIndex) % COURSE_PALETTE_24.length
  const color = COURSE_PALETTE_24[index]
  if (!color) {
    return COURSE_PALETTE_24[0]!
  }
  return color
}
