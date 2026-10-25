import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import EventContainerModal from '../EventContainerModal.vue'
import type { TapOriginRect } from '@/types/notesTransition'
import type { AcademicEventResponse } from '@/types/api'

const EventDetailPanelStub = defineComponent({
  name: 'EventDetailPanel',
  props: ['eventId', 'showContent', 'showControls'],
  emits: ['close', 'deleted', 'missing'],
  setup() {
    return () => h('div', { 'data-testid': 'event-detail-stub' })
  },
})

const origin: TapOriginRect = { top: 200, left: 300, width: 56, height: 56, borderRadius: '16px' }

function mountModal(props: {
  isOpen: boolean
  eventId?: string | null
  originRect?: TapOriginRect | null
}) {
  return mount(EventContainerModal, {
    props: { eventId: null, originRect: origin, ...props },
    global: { stubs: { EventDetailPanel: EventDetailPanelStub } },
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

describe('EventContainerModal', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    vi.useFakeTimers()
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
    expect(wrapper.find('[data-testid="event-modal"]').exists()).toBe(false)
  })

  it('renders an accessible dialog with a translucent scrim', async () => {
    const wrapper = mountModal({ isOpen: false })
    await wrapper.setProps({ isOpen: true })

    const dialog = wrapper.get('[data-testid="event-modal"]')
    expect(dialog.attributes('role')).toBe('dialog')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.attributes('aria-label')).toBe('Event')
    expect(wrapper.find('[data-testid="event-modal-backdrop"]').exists()).toBe(true)
  })

  it('locks body scroll and starts the container at the origin geometry', async () => {
    const wrapper = mountModal({ isOpen: false, eventId: null })

    await wrapper.setProps({ isOpen: true })

    expect(document.body.style.overflow).toBe('hidden')

    const container = wrapper.get('[data-testid="event-modal-container"]')
    expect(container.attributes('style')).toContain('top: 200px')
    expect(container.attributes('style')).toContain('left: 300px')
    expect(container.attributes('style')).toContain('width: 56px')
    expect(container.attributes('style')).toContain('height: 56px')
    expect(container.attributes('style')).toContain('border-radius: 16px')

    await nextTick()
    await nextTick()

    expect(container.attributes('style')).toContain('top: 0px')
    expect(container.attributes('style')).toContain('border-radius: 0px')
    expect(container.attributes('style')).toContain('transition-duration: 320ms')
  })

  it('collapses back to the origin geometry and emits close after 240ms', async () => {
    const wrapper = mountModal({ isOpen: true, eventId: null })
    await nextTick()

    const panel = wrapper.findComponent(EventDetailPanelStub)
    panel.vm.$emit('close')
    await nextTick()

    const container = wrapper.get('[data-testid="event-modal-container"]')
    expect(container.attributes('style')).toContain('top: 200px')
    expect(container.attributes('style')).toContain('border-radius: 16px')
    expect(container.attributes('style')).toContain('transition-duration: 240ms')
    expect(wrapper.emitted('close')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(240)
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(document.body.style.overflow).toBe('')
  })

  it('re-emits deleted and collapses after the panel reports a deletion', async () => {
    const wrapper = mountModal({ isOpen: true, eventId: null })
    await nextTick()

    const event = { id: 'event-1' } as AcademicEventResponse
    const panel = wrapper.findComponent(EventDetailPanelStub)
    panel.vm.$emit('deleted', event)
    await nextTick()

    expect(wrapper.emitted('deleted')).toEqual([[event]])
    expect(wrapper.get('[data-testid="event-modal-container"]').attributes('style')).toContain(
      'transition-duration: 150ms',
    )

    await vi.advanceTimersByTimeAsync(150)
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('pushes exactly one event-modal history entry on open', async () => {
    const pushSpy = vi.spyOn(window.history, 'pushState')
    const wrapper = mountModal({ isOpen: false, eventId: null })

    await wrapper.setProps({ isOpen: true })

    expect(pushSpy).toHaveBeenCalledTimes(1)
    expect(pushSpy).toHaveBeenCalledWith({ nyareEventModal: true }, '')
  })

  it('collapses to the origin on Escape and emits close after 240ms', async () => {
    const wrapper = mountModal({ isOpen: true, eventId: null })
    await nextTick()

    await wrapper.get('[data-testid="event-modal"]').trigger('keydown.esc')
    await nextTick()

    const container = wrapper.get('[data-testid="event-modal-container"]')
    expect(container.attributes('style')).toContain('top: 200px')
    expect(container.attributes('style')).toContain('border-radius: 16px')
    expect(container.attributes('style')).toContain('transition-duration: 240ms')
    expect(wrapper.emitted('close')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(240)
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('collapses when the scrim is tapped', async () => {
    const wrapper = mountModal({ isOpen: true, eventId: null })
    await nextTick()

    await wrapper.get('[data-testid="event-modal-backdrop"]').trigger('click')
    await nextTick()

    expect(wrapper.get('[data-testid="event-modal-container"]').attributes('style')).toContain(
      'transition-duration: 240ms',
    )
    expect(wrapper.emitted('close')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(240)
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('collapses on popstate without calling history.back', async () => {
    const wrapper = mountModal({ isOpen: true, eventId: null })
    await nextTick()

    window.dispatchEvent(new Event('popstate'))
    await nextTick()

    expect(wrapper.get('[data-testid="event-modal-container"]').attributes('style')).toContain(
      'transition-duration: 240ms',
    )
    expect(window.history.back).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(240)
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('reveals content at 100ms and controls at 180ms', async () => {
    const wrapper = mountModal({ isOpen: false, eventId: null })
    await wrapper.setProps({ isOpen: true })
    await nextTick()

    const panel = () => wrapper.findComponent(EventDetailPanelStub)
    expect(panel().props('showContent')).toBe(false)
    expect(panel().props('showControls')).toBe(false)

    await vi.advanceTimersByTimeAsync(100)
    await nextTick()
    expect(panel().props('showContent')).toBe(true)
    expect(panel().props('showControls')).toBe(false)

    await vi.advanceTimersByTimeAsync(80)
    await nextTick()
    expect(panel().props('showControls')).toBe(true)
  })

  it('hides content and controls before the collapse starts', async () => {
    const wrapper = mountModal({ isOpen: true, eventId: null })
    await nextTick()
    await vi.advanceTimersByTimeAsync(180)
    await nextTick()

    const panel = wrapper.findComponent(EventDetailPanelStub)
    expect(panel.props('showContent')).toBe(true)
    expect(panel.props('showControls')).toBe(true)

    panel.vm.$emit('close')
    await nextTick()

    expect(panel.props('showContent')).toBe(false)
    expect(panel.props('showControls')).toBe(false)
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('uses a 150ms opacity crossfade with no spatial scaling under reduced motion', async () => {
    mockReducedMotion(true)
    const wrapper = mountModal({ isOpen: false, eventId: null })

    await wrapper.setProps({ isOpen: true })

    const container = wrapper.get('[data-testid="event-modal-container"]')
    expect(container.attributes('style')).toContain('top: 0px')
    expect(container.attributes('style')).not.toContain('top: 200px')
    expect(container.classes()).toContain('transition-opacity')
    expect(container.attributes('style')).toContain('transition-duration: 150ms')

    const panel = wrapper.findComponent(EventDetailPanelStub)
    expect(panel.props('showContent')).toBe(true)
    expect(panel.props('showControls')).toBe(true)

    panel.vm.$emit('close')
    await nextTick()
    await vi.advanceTimersByTimeAsync(150)
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('fills the resized viewport while open', async () => {
    const wrapper = mountModal({ isOpen: true, eventId: null })
    await nextTick()

    const originalWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 })

    window.dispatchEvent(new Event('resize'))
    await nextTick()

    expect(wrapper.get('[data-testid="event-modal-container"]').attributes('style')).toContain(
      'width: 500px',
    )

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth })
  })
})
