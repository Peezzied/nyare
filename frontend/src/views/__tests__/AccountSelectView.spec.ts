import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AccountSelectView from '../AccountSelectView.vue'
import { authApi } from '@/api'
import { setSessionUser, useAuth } from '@/composables/useAuth'
import { resetRouteWipe } from '@/composables/useRouteWipe'
import type { LoginRequest, UserRequest, UserResponse } from '@/types/api'

const mockPush = vi.fn<(path: string) => Promise<void> | void>()
const mockBack = vi.fn<() => void>()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}))

vi.mock('@/api', () => ({
  authApi: {
    listUsers: vi.fn<() => Promise<UserResponse[]>>(),
    login: vi.fn<(request: LoginRequest) => Promise<UserResponse>>(),
    register: vi.fn<(request: UserRequest) => Promise<UserResponse>>(),
    logout: vi.fn<() => Promise<void>>(),
    deleteUser: vi.fn<(id: number) => Promise<void>>(),
  },
}))

describe('AccountSelectView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRouteWipe()
  })

  it('renders loading skeletons on mount', async () => {
    vi.mocked(authApi.listUsers).mockImplementation(() => new Promise<UserResponse[]>(() => {}))

    const wrapper = mount(AccountSelectView)
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    expect(wrapper.find('img[alt="Duckota Mascot"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Checking records...')
  })

  it('renders empty state when no users exist', async () => {
    vi.mocked(authApi.listUsers).mockResolvedValueOnce([])

    const wrapper = mount(AccountSelectView)
    await flushPromises()

    expect(wrapper.text()).toContain('No student accounts yet')
    expect(wrapper.text()).toContain('Add Account')
  })

  it('navigates to onboarding when Add Account is clicked', async () => {
    vi.mocked(authApi.listUsers).mockResolvedValueOnce([])

    const wrapper = mount(AccountSelectView)
    await flushPromises()

    const addAccountButton = wrapper.findAll('button').find((b) => b.text().includes('Add Account'))
    expect(addAccountButton).toBeDefined()
    await addAccountButton!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith({ path: '/welcome', query: { from: 'accounts' } })
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('warns a signed-in user and ends the session only after confirming', async () => {
    const sessionedUser: UserResponse = {
      id: 1,
      username: 'Carol',
      createdAt: '2026-10-10T12:00:00Z',
      updatedAt: '2026-10-10T12:00:00Z',
    }
    setSessionUser(sessionedUser)
    vi.mocked(authApi.listUsers).mockResolvedValueOnce([sessionedUser])
    vi.mocked(authApi.logout).mockResolvedValueOnce()

    const wrapper = mount(AccountSelectView)
    await flushPromises()

    const addAccountButton = wrapper.findAll('button').find((b) => b.text().includes('Add Account'))
    await addAccountButton!.trigger('click')
    await flushPromises()

    // The warning dialog opens; nothing has signed out or navigated yet.
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('You will be signed out of')
    expect(authApi.logout).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()

    await wrapper.find('[data-testid="add-account-confirm"]').trigger('click')
    await flushPromises()

    expect(authApi.logout).toHaveBeenCalled()
    expect(useAuth().user.value).toBeNull()
    expect(mockPush).toHaveBeenCalledWith({ path: '/welcome', query: { from: 'accounts' } })
  })

  it('keeps the session when the sign-out warning is cancelled', async () => {
    const sessionedUser: UserResponse = {
      id: 1,
      username: 'Carol',
      createdAt: '2026-10-10T12:00:00Z',
      updatedAt: '2026-10-10T12:00:00Z',
    }
    setSessionUser(sessionedUser)
    vi.mocked(authApi.listUsers).mockResolvedValueOnce([sessionedUser])

    const wrapper = mount(AccountSelectView)
    await flushPromises()

    const addAccountButton = wrapper.findAll('button').find((b) => b.text().includes('Add Account'))
    await addAccountButton!.trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="add-account-cancel"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(authApi.logout).not.toHaveBeenCalled()
    expect(useAuth().user.value).toEqual(sessionedUser)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('renders user cards with GitHub identicons and selects on click', async () => {
    const mockUsers: UserResponse[] = [
      {
        id: 1,
        username: 'Carol',
        createdAt: '2026-10-10T12:00:00Z',
        updatedAt: '2026-10-10T12:00:00Z',
      },
    ]
    vi.mocked(authApi.listUsers).mockResolvedValueOnce(mockUsers)
    vi.mocked(authApi.login).mockResolvedValueOnce(mockUsers[0]!)

    const wrapper = mount(AccountSelectView)
    await flushPromises()

    expect(wrapper.text()).toContain('Carol')

    const img = wrapper.find('img[alt="Carol avatar"]')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toContain('data:image/svg+xml;utf8')

    // Click account card
    const userCard = wrapper.find('[role="listitem"]')
    await userCard.trigger('click')
    await flushPromises()

    expect(authApi.login).toHaveBeenCalledWith({ username: 'Carol' })
    // The route swap waits for the wipe disc to cover the viewport first.
    await vi.waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'))
  })

  it('handles manage mode and account deletion with confirmation', async () => {
    const mockUsers: UserResponse[] = [
      {
        id: 1,
        username: 'Carol',
        createdAt: '2026-10-10T12:00:00Z',
        updatedAt: '2026-10-10T12:00:00Z',
      },
    ]
    vi.mocked(authApi.listUsers).mockResolvedValueOnce(mockUsers)
    vi.mocked(authApi.deleteUser).mockResolvedValueOnce()

    const wrapper = mount(AccountSelectView)
    await flushPromises()

    // Toggle Manage mode
    const manageButton = wrapper.findAll('button').find((b) => b.text() === 'Manage')
    expect(manageButton).toBeDefined()
    await manageButton!.trigger('click')

    expect(manageButton!.text()).toBe('Done')

    // Trigger delete button on Carol's card
    const deleteButton = wrapper.find('button[aria-label="Delete student profile"]')
    expect(deleteButton.exists()).toBe(true)
    await deleteButton.trigger('click')

    // Check confirmation dialog
    expect(wrapper.text()).toContain('Delete Profile')
    expect(wrapper.text()).toContain('Are you sure you want to delete Carol?')

    // Confirm deletion
    const confirmButton = wrapper.findAll('button').find((b) => b.text() === 'Delete')
    expect(confirmButton).toBeDefined()
    await confirmButton!.trigger('click')
    await flushPromises()

    expect(authApi.deleteUser).toHaveBeenCalledWith(1)
    expect(wrapper.text()).toContain('No student accounts yet')
  })

  it('displays error banner if fetching users fails', async () => {
    vi.mocked(authApi.listUsers).mockRejectedValueOnce(new Error('Network failure'))

    const wrapper = mount(AccountSelectView)
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Network failure')
  })

  it('navigates back when back button is clicked', async () => {
    vi.mocked(authApi.listUsers).mockResolvedValueOnce([])

    const wrapper = mount(AccountSelectView)
    await flushPromises()

    const backButton = wrapper.find('[data-testid="back-button"]')
    expect(backButton.exists()).toBe(true)
    await backButton.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/')
  })
})
