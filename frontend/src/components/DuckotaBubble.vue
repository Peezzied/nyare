<script setup lang="ts">
// Speech bubble anchored above the Duckota FAB. The mascot reports Process
// run states here instead of the toast shelf. AppShell renders one at a
// time, auto-dismisses it, and opens the Process dialog on tap.
import { computed } from 'vue'
import { CircleCheck, CircleX, Info, LoaderCircle } from '@lucide/vue'
import type { ToastKind } from '@/composables/useToasts'
import { statusColor } from '@/utils/statusColors'

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

const iconColor = computed(() => statusColor(props.kind))
</script>

<template>
  <button
    type="button"
    data-testid="duckota-bubble"
    class="absolute bottom-[calc(100%+14px)] left-0 z-30 flex w-64 origin-bottom-left cursor-pointer items-start gap-2.5 rounded-2xl border border-app-border bg-card p-3 text-left shadow-stationery drop-shadow-[0_10px_16px_rgba(43,50,54,0.12)]"
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
      <span class="block font-sans text-sm font-semibold text-text-main">
        {{ title }}
      </span>
      <span v-if="detail" class="mt-0.5 block font-secondary text-xs text-text-muted">
        {{ detail }}
      </span>
    </span>
    <span
      class="absolute -bottom-[7px] left-7 size-3 rotate-45 border-b border-r border-app-border bg-card"
      aria-hidden="true"
    />
  </button>
</template>
