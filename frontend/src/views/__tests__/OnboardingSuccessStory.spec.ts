import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import OnboardingSuccessStory from '../OnboardingSuccessView.story.vue'
import { resetRouteWipe } from '@/composables/useRouteWipe'

// Reproduces the Histoire wiring: the story runs inside a sub-app that installs
// the memory router from histoire.setup.ts, then mounts every variant's slot.
describe('OnboardingSuccessView story', () => {
  beforeEach(() => {
    resetRouteWipe()
  })

  it('mounts all variants and drives the wipe demo to the calendar stub', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
    })

    const wrapper = mount(OnboardingSuccessStory, {
      global: {
        plugins: [router],
        stubs: {
          Story: { template: '<div><slot /></div>' },
          Variant: { template: '<div><slot /></div>' },
        },
      },
    })
    await flushPromises()

    // The routed demo shows the revealed celebration.
    expect(wrapper.text()).toContain('You did it!')

    const ctas = wrapper.findAll('button[aria-label="Go to your calendar"]')
    expect(ctas.length).toBeGreaterThan(0)

    await ctas[ctas.length - 1]!.trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('CALENDAR'))

    // Tapping the stub replays the demo.
    const stub = wrapper.findAll('button').find((b) => b.text().includes('CALENDAR'))
    await stub!.trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('You did it!'))
  })
})
