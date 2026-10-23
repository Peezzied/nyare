import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { useRouteWipe, resetRouteWipe } from '../useRouteWipe'
import RouteWipeOverlay from '@/components/RouteWipeOverlay.vue'

const HomeStub = defineComponent({ setup: () => () => h('div', 'home') })
const CalendarStub = defineComponent({ setup: () => () => h('div', 'calendar-stub') })

const Host = defineComponent({
  components: { RouterView, RouteWipeOverlay },
  setup() {
    const { wipeTo } = useRouteWipe()
    const go = (event: MouseEvent) =>
      void wipeTo('/calendar', { x: event.clientX || 50, y: event.clientY || 50 })
    return { go }
  },
  template: '<RouterView /><RouteWipeOverlay /><button data-testid="go" @click="go" />',
})

function mountHost() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: HomeStub },
      { path: '/calendar', component: CalendarStub },
    ],
  })
  return { wrapper: mount(Host, { global: { plugins: [router] } }), router }
}

describe('useRouteWipe', () => {
  beforeEach(() => {
    resetRouteWipe()
    vi.restoreAllMocks()
  })

  it('covers the viewport with the disc, swaps the route, then fades out', async () => {
    const { wrapper, router } = mountHost()
    await router.replace('/')

    await wrapper.find('[data-testid="go"]').trigger('click')

    // The disc mounts immediately and the route swap waits for the cover.
    expect(wrapper.find('.veil').exists()).toBe(true)
    expect(wrapper.find('.disc').exists()).toBe(true)
    expect(router.currentRoute.value.path).toBe('/')

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/calendar'))
    expect(wrapper.text()).toContain('calendar-stub')

    // The disc clears after the fade.
    await vi.waitFor(() => expect(wrapper.find('.veil').exists()).toBe(false))
  })

  it('navigates immediately when reduced motion is preferred', async () => {
    // jsdom ships no matchMedia; isReducedMotion treats its absence as false.
    Object.defineProperty(window, 'matchMedia', {
      value: () => ({ matches: true }) as MediaQueryList,
      configurable: true,
    })
    const { wrapper, router } = mountHost()
    await router.replace('/')

    await wrapper.find('[data-testid="go"]').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/calendar'))

    expect(wrapper.find('.veil').exists()).toBe(false)
  })
})
