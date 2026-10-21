<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DayEvent } from '../../types/calendar'
import { buildMarkerState } from '../../utils/calendarItemDetail'
import { CLASS_THEME_STYLES } from '../../utils/calendarStyle'

// Compact class pill for the 7-column week grid
const props = defineProps<{
  event: DayEvent
}>()

const emit = defineEmits<{
  (e: 'select', event: DayEvent, originRect: DOMRect): void
}>()

const pillRef = ref<HTMLElement | null>(null)

const CLASS_MARKER_LABEL = buildMarkerState('class').label

function handleActivate(e: MouseEvent | KeyboardEvent) {
  const rect =
    pillRef.value?.getBoundingClientRect() ??
    (e.currentTarget as HTMLElement | null)?.getBoundingClientRect()
  if (rect) emit('select', props.event, rect)
}

const theme = computed(() => CLASS_THEME_STYLES[props.event.colorTheme])
</script>

<template>
  <div
    ref="pillRef"
    role="button"
    tabindex="0"
    :aria-label="`${CLASS_MARKER_LABEL}: ${event.title}`"
    class="h-full w-full cursor-pointer select-none overflow-hidden rounded-md border pr-1 py-px transition-colors hover:brightness-[0.97]"
    :class="[theme.fill, theme.edge, theme.ink]"
    @click="handleActivate"
    @keydown.enter.prevent="handleActivate"
    @keydown.space.prevent="handleActivate"
  >
    <p class="break-words font-secondary text-[10px] font-semibold leading-[13px]">
      {{ event.title }}
    </p>
  </div>
</template>
