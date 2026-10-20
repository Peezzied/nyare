<script setup lang="ts">
import { ref, watch } from 'vue'
import { schedulesApi } from '@/api'
import { ApiError } from '@/api/client'
import { useCatalog } from '@/composables/useCatalog'
import DialogShell from '@/components/ui/DialogShell.vue'

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

const catalog = useCatalog()

const isDeleting = ref(false)
const errorMessage = ref('')

watch(
  () => props.open,
  (opened) => {
    if (opened) {
      errorMessage.value = ''
    }
  },
)

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
  <DialogShell
    :open="open"
    title="Delete Schedule"
    :busy="isDeleting"
    @update:open="emit('update:open', $event)"
    @cancel="emit('cancel')"
  >
    <p
      class="mt-2 text-sm text-[#7B8B97]"
      style="font-family: 'Inter', sans-serif; font-weight: 400"
    >
      Are you sure you want to delete the schedule:
    </p>

    <div class="flex items-center gap-2" style="margin-top: 48px">
      <span
        v-if="schedule"
        class="h-3 w-3 rounded-full border border-white/60 shadow-sm"
        :style="{ backgroundColor: catalog.courseColor(schedule.courseId).solid }"
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

    <template #actions="{ disabled, dismiss }">
      <button
        type="button"
        :disabled="disabled"
        class="min-h-[44px] rounded-xl border-b-4 border-[#CBD5E1] bg-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#334155] transition-all duration-75 hover:bg-[#D7DEE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 active:border-b-0 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
        style="font-family: 'Quicksand', sans-serif; font-weight: 600"
        @click="dismiss"
      >
        Back
      </button>

      <button
        type="button"
        :disabled="!schedule || disabled"
        :aria-busy="isDeleting"
        class="min-h-[44px] rounded-xl border-b-4 border-[#991B1B] bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white transition-all duration-75 hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2 active:border-b-0 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
        style="font-family: 'Quicksand', sans-serif; font-weight: 700"
        @click="confirm"
      >
        CONFIRM
      </button>
    </template>
  </DialogShell>
</template>
