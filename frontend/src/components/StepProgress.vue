<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    activeStep?: number
    currentStep?: number
    totalSteps?: number
    current?: number
    total?: number
  }>(),
  {
    activeStep: undefined,
    currentStep: undefined,
    totalSteps: 3,
    current: undefined,
    total: undefined,
  },
)

const active = computed(() => props.activeStep ?? props.currentStep ?? props.current ?? 1)
const total = computed(() => props.totalSteps ?? props.total ?? 3)
const dots = computed(() => Array.from({ length: total.value }, (_, index) => index + 1))
</script>

<template>
  <div role="status" class="flex items-center gap-2" :aria-label="`Step ${active} of ${total}`">
    <span
      v-for="dot in dots"
      :key="dot"
      class="step-dot h-2.5 w-2.5 rounded-full transition-colors"
      :class="
        dot === active
          ? 'step-dot-active step-active active is-active bg-[#007B99] bg-[#00A4C8]'
          : 'step-dot-inactive bg-[#B3E5FC] bg-[#00A4C8]/25'
      "
      :aria-current="dot === active ? 'step' : undefined"
      :data-active="dot === active ? 'true' : 'false'"
      :data-step="dot"
    />
  </div>
</template>
