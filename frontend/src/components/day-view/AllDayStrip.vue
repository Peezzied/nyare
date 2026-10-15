<script setup lang="ts">
import type { UntimedDayItem } from '../../utils/untimedItems'
import UntimedPill from './UntimedPill.vue'

defineProps<{
  items: UntimedDayItem[]
}>()

const emit = defineEmits<{
  (e: 'select', item: UntimedDayItem): void
}>()
</script>

<template>
  <!-- Left padding is set by the parent so pills line up with the day column -->
  <section
    aria-label="Tasks and events without a time"
    class="border-b border-[#9ccfe0] bg-[#F5F6EE] py-1.5 pr-2"
  >
    <!-- About 2.5 rows visible so it is clear there is more; vertical scroll only -->
    <ul
      class="flex max-h-[7.5rem] flex-col gap-1.5 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:thin] [scrollbar-color:#a8a29e_transparent]"
    >
      <li v-for="item in items" :key="item.id" class="min-w-0 shrink-0">
        <UntimedPill :item="item" @select="emit('select', $event)" />
      </li>
    </ul>
  </section>
</template>
