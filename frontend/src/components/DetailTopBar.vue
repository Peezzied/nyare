<script setup lang="ts">
// Shared top bar for full-screen detail surfaces (Google Calendar mobile app-bar
// pattern): circular back button, centered kind label, trailing action slot.
// Consumers pass entrance/reveal classes via the class attribute; the trailing
// slot defaults to a spacer that balances the 44px back button.
import { ref } from 'vue'
import { ArrowLeft } from '@lucide/vue'
import { useTopBarInset } from '@/composables/useTopBarInset'

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
    class="relative flex shrink-0 items-center justify-between border-b border-[#CBD5E1]/60 bg-[#F5F6EE] px-4 py-2 mb-4"
  >
    <button
      type="button"
      data-testid="detail-back"
      :aria-label="backLabel"
      class="-ml-2 flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full p-2.5 text-[#334155] transition-all hover:bg-slate-200/70 active:scale-95"
      @click="emit('close')"
    >
      <ArrowLeft class="h-6 w-6 stroke-[2.2]" aria-hidden="true" />
    </button>

    <h1
      v-if="title"
      :id="titleId"
      class="pointer-events-none absolute left-1/2 max-w-[55%] -translate-x-1/2 truncate font-quicksand text-sm font-semibold text-[#64748B]"
    >
      {{ title }}
    </h1>

    <slot name="trailing">
      <div class="w-11" aria-hidden="true" />
    </slot>
  </header>
</template>
