import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NavigationBar from '../NavigationBar.vue'

describe('NavigationBar.vue', () => {
  it('renders three primary destination tabs by default', () => {
    const wrapper = mount(NavigationBar)
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(3)
  })

  it('sets the active tab based on modelValue', () => {
    const wrapper = mount(NavigationBar, {
      props: {
        modelValue: 'calendar',
      },
    })
    const activeTab = wrapper.find('[data-active="true"]')
    expect(activeTab.exists()).toBe(true)
    expect(activeTab.attributes('data-id')).toBe('calendar')
    expect(activeTab.attributes('aria-selected')).toBe('true')
  })

  it('emits update:modelValue and navigate when a tab is clicked', async () => {
    const wrapper = mount(NavigationBar, {
      props: {
        modelValue: 'calendar',
      },
    })
    const tasksTab = wrapper.find('[data-id="tasks"]')
    await tasksTab.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['tasks'])
    expect(wrapper.emitted('navigate')).toBeTruthy()
  })

  it('applies the Duolingo lift transform and accent classes to the active tab', () => {
    const wrapper = mount(NavigationBar, {
      props: {
        modelValue: 'calendar',
      },
    })
    const activeTab = wrapper.find('[data-id="calendar"]')
    const inactiveTab = wrapper.find('[data-id="tasks"]')

    // Active tab has lift translation and accent color
    expect(activeTab.classes()).toContain('-translate-y-1')
    expect(activeTab.classes()).toContain('text-[#00A4C8]')

    // Inactive tab is resting on baseline in muted color
    expect(inactiveTab.classes()).toContain('translate-y-0')
    expect(inactiveTab.classes()).toContain('text-[#7B8B97]')
  })

  it('satisfies accessible touch target boundaries and safe-area markup', () => {
    const wrapper = mount(NavigationBar)
    const nav = wrapper.find('nav')
    expect(nav.attributes('role')).toBe('navigation')
    expect(nav.attributes('aria-label')).toBe('Main navigation')

    const tabs = wrapper.findAll('[role="tab"]')
    for (const tab of tabs) {
      expect(tab.attributes('aria-label')).toBeTruthy()
      expect(tab.classes()).toContain('min-h-[44px]')
      expect(tab.classes()).toContain('min-w-[48px]')
    }
  })
})
