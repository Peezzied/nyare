<script setup lang="ts">
// Calendar header title: tap the date label + chevron to open a mini month
// picker (Google Calendar style). Picking a day emits `select` and closes.
// `hasItems` marks busy days with a dot below the numeral.
import { computed, ref } from 'vue'
import { parseDate, type DateValue } from '@internationalized/date'
import { ChevronDown } from '@lucide/vue'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toDateKey } from '@/utils/dayKey'

const props = defineProps<{
  title: string
  selected: Date
  hasItems?: (date: Date) => boolean
}>()

const emit = defineEmits<{
  (e: 'select', date: Date): void
}>()

const open = ref(false)

const picked = computed<DateValue | undefined>({
  get: () => parseDate(toDateKey(props.selected)),
  set: (value) => {
    if (!value) return
    emit('select', new Date(value.year, value.month - 1, value.day))
    open.value = false
  },
})

function dayMarker(day: DateValue): boolean {
  return props.hasItems?.(new Date(day.year, day.month - 1, day.day)) ?? false
}
</script>

<template>
  <Popover v-model:open="open">
    <h1 class="text-xl font-bold tracking-tight text-text-main">
      <PopoverTrigger as-child>
        <button
          type="button"
          data-testid="app-header-title"
          :aria-expanded="open"
          aria-haspopup="dialog"
          :aria-label="`Choose a date — ${title}`"
          class="flex min-h-11 min-w-0 items-center gap-1 rounded-lg px-2 transition-colors hover:bg-black/5 active:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span class="truncate">{{ title }}</span>
          <ChevronDown
            class="h-5 w-5 shrink-0 transition-transform duration-200"
            :class="{ 'rotate-180': open }"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
    </h1>
    <PopoverContent class="w-auto rounded-2xl p-0" :side-offset="8">
      <Calendar v-model="picked" :day-marker="dayMarker" initial-focus />
    </PopoverContent>
  </Popover>
</template>
