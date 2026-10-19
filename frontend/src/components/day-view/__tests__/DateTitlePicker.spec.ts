import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DateTitlePicker from '../DateTitlePicker.vue'

const selected = new Date(2026, 9, 15)

async function openPicker() {
  const wrapper = mount(DateTitlePicker, {
    props: { title: 'Thursday, Oct 15', selected },
    attachTo: document.body,
  })
  await wrapper.get('[data-testid="app-header-title"]').trigger('click')
  return wrapper
}

describe('DateTitlePicker.vue', () => {
  it('renders the header title inside a tappable trigger', () => {
    const wrapper = mount(DateTitlePicker, {
      props: { title: 'Thursday, Oct 15', selected },
    })
    const trigger = wrapper.get('[data-testid="app-header-title"]')
    expect(trigger.text()).toContain('Thursday, Oct 15')
    expect(trigger.attributes('aria-haspopup')).toBe('dialog')
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  it('opens a mini month for the selected date and emits select on a day pick', async () => {
    const wrapper = await openPicker()
    const dayButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('[data-slot="calendar-cell-trigger"]'),
    ).find((button) => button.textContent?.trim() === '20')
    expect(dayButton).toBeTruthy()
    dayButton!.click()
    await wrapper.vm.$nextTick()

    const emitted = wrapper.emitted('select')
    expect(emitted).toBeTruthy()
    const picked = emitted![0]![0] as Date
    expect(picked.getFullYear()).toBe(2026)
    expect(picked.getMonth()).toBe(9)
    expect(picked.getDate()).toBe(20)
  })

  it('marks busy days with a dot when hasItems returns true', async () => {
    const hasItems = (date: Date) => date.getDate() === 20
    const wrapper = mount(DateTitlePicker, {
      props: { title: 'Thursday, Oct 15', selected, hasItems },
      attachTo: document.body,
    })
    await wrapper.get('[data-testid="app-header-title"]').trigger('click')

    const dots = document.body.querySelectorAll('[data-slot="calendar-cell"] span.rounded-full')
    expect(dots.length).toBeGreaterThanOrEqual(1)
  })
})
