<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import duckotaFeedback from '@/assets/mascot/duckota_feedback.png'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
  }>(),
  {
    open: false,
    title: 'Discard changes?',
    message: 'You have unsaved changes. Are you sure you want to discard your draft?',
    confirmLabel: 'Discard',
    cancelLabel: 'Keep editing',
  },
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'keepEditing'): void
  (e: 'discard'): void
}>()

const titleId = 'discard-draft-title'
const descriptionId = 'discard-draft-description'
const keepButton = ref<HTMLButtonElement | null>(null)
const previousFocus = ref<HTMLElement | null>(null)

watch(
  () => props.open,
  (opened) => {
    if (opened) {
      previousFocus.value =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      window.addEventListener('keydown', handleKeydown)
      nextTick(() => {
        keepButton.value?.focus()
      })
      return
    }

    window.removeEventListener('keydown', handleKeydown)
    nextTick(() => {
      previousFocus.value?.focus()
    })
  },
  { immediate: true },
)

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleKeepEditing()
  }
}

function handleKeepEditing() {
  emit('update:open', false)
  emit('keepEditing')
}

function handleDiscard() {
  emit('update:open', false)
  emit('discard')
}
</script>

<template>
  <Transition name="popup">
    <div
      v-if="open"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(0,0,0,0.4)] px-4"
      role="presentation"
      @click.self="handleKeepEditing"
    >
      <section
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
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
          {{ props.title }}
        </h2>

        <p
          :id="descriptionId"
          class="mt-2 text-sm text-[#7B8B97]"
          style="font-family: 'Inter', sans-serif; font-weight: 400"
        >
          {{ props.message }}
        </p>

        <div class="mt-6 flex items-center justify-end gap-3">
          <button
            ref="keepButton"
            type="button"
            class="min-h-[44px] rounded-xl border-b-4 border-[#CBD5E1] bg-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#334155] transition-all duration-75 hover:bg-[#D7DEE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 active:translate-y-1 active:border-b-0"
            style="font-family: 'Quicksand', sans-serif; font-weight: 600"
            @click="handleKeepEditing"
          >
            {{ props.cancelLabel }}
          </button>

          <button
            type="button"
            class="min-h-[44px] rounded-xl border-b-4 border-[#991B1B] bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white transition-all duration-75 hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2 active:translate-y-1 active:border-b-0"
            style="font-family: 'Quicksand', sans-serif; font-weight: 700"
            @click="handleDiscard"
          >
            {{ props.confirmLabel }}
          </button>
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
