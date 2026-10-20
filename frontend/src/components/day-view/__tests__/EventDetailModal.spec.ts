import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import EventDetailModal from '../EventDetailModal.vue'
import type { TapOriginRect } from '@/types/notesTransition'

const origin: TapOriginRect = { top: 100, left: 20, width: 160, height: 90, borderRadius: '16px' }
const frames: HTMLElement[] = []

function toRect(rect: Partial<DOMRect>): DOMRect {
  const base = {
    top: 40,
    left: 500,
    width: 430,
    height: 880,
    right: 930,
    bottom: 920,
    x: 500,
    y: 40,
  }
  return { ...base, ...rect, toJSON: () => ({}) } as DOMRect
}

/** Stands in for the app frame the day view renders inside. */
function makeFrame(rect: Partial<DOMRect> = {}, borderRadius = '36px'): HTMLElement {
  const frame = document.createElement('div')
  frame.style.borderRadius = borderRadius
  document.body.appendChild(frame)
  vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue(toRect(rect))
  frames.push(frame)
  return frame
}

function setFrameRect(frame: HTMLElement, rect: Partial<DOMRect>): void {
  vi.mocked(frame.getBoundingClientRect).mockReturnValue(toRect(rect))
}

function mountModal(props: Record<string, unknown> = {}) {
  return mount(EventDetailModal, {
    props: { isOpen: false, originRect: origin, item: null, frameEl: null, ...props },
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

async function openAndSettle(wrapper: ReturnType<typeof mountModal>): Promise<void> {
  await wrapper.setProps({ isOpen: true })
  await nextTick()
  await nextTick()
}

describe('EventDetailModal', () => {
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
    while (frames.length > 0) frames.pop()?.remove()
    document.body.style.overflow = ''
    window.matchMedia = originalMatchMedia
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders nothing when closed', () => {
    const wrapper = mountModal()
    expect(wrapper.find('[data-testid="detail-modal-container"]').exists()).toBe(false)
  })

  it('expands from the tapped item to the app frame instead of the viewport', async () => {
    const frame = makeFrame()
    const wrapper = mountModal({ frameEl: frame })

    await wrapper.setProps({ isOpen: true })

    // Initial geometry matches the tapped card, in viewport pixels
    const container = wrapper.get('[data-testid="detail-modal-container"]')
    expect(container.attributes('style')).toContain('top: 100px')
    expect(container.attributes('style')).toContain('left: 20px')
    expect(container.attributes('style')).toContain('width: 160px')
    expect(container.attributes('style')).toContain('height: 90px')
    expect(container.attributes('style')).toContain('border-radius: 16px')

    await nextTick()
    await nextTick()

    expect(container.attributes('style')).toContain('top: 40px')
    expect(container.attributes('style')).toContain('left: 500px')
    expect(container.attributes('style')).toContain('width: 430px')
    expect(container.attributes('style')).toContain('height: 880px')
    // The frame's own corner radius, so the panel matches the rounded column
    expect(container.attributes('style')).toContain('border-radius: 36px')
    expect(container.classes()).toContain('duration-[320ms]')
    // The browser viewport (1024px in jsdom) must not decide the size
    expect(container.attributes('style')).not.toContain('1024px')
  })

  it('re-fits the open panel when the viewport is resized', async () => {
    const frame = makeFrame()
    const wrapper = mountModal({ frameEl: frame })
    await openAndSettle(wrapper)

    // The window widens, so the centred column moves right and stretches
    setFrameRect(frame, { left: 900, width: 500, right: 1400 })
    window.dispatchEvent(new Event('resize'))
    await nextTick()

    const container = wrapper.get('[data-testid="detail-modal-container"]')
    expect(container.attributes('style')).toContain('left: 900px')
    expect(container.attributes('style')).toContain('width: 500px')
  })

  it('keeps the collapse geometry when the viewport is resized mid-collapse, then closes after 240ms', async () => {
    const frame = makeFrame()
    const wrapper = mountModal({ frameEl: frame })
    await openAndSettle(wrapper)

    await wrapper.get('[data-testid="modal-backdrop"]').trigger('click')
    await nextTick()

    const container = wrapper.get('[data-testid="detail-modal-container"]')
    const collapseStyle = container.attributes('style')
    expect(collapseStyle).toContain('top: 100px')
    expect(container.classes()).toContain('duration-[240ms]')

    setFrameRect(frame, { left: 900, width: 500, right: 1400 })
    window.dispatchEvent(new Event('resize'))
    await nextTick()

    expect(container.attributes('style')).toBe(collapseStyle)
    expect(wrapper.emitted('close')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(240)
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)

    // The parent closes the modal in response, which releases the scroll lock
    await wrapper.setProps({ isOpen: false })
    expect(document.body.style.overflow).toBe('')
  })

  it('falls back to the viewport when no frame is supplied', async () => {
    const wrapper = mountModal()
    await openAndSettle(wrapper)

    const container = wrapper.get('[data-testid="detail-modal-container"]')
    expect(container.attributes('style')).toContain('top: 0px')
    expect(container.attributes('style')).toContain('left: 0px')
    expect(container.attributes('style')).toContain('border-radius: 0px')
  })

  it('closes on Escape over the 240ms collapse', async () => {
    const frame = makeFrame()
    const wrapper = mountModal({ frameEl: frame })
    await openAndSettle(wrapper)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(wrapper.get('[data-testid="detail-modal-container"]').classes()).toContain(
      'duration-[240ms]',
    )
    expect(window.history.back).toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(240)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('collapses on popstate without calling history.back', async () => {
    const frame = makeFrame()
    const wrapper = mountModal({ frameEl: frame })
    await openAndSettle(wrapper)

    window.dispatchEvent(new Event('popstate'))
    await nextTick()

    expect(wrapper.get('[data-testid="detail-modal-container"]').classes()).toContain(
      'duration-[240ms]',
    )
    expect(window.history.back).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(240)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('uses a 150ms opacity crossfade with no spatial scaling under reduced motion', async () => {
    mockReducedMotion(true)
    const frame = makeFrame()
    const wrapper = mountModal({ frameEl: frame })

    await openAndSettle(wrapper)

    const container = wrapper.get('[data-testid="detail-modal-container"]')
    expect(container.attributes('style')).toContain('width: 430px')
    expect(container.classes()).toContain('transition-opacity')
    expect(container.classes()).toContain('duration-[150ms]')
    expect(container.classes()).not.toContain('duration-[320ms]')
    expect(container.classes()).not.toContain('duration-[240ms]')

    await wrapper.get('[data-testid="modal-backdrop"]').trigger('click')
    await nextTick()
    await vi.advanceTimersByTimeAsync(150)

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
