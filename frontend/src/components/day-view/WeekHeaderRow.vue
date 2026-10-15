<script setup lang="ts">
import type { UntimedDayItem } from '../../utils/untimedItems'

defineProps<{
  days: { date: Date; key: string; untimed: UntimedDayItem[] }[]
  todayKey: string
  gutterLeft: number // width of the time axis, so columns line up with the grid
  colsWidth: number // measured width of the 7 columns (0 = fill the space)
}>()

const emit = defineEmits<{
  (e: 'select', date: Date): void
}>()

const MAX_PILLS = 2
const COLORS = ['bg-[#7CE19D]', 'bg-[#80C2F8]', 'bg-[#C084FC]', 'bg-[#FB923C]'] as const

function pillColor(courseId: number) {
  return COLORS[Math.abs(courseId - 1) % COLORS.length] ?? COLORS[1]
}

function dayName(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
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
        :aria-label="`Open ${day.date.toDateString()}`"
        @click="emit('select', day.date)"
      >
        <span class="text-[10px] font-bold tracking-wide text-stone-500">
          {{ dayName(day.date) }}
        </span>
        <span
          class="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-base font-bold"
          :class="day.key === todayKey ? 'bg-[#0E7490] text-white' : 'text-stone-700'"
        >
          {{ day.date.getDate() }}
        </span>

        <!-- Fixed height, so every week's header is the same size -->
        <span class="mt-1 flex h-[50px] w-full flex-col gap-0.5 overflow-hidden">
          <span
            v-for="item in day.untimed.slice(0, MAX_PILLS)"
            :key="item.id"
            class="block h-4 shrink-0 truncate rounded border border-[#1E293B]/50 px-0.5 text-left text-[9px] font-bold leading-[14px] text-white"
            :class="pillColor(item.courseId)"
          >
            {{ item.title }}
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
