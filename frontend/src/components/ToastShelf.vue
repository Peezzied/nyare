<script setup lang="ts">
// Transient toast stack. Renders `useToasts` records bottom-center above
// the nav bar; each toast slides up, fades, and self-dismisses.
import { CircleCheck, CircleX, LoaderCircle } from '@lucide/vue'
import { useToasts } from '@/composables/useToasts'
import type { ToastKind } from '@/composables/useToasts'

const { toasts, dismissToast } = useToasts()

function icon(kind: ToastKind) {
  switch (kind) {
    case 'success':
      return CircleCheck
    case 'error':
      return CircleX
    default:
      return LoaderCircle
  }
}

function iconColor(kind: ToastKind): string {
  switch (kind) {
    case 'success':
      return '#0B8043'
    case 'error':
      return '#DC2626'
    default:
      return '#00A4C8'
  }
}
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-16 z-[60] flex flex-col items-center gap-2 px-4"
    aria-live="polite"
  >
    <TransitionGroup name="toast">
      <button
        v-for="toast in toasts"
        :key="toast.id"
        type="button"
        data-testid="toast"
        class="pointer-events-auto flex w-full max-w-[340px] items-start gap-3 rounded-2xl border border-[#CBD5E1] bg-white p-3.5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        @click="dismissToast(toast.id)"
      >
        <component
          :is="icon(toast.kind)"
          class="mt-0.5 h-5 w-5 shrink-0"
          :class="{ 'animate-spin': toast.kind === 'info' }"
          :style="{ color: iconColor(toast.kind) }"
          aria-hidden="true"
        />
        <span class="min-w-0 flex-1">
          <span
            class="block text-sm font-semibold text-[#334155]"
            style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          >
            {{ toast.title }}
          </span>
          <span
            v-if="toast.detail"
            class="mt-0.5 block text-xs text-[#7B8B97]"
            style="font-family: 'Inter', sans-serif; font-weight: 400"
          >
            {{ toast.detail }}
          </span>
        </span>
      </button>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active {
  transition:
    transform 300ms cubic-bezier(0.05, 0.7, 0.1, 1),
    opacity 300ms cubic-bezier(0.05, 0.7, 0.1, 1);
}

.toast-leave-active {
  transition:
    transform 200ms ease-in,
    opacity 200ms ease-in;
}

.toast-enter-from {
  transform: translateY(-16px) scale(0.96);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(-8px) scale(0.96);
  opacity: 0;
}
</style>
