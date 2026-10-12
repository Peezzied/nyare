import type { Component } from 'vue'

export interface NavigationItem {
  id: string
  label: string
  icon: Component
  route: string
  badgeCount?: number
}

export interface NavigationBarProps {
  modelValue?: string
  items?: NavigationItem[]
}

export type NavigationBarEmits = {
  (e: 'update:modelValue', id: string): void
  (e: 'navigate', item: NavigationItem): void
}
