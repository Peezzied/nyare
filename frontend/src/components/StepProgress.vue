<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    activeStep?: number
    currentStep?: number
    totalSteps?: number
    current?: number
    total?: number
    /** Renders completed steps as buttons that emit `select`. */
    interactive?: boolean
    /** Human step names used for accessible labels, 1-indexed order. */
    stepLabels?: string[]
  }>(),
  {
    activeStep: undefined,
    currentStep: undefined,
    totalSteps: 3,
    current: undefined,
    total: undefined,
    interactive: false,
    stepLabels: () => [],
  },
)

const emit = defineEmits<{
  (e: 'select', step: number): void
}>()

const active = computed(() => props.activeStep ?? props.currentStep ?? props.current ?? 1)
const total = computed(() => props.totalSteps ?? props.total ?? 3)
const dots = computed(() => Array.from({ length: total.value }, (_, index) => index + 1))

function stepLabel(dot: number) {
  return props.stepLabels[dot - 1] ?? `step ${dot}`
}

function dotClass(dot: number) {
  if (dot === active.value) {
    return 'step-dot-active step-active active is-active bg-[#007B99] scale-125'
  }
  if (dot < active.value) {
    return 'bg-[#00A4C8] group-hover:scale-125'
  }
  return 'step-dot-inactive bg-[#00A4C8]/25'
}

function selectStep(dot: number) {
  if (dot < active.value) {
    emit('select', dot)
  }
}
</script>

<template>
  <div
    :role="interactive ? 'group' : 'status'"
    class="flex items-center"
    :class="interactive ? 'gap-0' : 'gap-2'"
    :aria-label="`Step ${active} of ${total}`"
  >
    <template v-for="dot in dots" :key="dot">
      <button
        v-if="interactive"
        type="button"
        class="step-dot group flex size-8 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-[#00A4C8]/45 focus-visible:outline-offset-1"
        :class="dot < active ? 'cursor-pointer hover:bg-[#00A4C8]/10' : 'cursor-default'"
        :disabled="dot >= active"
        :aria-current="dot === active ? 'step' : undefined"
        :aria-label="`Step ${dot}: ${stepLabel(dot)}`"
        :data-active="dot === active ? 'true' : 'false'"
        :data-step="dot"
        @click="selectStep(dot)"
      >
        <span
          class="h-2.5 w-2.5 rounded-full transition-transform duration-200"
          :class="dotClass(dot)"
          aria-hidden="true"
        />
      </button>
      <span
        v-else
        class="step-dot h-2.5 w-2.5 rounded-full transition-colors"
        :class="dotClass(dot)"
        :aria-current="dot === active ? 'step' : undefined"
        :data-active="dot === active ? 'true' : 'false'"
        :data-step="dot"
      />
    </template>
  </div>
</template>
