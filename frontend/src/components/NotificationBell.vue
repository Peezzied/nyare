<script setup lang="ts">
// Top-nav notification icon. Blue badge bubble while a Process run is in
// flight, red count bubble for unread finished runs, both stacked when
// they coincide. Tap opens the notification center, which expands from
// this button's rect.
import { ref, watch } from 'vue'
import { Bell } from '@lucide/vue'
import type { UseProcess } from '@/composables/useProcess'

const props = withDefaults(
  defineProps<{
    proc: UseProcess
    /** Unread finished runs. Shows as a red count bubble on the bell. */
    unread?: number
    /** Bump it to replay the bell ring animation, e.g. after the run flight lands. */
    popToken?: number
  }>(),
  { unread: 0, popToken: 0 },
)

const emit = defineEmits<{
  /** Fires on activation. The parent opens the notification center. */
  (e: 'open', event: MouseEvent): void
}>()

const { running } = props.proc

const popping = ref(false)
let popTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.popToken,
  (token) => {
    if (!token) {
      return
    }
    if (popTimer) {
      clearTimeout(popTimer)
    }
    popping.value = true
    popTimer = setTimeout(() => {
      popping.value = false
      popTimer = null
    }, 550)
  },
)
</script>

<template>
  <button
    type="button"
    role="status"
    aria-live="polite"
    :aria-label="running ? 'Processing notes — open notifications' : 'Open notifications'"
    data-testid="notifications-button"
    class="relative flex h-11 w-11 items-center justify-center rounded-lg text-text-main transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 focus-visible:outline-none active:bg-black/10"
    @click="emit('open', $event)"
  >
    <Bell class="h-6 w-6" :class="{ 'bell-ring': popping }" aria-hidden="true" />
    <span class="absolute top-1 -right-0.5 flex items-center" aria-hidden="true">
      <span
        v-if="running"
        data-testid="notifications-running-badge"
        class="h-2.5 w-2.5 rounded-full bg-[#00A4C8] ring-2 ring-white animate-pulse"
      />
      <span
        v-if="unread > 0"
        data-testid="notifications-unread-badge"
        class="flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white shadow-sm ring-1 ring-white"
      >
        {{ unread }}
      </span>
    </span>
  </button>
</template>

<style scoped>
@keyframes bell-ring {
  0%,
  100% {
    transform: rotate(0deg);
  }
  20% {
    transform: rotate(18deg);
  }
  40% {
    transform: rotate(-14deg);
  }
  60% {
    transform: rotate(9deg);
  }
  80% {
    transform: rotate(-5deg);
  }
}

.bell-ring {
  transform-origin: 50% 0%;
  animation: bell-ring 550ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
}
</style>
