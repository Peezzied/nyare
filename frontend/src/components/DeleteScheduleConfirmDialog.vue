<script setup lang="ts">
import { ref, watch } from 'vue'
import { schedulesApi } from '@/api'
import { ApiError } from '@/api/client'
import { useCatalog } from '@/composables/useCatalog'
import { Button } from '@/components/ui/button'
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
    <p class="mt-2 font-secondary text-sm text-text-muted">
      Are you sure you want to delete the schedule:
    </p>

    <div class="flex items-center gap-2" style="margin-top: 48px">
      <span
        v-if="schedule"
        class="h-3 w-3 rounded-full border border-white/60 shadow-sm"
        :style="{ backgroundColor: catalog.courseColor(schedule.courseId).solid }"
        aria-hidden="true"
      />
      <span class="font-sans text-sm font-semibold text-text-main">
        {{ schedule?.name ?? '' }}
      </span>
    </div>

    <p
      v-if="errorMessage"
      role="alert"
      class="mt-3 font-secondary text-sm font-medium text-destructive"
    >
      {{ errorMessage }}
    </p>

    <template #actions="{ disabled, dismiss }">
      <Button
        type="button"
        variant="tactile-secondary"
        size="touch"
        :disabled="disabled"
        @click="dismiss"
      >
        Back
      </Button>

      <Button
        type="button"
        variant="tactile-destructive"
        size="touch"
        class="px-5"
        :disabled="!schedule || disabled"
        :aria-busy="isDeleting"
        @click="confirm"
      >
        CONFIRM
      </Button>
    </template>
  </DialogShell>
</template>
