<script setup lang="ts">
// Bottom sheet of preset quick actions for one task, opened by a left swipe on
// a task row. Each chip applies immediately; the parent closes the sheet on
// success. The full editor stays the keyboard/tap path for the same edits.
import { computed, ref } from 'vue'
import { CalendarDays, Trash2 } from '@lucide/vue'
import type { DateValue } from '@internationalized/date'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { durationToMinutes, minutesToDuration } from '@/utils/duration'
import { formatDuration } from '@/utils/taskUrgency'
import type { TaskResponse } from '@/types/api'

const props = defineProps<{
  open: boolean
  task: TaskResponse | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  schedule: [date: string | null]
  duration: [minutes: number | null]
  delete: []
}>()

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180] as const

const CHIP_BASE =
  'flex h-11 items-center gap-1.5 rounded-full border border-(--color-app-border) bg-(--color-card) px-4 text-sm font-semibold text-(--color-text-main)'
const CHIP_ACTIVE = 'border-transparent bg-(--color-primary) text-white'

const datePickerOpen = ref(false)

function isoIn(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// "This weekend" resolves to the upcoming Saturday (today when it is Saturday).
function weekendOffset(): number {
  return (6 - new Date().getDay() + 7) % 7
}

const scheduleOptions = computed(() => [
  { label: 'Today', date: isoIn(0) },
  { label: 'Tomorrow', date: isoIn(1) },
  { label: 'This weekend', date: isoIn(weekendOffset()) },
])

const currentDuration = computed(() => durationToMinutes(props.task?.duration ?? null))

function pickDate(value: DateValue | undefined) {
  datePickerOpen.value = false
  if (value) emit('schedule', value.toString())
}
</script>

<template>
  <Drawer :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent
      overlay
      class="data-[swipe-direction=down]:h-auto"
      data-testid="task-quick-actions"
    >
      <template v-if="task">
        <DrawerTitle class="sr-only">Quick actions</DrawerTitle>

        <div class="px-4 pt-2">
          <p class="text-xs font-semibold text-(--color-text-muted)">Reschedule</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="opt in scheduleOptions"
              :key="opt.label"
              type="button"
              :class="[CHIP_BASE, task.scheduledDate === opt.date ? CHIP_ACTIVE : '']"
              @click="emit('schedule', opt.date)"
            >
              {{ opt.label }}
            </button>
            <Popover v-model:open="datePickerOpen">
              <PopoverTrigger as-child>
                <button type="button" :class="CHIP_BASE" data-testid="quick-pick-date">
                  <CalendarDays class="size-4" aria-hidden="true" />
                  Pick a date…
                </button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0" align="start">
                <Calendar @update:model-value="pickDate" initial-focus />
              </PopoverContent>
            </Popover>
            <button
              v-if="task.scheduledDate"
              type="button"
              :class="CHIP_BASE"
              data-testid="quick-clear-date"
              @click="emit('schedule', null)"
            >
              No date
            </button>
          </div>
        </div>

        <div class="mt-4 px-4">
          <p class="text-xs font-semibold text-(--color-text-muted)">Duration</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              :class="[CHIP_BASE, currentDuration === null ? CHIP_ACTIVE : '']"
              @click="emit('duration', null)"
            >
              Not set
            </button>
            <button
              v-for="mins in DURATION_PRESETS"
              :key="mins"
              type="button"
              :class="[CHIP_BASE, currentDuration === mins ? CHIP_ACTIVE : '']"
              @click="emit('duration', mins)"
            >
              {{ formatDuration(minutesToDuration(mins)) }}
            </button>
          </div>
        </div>

        <div class="px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="tactile-destructive"
            size="touch"
            class="w-full"
            data-testid="quick-delete"
            style="font-family: 'Quicksand', sans-serif; font-weight: 700"
            @click="emit('delete')"
          >
            <Trash2 class="size-5" aria-hidden="true" />
            Delete task
          </Button>
        </div>
      </template>
    </DrawerContent>
  </Drawer>
</template>
