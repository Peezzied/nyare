import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import WelcomeView from '../WelcomeView.vue'
import { useOnboarding } from '@/composables/useOnboarding'

const mockPush = vi.fn<(path: string) => Promise<void> | void>()
const mockReplace = vi.fn<(path: string) => Promise<void> | void>()
const mockBack = vi.fn<() => void>()
const routeQuery = { from: undefined as string | undefined }

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useRoute: () => ({ query: routeQuery }),
}))

describe('WelcomeView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useOnboarding().resetOnboarding()
    routeQuery.from = undefined
  })

  it('keeps the name in onboarding state and continues to schedule setup', async () => {
    const wrapper = mount(WelcomeView)
    await wrapper.find('input[type="text"]').setValue('Alice')
    await wrapper.find('button[aria-label="Continue to schedule setup"]').trigger('click')
    await flushPromises()

    // Registration is deferred to Save all; the view only stores the name.
    expect(useOnboarding().studentName.value).toBe('Alice')
    expect(mockReplace).toHaveBeenCalledWith('/create-schedule')
  })

  it('disables continue until the name passes backend username rules', async () => {
    const wrapper = mount(WelcomeView)
    await wrapper.find('input[type="text"]').setValue('Al')

    const continueButton = wrapper.find('button[aria-label="Continue to schedule setup"]')
    expect(continueButton.attributes('disabled')).toBeDefined()
    await continueButton.trigger('click')

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('hides the back button without the accounts query marker', () => {
    const wrapper = mount(WelcomeView)
    expect(wrapper.find('[data-testid="welcome-back"]').exists()).toBe(false)
  })

  it('shows a back button that returns to the picker after Add Account', async () => {
    routeQuery.from = 'accounts'
    const wrapper = mount(WelcomeView)

    const backButton = wrapper.find('[data-testid="welcome-back"]')
    expect(backButton.exists()).toBe(true)

    // jsdom history has one entry, so the fallback targets the picker.
    await backButton.trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/select-account')
  })

  it('returns to the start step when the first progress dot is clicked', async () => {
    const wrapper = mount(WelcomeView)

    await wrapper.find('[data-step="1"]').trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})
