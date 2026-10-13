// ponytail: minimal bidirectional markdown-to-html and html-to-markdown serialization.

function parseInline(text: string): string {
  if (!text) {
    return ''
  }

  // Preserve inline code spans before other inline formatters
  const codeSpans: string[] = []
  let result = text.replace(/`([^`]+)`/g, (_match, code: string) => {
    const placeholder = `@@NYARECODE${codeSpans.length}@@`
    codeSpans.push(`<code>${code}</code>`)
    return placeholder
  })

  // Images: ![alt](src)
  result = result.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')

  // Bold and italic combination: ***text*** or ___text___
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  result = result.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>')

  // Bold: **text** or __text__
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic: *text* or _text_
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')
  result = result.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>')

  // Strikethrough: ~~text~~
  result = result.replace(/~~(.+?)~~/g, '<s>$1</s>')

  // Restore inline code spans
  result = result.replace(/@@NYARECODE(\d+)@@/g, (_match, indexString: string) => {
    const index = Number(indexString)
    return codeSpans[index] ?? ''
  })

  return result
}

export function markdownToHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return ''
  }

  const normalized = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  const blocks: string[] = []

  let listType: 'ul' | 'ol' | null = null
  let listItems: string[] = []
  let quoteLines: string[] = []
  let paragraphLines: string[] = []

  const flushList = () => {
    if (listType && listItems.length > 0) {
      blocks.push(`<${listType}>${listItems.map((item) => `<li>${item}</li>`).join('')}</${listType}>`)
    }
    listType = null
    listItems = []
  }

  const flushQuote = () => {
    if (quoteLines.length > 0) {
      const inner = quoteLines.map((line) => `<p>${parseInline(line)}</p>`).join('')
      blocks.push(`<blockquote>${inner}</blockquote>`)
      quoteLines = []
    }
  }

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      const inner = paragraphLines.map((line) => parseInline(line)).join('<br>')
      blocks.push(`<p>${inner}</p>`)
      paragraphLines = []
    }
  }

  const flushAll = () => {
    flushList()
    flushQuote()
    flushParagraph()
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()

    if (!trimmed) {
      flushAll()
      continue
    }

    // Headings: # H1, ## H2, ### H3, etc.
    const headingMatch = rawLine.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      flushAll()
      const level = headingMatch[1].length
      blocks.push(`<h${level}>${parseInline(headingMatch[2].trim())}</h${level}>`)
      continue
    }

    // Horizontal rule: --- or *** or ___
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushAll()
      blocks.push('<hr>')
      continue
    }

    // Standalone image: ![alt](src)
    const imageMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (imageMatch && imageMatch[1] !== undefined && imageMatch[2] !== undefined) {
      flushAll()
      blocks.push(`<img src="${imageMatch[2]}" alt="${imageMatch[1]}">`)
      continue
    }

    // Blockquote: > text
    const quoteMatch = rawLine.match(/^>\s?(.*)$/)
    if (quoteMatch && quoteMatch[1] !== undefined) {
      flushList()
      flushParagraph()
      quoteLines.push(quoteMatch[1])
      continue
    }

    // Bullet list: - item or * item
    const bulletMatch = rawLine.match(/^\s*[-*]\s+(.+)$/)
    if (bulletMatch && bulletMatch[1]) {
      flushQuote()
      flushParagraph()
      if (listType !== 'ul') {
        flushList()
        listType = 'ul'
      }
      listItems.push(parseInline(bulletMatch[1].trim()))
      continue
    }

    // Ordered list: 1. item
    const orderedMatch = rawLine.match(/^\s*\d+\.\s+(.+)$/)
    if (orderedMatch && orderedMatch[1]) {
      flushQuote()
      flushParagraph()
      if (listType !== 'ol') {
        flushList()
        listType = 'ol'
      }
      listItems.push(parseInline(orderedMatch[1].trim()))
      continue
    }

    // Regular paragraph line
    flushList()
    flushQuote()
    paragraphLines.push(trimmed)
  }

  flushAll()

  return blocks.join('')
}

function serializeInlineChildren(el: HTMLElement): string {
  let result = ''
  for (const child of Array.from(el.childNodes)) {
    result += serializeInline(child)
  }
  return result
}

function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || ''
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return ''
  }

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()

  switch (tag) {
    case 'strong':
    case 'b': {
      const inner = serializeInlineChildren(el)
      return inner.trim() ? `**${inner}**` : ''
    }
    case 'em':
    case 'i': {
      const inner = serializeInlineChildren(el)
      return inner.trim() ? `*${inner}*` : ''
    }
    case 's':
    case 'strike':
    case 'del': {
      const inner = serializeInlineChildren(el)
      return inner.trim() ? `~~${inner}~~` : ''
    }
    case 'u': {
      const inner = serializeInlineChildren(el)
      return inner.trim() ? `<u>${inner}</u>` : ''
    }
    case 'code': {
      const text = el.textContent || ''
      return text ? `\`${text}\`` : ''
    }
    case 'img': {
      const src = el.getAttribute('src') || ''
      const alt = el.getAttribute('alt') || ''
      return `![${alt}](${src})`
    }
    case 'br': {
      return '\n'
    }
    case 'a': {
      const href = el.getAttribute('href') || ''
      const inner = serializeInlineChildren(el)
      return href ? `[${inner}](${href})` : inner
    }
    default: {
      return serializeInlineChildren(el)
    }
  }
}

function serializeListItem(li: HTMLElement): string {
  const pChildren = Array.from(li.children).filter((c) => c.tagName.toLowerCase() === 'p')
  if (pChildren.length > 0) {
    return pChildren.map((p) => serializeInlineChildren(p as HTMLElement).trim()).join(' ')
  }
  return serializeInlineChildren(li).trim()
}

function serializeContainerToBlocks(container: HTMLElement): string[] {
  const blocks: string[] = []
  let inlineBuffer = ''

  const flushInline = () => {
    const trimmed = inlineBuffer.trim()
    if (trimmed) {
      blocks.push(trimmed)
    }
    inlineBuffer = ''
  }

  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      inlineBuffer += node.textContent || ''
      continue
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      continue
    }

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()

    if (tag === 'script' || tag === 'style') {
      continue
    }

    if (tag === 'p') {
      flushInline()
      const text = serializeInlineChildren(el).trim()
      if (text) {
        blocks.push(text)
      }
    } else if (/^h[1-6]$/.test(tag)) {
      flushInline()
      const level = Number(tag.slice(1))
      const text = serializeInlineChildren(el).trim()
      if (text) {
        blocks.push(`${'#'.repeat(level)} ${text}`)
      }
    } else if (tag === 'hr') {
      flushInline()
      blocks.push('---')
    } else if (tag === 'blockquote') {
      flushInline()
      const innerBlocks = serializeContainerToBlocks(el)
      if (innerBlocks.length > 0) {
        const quoteText = innerBlocks.join('\n')
        const lines = quoteText.split('\n').map((l) => (l.startsWith('>') ? l : `> ${l}`))
        blocks.push(lines.join('\n'))
      }
    } else if (tag === 'ul') {
      flushInline()
      const lis = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === 'li')
      const items: string[] = []
      for (const li of lis) {
        const itemText = serializeListItem(li as HTMLElement).trim()
        if (itemText) {
          items.push(`- ${itemText}`)
        }
      }
      if (items.length > 0) {
        blocks.push(items.join('\n'))
      }
    } else if (tag === 'ol') {
      flushInline()
      const lis = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === 'li')
      const items: string[] = []
      for (let i = 0; i < lis.length; i++) {
        const li = lis[i] as HTMLElement
        const itemText = serializeListItem(li).trim()
        if (itemText) {
          items.push(`${i + 1}. ${itemText}`)
        }
      }
      if (items.length > 0) {
        blocks.push(items.join('\n'))
      }
    } else if (tag === 'div') {
      flushInline()
      const innerBlocks = serializeContainerToBlocks(el)
      blocks.push(...innerBlocks)
    } else {
      inlineBuffer += serializeInline(el)
    }
  }

  flushInline()
  return blocks
}

export function htmlToMarkdown(html: string): string {
  if (!html || !html.trim()) {
    return ''
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const blocks = serializeContainerToBlocks(doc.body)

  return blocks.join('\n\n').trim()
}

export function extractImageUrls(content: string): string[] {
  if (!content) {
    return []
  }

  const matches = content.match(/\/api\/images\/[a-zA-Z0-9_-]+/g)
  return matches ? Array.from(new Set(matches)) : []
}
