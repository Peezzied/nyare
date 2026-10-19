<script setup lang="ts">
import { computed } from 'vue'
import { Check, Flag } from '@lucide/vue'
import type { UntimedDayItem } from '../../utils/untimedItems'
import { CLASS_THEME_STYLES, classThemeForCourse } from '../../utils/calendarStyle'

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

// Tri-block surfaces (DESIGN.md §6): an event is a saturated fill with white
// ink, a task is a white card with a checkbox.
const theme = computed(() => CLASS_THEME_STYLES[classThemeForCourse(props.item.courseId)])

const surfaceClasses = computed(() =>
  props.item.category === 'event'
    ? `${theme.value.solid} ${theme.value.solidEdge} border-2 text-white`
    : 'bg-white border border-[#CBD5E1] text-[#334155]',
)
</script>

<template>
  <!-- h-7 keeps the all-day row compact on a phone -->
  <button
    type="button"
    class="flex h-7 w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg px-3 text-left text-sm transition-colors active:brightness-95"
    :class="surfaceClasses"
    :aria-label="`${props.item.category}: ${props.item.title}`"
    @click="handleClick"
  >
    <span
      v-if="props.item.category === 'task'"
      class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-[#94A3B8]"
      aria-hidden="true"
    >
      <Check v-if="props.item.completed" class="h-3.5 w-3.5 text-[#334155]" :stroke-width="3" />
    </span>
    <Flag v-else class="h-3.5 w-3.5 shrink-0" :stroke-width="2.5" aria-hidden="true" />
    <span class="min-w-0 flex-1 truncate font-semibold">{{ props.item.title }}</span>
  </button>
</template>
