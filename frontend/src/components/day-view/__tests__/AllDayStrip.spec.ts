import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AllDayStrip from '../AllDayStrip.vue'
import type { UntimedDayItem } from '@/utils/untimedItems'

function makeItem(n: number): UntimedDayItem {
  return {
    id: `item-${n}`,
    title: `Item ${n}`,
    category: 'task',
    courseId: 1,
    completed: false,
    date: '2026-10-14',
  }
}

describe('AllDayStrip', () => {
  it('renders all items when there are three or fewer', () => {
    const wrapper = mount(AllDayStrip, { props: { items: [makeItem(1), makeItem(2)] } })

    expect(wrapper.text()).toContain('Item 1')
    expect(wrapper.text()).toContain('Item 2')
    expect(wrapper.text()).not.toContain('more')
    expect(wrapper.find('button[aria-expanded]').exists()).toBe(false)
  })

  it('caps at three items with a +N indicator and a collapsed overflow region', () => {
    const wrapper = mount(AllDayStrip, {
      props: { items: [makeItem(1), makeItem(2), makeItem(3), makeItem(4), makeItem(5)] },
    })

    expect(wrapper.text()).toContain('+2 more')
    const overflow = wrapper.find('.grid.grid-rows-\\[0fr\\]')
    expect(overflow.exists()).toBe(true)
    expect(overflow.find('ul').attributes('inert')).toBeDefined()
  })

  it('expands the overflow region when the chevron is tapped', async () => {
    const wrapper = mount(AllDayStrip, {
      props: { items: [makeItem(1), makeItem(2), makeItem(3), makeItem(4)] },
    })

    await wrapper.find('button[aria-expanded]').trigger('click')

    expect(wrapper.find('.grid-rows-\\[1fr\\]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('more')
  })
})
