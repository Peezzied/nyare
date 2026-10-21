<script setup lang="ts">
// Shared tactile Save button for detail top bars. Attributes (data-testid,
// class, aria-label) fall through to the underlying button element.
import { Loader2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'

defineProps<{
  /** Shows the spinner and swaps the label to "Saving…". */
  saving?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <Button
    type="button"
    variant="tactile"
    :disabled="disabled"
    class="cursor-pointer disabled:cursor-not-allowed"
    @click="emit('click')"
  >
    <Loader2 v-if="saving" class="size-4 animate-spin" aria-hidden="true" />
    {{ saving ? 'Saving…' : 'Save' }}
  </Button>
</template>
