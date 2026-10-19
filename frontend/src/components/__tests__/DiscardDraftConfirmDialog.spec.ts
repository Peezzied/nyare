import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DiscardDraftConfirmDialog from '../DiscardDraftConfirmDialog.vue'

describe('DiscardDraftConfirmDialog', () => {
  it('does not render dialog content when open is false', () => {
    const wrapper = mount(DiscardDraftConfirmDialog, {
      props: { open: false },
    })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('renders dialog with title, description, and two actions when open is true', () => {
    const wrapper = mount(DiscardDraftConfirmDialog, {
      props: { open: true },
    })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Discard changes')
    expect(wrapper.text()).toContain('Keep editing')
    expect(wrapper.text()).toContain('Discard')
  })

  it('emits keepEditing and update:open false when Keep editing is clicked', async () => {
    const wrapper = mount(DiscardDraftConfirmDialog, {
      props: { open: true },
    })

    const keepBtn = wrapper.findAll('button').find((b) => b.text().includes('Keep editing'))
    expect(keepBtn).toBeDefined()
    await keepBtn!.trigger('click')

    expect(wrapper.emitted('keepEditing')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('emits discard and update:open false when Discard is clicked', async () => {
    const wrapper = mount(DiscardDraftConfirmDialog, {
      props: { open: true },
    })

    const discardBtn = wrapper.findAll('button').find((b) => b.text().includes('Discard'))
    expect(discardBtn).toBeDefined()
    await discardBtn!.trigger('click')

    expect(wrapper.emitted('discard')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('emits keepEditing and update:open false on Escape key press', async () => {
    const wrapper = mount(DiscardDraftConfirmDialog, {
      props: { open: true },
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(wrapper.emitted('keepEditing')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('emits keepEditing and update:open false when backdrop is clicked', async () => {
    const wrapper = mount(DiscardDraftConfirmDialog, {
      props: { open: true },
    })

    const backdrop = wrapper.find('[role="presentation"]')
    await backdrop.trigger('click')

    expect(wrapper.emitted('keepEditing')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })
})
