<script setup lang="ts">
// Speech bubble anchored above the Duckota FAB. The mascot reports Process
// run states here instead of the toast shelf. AppShell renders one at a
// time, auto-dismisses it, and opens the Process dialog on tap.
import { computed } from 'vue'
import { CircleCheck, CircleX, Info, LoaderCircle } from '@lucide/vue'
import type { ToastKind } from '@/composables/useToasts'

export interface DuckotaBubbleProps {
  /** Visual tone, same semantic map as the toast shelf. */
  kind: ToastKind
  title: string
  detail?: string
}

const props = defineProps<DuckotaBubbleProps>()

const emit = defineEmits<{
  /** Fires on tap. AppShell opens the Process dialog. */
  (e: 'tap'): void
}>()

const icon = computed(() => {
  switch (props.kind) {
    case 'success':
      return CircleCheck
    case 'error':
      return CircleX
    case 'loading':
      return LoaderCircle
    default:
      return Info
  }
})

const iconColor = computed(() => {
  switch (props.kind) {
    case 'success':
      return '#0B8043'
    case 'error':
      return '#DC2626'
    default:
      return '#00A4C8'
  }
})
</script>

<template>
  <button
    type="button"
    data-testid="duckota-bubble"
    class="absolute bottom-[calc(100%+14px)] left-0 z-30 flex w-60 origin-bottom-left cursor-pointer items-start gap-2.5 rounded-2xl border border-[#CBD5E1] bg-[#FDFEF7] p-3 text-left shadow-[0_4px_0_#D5EBF1] drop-shadow-[0_10px_16px_rgba(43,50,54,0.12)]"
    @click="emit('tap')"
  >
    <component
      :is="icon"
      class="mt-0.5 h-5 w-5 shrink-0"
      :class="{ 'motion-safe:animate-spin': kind === 'loading' }"
      :style="{ color: iconColor }"
      aria-hidden="true"
    />
    <span class="min-w-0 flex-1">
      <span class="block font-sans text-sm font-semibold text-[#334155]">
        {{ title }}
      </span>
      <span v-if="detail" class="mt-0.5 block font-editor text-xs text-[#7B8B97]">
        {{ detail }}
      </span>
    </span>
    <span
      class="absolute -bottom-[7px] left-7 size-3 rotate-45 border-b border-r border-[#CBD5E1] bg-[#FDFEF7]"
      aria-hidden="true"
    />
  </button>
</template>
