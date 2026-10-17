<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { schedulesApi } from '@/api'
import { ApiError } from '@/api/client'
import { getCourseColor } from '@/constants/palette'
import duckotaFeedback from '@/assets/mascot/duckota_feedback.png'

export interface DeleteScheduleTarget {
  id: number
  courseId: number
  name: string
}

const props = withDefaults(
  defineProps<{
    open: boolean
    schedule: DeleteScheduleTarget | null
  }>(),
  {
    open: false,
    schedule: null,
  },
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'deleted', id: number): void
  (e: 'cancel'): void
}>()

const isDeleting = ref(false)
const errorMessage = ref('')
const titleId = 'delete-schedule-title'
const descriptionId = 'delete-schedule-description'
const backButton = ref<HTMLButtonElement | null>(null)
const previousFocus = ref<HTMLElement | null>(null)

watch(
  () => props.open,
  (opened) => {
    if (opened) {
      errorMessage.value = ''
      previousFocus.value =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      window.addEventListener('keydown', handleKeydown)
      nextTick(() => {
        backButton.value?.focus()
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
  if (event.key === 'Escape' && !isDeleting.value) {
    dismiss()
  }
}

function dismiss() {
  if (isDeleting.value) {
    return
  }

  emit('update:open', false)
  emit('cancel')
}

async function confirm() {
  if (!props.schedule || isDeleting.value) {
    return
  }

  isDeleting.value = true
  errorMessage.value = ''

  try {
    await schedulesApi.delete(props.schedule.id)
    emit('deleted', props.schedule.id)
    emit('update:open', false)
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : 'Unable to delete the schedule. Please try again.'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <Transition name="popup">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.4)] px-4"
      role="presentation"
      @click.self="dismiss"
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
          Delete Schedule
        </h2>

        <p
          :id="descriptionId"
          class="mt-2 text-sm text-[#7B8B97]"
          style="font-family: 'Inter', sans-serif; font-weight: 400"
        >
          Are you sure you want to delete the schedule:
        </p>

        <div class="flex items-center gap-2" style="margin-top: 48px">
          <span
            v-if="schedule"
            class="h-3 w-3 rounded-full border border-white/60 shadow-sm"
            :style="{ backgroundColor: getCourseColor(schedule.courseId).solid }"
            aria-hidden="true"
          />
          <span
            class="text-sm font-semibold text-[#334155]"
            style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          >
            {{ schedule?.name ?? '' }}
          </span>
        </div>

        <p
          v-if="errorMessage"
          role="alert"
          class="mt-3 text-sm font-medium text-[#DC2626]"
          style="font-family: 'Inter', sans-serif; font-weight: 400"
        >
          {{ errorMessage }}
        </p>

        <div class="mt-5 flex items-center justify-end gap-3">
          <button
            ref="backButton"
            type="button"
            :disabled="isDeleting"
            class="min-h-[44px] rounded-xl border-b-4 border-[#CBD5E1] bg-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#334155] transition-all duration-75 hover:bg-[#D7DEE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 active:border-b-0 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
            style="font-family: 'Quicksand', sans-serif; font-weight: 600"
            @click="dismiss"
          >
            Back
          </button>

          <button
            type="button"
            :disabled="!schedule || isDeleting"
            :aria-busy="isDeleting"
            class="min-h-[44px] rounded-xl border-b-4 border-[#991B1B] bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white transition-all duration-75 hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2 active:border-b-0 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
            style="font-family: 'Quicksand', sans-serif; font-weight: 700"
            @click="confirm"
          >
            CONFIRM
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
