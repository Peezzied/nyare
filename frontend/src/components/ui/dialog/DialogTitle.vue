<script setup lang="ts">
import { DialogTitle, type DialogTitleProps } from 'reka-ui'

const props = defineProps<DialogTitleProps & { class?: string }>()
</script>

<template>
  <DialogTitle :class="props.class">
    <slot />
  </DialogTitle>
</template>
