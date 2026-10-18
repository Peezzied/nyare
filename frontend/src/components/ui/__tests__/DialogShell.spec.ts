import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DialogShell from '../DialogShell.vue'

function mountShell(open = true, busy = false) {
  return mount(DialogShell, {
    props: { open, title: 'Delete Schedule', busy },
    slots: {
      default: '<p>Body</p>',
      actions: '<button>Back</button>',
    },
  })
}

describe('DialogShell', () => {
  it('renders the title, content, and action slots inside the dialog', () => {
    const wrapper = mountShell()

    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.text()).toContain('Delete Schedule')
    expect(dialog.text()).toContain('Body')
    expect(dialog.text()).toContain('Back')
    expect(dialog.attributes('aria-labelledby')).toBeDefined()
    expect(dialog.attributes('aria-describedby')).toBeDefined()
  })

  it('dismisses on Escape and emits cancel', async () => {
    const wrapper = mountShell()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('ignores dismissal while busy', async () => {
    const wrapper = mountShell(true, true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.get('[role="presentation"]').trigger('click')
    await nextTick()

    expect(wrapper.emitted('update:open')).toBeUndefined()
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('dismisses on backdrop click', async () => {
    const wrapper = mountShell()

    await wrapper.get('[role="presentation"]').trigger('click')

    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})
