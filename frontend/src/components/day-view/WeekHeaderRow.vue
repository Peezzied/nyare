<script setup lang="ts">
import type { UntimedDayItem } from "../../utils/untimedItems";
import { buildMarkerState } from "../../utils/calendarItemDetail";
import CategoryMarker from "./CategoryMarker.vue";

defineProps<{
  days: { date: Date; key: string; untimed: UntimedDayItem[] }[]
  todayKey: string
  gutterLeft: number // width of the time axis, so columns line up with the grid
  colsWidth: number // measured width of the 7 columns (0 = fill the space)
}>()

const emit = defineEmits<{
  (e: 'select', date: Date): void
  (e: 'selectUntimed', item: UntimedDayItem, originRect: DOMRect): void
}>()

function onUntimedClick(e: MouseEvent, item: UntimedDayItem) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  emit('selectUntimed', item, rect)
}

const MAX_PILLS = 2
const COLORS = ['bg-[#7CE19D]', 'bg-[#80C2F8]', 'bg-[#C084FC]', 'bg-[#FB923C]'] as const

function pillColor(courseId: number) {
  return COLORS[Math.abs(courseId - 1) % COLORS.length] ?? COLORS[1]
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
    class="shrink-0 border-b border-[#9ccfe0] bg-[#F5F6EE]"
    :style="{ paddingLeft: `${gutterLeft}px` }"
  >
    <div class="grid grid-cols-7" :style="colsWidth > 0 ? { width: `${colsWidth}px` } : {}">
      <!-- Each day is one big tap target: opens that day -->
      <button
        v-for="day in days"
        :key="day.key"
        type="button"
        class="flex min-w-0 flex-col items-center px-px pb-1 pt-1.5 active:bg-stone-200/60"
        :aria-label="dayAriaLabel(day)"
        @click="emit('select', day.date)"
      >
        <span class="text-xs font-bold tracking-wide"
          :class="day.key === todayKey ? 'text-[#0E7490]' : 'text-stone-500'">
          {{ dayName(day.date) }}
        </span>
        <span
          class="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-xl font-bold"
          :class="day.key === todayKey ? 'bg-[#0E7490] text-white' : 'text-stone-700'"
        >
          {{ day.date.getDate() }}
        </span>

        <!-- Fixed height, so every week's header is the same size -->
        <span class="mt-1 flex h-[50px] w-full flex-col gap-0.5 overflow-hidden">
          <span
            v-for="item in day.untimed.slice(0, MAX_PILLS)"
            :key="item.id"
            class="flex h-4 shrink-0 items-center gap-0.5 truncate rounded border border-[#1E293B]/50 px-0.5 text-left text-[9px] font-bold leading-[14px] text-white hover:brightness-105 active:scale-95 transition-transform cursor-pointer"
            :class="pillColor(item.courseId)"
            @click.stop="onUntimedClick($event, item)"
          >
            <CategoryMarker :category="item.category" :completed="item.completed" />
            <span class="min-w-0 truncate">{{ item.title }}</span>
          </span>
          <span
            v-if="day.untimed.length > MAX_PILLS"
            class="text-[9px] font-bold leading-3 text-stone-500"
          >
            +{{ day.untimed.length - MAX_PILLS }}
          </span>
        </span>
      </button>
    </div>
  </div>
</template>
