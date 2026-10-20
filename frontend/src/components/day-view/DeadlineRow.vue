<script setup lang="ts">
// One deadline row in the Deadlines list: a saturated course-colored block
// for upcoming events, a muted parchment block for past ones (DESIGN.md §6).
import { computed } from 'vue'
import { Flag } from '@lucide/vue'
import type { DeadlineRow } from '@/utils/deadlineSections'
import { CLASS_THEME_STYLES, classThemeForCourse } from '@/utils/calendarStyle'

const props = defineProps<{
  row: DeadlineRow
  courseName: string
  past?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', originRect: DOMRect): void
}>()

const theme = computed(() => CLASS_THEME_STYLES[classThemeForCourse(props.row.event.courseId)])

const surfaceClasses = computed(() =>
  props.past
    ? 'border border-[#D5DBCB] bg-[#F1F3EA] text-[#7B8B97]'
    : `${theme.value.solid} ${theme.value.solidEdge} border-2 text-white`,
)

const meta = computed(() =>
  [props.courseName, props.row.timeLabel].filter(Boolean).join(' · '),
)

function handleClick(e: MouseEvent) {
  emit('select', (e.currentTarget as HTMLElement).getBoundingClientRect())
}
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors active:brightness-95"
    :class="surfaceClasses"
    :aria-label="`Deadline: ${row.event.title}`"
    @click="handleClick"
  >
    <Flag class="h-4 w-4 shrink-0" :stroke-width="2.5" aria-hidden="true" />
    <span class="min-w-0 flex-1">
      <span class="block truncate font-bold">{{ row.event.title }}</span>
      <span class="block truncate text-sm opacity-90">{{ meta }}</span>
    </span>
    <span
      v-if="row.countdownLabel"
      class="shrink-0 rounded-lg bg-white/20 px-2 py-1 text-xs font-bold"
    >
      {{ row.countdownLabel }}
    </span>
  </button>
</template>
