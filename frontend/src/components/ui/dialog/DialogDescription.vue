<script setup lang="ts">
import { DialogDescription, type DialogDescriptionProps } from 'reka-ui'

const props = defineProps<DialogDescriptionProps & { class?: string }>()
</script>

<template>
  <DialogDescription :class="props.class">
    <slot />
  </DialogDescription>
</template>
