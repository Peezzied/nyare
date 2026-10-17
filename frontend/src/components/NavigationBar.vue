<script setup lang="ts">
// Fixed bottom tab bar for the Tasks, Calendar, and Notes pages.
// Only NavigationBar.story.vue and its unit test render it now.
import { ref, computed, inject } from 'vue'
import { routerKey, routeLocationKey } from 'vue-router'
import { ClipboardList, Calendar, SquarePen } from '@lucide/vue'
import type { NavigationItem, NavigationBarProps } from '@/types/navigation'

const props = withDefaults(defineProps<NavigationBarProps & { showLabels?: boolean }>(), {
  modelValue: undefined,
  items: undefined,
  showLabels: false,
})

const emit = defineEmits<{
  /** Fires when the user clicks a tab. Payload is the tab item id. */
  (e: 'update:modelValue', id: string): void
  /** Fires after update:modelValue on each tab click. Payload is the clicked item. */
  (e: 'navigate', item: NavigationItem): void
}>()

// Safe router lookup for environments without vue-router context (like test/Histoire)
const router = inject(routerKey, undefined)
const route = inject(routeLocationKey, undefined)

const defaultItems: NavigationItem[] = [
  {
    id: 'tasks',
    label: 'Tasks',
    icon: ClipboardList,
    route: '/tasks',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    route: '/calendar',
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: SquarePen,
    route: '/notes',
  },
]

const navigationItems = computed(() => props.items ?? defaultItems)

const internalActiveId = ref<string>('calendar')

// Active tab priority: the modelValue prop, then a route path match, then the last clicked tab.
// The prefix match keeps the tab active on child routes such as /notes/:id.
const activeId = computed(() => {
  if (props.modelValue !== undefined) {
    return props.modelValue
  }
  if (route?.path) {
    const matched = navigationItems.value.find(
      (item) =>
        item.route === route?.path || (item.route !== '/' && route?.path.startsWith(item.route)),
    )
    if (matched) return matched.id
  }
  return internalActiveId.value
})

function isItemActive(item: NavigationItem): boolean {
  return activeId.value === item.id
}

function handleSelect(item: NavigationItem): void {
  internalActiveId.value = item.id
  emit('update:modelValue', item.id)
  emit('navigate', item)

  if (router && route && route.path !== item.route) {
    router.push(item.route).catch(() => {
      // Ignore redundant navigation errors
    })
  }
}
</script>

<template>
  <nav
    role="navigation"
    aria-label="Main navigation"
    class="fixed bottom-0 inset-x-0 z-40 bg-nav-bg border-t-3 border-app-border pb-[env(safe-area-inset-bottom)]"
  >
    <div role="tablist" class="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
      <button
        v-for="item in navigationItems"
        :key="item.id"
        type="button"
        role="tab"
        :data-id="item.id"
        :data-active="isItemActive(item)"
        :aria-selected="isItemActive(item)"
        :aria-current="isItemActive(item) ? 'page' : undefined"
        :aria-label="item.label"
        class="group relative flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-4 py-2 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 rounded-2xl cursor-pointer transition-all duration-150 ease-out active:translate-y-0.5 active:scale-95 motion-reduce:transition-none motion-reduce:transform-none"
        :class="[
          isItemActive(item)
            ? '-translate-y-1 text-[#00A4C8]'
            : 'translate-y-0 text-[#7B8B97] hover:text-[#334155]',
        ]"
        @click="handleSelect(item)"
      >
        <span
          class="relative flex items-center justify-center p-2 rounded-xl transition-colors duration-150"
          :class="[
            isItemActive(item)
              ? 'bg-[#E1F5FE] border-b-[3px] border-[#007B99]'
              : 'bg-transparent border-b-[3px] border-transparent',
          ]"
        >
          <component
            :is="item.icon"
            class="w-7 h-7 transition-transform duration-150"
            :stroke-width="isItemActive(item) ? 2.5 : 2"
            aria-hidden="true"
          />
        </span>

        <span
          v-if="showLabels"
          class="text-[11px] font-['Quicksand'] mt-0.5 transition-colors duration-150"
          :class="[isItemActive(item) ? 'font-bold text-[#00A4C8]' : 'font-medium text-[#7B8B97]']"
        >
          {{ item.label }}
        </span>

        <span class="sr-only">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>
