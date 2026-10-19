import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AccountMenuButton from '../AccountMenuButton.vue'

const mockPush = vi.fn<(path: string) => Promise<void>>()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('AccountMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('navigates to select-account from the hamburger menu', async () => {
    const wrapper = mount(AccountMenuButton)

    await wrapper.get('button[aria-label="Open menu"]').trigger('click')
    await flushPromises()

    // Reka-ui renders the popover content inside a body portal.
    const item = document.querySelector<HTMLElement>('[data-testid="select-account-item"]')
    expect(item).not.toBeNull()
    expect(item!.textContent).toContain('Select Account')

    item!.click()
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith('/select-account')
  })
})
