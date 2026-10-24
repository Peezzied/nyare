<script lang="ts">
import type { DayOfWeek } from '@/types/api'

export interface ScheduleDraft {
  day: DayOfWeek
  state: 'draft' | 'saving' | 'saved' | 'failed'
  savedId: number | null
  error: string
  submitted: boolean
}

export interface TimeBlockDraft {
  id: string
  selectedDays: DayOfWeek[]
  startTime: string
  endTime: string
  room: string
  state: 'draft' | 'saving' | 'saved' | 'failed'
  schedules: ScheduleDraft[]
  error: string
}

export interface TimeBlockCardProps {
  block: TimeBlockDraft
  index: number
  saving?: boolean
  canRemove?: boolean
  startTime?: string
  endTime?: string
  unavailableDays?: DayOfWeek[]
}

export function createScheduleDraft(day: DayOfWeek): ScheduleDraft {
  return {
    day,
    state: 'draft',
    savedId: null,
    error: '',
    submitted: false,
  }
}

let nextBlockId = 0
export function createBlock(): TimeBlockDraft {
  return {
    id: `block-${nextBlockId++}`,
    selectedDays: [],
    startTime: '',
    endTime: '',
    room: '',
    state: 'draft',
    schedules: [],
    error: '',
  }
}

export function syncScheduleDrafts(block: TimeBlockDraft) {
  const byDay = new Map(block.schedules.map((schedule) => [schedule.day, schedule]))

  const selectedDrafts = block.selectedDays.map((day) => byDay.get(day) ?? createScheduleDraft(day))
  const savedDrafts = block.schedules.filter(
    (schedule) => schedule.state === 'saved' && !block.selectedDays.includes(schedule.day),
  )

  block.schedules = [...selectedDrafts, ...savedDrafts]
}

export function blockStatus(block: TimeBlockDraft): TimeBlockDraft['state'] {
  if (block.schedules.length === 0) {
    return 'draft'
  }

  if (block.schedules.some((schedule) => schedule.state === 'failed')) {
    return 'failed'
  }
  if (block.schedules.some((schedule) => schedule.state === 'saving')) {
    return 'saving'
  }
  if (block.schedules.every((schedule) => schedule.state === 'saved')) {
    return 'saved'
  }
  return 'draft'
}

export function blockError(block: TimeBlockDraft): string {
  return block.schedules.find((schedule) => schedule.error)?.error ?? block.error
}

export const WEEKDAYS = [
  { label: 'Su', value: 'SUNDAY' as DayOfWeek },
  { label: 'Mo', value: 'MONDAY' as DayOfWeek },
  { label: 'Tu', value: 'TUESDAY' as DayOfWeek },
  { label: 'We', value: 'WEDNESDAY' as DayOfWeek },
  { label: 'Th', value: 'THURSDAY' as DayOfWeek },
  { label: 'Fr', value: 'FRIDAY' as DayOfWeek },
  { label: 'Sa', value: 'SATURDAY' as DayOfWeek },
]
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Clock, Trash2 } from 'lucide-vue-next'

const props = withDefaults(defineProps<TimeBlockCardProps>(), {
  saving: false,
  canRemove: undefined,
  startTime: undefined,
  endTime: undefined,
  unavailableDays: () => [],
})

const emit = defineEmits<{
  (e: 'remove'): void
  (e: 'toggleDay', day: DayOfWeek): void
  (e: 'update:startTime', value: string): void
  (e: 'update:endTime', value: string): void
}>()

const status = computed(() => blockStatus(props.block))
const isCardDisabled = computed(() => props.saving)
const canDelete = computed(() => props.canRemove ?? props.index > 0)
const currentStartTime = computed(() => props.startTime ?? props.block.startTime)
const currentEndTime = computed(() => props.endTime ?? props.block.endTime)

function handleToggleDay(day: DayOfWeek) {
  if (isCardDisabled.value || props.unavailableDays.includes(day)) {
    return
  }
  emit('toggleDay', day)
}
</script>

<template>
  <Card
    as="article"
    data-testid="time-block-card"
    class="flex min-w-0 flex-col gap-4 rounded-2xl border bg-card p-4 shadow-stationery transition-all duration-200 sm:p-5"
    :class="
      status === 'failed'
        ? 'border-destructive-line ring-2 ring-destructive-soft shadow-stationery-error'
        : 'border-border-cyan hover:border-primary'
    "
  >
    <!-- Card header with soft ocean surface and clock icon -->
    <CardHeader
      class="flex flex-row items-center justify-between gap-3 rounded-xl bg-ocean-soft px-3.5 min-h-12 py-1"
    >
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <Clock class="h-4 w-4 shrink-0 text-primary-bevel" aria-hidden="true" />
        <CardTitle class="min-w-0 font-sans text-sm font-bold text-heading">
          Time block {{ index + 1 }}
        </CardTitle>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <Badge
          v-if="status === 'saving'"
          variant="outline"
          class="border-secondary-border bg-ocean-soft px-2.5 py-0.5 text-xs font-semibold text-primary-bevel"
        >
          Saving
        </Badge>
        <Badge
          v-else-if="status === 'failed'"
          variant="destructive"
          class="border-destructive-line bg-destructive-soft px-2.5 py-0.5 text-xs font-semibold text-destructive-hover"
        >
          Failed
        </Badge>

        <Button
          v-if="canDelete"
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Delete time block"
          :disabled="saving"
          class="flex h-11 min-w-11 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100/70 hover:text-red-800 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          @click="emit('remove')"
        >
          <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
          <span>Delete</span>
        </Button>
      </div>
    </CardHeader>

    <CardContent class="space-y-4 p-0">
      <!-- Weekday selector with explicit label -->
      <div class="space-y-1.5">
        <Label class="block font-sans text-xs font-bold tracking-wider text-text-soft uppercase">
          Repeat on
        </Label>
        <ToggleGroup
          type="multiple"
          variant="circle"
          size="circle"
          :spacing="2"
          :model-value="block.selectedDays"
          :disabled="isCardDisabled"
          aria-label="Weekdays"
          class="grid w-full grid-cols-7 gap-1.5 py-1 sm:gap-2.5"
        >
          <ToggleGroupItem
            v-for="weekday in WEEKDAYS"
            :key="weekday.value"
            :value="weekday.value"
            variant="circle"
            size="circle"
            :aria-pressed="block.selectedDays.includes(weekday.value)"
            :aria-label="weekday.value"
            :disabled="isCardDisabled || props.unavailableDays.includes(weekday.value)"
            class="mx-auto flex aspect-square h-11 w-11 min-w-0 items-center justify-center rounded-full border p-0 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            :class="
              block.selectedDays.includes(weekday.value)
                ? '!border-primary-deep !bg-primary-bevel !text-white shadow-day-toggle-active hover:!bg-primary-deep'
                : '!border-border-cyan !bg-card !text-heading shadow-day-toggle hover:!border-primary hover:!bg-ocean-soft'
            "
            @click="handleToggleDay(weekday.value)"
          >
            {{ weekday.label }}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <!-- Start and end times in crisp recessed wells -->
      <div class="grid min-w-0 grid-cols-2 gap-3">
        <div class="min-w-0 space-y-1.5">
          <Label
            :for="`start-time-${block.id}`"
            class="block font-sans text-xs font-bold tracking-wider text-text-soft uppercase"
          >
            Start time
          </Label>
          <Input
            :id="`start-time-${block.id}`"
            :model-value="currentStartTime"
            type="time"
            required
            :disabled="isCardDisabled"
            class="h-12 w-full min-w-0 rounded-xl border border-border-cyan bg-field px-3 font-sans text-base font-bold text-heading shadow-2xs transition-colors hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:bg-slate-100"
            @update:model-value="emit('update:startTime', String($event))"
          />
        </div>

        <div class="min-w-0 space-y-1.5">
          <Label
            :for="`end-time-${block.id}`"
            class="block font-sans text-xs font-bold tracking-wider text-text-soft uppercase"
          >
            End time
          </Label>
          <Input
            :id="`end-time-${block.id}`"
            :model-value="currentEndTime"
            type="time"
            required
            :disabled="isCardDisabled"
            class="h-12 w-full min-w-0 rounded-xl border border-border-cyan bg-field px-3 font-sans text-base font-bold text-heading shadow-2xs transition-colors hover:border-primary focus-visible:border-primary focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:bg-slate-100"
            @update:model-value="emit('update:endTime', String($event))"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>
