import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SettingsView from '../SettingsView.vue'
import { settingsApi } from '@/api'
import type { UserSettings } from '@/types/api'
import { useToasts } from '@/composables/useToasts'

const mockPush = vi.fn<(to: unknown) => Promise<void>>(() => Promise.resolve())
let leaveGuard: ((to: { fullPath: string }) => boolean) | undefined

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  onBeforeRouteLeave: (cb: (to: { fullPath: string }) => boolean) => {
    leaveGuard = cb
  },
}))

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()
  return {
    ...actual,
    settingsApi: {
      get: vi.fn<() => Promise<UserSettings>>(),
      update: vi.fn<(r: UserSettings) => Promise<UserSettings>>(),
    },
  }
})

const mockGet = vi.mocked(settingsApi.get)
const mockUpdate = vi.mocked(settingsApi.update)

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useToasts().toasts.value.splice(0)
    mockGet.mockResolvedValue({ planningHorizonDays: 14, backdatingHorizonDays: 14 })
    mockUpdate.mockImplementation(async (request) => request)
  })

  afterEach(() => {
    useToasts().toasts.value.splice(0)
  })

  it('loads and displays the current horizon values', async () => {
    mockGet.mockResolvedValue({ planningHorizonDays: 21, backdatingHorizonDays: 30 })

    const wrapper = mount(SettingsView)
    await flushPromises()

    expect(mockGet).toHaveBeenCalled()
    expect(wrapper.get<HTMLInputElement>('[data-testid="planning-horizon-input"]').element.value).toBe('21')
    expect(wrapper.get<HTMLInputElement>('[data-testid="backdating-horizon-input"]').element.value).toBe('30')
    wrapper.unmount()
  })

  it('saves valid values and shows a confirmation toast', async () => {
    const wrapper = mount(SettingsView)
    await flushPromises()

    await wrapper.get('[data-testid="planning-horizon-input"]').setValue(25)
    await wrapper.get('[data-testid="backdating-horizon-input"]').setValue(20)
    await wrapper.get('[data-testid="settings-save"]').trigger('click')
    await flushPromises()

    expect(mockUpdate).toHaveBeenCalledWith({ planningHorizonDays: 25, backdatingHorizonDays: 20 })
    expect(useToasts().toasts.value.some((t) => t.kind === 'success')).toBe(true)
    wrapper.unmount()
  })

  it('blocks saving out-of-bounds values and shows guidance', async () => {
    const wrapper = mount(SettingsView)
    await flushPromises()

    await wrapper.get('[data-testid="planning-horizon-input"]').setValue(0)
    await wrapper.get('[data-testid="settings-save"]').trigger('click')
    await flushPromises()

    expect(mockUpdate).not.toHaveBeenCalled()
    expect(useToasts().toasts.value.some((t) => t.kind === 'error')).toBe(true)
    wrapper.unmount()
  })

  it('resets both fields to the 14-day defaults', async () => {
    const wrapper = mount(SettingsView)
    await flushPromises()

    await wrapper.get('[data-testid="planning-horizon-input"]').setValue(45)
    await wrapper.get('[data-testid="settings-reset"]').trigger('click')

    expect(wrapper.get<HTMLInputElement>('[data-testid="planning-horizon-input"]').element.value).toBe('14')
    expect(wrapper.get<HTMLInputElement>('[data-testid="backdating-horizon-input"]').element.value).toBe('14')
    wrapper.unmount()
  })

  it('shows a retry card when the load fails and recovers on retry', async () => {
    mockGet.mockRejectedValueOnce(new Error('offline'))

    const wrapper = mount(SettingsView)
    await flushPromises()

    expect(wrapper.find('[data-testid="settings-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="planning-horizon-input"]').exists()).toBe(false)

    await wrapper.get('[data-testid="settings-error"] button').trigger('click')
    await flushPromises()

    expect(mockGet).toHaveBeenCalledTimes(2)
    expect(wrapper.get<HTMLInputElement>('[data-testid="planning-horizon-input"]').element.value).toBe('14')
    wrapper.unmount()
  })

  it('guards navigation with unsaved changes and discards on confirm', async () => {
    const wrapper = mount(SettingsView)
    await flushPromises()

    expect(leaveGuard?.({ fullPath: '/calendar' })).toBe(true)

    await wrapper.get('[data-testid="planning-horizon-input"]').setValue(30)

    expect(leaveGuard?.({ fullPath: '/calendar' })).toBe(false)
    await flushPromises()
    expect(wrapper.find('[data-testid="settings-discard-confirm"]').exists()).toBe(true)

    await wrapper.get('[data-testid="settings-discard-confirm"]').trigger('click')

    expect(wrapper.get<HTMLInputElement>('[data-testid="planning-horizon-input"]').element.value).toBe('14')
    expect(mockPush).toHaveBeenCalledWith('/calendar')
    wrapper.unmount()
  })
})
