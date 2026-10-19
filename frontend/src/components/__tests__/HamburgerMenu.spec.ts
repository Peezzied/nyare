import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import HamburgerMenu from '../HamburgerMenu.vue'
import { clearSessionUser, setSessionUser } from '@/composables/useAuth'

const mockPush = vi.fn<(path: string) => Promise<void>>(() => Promise.resolve())

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const originalRaf = window.requestAnimationFrame
let frameQueue: FrameRequestCallback[] = []

function flushFrame(): void {
  const queued = frameQueue
  frameQueue = []
  for (const callback of queued) callback(performance.now())
}

describe('HamburgerMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearSessionUser()
    frameQueue = []
    window.requestAnimationFrame = (callback) => {
      frameQueue.push(callback)
      return frameQueue.length
    }
  })

  afterEach(() => {
    clearSessionUser()
    window.requestAnimationFrame = originalRaf
  })

  it('shows the Nyare brand and current user profile in the drawer', async () => {
    setSessionUser({
      id: 7,
      username: 'railey',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    })

    const wrapper = mount(HamburgerMenu)
    await wrapper.get('[data-testid="topbar-menu"]').trigger('click')
    await flushPromises()

    const drawer = document.querySelector<HTMLElement>('[data-testid="account-menu"]')
    expect(drawer).not.toBeNull()
    expect(drawer?.querySelector('[data-testid="nyare-wordmark"]')?.textContent).toContain('Nyare')
    expect(drawer?.querySelector('[data-testid="menu-profile-name"]')?.textContent?.trim()).toBe(
      'railey',
    )

    const avatar = drawer?.querySelector<HTMLImageElement>('[data-testid="menu-profile-avatar"]')
    expect(avatar).not.toBeNull()
    expect(avatar?.alt).toBe('railey profile picture')
    expect(avatar?.src).toContain('data:image/svg+xml')

    wrapper.unmount()
  })

  it('navigates to account selection and closes the drawer', async () => {
    const wrapper = mount(HamburgerMenu)
    await wrapper.get('[data-testid="topbar-menu"]').trigger('click')
    await flushPromises()

    const item = document.querySelector<HTMLElement>('[data-testid="select-account-item"]')
    expect(item).not.toBeNull()
    item?.click()
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith('/select-account')
    await vi.waitFor(() => {
      expect(document.querySelector('[data-testid="account-menu"]')).toBeNull()
    })
    wrapper.unmount()
  })

  it('paints the closed position before starting the open transition', async () => {
    const wrapper = mount(HamburgerMenu)
    await wrapper.get('[data-testid="topbar-menu"]').trigger('click')
    await nextTick()

    const panel = document.querySelector<HTMLElement>('[data-testid="account-menu"]')
    expect(panel).not.toBeNull()

    const width = Math.min(Math.round(window.innerWidth * 0.78), 360)
    expect(panel?.style.transform).toBe(`translateX(${-width}px)`)
    expect(panel?.style.transition).toBe('none')

    flushFrame()
    await nextTick()
    expect(panel?.style.transition).toBe('none')
    expect(panel?.style.transform).toBe(`translateX(${-width}px)`)

    flushFrame()
    await nextTick()
    expect(panel?.style.transition).toContain('transform')
    expect(panel?.style.transform).toBe('translateX(0px)')

    wrapper.unmount()
  })

  it('closes the drawer on Escape', async () => {
    const wrapper = mount(HamburgerMenu)
    await wrapper.get('[data-testid="topbar-menu"]').trigger('click')
    await flushPromises()

    expect(document.querySelector('[data-testid="account-menu"]')).not.toBeNull()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    await vi.waitFor(() => {
      expect(document.querySelector('[data-testid="account-menu"]')).toBeNull()
    })
    wrapper.unmount()
  })

  it('opens the drawer on a right swipe from the left edge', async () => {
    const wrapper = mount(HamburgerMenu)
    const edge = wrapper.get('[data-testid="menu-edge-swipe"]')

    firePointer(edge.element, 'pointerdown', 4)
    fireWindowPointer('pointerup', 84)
    await flushPromises()

    expect(document.querySelector('[data-testid="account-menu"]')).not.toBeNull()
    wrapper.unmount()
  })

  it('makes the panel follow the pointer while dragging from the edge', async () => {
    const wrapper = mount(HamburgerMenu)
    const edge = wrapper.get('[data-testid="menu-edge-swipe"]')

    firePointer(edge.element, 'pointerdown', 4)
    fireWindowPointer('pointermove', 184)
    await nextTick()

    const panel = document.querySelector<HTMLElement>('[data-testid="account-menu"]')
    expect(panel).not.toBeNull()

    const width = Math.min(Math.round(window.innerWidth * 0.78), 360)
    expect(panel?.style.transform).toBe(`translateX(${-width + 180}px)`)

    wrapper.unmount()
  })

  it('closes the drawer on a left swipe on the panel', async () => {
    const wrapper = mount(HamburgerMenu)
    await wrapper.get('[data-testid="topbar-menu"]').trigger('click')
    await flushPromises()

    const panel = document.querySelector<HTMLElement>('[data-testid="account-menu"]')
    expect(panel).not.toBeNull()

    firePointer(panel!, 'pointerdown', 200)
    fireWindowPointer('pointerup', 40)
    await flushPromises()

    await vi.waitFor(() => {
      expect(document.querySelector('[data-testid="account-menu"]')).toBeNull()
    })
    wrapper.unmount()
  })
})

function firePointer(el: Element, type: string, clientX: number): void {
  el.dispatchEvent(pointerEvent(type, clientX))
}

function fireWindowPointer(type: string, clientX: number): void {
  window.dispatchEvent(pointerEvent(type, clientX))
}

function pointerEvent(type: string, clientX: number): MouseEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY: 100,
  })
  Object.assign(event, { pointerId: 1, isPrimary: true })
  return event
}
