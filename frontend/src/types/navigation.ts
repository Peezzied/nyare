import type { Component } from 'vue'

/** One destination in the navigation bar. */
export interface NavigationItem {
  id: string
  label: string
  icon: Component
  route: string
  badgeCount?: number
}

/** Props of the `NavigationBar` component. */
export interface NavigationBarProps {
  /** `id` of the active `NavigationItem`. It overrides the route match. Binds with `v-model`. */
  modelValue?: string
  items?: NavigationItem[]
}

/** Event signatures that match the `NavigationBar` component emits. */
export type NavigationBarEmits = {
  (e: 'update:modelValue', id: string): void
  (e: 'navigate', item: NavigationItem): void
}
