<script setup lang="ts">
// Shared 44px icon-button chrome for AppHeader side regions.
// Attributes (aria-label, data-testid, listeners) fall through to the button.
</script>

<template>
  <button
    type="button"
    class="flex h-11 w-11 items-center justify-center rounded-lg text-text-main transition-colors hover:bg-black/5 active:bg-black/10"
  >
    <slot />
  </button>
</template>
