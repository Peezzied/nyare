import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import NoteEditorModal from '../NoteEditorModal.vue'
import type { TapOriginRect } from '@/types/notesTransition'

const NoteEditorStub = defineComponent({
  name: 'NoteEditor',
  props: ['noteId', 'showContent', 'showControls'],
  emits: ['close', 'saved'],
  setup(_, { emit, expose }) {
    expose({ requestBack: () => emit('close') })
    return () => h('div', { 'data-testid': 'note-editor-stub' })
  },
})

const origin: TapOriginRect = { top: 100, left: 20, width: 160, height: 90, borderRadius: '16px' }

function mountModal(props: {
  isOpen: boolean
  noteId?: string | null
  originRect?: TapOriginRect | null
}) {
  return mount(NoteEditorModal, {
    props: { noteId: null, originRect: origin, ...props },
    global: { stubs: { NoteEditor: NoteEditorStub } },
  })
}

function mockReducedMotion(matches: boolean): void {
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

describe('NoteEditorModal', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    vi.useFakeTimers()
    // Deterministic rAF: fires the expansion frame synchronously inside nextTick.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
    vi.spyOn(window.history, 'back').mockImplementation(() => {})
    mockReducedMotion(false)
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
    window.matchMedia = originalMatchMedia
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders nothing when closed', () => {
    const wrapper = mountModal({ isOpen: false })
    expect(wrapper.find('[data-testid="note-editor-modal"]').exists()).toBe(false)
  })

  it('pushes history state, locks body scroll, and expands from origin to viewport', async () => {
    const pushSpy = vi.spyOn(window.history, 'pushState')
    const wrapper = mountModal({ isOpen: false, noteId: 'note-1' })

    await wrapper.setProps({ isOpen: true })

    expect(pushSpy).toHaveBeenCalledWith({ nyareNoteModal: true }, '')
    expect(document.body.style.overflow).toBe('hidden')

    // Initial geometry matches the tapped card
    const container = wrapper.get('[data-testid="note-modal-container"]')
    expect(container.attributes('style')).toContain('top: 100px')
    expect(container.attributes('style')).toContain('left: 20px')
    expect(container.attributes('style')).toContain('width: 160px')
    expect(container.attributes('style')).toContain('height: 90px')
    expect(container.attributes('style')).toContain('border-radius: 16px')

    await nextTick()
    await nextTick()

    // After the animation frame the container targets the full viewport
    expect(container.attributes('style')).toContain('top: 0px')
    expect(container.attributes('style')).toContain('left: 0px')
    expect(container.attributes('style')).toContain('border-radius: 0px')
    expect(container.classes()).toContain('duration-[320ms]')
  })

  it('mounts the editor once the expansion settles', async () => {
    const wrapper = mountModal({ isOpen: false, noteId: 'note-1' })
    await wrapper.setProps({ isOpen: true })
    await nextTick()

    // The editor stays unmounted while the container animates.
    expect(wrapper.findComponent(NoteEditorStub).exists()).toBe(false)

    await vi.advanceTimersByTimeAsync(320)
    await nextTick()

    const editor = wrapper.findComponent(NoteEditorStub)
    expect(editor.exists()).toBe(true)
    expect(editor.props('showContent')).toBe(true)
    expect(editor.props('showControls')).toBe(true)
  })

  it('collapses back to the origin style and emits close once after 240ms', async () => {
    const wrapper = mountModal({ isOpen: true, noteId: 'note-1' })
    await nextTick()
    await vi.advanceTimersByTimeAsync(320)
    await nextTick()

    const editor = wrapper.findComponent(NoteEditorStub)
    editor.vm.$emit('close')
    // Repeated close requests during collapse are ignored
    editor.vm.$emit('close')
    await nextTick()

    const container = wrapper.get('[data-testid="note-modal-container"]')
    expect(container.attributes('style')).toContain('top: 100px')
    expect(container.attributes('style')).toContain('border-radius: 16px')
    expect(container.classes()).toContain('duration-[240ms]')
    expect(wrapper.emitted('close')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(240)
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(document.body.style.overflow).toBe('')
  })

  it('collapses on Escape via the editor requestBack', async () => {
    const wrapper = mountModal({ isOpen: true, noteId: 'note-1' })
    await nextTick()
    await vi.advanceTimersByTimeAsync(320)
    await nextTick()

    await wrapper.get('[data-testid="note-editor-modal"]').trigger('keydown.esc')
    await nextTick()

    expect(wrapper.get('[data-testid="note-modal-container"]').classes()).toContain(
      'duration-[240ms]',
    )
    expect(window.history.back).toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(240)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('collapses on popstate without calling history.back', async () => {
    const wrapper = mountModal({ isOpen: true, noteId: 'note-1' })
    await nextTick()

    window.dispatchEvent(new Event('popstate'))
    await nextTick()

    expect(wrapper.get('[data-testid="note-modal-container"]').classes()).toContain(
      'duration-[240ms]',
    )
    expect(window.history.back).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(240)
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(document.body.style.overflow).toBe('')
  })

  it('uses a 150ms opacity crossfade when no origin rect exists', async () => {
    const wrapper = mountModal({ isOpen: false, noteId: 'note-1', originRect: null })

    await wrapper.setProps({ isOpen: true })

    // Target geometry applies immediately; the container fades instead of morphing
    const container = wrapper.get('[data-testid="note-modal-container"]')
    expect(container.attributes('style')).toContain('top: 0px')
    expect(container.classes()).toContain('transition-opacity')
    expect(container.classes()).toContain('duration-[150ms]')

    await vi.advanceTimersByTimeAsync(150)
    await nextTick()

    const editor = wrapper.findComponent(NoteEditorStub)
    expect(editor.props('showContent')).toBe(true)
    expect(editor.props('showControls')).toBe(true)

    editor.vm.$emit('close')
    await nextTick()

    await vi.advanceTimersByTimeAsync(150)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('uses a 150ms opacity crossfade under reduced motion', async () => {
    mockReducedMotion(true)
    const wrapper = mountModal({ isOpen: false, noteId: 'note-1' })

    await wrapper.setProps({ isOpen: true })

    // Target geometry applies immediately; no origin snapshot is rendered
    const container = wrapper.get('[data-testid="note-modal-container"]')
    expect(container.attributes('style')).toContain('top: 0px')
    expect(container.classes()).toContain('transition-opacity')
    expect(container.classes()).toContain('duration-[150ms]')

    await vi.advanceTimersByTimeAsync(150)
    await nextTick()

    const editor = wrapper.findComponent(NoteEditorStub)
    expect(editor.props('showContent')).toBe(true)
    expect(editor.props('showControls')).toBe(true)

    editor.vm.$emit('close')
    await nextTick()

    await vi.advanceTimersByTimeAsync(150)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
