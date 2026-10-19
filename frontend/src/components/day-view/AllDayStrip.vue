<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ChevronUp } from '@lucide/vue'
import type { UntimedDayItem } from '../../utils/untimedItems'
import UntimedPill from './UntimedPill.vue'

const props = withDefaults(
  defineProps<{
    items: UntimedDayItem[]
    today?: boolean // wash the strip when the shown day is today
  }>(),
  { today: false },
)

const emit = defineEmits<{
  (e: 'selectUntimed', item: UntimedDayItem, originRect: DOMRect): void
}>()

const MAX_COLLAPSED_ITEMS = 3

const expanded = ref(false)
const hiddenCount = computed(() => Math.max(props.items.length - MAX_COLLAPSED_ITEMS, 0))
const collapsible = computed(() => hiddenCount.value > 0)
const primaryItems = computed(() => props.items.slice(0, MAX_COLLAPSED_ITEMS))
const overflowItems = computed(() => props.items.slice(MAX_COLLAPSED_ITEMS))
</script>

<template>
  <!-- Left padding is set by the parent so pills line up with the day column -->
  <section
    aria-label="Tasks and events without a time"
    class="relative border-b border-app-border py-1.5 pr-2"
  >
    <!-- Expand/collapse: sits in the time-axis gutter at the left -->
    <button
      v-if="collapsible"
      type="button"
      class="absolute left-1.5 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-stone-200/60"
      :aria-label="expanded ? 'Show fewer items' : `Show ${hiddenCount} more items`"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <component :is="expanded ? ChevronUp : ChevronDown" class="h-4 w-4" :stroke-width="2.5" />
    </button>

    <ul class="flex flex-col gap-1">
      <li v-for="item in primaryItems" :key="item.id" class="min-w-0 shrink-0">
        <UntimedPill
          :item="item"
          @select="(pillItem, rect) => emit('selectUntimed', pillItem, rect)"
        />
      </li>
      <li
        v-if="collapsible && !expanded"
        class="flex h-5 shrink-0 items-center px-3 text-[11px] font-semibold text-text-muted"
      >
        +{{ hiddenCount }} more
      </li>
    </ul>

    <!-- Overflow items: the grid-rows trick animates the strip open without JS measuring -->
    <div
      v-if="collapsible"
      class="grid transition-[grid-template-rows] duration-200 ease-out"
      :class="expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="min-h-0 overflow-hidden">
        <ul class="flex flex-col gap-1 pt-1" :inert="!expanded || undefined">
          <li v-for="item in overflowItems" :key="item.id" class="min-w-0 shrink-0">
            <UntimedPill
              :item="item"
              @select="(pillItem, rect) => emit('selectUntimed', pillItem, rect)"
            />
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
