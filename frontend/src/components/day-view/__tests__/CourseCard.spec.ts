import { beforeEach, describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CourseCard from '../CourseCard.vue'
import { useCatalog } from '@/composables/useCatalog'
import type { DayEvent } from '@/types/calendar'

describe('CourseCard', () => {
  beforeEach(() => {
    useCatalog().resetCatalog()
  })

  const sampleEvent: DayEvent = {
    id: 'evt-1',
    courseId: 1,
    title: 'Operating Systems',
    start: '2026-10-16 09:00',
    end: '2026-10-16 11:00',
    detail: 'Room 301',
  }

  it('renders title and formatted time', () => {
    const wrapper = mount(CourseCard, {
      props: {
        event: sampleEvent,
        embedded: true,
      },
    })

    expect(wrapper.text()).toContain('Operating Systems')
    expect(wrapper.text()).toContain('9:00 - 11:00 AM')
  })

  it('paints the card with the palette color stored on the course', () => {
    useCatalog().applyCourseCreated({ id: 1, name: 'Operating Systems', color: 'flamingo' })
    const wrapper = mount(CourseCard, {
      props: {
        event: sampleEvent,
        embedded: true,
      },
    })

    const el = wrapper.element as HTMLElement
    expect(el.style.backgroundColor).toBe('rgb(230, 124, 115)') // flamingo solid #E67C73
    expect(el.style.color).toBe('rgb(255, 255, 255)') // white ink on saturated fill
  })

  it('emits select with event and DOMRect when clicked', async () => {
    const wrapper = mount(CourseCard, {
      props: {
        event: sampleEvent,
        embedded: true,
      },
    })

    await wrapper.trigger('click')

    const emitted = wrapper.emitted('select')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[0]).toEqual(sampleEvent)
    expect(emitted?.[0]?.[1]).toBeDefined()
  })
})
