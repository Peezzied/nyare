<script setup lang="ts">
// Round mascot button with an optional badge and an AI processing ring.
// DuckotaFab renders it in the calendar, notes, and tasks views.
import { computed } from 'vue'
import duckotaImg from '@/assets/mascot/duckota_in_button.png'
import { COURSE_PALETTE_24 } from '@/constants/palette'

export interface DuckotaButtonProps {
  /** Visual style: tactile has a solid drop shadow, floating has a soft shadow, plain has no shadow. */
  variant?: 'tactile' | 'floating' | 'plain'
  /** Accessible name. The button aria-label and the mascot image alt text use it. */
  label?: string
  /** Text in the corner badge. An undefined value or an empty string hides the badge. */
  badge?: string | number
  badgeColor?: 'destructive' | 'primary' | 'warning'
  /** Shows the spinning rainbow ring and blocks clicks. Set it while an AI Process run is active. */
  processing?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<DuckotaButtonProps>(), {
  variant: 'tactile',
  label: 'Duckota',
  badgeColor: 'destructive',
  processing: false,
  disabled: false,
})

const emit = defineEmits<{
  /** Fires on click when the button is not disabled or processing. Payload is the native MouseEvent. */
  (e: 'click', event: MouseEvent): void
}>()

// The last ID repeats the first ID so the conic gradient has no color seam at 360 degrees.
const RAINBOW_COURSE_IDS = [
  'peacock',
  'sage',
  'banana',
  'tangerine',
  'tomato',
  'radicchio',
  'amethyst',
  'peacock',
] as const

const rainbowGradient = computed(() => {
  const colors = RAINBOW_COURSE_IDS.map(
    (id) => COURSE_PALETTE_24.find((c) => c.id === id)?.solid ?? '#00A4C8',
  )
  return `conic-gradient(from 0deg, ${colors.join(', ')})`
})

const SIZE_CLASSES = 'size-16 border-4'

const variantClasses = computed(() => {
  if (props.disabled) {
    return 'opacity-50 cursor-not-allowed shadow-none'
  }

  if (props.processing) {
    return 'cursor-wait shadow-none'
  }

  switch (props.variant) {
    case 'plain':
      return 'hover:scale-105 active:scale-95 transition-transform'
    case 'floating':
      return 'shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all'
    case 'tactile':
    default:
      return 'shadow-[0_4px_0_#2B3236] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all'
  }
})

const badgeColorClasses = computed(() => {
  switch (props.badgeColor) {
    case 'primary':
      return 'bg-[#00A4C8] text-white'
    case 'warning':
      return 'bg-amber-500 text-white'
    case 'destructive':
    default:
      return 'bg-red-500 text-white'
  }
})

function handleClick(event: MouseEvent) {
  if (props.disabled || props.processing) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :aria-disabled="disabled || processing"
    :disabled="disabled || processing"
    class="relative inline-flex items-center justify-center rounded-full bg-[#E5EDF2] border-[#616161] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00A4C8] cursor-pointer"
    :class="[SIZE_CLASSES, variantClasses]"
    @click="handleClick"
  >
    <!-- Outer ambient glow ring during AI processing -->
    <span
      v-if="processing"
      class="absolute -inset-0.5 rounded-full blur-[2px] opacity-35 animate-spin pointer-events-none"
      :style="{ background: rainbowGradient, animationDuration: '3s' }"
      aria-hidden="true"
    />

    <!-- Crisp dancing stroke gradient ring (masked stroke, zero cutout gap/wobble) -->
    <span
      v-if="processing"
      class="absolute -inset-[3px] rounded-full animate-spin pointer-events-none"
      :style="{
        background: rainbowGradient,
        animationDuration: '3s',
        mask: 'radial-gradient(circle, transparent calc(100% - 3px), black calc(100% - 3px))',
        WebkitMask: 'radial-gradient(circle, transparent calc(100% - 3px), black calc(100% - 3px))',
      }"
      aria-hidden="true"
    />

    <!-- Inner shadow inside the circular button disc -->
    <span
      class="absolute inset-0 rounded-full pointer-events-none shadow-[inset_0_4px_8px_rgba(0,0,0,0.25)]"
      aria-hidden="true"
    />

    <!-- Mascot character overlapping the circular base -->
    <img
      :src="duckotaImg"
      :alt="label"
      class="relative z-10 size-full scale-[1.17] translate-x-[-1px] translate-y-[-1.02px] object-contain pointer-events-none select-none"
      :class="{ 'animate-pulse': processing }"
    />

    <!-- Notification badge overlay -->
    <span
      v-if="badge !== undefined && badge !== ''"
      class="absolute -top-1 -right-1 z-20 flex min-w-5 h-5 items-center justify-center px-1 rounded-full text-xs font-bold leading-none shadow-sm pointer-events-none"
      :class="badgeColorClasses"
      aria-hidden="true"
    >
      {{ badge }}
    </span>

    <slot />
  </button>
</template>
