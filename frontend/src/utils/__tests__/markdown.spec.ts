import { describe, it, expect } from 'vitest'
import { markdownToHtml, htmlToMarkdown, extractImageUrls } from '../markdown'

describe('markdown utility', () => {
  describe('markdownToHtml', () => {
    it('returns an empty string when input is empty or whitespace', () => {
      expect(markdownToHtml('')).toBe('')
      expect(markdownToHtml('   ')).toBe('')
      expect(markdownToHtml('\n\n\t')).toBe('')
    })

    it('converts level 1, 2, and 3 headings', () => {
      expect(markdownToHtml('# Heading 1')).toBe('<h1>Heading 1</h1>')
      expect(markdownToHtml('## Heading 2')).toBe('<h2>Heading 2</h2>')
      expect(markdownToHtml('### Heading 3')).toBe('<h3>Heading 3</h3>')
    })

    it('converts bold text with asterisks and underscores', () => {
      expect(markdownToHtml('**bold text**')).toBe('<p><strong>bold text</strong></p>')
      expect(markdownToHtml('__bold text__')).toBe('<p><strong>bold text</strong></p>')
    })

    it('converts italic text with asterisks and underscores', () => {
      expect(markdownToHtml('*italic text*')).toBe('<p><em>italic text</em></p>')
      expect(markdownToHtml('_italic text_')).toBe('<p><em>italic text</em></p>')
    })

    it('converts strikethrough text', () => {
      expect(markdownToHtml('~~struck text~~')).toBe('<p><s>struck text</s></p>')
    })

    it('converts inline code spans without formatting symbols inside', () => {
      expect(markdownToHtml('`const x = 42;`')).toBe('<p><code>const x = 42;</code></p>')
      expect(markdownToHtml('`**not bold**`')).toBe('<p><code>**not bold**</code></p>')
    })

    it('converts blockquotes to blockquote with nested paragraph', () => {
      expect(markdownToHtml('> Academic note insight')).toBe(
        '<blockquote><p>Academic note insight</p></blockquote>',
      )
    })

    it('converts horizontal rules with dashes and asterisks', () => {
      expect(markdownToHtml('---')).toBe('<hr>')
      expect(markdownToHtml('***')).toBe('<hr>')
      expect(markdownToHtml('___')).toBe('<hr>')
    })

    it('converts bullet lists with dashes and asterisks', () => {
      const markdownDashes = '- Lecture topic 1\n- Lecture topic 2'
      expect(markdownToHtml(markdownDashes)).toBe(
        '<ul><li>Lecture topic 1</li><li>Lecture topic 2</li></ul>',
      )

      const markdownAsterisks = '* First bullet\n* Second bullet'
      expect(markdownToHtml(markdownAsterisks)).toBe(
        '<ul><li>First bullet</li><li>Second bullet</li></ul>',
      )
    })

    it('converts ordered lists with numbers', () => {
      const markdown = '1. Step one\n2. Step two'
      expect(markdownToHtml(markdown)).toBe('<ol><li>Step one</li><li>Step two</li></ol>')
    })

    it('converts standalone image markdown to an img tag', () => {
      const markdown = '![Lecture Slide](/api/images/slide-01)'
      expect(markdownToHtml(markdown)).toBe('<img src="/api/images/slide-01" alt="Lecture Slide">')
    })

    it('converts inline image markdown inside a paragraph', () => {
      const markdown = 'Refer to slide ![Slide](/api/images/slide-01) for details'
      expect(markdownToHtml(markdown)).toBe(
        '<p>Refer to slide <img src="/api/images/slide-01" alt="Slide"> for details</p>',
      )
    })

    it('converts multiple paragraphs separated by empty lines', () => {
      const markdown = 'First paragraph.\n\nSecond paragraph.'
      expect(markdownToHtml(markdown)).toBe('<p>First paragraph.</p><p>Second paragraph.</p>')
    })

    it('converts mixed inline formatting in paragraphs', () => {
      const markdown = 'This has **bold**, *italic*, ~~deleted~~, and `code`.'
      expect(markdownToHtml(markdown)).toBe(
        '<p>This has <strong>bold</strong>, <em>italic</em>, <s>deleted</s>, and <code>code</code>.</p>',
      )
    })
  })

  describe('htmlToMarkdown', () => {
    it('returns an empty string when input is empty or whitespace', () => {
      expect(htmlToMarkdown('')).toBe('')
      expect(htmlToMarkdown('   ')).toBe('')
      expect(htmlToMarkdown('<p></p>')).toBe('')
      expect(htmlToMarkdown('<p><br></p>')).toBe('')
    })

    it('converts h1, h2, and h3 tags to markdown headings', () => {
      expect(htmlToMarkdown('<h1>Main Title</h1>')).toBe('# Main Title')
      expect(htmlToMarkdown('<h2>Section Title</h2>')).toBe('## Section Title')
      expect(htmlToMarkdown('<h3>Sub-section</h3>')).toBe('### Sub-section')
    })

    it('converts strong and b tags to bold markdown', () => {
      expect(htmlToMarkdown('<p><strong>Strong text</strong></p>')).toBe('**Strong text**')
      expect(htmlToMarkdown('<p><b>Bold text</b></p>')).toBe('**Bold text**')
    })

    it('converts em and i tags to italic markdown', () => {
      expect(htmlToMarkdown('<p><em>Emphasized text</em></p>')).toBe('*Emphasized text*')
      expect(htmlToMarkdown('<p><i>Italic text</i></p>')).toBe('*Italic text*')
    })

    it('converts s, strike, and del tags to strikethrough markdown', () => {
      expect(htmlToMarkdown('<p><s>Strikethrough</s></p>')).toBe('~~Strikethrough~~')
      expect(htmlToMarkdown('<p><strike>Struck</strike></p>')).toBe('~~Struck~~')
      expect(htmlToMarkdown('<p><del>Deleted</del></p>')).toBe('~~Deleted~~')
    })

    it('converts code tags to inline code markdown', () => {
      expect(htmlToMarkdown('<p><code>const num = 1;</code></p>')).toBe('`const num = 1;`')
    })

    it('converts blockquotes to markdown quotes', () => {
      expect(htmlToMarkdown('<blockquote><p>Quoted thought</p></blockquote>')).toBe(
        '> Quoted thought',
      )
      expect(htmlToMarkdown('<blockquote>Simple quote</blockquote>')).toBe('> Simple quote')
    })

    it('converts hr tags to horizontal rules', () => {
      expect(htmlToMarkdown('<hr>')).toBe('---')
      expect(htmlToMarkdown('<hr />')).toBe('---')
    })

    it('converts standard ul and li tags to bullet list markdown', () => {
      const html = '<ul><li>First item</li><li>Second item</li></ul>'
      expect(htmlToMarkdown(html)).toBe('- First item\n- Second item')
    })

    it('converts Tiptap ul li with nested p tags cleanly', () => {
      const html = '<ul><li><p>Tiptap item 1</p></li><li><p>Tiptap item 2</p></li></ul>'
      expect(htmlToMarkdown(html)).toBe('- Tiptap item 1\n- Tiptap item 2')
    })

    it('converts standard ol and li tags to ordered list markdown', () => {
      const html = '<ol><li>First item</li><li>Second item</li></ol>'
      expect(htmlToMarkdown(html)).toBe('1. First item\n2. Second item')
    })

    it('converts Tiptap ol li with nested p tags cleanly', () => {
      const html = '<ol><li><p>Step one</p></li><li><p>Step two</p></li></ol>'
      expect(htmlToMarkdown(html)).toBe('1. Step one\n2. Step two')
    })

    it('converts img tags with src and alt attributes', () => {
      const html = '<img src="/api/images/uuid-101" alt="Exam preview">'
      expect(htmlToMarkdown(html)).toBe('![Exam preview](/api/images/uuid-101)')
    })

    it('converts Tiptap styled img tags wrapped in paragraphs', () => {
      const html =
        '<p><img src="/api/images/uuid-102" alt="Board photo" class="rounded-lg shadow-xs"></p>'
      expect(htmlToMarkdown(html)).toBe('![Board photo](/api/images/uuid-102)')
    })

    it('converts multiple paragraphs into separated markdown blocks', () => {
      const html = '<p>Paragraph one.</p><p>Paragraph two.</p>'
      expect(htmlToMarkdown(html)).toBe('Paragraph one.\n\nParagraph two.')
    })

    it('trims excess whitespace and newlines', () => {
      const html = '   <p>   Content with spaces   </p>   '
      expect(htmlToMarkdown(html)).toBe('Content with spaces')
    })
  })

  describe('bidirectional roundtrip conversion', () => {
    it('roundtrips headings and paragraphs', () => {
      const markdown = '# Lecture 1\n\nIntroduction to algorithms.'
      const html = markdownToHtml(markdown)
      expect(htmlToMarkdown(html)).toBe(markdown)
    })

    it('roundtrips inline bold, italic, strikethrough, and code', () => {
      const markdown = 'Text with **bold**, *italic*, ~~strikethrough~~, and `code`.'
      const html = markdownToHtml(markdown)
      expect(htmlToMarkdown(html)).toBe(markdown)
    })

    it('roundtrips bullet lists', () => {
      const markdown = '- Calculus assignment\n- Physics experiment'
      const html = markdownToHtml(markdown)
      expect(htmlToMarkdown(html)).toBe(markdown)
    })

    it('roundtrips ordered lists', () => {
      const markdown = '1. Review notes\n2. Solve exercises'
      const html = markdownToHtml(markdown)
      expect(htmlToMarkdown(html)).toBe(markdown)
    })

    it('roundtrips blockquotes', () => {
      const markdown = '> Important formula derivation'
      const html = markdownToHtml(markdown)
      expect(htmlToMarkdown(html)).toBe(markdown)
    })

    it('roundtrips horizontal rules', () => {
      const markdown = 'Top section\n\n---\n\nBottom section'
      const html = markdownToHtml(markdown)
      expect(htmlToMarkdown(html)).toBe(markdown)
    })

    it('roundtrips standalone images', () => {
      const markdown = '![Diagram](/api/images/diag-001)'
      const html = markdownToHtml(markdown)
      expect(htmlToMarkdown(html)).toBe(markdown)
    })

    it('roundtrips a complex document with multiple elements', () => {
      const markdown = [
        '# Biology Notes',
        'Summary of cellular respiration.',
        '- Glycolysis in cytoplasm',
        '- Citric acid cycle in mitochondria',
        '> Remember to review enzyme regulation',
        '---',
        '![Respiration diagram](/api/images/resp-99)',
      ].join('\n\n')

      const html = markdownToHtml(markdown)
      expect(htmlToMarkdown(html)).toBe(markdown)
    })
  })

  describe('extractImageUrls', () => {
    it('returns an empty array when content is empty or contains no images', () => {
      expect(extractImageUrls('')).toEqual([])
      expect(extractImageUrls('No images in this academic note.')).toEqual([])
      expect(extractImageUrls('# Just headings and text')).toEqual([])
    })

    it('extracts image URLs from markdown image syntax', () => {
      const content = '![Diagram](/api/images/550e8400-e29b-41d4-a716-446655440000)'
      expect(extractImageUrls(content)).toEqual([
        '/api/images/550e8400-e29b-41d4-a716-446655440000',
      ])
    })

    it('extracts image URLs from HTML img tags', () => {
      const content =
        '<p><img src="/api/images/3f19e7bf-4e64-4e94-8147-386b02660144" alt="Photo"></p>'
      expect(extractImageUrls(content)).toEqual([
        '/api/images/3f19e7bf-4e64-4e94-8147-386b02660144',
      ])
    })

    it('extracts multiple distinct image URLs from mixed content', () => {
      const content = [
        '# Notes',
        '![Slide 1](/api/images/uuid-aaa)',
        '<img src="/api/images/uuid-bbb" alt="Slide 2">',
        'Another reference at /api/images/uuid-ccc in plain text.',
      ].join('\n')

      expect(extractImageUrls(content)).toEqual([
        '/api/images/uuid-aaa',
        '/api/images/uuid-bbb',
        '/api/images/uuid-ccc',
      ])
    })

    it('deduplicates duplicate image URL occurrences', () => {
      const content = [
        '![Diagram](/api/images/repeated-uuid)',
        '<img src="/api/images/repeated-uuid" alt="Same diagram">',
      ].join('\n')

      expect(extractImageUrls(content)).toEqual(['/api/images/repeated-uuid'])
    })
  })
})
