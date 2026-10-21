<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DayEvent } from '../../types/calendar'
import { formatTimeRange } from '../../utils/scheduleExpander'
import { classDurationMinutes, getClassCardTier } from '../../utils/classCardTier'
import { useCatalog } from '../../composables/useCatalog'

const props = withDefaults(
  defineProps<{
    event: DayEvent
    top?: number
    height?: number
    // When true the card fills a parent container instead of absolute-positioning itself.
    // Used by the Schedule X #timeGridEvent slot where SX already positions the container.
    embedded?: boolean
  }>(),
  { top: 0, height: 0, embedded: false },
)

const startTime = computed(() => props.event.start.split(' ')[1] ?? '')
const endTime = computed(() => props.event.end.split(' ')[1] ?? '')

const formattedTime = computed(() => formatTimeRange(startTime.value, endTime.value))

const tier = computed(() => getClassCardTier(classDurationMinutes(startTime.value, endTime.value)))

const catalog = useCatalog()
const courseColor = computed(() => catalog.courseColor(props.event.courseId))

const emit = defineEmits<{
  (e: 'select', event: DayEvent, originRect: DOMRect): void
}>()

const cardRef = ref<HTMLElement | null>(null)

function handleClick(e: MouseEvent) {
  const rect =
    cardRef.value?.getBoundingClientRect() ??
    (e.currentTarget as HTMLElement).getBoundingClientRect()
  emit('select', props.event, rect)
}
</script>

<template>
  <div
    ref="cardRef"
    class="flex cursor-pointer flex-col justify-start overflow-hidden rounded-lg border transition-colors hover:brightness-[0.97]"
    :class="[tier.card, props.embedded ? 'relative h-full w-full' : 'absolute left-2 right-2']"
    :style="{
      backgroundColor: courseColor.solid,
      borderColor: courseColor.text,
      color: '#fff',
      ...(props.embedded ? {} : { top: `${top}px`, height: `${height}px` }),
    }"
    @click="handleClick"
  >
    <!-- Course Title -->
    <h3 class="font-semibold" :class="tier.title">
      {{ event.title }}
    </h3>

    <!-- Time & Detail Line -->
    <p class="font-secondary font-medium opacity-80" :class="tier.description">
      <span>{{ formattedTime }}</span>
      <span v-if="event.detail"> · {{ event.detail }}</span>
    </p>
  </div>
</template>
