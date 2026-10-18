import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import AppShell from '../AppShell.vue'
import type { ShellHeaderConfig } from '@/composables/useShellHeader'
import { routerKey, routeLocationKey } from 'vue-router'

const mockPush = vi.fn<(path: string) => Promise<void>>(() => Promise.resolve())

const stubHeaderConfig = ref<ShellHeaderConfig>({ title: 'Tasks' })

vi.mock('vue-router', async () => {
  const { shellHeaderKey } = await import('@/composables/useShellHeader')
  const { inject } = await import('vue')
  const routerKey = Symbol('routerKey')
  const routeLocationKey = Symbol('routeLocationKey')
  const routerStub = {
    push: (path: string) => mockPush(path),
  }
  return {
    useRouter: () => routerStub,
    // The routed child configures the header, like a real view does.
    RouterView: defineComponent({
      name: 'StubView',
      setup() {
        const header = inject(shellHeaderKey, undefined)
        if (header) Object.assign(header, stubHeaderConfig.value)
        return () => h('div', { 'data-testid': 'stub-view' })
      },
    }),
    routerKey,
    routeLocationKey,
  }
})

function mountShell() {
  return mount(AppShell, {
    global: {
      // DuckotaFab talks to the planner API on mount; stub it out here.
      stubs: {
        DuckotaFab: { template: '<div data-testid="duckota-fab" />' },
      },
      provide: {
        [routerKey]: { push: mockPush },
        [routeLocationKey]: { path: '/tasks' },
      },
    },
  })
}

describe('AppShell', () => {
  beforeEach(() => {
    mockPush.mockClear()
    stubHeaderConfig.value = { title: 'Tasks' }
  })

  it('renders the shared chrome around the routed view', async () => {
    const wrapper = mountShell()
    await flushPromises()

    expect(wrapper.find('[data-testid="app-header"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="app-header-title"]').text()).toBe('Tasks')
    expect(wrapper.find('[data-testid="stub-view"]').exists()).toBe(true)
    expect(wrapper.find('nav[aria-label="Main navigation"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="duckota-fab"]').exists()).toBe(true)
  })

  it('renders the default account menu and routes to select-account', async () => {
    const wrapper = mountShell()

    await wrapper.get('[data-testid="topbar-menu"]').trigger('click')
    await flushPromises()

    const item = document.querySelector<HTMLElement>('[data-testid="select-account-item"]')
    expect(item).not.toBeNull()
    expect(item!.textContent).toContain('Select Account')

    item!.click()
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith('/select-account')
  })

  it('navigates to the notes tab from the bottom navigation', async () => {
    const wrapper = mountShell()

    await wrapper
      .get('nav[aria-label="Main navigation"]')
      .get('[data-id="notes"]')
      .trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/notes')
  })

  it('renders view-provided header regions over the defaults', async () => {
    stubHeaderConfig.value = {
      title: 'Friday, Oct 17',
      left: () => h('button', { 'data-testid': 'custom-left' }),
      right: () => h('button', { 'data-testid': 'custom-right' }),
    }

    const wrapper = mountShell()
    await flushPromises()

    expect(wrapper.get('[data-testid="app-header-title"]').text()).toBe('Friday, Oct 17')
    expect(wrapper.find('[data-testid="custom-left"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="custom-right"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="topbar-menu"]').exists()).toBe(false)
  })
})
