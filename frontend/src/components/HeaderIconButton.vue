<script setup lang="ts">
// Shared 44px icon-button chrome for AppHeader side regions.
// Attributes (aria-label, data-testid, listeners) fall through to the button.
const props = withDefaults(defineProps<{ rounded?: 'lg' | 'full' }>(), { rounded: 'lg' })
</script>

<template>
  <button
    type="button"
    class="flex h-11 w-11 items-center justify-center text-text-main transition-colors hover:bg-black/5 active:bg-black/10"
    :class="props.rounded === 'full' ? 'rounded-full' : 'rounded-lg'"
  >
    <slot />
  </button>
</template>
