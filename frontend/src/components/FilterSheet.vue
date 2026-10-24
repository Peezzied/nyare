<script lang="ts">
/** Server-side list filters shared by the tasks, notes, and deadlines surfaces. */
export interface ListFilters {
  courseId?: number
  /** ISO `YYYY-MM-DD` inclusive lower bound on the item date. */
  from?: string
  /** ISO `YYYY-MM-DD` inclusive upper bound on the item date. */
  to?: string
  /** Task status filter. Only the tasks surface renders this control. */
  status?: 'TODO' | 'COMPLETED'
}
</script>

<script setup lang="ts">
// Bottom sheet of list filters, opened from the search bar button. Field edits
// stay in a local draft until Apply commits them through update:modelValue;
// Clear emits an empty set so the caller drops every filter at once. A From
// date after the To date blocks Apply instead of reaching the backend's 400.
import { computed, ref, watch } from 'vue'
import type { AcceptableValue } from 'reka-ui'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { CourseResponse } from '@/types/api'

const props = withDefaults(
  defineProps<{
    open: boolean
    modelValue?: ListFilters
    courses: CourseResponse[]
    showStatus?: boolean
  }>(),
  {
    modelValue: undefined,
    showStatus: false,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:modelValue': [value: ListFilters]
}>()

const draftCourseId = ref<number | undefined>(props.modelValue?.courseId)
const draftFrom = ref(props.modelValue?.from ?? '')
const draftTo = ref(props.modelValue?.to ?? '')
const draftStatus = ref<ListFilters['status']>(props.modelValue?.status)

// Re-seed the draft from the applied filters each time the sheet opens, so a
// cancelled edit never leaks into the next session.
watch(
  () => props.open,
  (open) => {
    if (open) syncDraft(props.modelValue)
  },
)

function syncDraft(filters: ListFilters | undefined) {
  draftCourseId.value = filters?.courseId
  draftFrom.value = filters?.from ?? ''
  draftTo.value = filters?.to ?? ''
  draftStatus.value = filters?.status
}

function onCourseChange(value?: unknown) {
  draftCourseId.value =
    value === '' || value === null || value === undefined ? undefined : Number(value)
}

// 'ANY' and a deselect payload both resolve to no status filter.
function onStatusChange(value: AcceptableValue | AcceptableValue[]) {
  draftStatus.value = value === 'TODO' || value === 'COMPLETED' ? value : undefined
}

const rangeInvalid = computed(
  () => draftFrom.value !== '' && draftTo.value !== '' && draftFrom.value > draftTo.value,
)

function apply() {
  const filters: ListFilters = {}
  if (draftCourseId.value !== undefined) filters.courseId = draftCourseId.value
  if (draftFrom.value !== '') filters.from = draftFrom.value
  if (draftTo.value !== '') filters.to = draftTo.value
  if (props.showStatus && draftStatus.value !== undefined) filters.status = draftStatus.value
  emit('update:modelValue', filters)
  emit('update:open', false)
}

function clear() {
  syncDraft({})
  emit('update:modelValue', {})
  emit('update:open', false)
}

const STATUS_OPTIONS = [
  { value: 'ANY', label: 'Any' },
  { value: 'TODO', label: 'Open' },
  { value: 'COMPLETED', label: 'Completed' },
] as const

const FIELD_CLASS =
  'mt-2 h-11 w-full rounded-xl border border-app-border bg-field px-3 text-sm text-text-main shadow-2xs outline-none focus-visible:bg-card focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30'

const STATUS_CHIP =
  'h-11 flex-1 rounded-full border-app-border bg-card px-3 font-semibold text-text-main shadow-none hover:bg-ocean-soft hover:text-text-main data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-white'
</script>

<template>
  <Drawer :open="open" @update:open="emit('update:open', $event)">
    <DrawerContent overlay class="data-[swipe-direction=down]:h-auto" data-testid="filter-sheet">
      <DrawerTitle class="sr-only">Filters</DrawerTitle>

      <div class="px-4 pt-2">
        <label for="filter-course" class="text-xs font-semibold text-text-muted">
          Course
        </label>
        <div class="mt-2 flex flex-col">
          <NativeSelect
            id="filter-course"
            data-testid="filter-course"
            :model-value="draftCourseId ?? ''"
            class="h-11 rounded-xl border-app-border bg-field text-sm text-text-main shadow-2xs focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            @update:model-value="onCourseChange"
          >
            <NativeSelectOption value="">All courses</NativeSelectOption>
            <NativeSelectOption v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.name }}
            </NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      <div class="mt-4 px-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="filter-from" class="text-xs font-semibold text-text-muted">
              From
            </label>
            <input
              id="filter-from"
              v-model="draftFrom"
              type="date"
              data-testid="filter-from"
              :class="FIELD_CLASS"
            />
          </div>
          <div>
            <label for="filter-to" class="text-xs font-semibold text-text-muted">
              To
            </label>
            <input
              id="filter-to"
              v-model="draftTo"
              type="date"
              data-testid="filter-to"
              :class="FIELD_CLASS"
            />
          </div>
        </div>
        <p v-if="rangeInvalid" role="alert" class="mt-2 text-xs font-semibold text-destructive-hover">
          The From date must not be after the To date.
        </p>
      </div>

      <div v-if="showStatus" class="mt-4 px-4">
        <p class="text-xs font-semibold text-text-muted">Status</p>
        <ToggleGroup
          type="single"
          variant="outline"
          :spacing="2"
          class="mt-2 w-full"
          :model-value="draftStatus ?? 'ANY'"
          aria-label="Task status"
          @update:model-value="onStatusChange"
        >
          <ToggleGroupItem
            v-for="option in STATUS_OPTIONS"
            :key="option.value"
            :value="option.value"
            :class="STATUS_CHIP"
          >
            {{ option.label }}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div class="flex gap-2 px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <Button
          type="button"
          variant="tactile-ocean"
          size="touch"
          class="flex-1"
          data-testid="filter-clear"
          @click="clear"
        >
          Clear
        </Button>
        <Button
          type="button"
          variant="tactile"
          size="touch"
          class="flex-1"
          data-testid="filter-apply"
          :disabled="rangeInvalid"
          @click="apply"
        >
          Apply
        </Button>
      </div>
    </DrawerContent>
  </Drawer>
</template>
