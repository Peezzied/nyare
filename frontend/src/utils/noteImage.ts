// ponytail: image-note card style derives from image markdown in note content.

const IMAGE_MARKDOWN_SOURCE = '![^\\]]*\\]\\(\\s*([^)\\s]+)(?:\\s+[\'"][^\'"]*[\'"])?\\s*\\)'

const FIRST_IMAGE_PATTERN = new RegExp(IMAGE_MARKDOWN_SOURCE)

const ALL_IMAGES_PATTERN = new RegExp(IMAGE_MARKDOWN_SOURCE, 'g')

function isSafeImageUrl(url: string): boolean {
  return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')
}

/** Returns the first safe image URL from markdown. Returns null when none exists. */
export function extractFirstImageUrl(markdown: string | null | undefined): string | null {
  if (!markdown || typeof markdown !== 'string') {
    return null
  }
  const match = FIRST_IMAGE_PATTERN.exec(markdown)
  if (!match?.[1]) {
    return null
  }
  const url = match[1].trim()
  return isSafeImageUrl(url) ? url : null
}

/** Collapses blank lines to a single newline for card previews. */
export function collapseBlankLines(text: string): string {
  return text.replace(/\n{2,}/g, '\n')
}

/** Removes image markdown from text. Keeps surrounding words. */
export function stripImageMarkdown(markdown: string | null | undefined): string {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }
  return markdown.replace(ALL_IMAGES_PATTERN, '').trim()
}
