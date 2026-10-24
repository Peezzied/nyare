<script setup lang="ts">
// Tactile floating add button shared by the Notes and To-do views.
import { Plus } from '@lucide/vue'

export interface AddFabProps {
  /** Accessible name for the button, e.g. "Add note". */
  label: string
}

defineProps<AddFabProps>()

const emit = defineEmits<{
  /** Fires on click. Payload is the native MouseEvent so callers can compute tap-origin rects. */
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    class="group absolute right-4 bottom-4 z-10 flex size-14 cursor-pointer items-center justify-center rounded-2xl bg-primary text-white shadow-[0_4px_0_var(--color-primary-bevel),0_10px_16px_-6px_rgba(0,90,110,0.35)] transition-[transform,box-shadow,background-color] duration-150 ease-out hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_6px_0_var(--color-primary-bevel),0_14px_20px_-6px_rgba(0,90,110,0.4)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-1 active:shadow-[0_0px_0_var(--color-primary-bevel),0_4px_8px_-4px_rgba(0,90,110,0.3)] motion-reduce:transition-none"
    @click="emit('click', $event)"
  >
    <Plus
      :stroke-width="3"
      class="size-6 transition-transform duration-200 group-active:rotate-90 motion-reduce:transition-none"
      aria-hidden="true"
    />
  </button>
</template>
