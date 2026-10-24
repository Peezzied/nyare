<script setup lang="ts">
import { computed } from 'vue'
import type { UntimedDayItem } from '../../utils/untimedItems'
import { buildMarkerState } from '../../utils/calendarItemDetail'
import { useCatalog } from '../../composables/useCatalog'
import { isoWeekNumber } from '../../utils/weekDays'
import CategoryMarker from './CategoryMarker.vue'

const props = defineProps<{
  days: { date: Date; key: string; untimed: UntimedDayItem[] }[]
  todayKey: string
  gutterLeft: number // width of the time axis, so columns line up with the grid
  colsWidth: number // measured width of the 7 columns (0 = fill the space)
}>()

// The Sunday-start grid takes its ISO week number from its Thursday (index 4).
const weekNumber = computed(() => isoWeekNumber(props.days[4]?.date ?? new Date()))

const emit = defineEmits<{
  (e: 'select', date: Date): void
  (e: 'selectUntimed', item: UntimedDayItem, originRect: DOMRect): void
}>()

function onUntimedClick(e: MouseEvent, item: UntimedDayItem) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  emit('selectUntimed', item, rect)
}

const MAX_PILLS = 2

const catalog = useCatalog()

// Tri-block surfaces (DESIGN.md §6): an event chip is a saturated fill with
// white ink, a task chip is a white card.
function chipClasses(item: UntimedDayItem) {
  return item.category === 'event'
    ? 'border text-white'
    : 'border border-app-border bg-white text-text-main'
}

function chipStyle(item: UntimedDayItem) {
  if (item.category !== 'event') return undefined
  const color = catalog.courseColor(item.courseId)
  return { backgroundColor: color.solid, borderColor: color.text }
}

function dayName(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'narrow' }).toUpperCase()
}

/**
 * Names the day and every item it holds. The chips are painted inside this one
 * tap target, so each item's category has to reach the reader here (FR-005).
 */
function dayAriaLabel(day: { date: Date; untimed: UntimedDayItem[] }) {
  const label = `Open ${day.date.toDateString()}`
  if (day.untimed.length === 0) return label
  const items = day.untimed
    .map((item) => `${buildMarkerState(item.category, item.completed).label}: ${item.title}`)
    .join(', ')
  return `${label}. ${items}`
}
</script>

<template>
  <div
    class="relative shrink-0 border-b border-app-border bg-app-bg"
    :style="{ paddingLeft: `${gutterLeft}px` }"
  >
    <!-- ISO week number chip, centered in the time-axis gutter -->
    <span
      class="absolute inset-y-0 left-0 flex items-center justify-center pt-1.5"
      :style="{ width: `${gutterLeft}px` }"
      aria-hidden="true"
    >
      <span class="rounded-md bg-ocean-soft px-1.5 py-0.5 text-[10px] font-bold text-now">
        W{{ weekNumber }}
      </span>
    </span>

    <div class="grid grid-cols-7" :style="colsWidth > 0 ? { width: `${colsWidth}px` } : {}">
      <!-- Each day is one big tap target: opens that day -->
      <button
        v-for="day in days"
        :key="day.key"
        type="button"
        class="flex min-w-0 flex-col items-center px-px pb-1 pt-1.5 active:bg-stone-200/60"
        :class="day.key === todayKey ? 'bg-urgency-yellow/10' : ''"
        :aria-label="dayAriaLabel(day)"
        @click="emit('select', day.date)"
      >
        <span
          class="text-xs font-bold tracking-wide"
          :class="day.key === todayKey ? 'text-now' : 'text-text-muted'"
        >
          {{ dayName(day.date) }}
        </span>
        <span
          class="mt-0.5 flex size-9 items-center justify-center rounded-full text-xl font-bold"
          :class="day.key === todayKey ? 'bg-now text-white' : 'text-text-main'"
        >
          {{ day.date.getDate() }}
        </span>

        <!-- Fixed height, so every week's header is the same size -->
        <span class="mt-1 flex w-full flex-col gap-0.5 overflow-hidden">
          <span
            v-for="item in day.untimed.slice(0, MAX_PILLS)"
            :key="item.id"
            class="flex h-5 shrink-0 cursor-pointer items-center gap-0.5 truncate rounded-lg px-1 text-left font-secondary text-[10px] font-semibold leading-[14px] transition-transform active:scale-95"
            :class="chipClasses(item)"
            :style="chipStyle(item)"
            @click.stop="onUntimedClick($event, item)"
          >
            <CategoryMarker :category="item.category" :completed="item.completed" />
            <span class="min-w-0">{{ item.title }}</span>
          </span>
          <span
            v-if="day.untimed.length > MAX_PILLS"
            class="text-[9px] font-bold leading-3 text-text-muted"
          >
            +{{ day.untimed.length - MAX_PILLS }}
          </span>
        </span>
      </button>
    </div>
  </div>
</template>
