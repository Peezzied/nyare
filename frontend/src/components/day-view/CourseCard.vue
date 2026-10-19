<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DayEvent } from '../../types/calendar'
import { formatTimeRange } from '../../utils/scheduleExpander'
import { classDurationMinutes, getClassCardTier } from '../../utils/classCardTier'

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

const colorClasses = computed(() => {
  switch (props.event.colorTheme) {
    case 'green':
      return {
        bg: 'bg-[#7CE19D]',
        border: 'border-[#1E3A2F]',
      }
    case 'blue':
      return {
        bg: 'bg-[#80C2F8]',
        border: 'border-[#1E293B]',
      }
    case 'purple':
      return {
        bg: 'bg-[#C084FC]',
        border: 'border-[#3B0764]',
      }
    case 'orange':
      return {
        bg: 'bg-[#FB923C]',
        border: 'border-[#7C2D12]',
      }
    default:
      return {
        bg: 'bg-[#80C2F8]',
        border: 'border-[#1E293B]',
      }
  }
})

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
    class="rounded-2xl shadow-sm flex flex-col justify-start overflow-hidden transition-transform hover:scale-[1.01] cursor-pointer"
    :class="[
      colorClasses.bg,
      colorClasses.border,
      tier.card,
      props.embedded ? 'relative h-full w-full' : 'absolute left-2 right-2',
    ]"
    :style="props.embedded ? {} : { top: `${top}px`, height: `${height}px` }"
    @click="handleClick"
  >
    <!-- Course Title -->
    <h3 class="font-bold text-white tracking-wide" :class="tier.title">
      {{ event.title }}
    </h3>

    <!-- Time & Detail Line -->
    <p class="text-white/95 font-medium" :class="tier.description">
      <span>{{ formattedTime }}</span>
      <span v-if="event.detail"> • {{ event.detail }}</span>
    </p>
  </div>
</template>
