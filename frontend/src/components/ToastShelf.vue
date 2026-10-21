<script setup lang="ts">
// Transient toast stack. Renders `useToasts` records top-center; each toast
// drops in, fades, and self-dismisses or clears on tap / horizontal swipe.
import ToastItem from '@/components/ToastItem.vue'
import { useToasts } from '@/composables/useToasts'

const { toasts, dismissToast } = useToasts()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-16 z-[60] flex flex-col items-center gap-2 px-4"
    aria-live="polite"
  >
    <TransitionGroup name="toast">
      <ToastItem
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        @dismiss="dismissToast(toast.id)"
      />
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
