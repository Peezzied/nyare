<script setup lang="ts">
import { computed } from 'vue'
import type { UntimedDayItem } from '../../utils/untimedItems'

const props = defineProps<{
  item: UntimedDayItem
}>()

const emit = defineEmits<{
  (e: 'select', item: UntimedDayItem, originRect: DOMRect): void
}>()

function handleClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  emit('select', props.item, rect)
}

// Same 4-theme derivation as CourseCard so a course keeps one color everywhere.
const theme = computed(
  () =>
    (['green', 'blue', 'purple', 'orange'] as const)[Math.abs(props.item.courseId - 1) % 4] ??
    'blue',
)

const colorClasses = computed(() => {
  switch (theme.value) {
    case 'green':
      return 'bg-[#7CE19D] border-[#1E3A2F]'
    case 'blue':
      return 'bg-[#80C2F8] border-[#1E293B]'
    case 'purple':
      return 'bg-[#C084FC] border-[#3B0764]'
    case 'orange':
      return 'bg-[#FB923C] border-[#7C2D12]'
    default:
      return 'bg-[#80C2F8] border-[#1E293B]'
  }
})
</script>

<template>
  <!-- h-11 = 44px, the minimum comfortable tap target on a phone -->
  <button
    type="button"
    class="flex h-9 w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border-2 px-3 text-left text-sm shadow-sm transition-transform active:scale-[0.98]"
    :class="colorClasses"
    :aria-label="`${props.item.category}: ${props.item.title}`"
    @click="handleClick"
  >
    <span
      v-if="props.item.category === 'task'"
      class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-white/90 text-xs font-bold leading-none text-white"
      aria-hidden="true"
    >
      {{ props.item.completed ? '✓' : '' }}
    </span>
    <span v-else class="shrink-0 text-base leading-none text-white" aria-hidden="true"> ⚑ </span>
    <span class="min-w-0 flex-1 truncate font-bold text-white">{{ props.item.title }}</span>
  </button>
</template>
