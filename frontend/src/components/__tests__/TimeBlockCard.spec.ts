import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimeBlockCard, { createBlock, createScheduleDraft } from '../TimeBlockCard.vue'
import type { TimeBlockDraft } from '../TimeBlockCard.vue'

describe('TimeBlockCard', () => {
  function makeBlock(overrides: Partial<TimeBlockDraft> = {}): TimeBlockDraft {
    return {
      ...createBlock(),
      ...overrides,
    }
  }

  it('renders time block index heading', () => {
    const block = makeBlock()
    const wrapper = mount(TimeBlockCard, {
      props: { block, index: 0 },
    })

    expect(wrapper.text()).toContain('Time block 1')
  })

  it('does not render delete button for the first block by default', () => {
    const block = makeBlock()
    const wrapper = mount(TimeBlockCard, {
      props: { block, index: 0 },
    })

    expect(wrapper.find('[aria-label="Delete time block"]').exists()).toBe(false)
  })

  it('renders delete button for subsequent blocks and emits remove on click', async () => {
    const block = makeBlock()
    const wrapper = mount(TimeBlockCard, {
      props: { block, index: 1 },
    })

    const deleteBtn = wrapper.find('[aria-label="Delete time block"]')
    expect(deleteBtn.exists()).toBe(true)

    await deleteBtn.trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })

  it('respects canRemove prop override', () => {
    const block = makeBlock()
    const wrapper = mount(TimeBlockCard, {
      props: { block, index: 0, canRemove: true },
    })

    expect(wrapper.find('[aria-label="Delete time block"]').exists()).toBe(true)
  })

  it('displays status badges based on schedule draft states', () => {
    const savedBlock = makeBlock({
      selectedDays: ['MONDAY'],
      schedules: [{ ...createScheduleDraft('MONDAY'), state: 'saved' }],
    })
    const savedWrapper = mount(TimeBlockCard, {
      props: { block: savedBlock, index: 0 },
    })
    expect(savedWrapper.text()).toContain('Saved')

    const savingBlock = makeBlock({
      selectedDays: ['MONDAY'],
      schedules: [{ ...createScheduleDraft('MONDAY'), state: 'saving' }],
    })
    const savingWrapper = mount(TimeBlockCard, {
      props: { block: savingBlock, index: 0 },
    })
    expect(savingWrapper.text()).toContain('Saving')

    const failedBlock = makeBlock({
      selectedDays: ['MONDAY'],
      schedules: [{ ...createScheduleDraft('MONDAY'), state: 'failed', error: 'Invalid time' }],
    })
    const failedWrapper = mount(TimeBlockCard, {
      props: { block: failedBlock, index: 0 },
    })
    expect(failedWrapper.text()).toContain('Failed')
    expect(failedWrapper.text()).toContain('MONDAY: Invalid time')
  })

  it('emits toggleDay event when weekday toggle is clicked', async () => {
    const block = makeBlock({ selectedDays: ['MONDAY'] })
    const wrapper = mount(TimeBlockCard, {
      props: { block, index: 0 },
    })

    await wrapper.find('[aria-label="WEDNESDAY"]').trigger('click')
    expect(wrapper.emitted('toggleDay')).toEqual([['WEDNESDAY']])
  })

  it('emits update:startTime and update:endTime when time inputs change', async () => {
    const block = makeBlock({ startTime: '08:00', endTime: '09:00' })
    const wrapper = mount(TimeBlockCard, {
      props: { block, index: 0 },
    })

    const inputs = wrapper.findAll('input[type="time"]')
    await inputs[0]!.setValue('09:30')
    expect(wrapper.emitted('update:startTime')).toEqual([['09:30']])

    await inputs[1]!.setValue('11:00')
    expect(wrapper.emitted('update:endTime')).toEqual([['11:00']])
  })

  it('disables inputs and buttons when saving is true or status is saved', () => {
    const savingBlock = makeBlock()
    const savingWrapper = mount(TimeBlockCard, {
      props: { block: savingBlock, index: 1, saving: true },
    })

    expect(
      savingWrapper.find('[aria-label="Delete time block"]').attributes('disabled'),
    ).toBeDefined()
    for (const input of savingWrapper.findAll('input[type="time"]')) {
      expect(input.attributes('disabled')).toBeDefined()
    }
  })
})
