import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WeekPreview from '@/components/WeekPreview.vue'
import type { PreviewBlock } from '@/utils/weekPreview'
import type { CoursePaletteColor } from '@/constants/palette'

const sampleColor: CoursePaletteColor = {
  id: 'tomato',
  name: 'Tomato',
  solid: '#D50000',
  bg: '#FFEBEE',
  text: '#B71C1C',
  border: '#EF9A9A',
}

describe('WeekPreview.vue', () => {
  it('renders the seven weekday labels and no date numbers', () => {
    const wrapper = mount(WeekPreview, {
      props: {
        blocks: [],
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Su')
    expect(text).toContain('Mo')
    expect(text).toContain('Tu')
    expect(text).toContain('We')
    expect(text).toContain('Th')
    expect(text).toContain('Fr')
    expect(text).toContain('Sa')

    const header = wrapper.find('[role="grid"]')
    expect(header.exists()).toBe(true)
  })

  it('renders PreviewBlock with its title in the correct column', () => {
    const block: PreviewBlock = {
      id: 'block-1-MONDAY',
      day: 'MONDAY',
      title: 'CS 101',
      startTime: '09:00',
      endTime: '10:00',
      color: sampleColor,
      blockId: 'block-1',
    }

    const wrapper = mount(WeekPreview, {
      props: {
        blocks: [block],
      },
    })

    expect(wrapper.text()).toContain('CS 101')
    const button = wrapper.find('button[aria-label="CS 101 09:00 to 10:00"]')
    expect(button.exists()).toBe(true)
  })

  it('emits selectBlock when a block is clicked', async () => {
    const block: PreviewBlock = {
      id: 'block-1-MONDAY',
      day: 'MONDAY',
      title: 'CS 101',
      startTime: '09:00',
      endTime: '10:00',
      color: sampleColor,
      blockId: 'block-1',
    }

    const wrapper = mount(WeekPreview, {
      props: {
        blocks: [block],
      },
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(wrapper.emitted('selectBlock')).toBeTruthy()
    expect(wrapper.emitted('selectBlock')![0]).toEqual(['block-1'])
  })
})
