import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WeekPill from '../WeekPill.vue'
import type { DayEvent } from '@/types/calendar'

describe('WeekPill', () => {
  const sampleEvent: DayEvent = {
    id: 'evt-week-1',
    courseId: 2,
    title: 'Calculus 2',
    start: '2026-10-14 13:00',
    end: '2026-10-14 15:00',
    detail: 'Room 301',
    colorTheme: 'blue',
  }

  it('renders title and detail text', () => {
    const wrapper = mount(WeekPill, {
      props: {
        event: sampleEvent,
      },
    })

    expect(wrapper.text()).toContain('Calculus 2')
    expect(wrapper.text()).toContain('Room 301')
  })

  it('emits select with event and originRect DOMRect on click', async () => {
    const wrapper = mount(WeekPill, {
      props: {
        event: sampleEvent,
      },
    })

    await wrapper.trigger('click')

    const emitted = wrapper.emitted('select')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toEqual(sampleEvent)
    expect(emitted?.[0]?.[1]).toBeDefined()
  })
})
