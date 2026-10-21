<script setup lang="ts">
// Shared confirmation popup: Duckota scrim card with a content slot and a button slot.
import { nextTick, onUnmounted, ref, useId, watch } from 'vue'
import duckotaFeedback from '@/assets/mascot/duckota_feedback.png'
import { cn } from '@/lib/utils'

interface Props {
  /** Dialog visibility. Bind it with v-model:open. */
  open?: boolean
  /** Dialog heading. The shell renders it and wires aria-labelledby. */
  title: string
  /** In-flight state. It blocks dismissal and sets the button slot's `disabled`. */
  busy?: boolean
  /** Extra overlay classes, for example to raise the layer above a drawer. */
  overlayClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  busy: false,
  overlayClass: '',
})

const emit = defineEmits<{
  /** Fires when the dialog closes through v-model. */
  (e: 'update:open', value: boolean): void
  /** Fires on Escape, backdrop click, or the button slot's dismiss callback. */
  (e: 'cancel'): void
}>()

const uid = useId()
const titleId = `dialog-shell-title-${uid}`
const contentId = `dialog-shell-content-${uid}`

const dialogEl = ref<HTMLElement | null>(null)
const previousFocus = ref<HTMLElement | null>(null)

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function dismiss() {
  if (props.busy) {
    return
  }

  emit('update:open', false)
  emit('cancel')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    dismiss()
  }
}

function focusFirstFocusable() {
  const target = dialogEl.value?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
  ;(target ?? dialogEl.value)?.focus()
}

watch(
  () => props.open,
  (opened) => {
    if (opened) {
      previousFocus.value =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      window.addEventListener('keydown', handleKeydown)
      nextTick(focusFirstFocusable)
      return
    }

    window.removeEventListener('keydown', handleKeydown)
    nextTick(() => {
      previousFocus.value?.focus()
    })
  },
  { immediate: true },
)

onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Transition name="popup">
    <div
      v-if="open"
      :class="
        cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.4)] px-4',
          overlayClass,
        )
      "
      role="presentation"
      @click.self="dismiss"
    >
      <section
        ref="dialogEl"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="contentId"
        tabindex="-1"
        class="popup-card relative w-full max-w-[360px] rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-xl"
      >
        <img
          :src="duckotaFeedback"
          alt=""
          aria-hidden="true"
          class="pointer-events-none absolute -right-12 -top-20 h-[175px] w-[175px] object-contain"
          style="
            filter: drop-shadow(1px 0 0 #ffffff) drop-shadow(-1px 0 0 #ffffff)
              drop-shadow(0 1px 0 #ffffff) drop-shadow(0 -1px 0 #ffffff)
              drop-shadow(1px 1px 0 #ffffff) drop-shadow(-1px 1px 0 #ffffff)
              drop-shadow(1px -1px 0 #ffffff) drop-shadow(-1px -1px 0 #ffffff);
          "
        />

        <h2
          :id="titleId"
          class="pr-32 text-lg font-bold text-[#DC2626]"
          style="font-family: 'Quicksand', sans-serif; font-weight: 700"
        >
          {{ title }}
        </h2>

        <div :id="contentId">
          <slot />
        </div>

        <div class="mt-5 flex items-center justify-end gap-3">
          <slot name="actions" :disabled="busy" :dismiss="dismiss" />
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.popup-enter-active,
.popup-leave-active {
  transition: opacity 140ms ease;
}

.popup-enter-active .popup-card,
.popup-leave-active .popup-card {
  transition: transform 140ms ease;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
}

.popup-enter-from .popup-card {
  transform: scale(0.95);
}

.popup-leave-to .popup-card {
  transform: scale(0.92);
}
</style>
