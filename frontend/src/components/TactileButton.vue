<script setup lang="ts">
defineProps<{
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
}>()

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled"
    :aria-label="ariaLabel"
    class="inline-flex min-h-[44px] items-center justify-center rounded-xl border-b-4 border-[#007B99] bg-[#00A4C8] px-6 py-3 font-sans text-base font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-400 disabled:bg-slate-300"
    :class="disabled ? '' : 'active:translate-y-1 active:border-b-0'"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>