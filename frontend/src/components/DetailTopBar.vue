<script setup lang="ts">
// Shared top bar for full-screen detail surfaces (Google Calendar mobile app-bar
// pattern): circular back button, centered kind label, trailing action slot.
// Consumers pass entrance/reveal classes via the class attribute; the trailing
// slot defaults to a spacer that balances the 44px back button.
import { ref } from 'vue'
import { ArrowLeft } from '@lucide/vue'
import { useTopBarInset } from '@/composables/useTopBarInset'
import HeaderIconButton from './HeaderIconButton.vue'

const headerEl = ref<HTMLElement | null>(null)
useTopBarInset(headerEl)

withDefaults(
  defineProps<{
    /** Centered kind label, e.g. "Task Details". */
    title?: string
    /** Accessible name of the back button. */
    backLabel?: string
    /** Id applied to the title so overlays can reference it with aria-labelledby. */
    titleId?: string
  }>(),
  {
    title: '',
    backLabel: 'Back',
    titleId: undefined,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <header
    ref="headerEl"
    class="relative flex shrink-0 items-center justify-between border-b border-app-border/60 bg-app-bg px-4 py-2 mb-4"
  >
    <HeaderIconButton
      rounded="full"
      data-testid="detail-back"
      :aria-label="backLabel"
      class="-ml-2 p-2.5 transition-all active:scale-95"
      @click="emit('close')"
    >
      <ArrowLeft class="h-6 w-6 stroke-[2.2]" aria-hidden="true" />
    </HeaderIconButton>

    <h1
      v-if="title"
      :id="titleId"
      class="pointer-events-none absolute left-1/2 max-w-[55%] -translate-x-1/2 truncate font-sans text-sm font-semibold text-text-muted"
    >
      {{ title }}
    </h1>

    <slot name="trailing">
      <div class="w-11" aria-hidden="true" />
    </slot>
  </header>
</template>
