import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import HamburgerMenu from '../HamburgerMenu.vue'
import { clearSessionUser, setSessionUser } from '@/composables/useAuth'

const mockPush = vi.fn<(path: string) => Promise<void>>(() => Promise.resolve())

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('HamburgerMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearSessionUser()
  })

  afterEach(() => {
    clearSessionUser()
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
    expect(drawer?.querySelector('[data-testid="nyare-wordmark"]')?.textContent).toContain(
      'Nyare',
    )
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
    expect(document.querySelector('[data-testid="account-menu"]')).toBeNull()
    wrapper.unmount()
  })
})
