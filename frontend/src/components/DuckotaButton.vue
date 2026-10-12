<script setup lang="ts">
import { computed } from 'vue'
import duckotaImg from '@/assets/mascot/duckota_button.png'
import { COURSE_PALETTE_24 } from '@/constants/palette'

export interface DuckotaButtonProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'tactile' | 'floating' | 'plain'
  label?: string
  badge?: string | number
  badgeColor?: 'destructive' | 'primary' | 'warning'
  processing?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<DuckotaButtonProps>(), {
  size: 'md',
  variant: 'tactile',
  label: 'Duckota',
  badgeColor: 'destructive',
  processing: false,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

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
    id => COURSE_PALETTE_24.find(c => c.id === id)?.solid ?? '#00A4C8',
  )
  return `conic-gradient(from 0deg, ${colors.join(', ')})`
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'size-11'
    case 'lg':
      return 'size-20'
    case 'md':
    default:
      return 'size-14'
  }
})

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
      return 'shadow-[0_4px_0_#334155] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all'
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
    class="relative inline-flex items-center justify-center rounded-full select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00A4C8] cursor-pointer"
    :class="[sizeClasses, variantClasses]"
    @click="handleClick"
  >
    <!-- Outer ambient glow ring during AI processing -->
    <span
      v-if="processing"
      class="absolute -inset-1 rounded-full blur-[2px] opacity-50 animate-spin pointer-events-none"
      :style="{ background: rainbowGradient, animationDuration: '3s' }"
      aria-hidden="true"
    />

    <!-- Crisp dancing stroke gradient ring -->
    <span
      v-if="processing"
      class="absolute -inset-[3px] rounded-full p-[3px] animate-spin pointer-events-none"
      :style="{ background: rainbowGradient, animationDuration: '3s' }"
      aria-hidden="true"
    >
      <span class="block size-full rounded-full bg-[#F6F7EE]" />
    </span>

    <img
      :src="duckotaImg"
      :alt="label"
      class="relative z-10 h-full w-full rounded-full object-contain pointer-events-none select-none"
      :class="{ 'animate-pulse': processing }"
    />

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
