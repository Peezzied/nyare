import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TiptapToolbar from '../TiptapToolbar.vue'
import type { Editor } from '@tiptap/vue-3'

interface MockChain {
  focus: () => MockChain
  undo: () => MockChain
  redo: () => MockChain
  toggleBold: () => MockChain
  toggleUnderline: () => MockChain
  toggleItalic: () => MockChain
  toggleStrike: () => MockChain
  toggleCode: () => MockChain
  toggleHeading: (opts: { level: 1 | 2 | 3 }) => MockChain
  toggleBulletList: () => MockChain
  toggleOrderedList: () => MockChain
  toggleBlockquote: () => MockChain
  setHorizontalRule: () => MockChain
  setImage: (opts: { src: string }) => MockChain
  run: () => boolean
}

function createMockEditor(overrides: Record<string, unknown> = {}) {
  const chainMock: MockChain = {
    focus: vi.fn<() => MockChain>().mockReturnThis(),
    undo: vi.fn<() => MockChain>().mockReturnThis(),
    redo: vi.fn<() => MockChain>().mockReturnThis(),
    toggleBold: vi.fn<() => MockChain>().mockReturnThis(),
    toggleUnderline: vi.fn<() => MockChain>().mockReturnThis(),
    toggleItalic: vi.fn<() => MockChain>().mockReturnThis(),
    toggleStrike: vi.fn<() => MockChain>().mockReturnThis(),
    toggleCode: vi.fn<() => MockChain>().mockReturnThis(),
    toggleHeading: vi.fn<(opts: { level: 1 | 2 | 3 }) => MockChain>().mockReturnThis(),
    toggleBulletList: vi.fn<() => MockChain>().mockReturnThis(),
    toggleOrderedList: vi.fn<() => MockChain>().mockReturnThis(),
    toggleBlockquote: vi.fn<() => MockChain>().mockReturnThis(),
    setHorizontalRule: vi.fn<() => MockChain>().mockReturnThis(),
    setImage: vi.fn<(opts: { src: string }) => MockChain>().mockReturnThis(),
    run: vi.fn<() => boolean>().mockReturnValue(true),
  }

  const canMock = {
    undo: vi.fn<() => boolean>().mockReturnValue(true),
    redo: vi.fn<() => boolean>().mockReturnValue(true),
  }

  return {
    chain: vi.fn<() => MockChain>().mockReturnValue(chainMock),
    can: vi.fn<() => { undo: () => boolean; redo: () => boolean }>().mockReturnValue(canMock),
    isActive: vi
      .fn<(name: string, attrs?: Record<string, unknown>) => boolean>()
      .mockReturnValue(false),
    ...overrides,
  } as unknown as Editor
}

describe('TiptapToolbar', () => {
  it('renders all toolbar buttons with accessible labels', () => {
    const editor = createMockEditor()
    const wrapper = mount(TiptapToolbar, {
      props: { editor },
    })

    const expectedLabels = [
      'Undo',
      'Redo',
      'Heading 1',
      'Heading 2',
      'Heading 3',
      'Bold',
      'Underline',
      'Italic',
      'Strikethrough',
      'Code',
      'Bullet List',
      'Ordered List',
      'Blockquote',
      'Divider',
      'Image',
    ]

    expectedLabels.forEach((label) => {
      const button = wrapper.find(`button[aria-label="${label}"]`)
      expect(button.exists()).toBe(true)
    })
  })

  it('dispatches undo and redo commands when history buttons are clicked', async () => {
    const editor = createMockEditor()
    const wrapper = mount(TiptapToolbar, {
      props: { editor },
    })

    const undoButton = wrapper.find('button[aria-label="Undo"]')
    await undoButton.trigger('click')
    const chain = (editor.chain as () => MockChain)()
    expect(chain.undo).toHaveBeenCalled()
    expect(chain.run).toHaveBeenCalled()

    const redoButton = wrapper.find('button[aria-label="Redo"]')
    await redoButton.trigger('click')
    expect(chain.redo).toHaveBeenCalled()
  })

  it('dispatches text and block formatting commands when buttons are clicked', async () => {
    const editor = createMockEditor()
    const wrapper = mount(TiptapToolbar, {
      props: { editor },
    })

    const boldButton = wrapper.find('button[aria-label="Bold"]')
    await boldButton.trigger('click')
    const chain = (editor.chain as () => MockChain)()
    expect(chain.toggleBold).toHaveBeenCalled()

    const underlineButton = wrapper.find('button[aria-label="Underline"]')
    await underlineButton.trigger('click')
    expect(chain.toggleUnderline).toHaveBeenCalled()

    const italicButton = wrapper.find('button[aria-label="Italic"]')
    await italicButton.trigger('click')
    expect(chain.toggleItalic).toHaveBeenCalled()

    const h1Button = wrapper.find('button[aria-label="Heading 1"]')
    await h1Button.trigger('click')
    expect(chain.toggleHeading).toHaveBeenCalledWith({ level: 1 })

    const bulletListButton = wrapper.find('button[aria-label="Bullet List"]')
    await bulletListButton.trigger('click')
    expect(chain.toggleBulletList).toHaveBeenCalled()

    const dividerButton = wrapper.find('button[aria-label="Divider"]')
    await dividerButton.trigger('click')
    expect(chain.setHorizontalRule).toHaveBeenCalled()
  })

  it('disables undo and redo buttons when history states are not available', () => {
    const editor = createMockEditor({
      can: vi.fn<() => { undo: () => boolean; redo: () => boolean }>().mockReturnValue({
        undo: vi.fn<() => boolean>().mockReturnValue(false),
        redo: vi.fn<() => boolean>().mockReturnValue(false),
      }),
    })

    const wrapper = mount(TiptapToolbar, {
      props: { editor },
    })

    const undoButton = wrapper.find('button[aria-label="Undo"]')
    const redoButton = wrapper.find('button[aria-label="Redo"]')

    expect(undoButton.attributes('disabled')).toBeDefined()
    expect(redoButton.attributes('disabled')).toBeDefined()
    expect(undoButton.classes()).toContain('opacity-30')
    expect(undoButton.classes()).toContain('pointer-events-none')
    expect(redoButton.classes()).toContain('opacity-30')
    expect(redoButton.classes()).toContain('pointer-events-none')
  })

  it('marks buttons as active when editor state matches formatting', () => {
    const editor = createMockEditor({
      isActive: vi
        .fn<(name: string, attrs?: Record<string, unknown>) => boolean>()
        .mockImplementation((name: string) => name === 'bold'),
    })

    const wrapper = mount(TiptapToolbar, {
      props: { editor },
    })

    const boldButton = wrapper.find('button[aria-label="Bold"]')
    expect(boldButton.attributes('aria-pressed')).toBe('true')
    expect(boldButton.classes()).toContain('bg-accent')

    const italicButton = wrapper.find('button[aria-label="Italic"]')
    expect(italicButton.attributes('aria-pressed')).toBe('false')
  })

  it('disables all buttons when disabled prop is true', () => {
    const editor = createMockEditor()
    const wrapper = mount(TiptapToolbar, {
      props: { editor, disabled: true },
    })

    const buttons = wrapper.findAll('button')
    buttons.forEach((btn) => {
      expect(btn.attributes('disabled')).toBeDefined()
    })
  })

  it('triggers file picker when image button is clicked', async () => {
    const editor = createMockEditor()
    const wrapper = mount(TiptapToolbar, {
      props: { editor },
    })

    const fileInput = wrapper.find<HTMLInputElement>('input[type="file"]')
    const clickSpy = vi.spyOn(fileInput.element, 'click')

    const imageButton = wrapper.find('button[aria-label="Image"]')
    await imageButton.trigger('click')

    expect(clickSpy).toHaveBeenCalled()
  })

  it('emits upload-image event when valid image file is chosen', async () => {
    const editor = createMockEditor()
    const wrapper = mount(TiptapToolbar, {
      props: { editor },
    })

    const fileInput = wrapper.find<HTMLInputElement>('input[type="file"]')
    const validFile = new File(['binary-content'], 'lecture-diagram.png', {
      type: 'image/png',
    })

    Object.defineProperty(fileInput.element, 'files', {
      value: [validFile],
      configurable: true,
    })

    await fileInput.trigger('change')

    const emitted = wrapper.emitted('upload-image')
    expect(emitted).toBeDefined()
    expect(emitted?.[0]?.[0]).toBe(validFile)
  })

  it('emits upload-error when unsupported file type is selected', async () => {
    const editor = createMockEditor()
    const wrapper = mount(TiptapToolbar, {
      props: { editor },
    })

    const fileInput = wrapper.find<HTMLInputElement>('input[type="file"]')
    const invalidFile = new File(['pdf-content'], 'document.pdf', {
      type: 'application/pdf',
    })

    Object.defineProperty(fileInput.element, 'files', {
      value: [invalidFile],
      configurable: true,
    })

    await fileInput.trigger('change')

    const errorEmitted = wrapper.emitted('upload-error')
    expect(errorEmitted).toBeDefined()
    const firstError = errorEmitted?.[0]?.[0] as Error
    expect(firstError).toBeInstanceOf(Error)
    expect(firstError.message).toContain('Only image files are supported')
  })

  it('emits upload-error when file size exceeds 10 MB limit', async () => {
    const editor = createMockEditor()
    const wrapper = mount(TiptapToolbar, {
      props: { editor },
    })

    const fileInput = wrapper.find<HTMLInputElement>('input[type="file"]')
    const largeFile = new File([''], 'huge-photo.jpg', {
      type: 'image/jpeg',
    })
    Object.defineProperty(largeFile, 'size', {
      value: 11 * 1024 * 1024,
    })

    Object.defineProperty(fileInput.element, 'files', {
      value: [largeFile],
      configurable: true,
    })

    await fileInput.trigger('change')

    const errorEmitted = wrapper.emitted('upload-error')
    expect(errorEmitted).toBeDefined()
    const firstError = errorEmitted?.[0]?.[0] as Error
    expect(firstError).toBeInstanceOf(Error)
    expect(firstError.message).toContain('10 MB')
  })

  it('enforces single-line horizontal scroll layout and accessible touch target sizes', () => {
    const editor = createMockEditor()
    const wrapper = mount(TiptapToolbar, {
      props: { editor },
    })

    const toolbarContainer = wrapper.find('[role="toolbar"]')
    expect(toolbarContainer.classes()).toContain('flex-nowrap')
    expect(toolbarContainer.classes()).toContain('overflow-x-auto')
    expect(toolbarContainer.classes()).toContain('minimal-scrollbar')

    const buttons = wrapper.findAll('button')
    buttons.forEach((btn) => {
      expect(btn.classes()).toContain('size-9')
    })
  })

  it('applies standout cyan styling to undo and redo history buttons', () => {
    const editor = createMockEditor()
    const wrapper = mount(TiptapToolbar, {
      props: { editor },
    })

    const undoButton = wrapper.find('button[aria-label="Undo"]')
    const redoButton = wrapper.find('button[aria-label="Redo"]')

    expect(undoButton.classes()).toContain('text-[#00A4C8]')
    expect(undoButton.classes()).toContain('bg-[#00A4C8]/10')
    expect(undoButton.classes()).toContain('border-[#00A4C8]/30')
    expect(undoButton.classes()).not.toContain('opacity-30')

    expect(redoButton.classes()).toContain('text-[#00A4C8]')
    expect(redoButton.classes()).toContain('bg-[#00A4C8]/10')
    expect(redoButton.classes()).toContain('border-[#00A4C8]/30')
    expect(redoButton.classes()).not.toContain('opacity-30')
  })

  it('floats undo and redo buttons at the right in single-line mode', () => {
    const editor = createMockEditor()
    const wrapper = mount(TiptapToolbar, {
      props: { editor },
    })

    const historyCluster = wrapper.find('[data-testid="history-cluster"]')
    expect(historyCluster.exists()).toBe(true)
    expect(historyCluster.classes()).toContain('sticky')
    expect(historyCluster.classes()).toContain('right-0')
    expect(historyCluster.classes()).toContain('ml-auto')
  })
})
