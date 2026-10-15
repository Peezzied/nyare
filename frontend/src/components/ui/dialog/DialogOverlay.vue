<script setup lang="ts">
import { DialogOverlay, type DialogOverlayProps } from 'reka-ui'

const props = defineProps<DialogOverlayProps & { class?: string }>()
</script>

<template>
  <DialogOverlay
    :class="[
      'fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      props.class,
    ]"
  />
</template>
