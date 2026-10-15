import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AccountSelectView from '../AccountSelectView.vue'
import { authApi } from '@/api'
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
    deleteUser: vi.fn<(id: number) => Promise<void>>(),
  },
}))

describe('AccountSelectView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('creates an account via the add modal and logs in', async () => {
    vi.mocked(authApi.listUsers).mockResolvedValueOnce([])
    const mockUser: UserResponse = {
      id: 1,
      username: 'Alice',
      createdAt: '2026-10-14T10:00:00Z',
      updatedAt: '2026-10-14T10:00:00Z',
    }
    vi.mocked(authApi.register).mockResolvedValueOnce(mockUser)
    vi.mocked(authApi.login).mockResolvedValueOnce(mockUser)

    const wrapper = mount(AccountSelectView)
    await flushPromises()

    // Open Add Account modal
    const addAccountButton = wrapper.findAll('button').find((b) => b.text().includes('Add Account'))
    expect(addAccountButton).toBeDefined()
    await addAccountButton!.trigger('click')

    expect(wrapper.text()).toContain('Add Student Profile')

    const input = wrapper.find('input[placeholder="Enter your username..."]')
    await input.setValue('Alice')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(authApi.register).toHaveBeenCalledWith({ username: 'Alice' })
    expect(authApi.login).toHaveBeenCalledWith({ username: 'Alice' })
    expect(mockPush).toHaveBeenCalledWith('/')
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
    expect(mockPush).toHaveBeenCalledWith('/')
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
