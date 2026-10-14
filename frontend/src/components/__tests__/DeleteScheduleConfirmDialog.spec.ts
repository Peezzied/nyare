import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import * as api from '@/api'
import DeleteScheduleConfirmDialog from '../DeleteScheduleConfirmDialog.vue'

interface DeleteScheduleTarget {
  id: number
  courseId: number
  name: string
}

vi.mock('@/api', () => ({
  schedulesApi: {
    delete: vi.fn<() => Promise<void>>(),
  },
}))

const schedule: DeleteScheduleTarget = {
  id: 7,
  courseId: 2,
  name: 'OOP',
}

describe('DeleteScheduleConfirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the confirmation details and schedule name', () => {
    const wrapper = mount(DeleteScheduleConfirmDialog, {
      props: {
        open: true,
        schedule,
      },
    })

    expect(wrapper.text()).toContain('Delete Schedule')
    expect(wrapper.text()).toContain('Are you sure you want to delete the schedule:')
    expect(wrapper.text()).toContain('OOP')
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('calls the delete API once and emits deleted on success', async () => {
    vi.mocked(api.schedulesApi.delete).mockResolvedValueOnce(undefined)

    const wrapper = mount(DeleteScheduleConfirmDialog, {
      props: {
        open: true,
        schedule,
      },
    })

    const confirmButton = wrapper.findAll('button').find((button) => button.text() === 'CONFIRM')
    expect(confirmButton).toBeDefined()

    await confirmButton!.trigger('click')
    await flushPromises()

    expect(api.schedulesApi.delete).toHaveBeenCalledTimes(1)
    expect(api.schedulesApi.delete).toHaveBeenCalledWith(7)
    expect(wrapper.emitted('deleted')).toEqual([[7]])
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('dismisses without deleting on Back', async () => {
    const wrapper = mount(DeleteScheduleConfirmDialog, {
      props: {
        open: true,
        schedule,
      },
    })

    const backButton = wrapper.findAll('button').find((button) => button.text() === 'Back')
    expect(backButton).toBeDefined()

    await backButton!.trigger('click')
    await flushPromises()

    expect(api.schedulesApi.delete).not.toHaveBeenCalled()
    expect(wrapper.emitted('deleted')).toBeUndefined()
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('shows a retryable error and no success event when deletion fails', async () => {
    vi.mocked(api.schedulesApi.delete).mockRejectedValueOnce(new Error('Request failed'))

    const wrapper = mount(DeleteScheduleConfirmDialog, {
      props: {
        open: true,
        schedule,
      },
    })

    const confirmButton = wrapper.findAll('button').find((button) => button.text() === 'CONFIRM')
    await confirmButton!.trigger('click')
    await flushPromises()

    expect(api.schedulesApi.delete).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('deleted')).toBeUndefined()
    expect(wrapper.text()).toContain('Unable to delete the schedule. Please try again.')
    expect((confirmButton!.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('disables CONFIRM when no schedule target is supplied', () => {
    const wrapper = mount(DeleteScheduleConfirmDialog, {
      props: {
        open: true,
        schedule: null,
      },
    })

    const confirmButton = wrapper.findAll('button').find((button) => button.text() === 'CONFIRM')
    expect(confirmButton).toBeDefined()
    expect((confirmButton!.element as HTMLButtonElement).disabled).toBe(true)

    const button = confirmButton!
    expect(button.attributes('disabled')).toBeDefined()
  })
})