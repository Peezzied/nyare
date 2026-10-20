<script setup lang="ts">
// Day-view header action: a calendar glyph opening a menu of view modes
// (day, week, deadlines). The numeral reads as the mode's day span.
import { ref } from 'vue'
import { Check, Flag } from '@lucide/vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { CalendarViewMode } from '@/types/calendar'
import HeaderIconButton from '../HeaderIconButton.vue'

const props = defineProps<{
  mode: CalendarViewMode
}>()

const emit = defineEmits<{
  (e: 'select', mode: CalendarViewMode): void
}>()

const open = ref(false)

const options: { mode: CalendarViewMode; label: string; days?: string }[] = [
  { mode: 'day', label: 'Day', days: '1' },
  { mode: 'week', label: 'Week', days: '7' },
  { mode: 'deadlines', label: 'Deadlines' },
]

function choose(mode: CalendarViewMode) {
  emit('select', mode)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <HeaderIconButton aria-label="Change calendar view">
        <svg
          v-if="props.mode !== 'deadlines'"
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M19 4h-1V2h-2v2H8V2H6v2H5C3.89 4 3 4.9 3 6v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"
          />
          <text
            x="12"
            y="17.5"
            font-size="8.5"
            font-weight="bold"
            text-anchor="middle"
            fill="currentColor"
          >
            {{ props.mode === 'day' ? '1' : '7' }}
          </text>
        </svg>
        <Flag v-else class="h-5 w-5" :stroke-width="2.5" aria-hidden="true" />
      </HeaderIconButton>
    </PopoverTrigger>
    <PopoverContent class="w-44 rounded-2xl p-1.5" align="end" :side-offset="8">
      <button
        v-for="option in options"
        :key="option.mode"
        type="button"
        role="menuitemradio"
        :aria-checked="option.mode === props.mode"
        class="flex h-11 w-full items-center gap-2 rounded-xl px-3 text-left font-semibold text-text-main transition-colors hover:bg-black/5"
        @click="choose(option.mode)"
      >
        <svg
          v-if="option.days"
          class="h-5 w-5 shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M19 4h-1V2h-2v2H8V2H6v2H5C3.89 4 3 4.9 3 6v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"
          />
          <text
            x="12"
            y="17.5"
            font-size="8.5"
            font-weight="bold"
            text-anchor="middle"
            fill="currentColor"
          >
            {{ option.days }}
          </text>
        </svg>
        <Flag v-else class="h-4 w-4 shrink-0" :stroke-width="2.5" aria-hidden="true" />
        <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
        <Check
          v-if="option.mode === props.mode"
          class="h-4 w-4 shrink-0 text-(--color-primary)"
          :stroke-width="3"
          aria-hidden="true"
        />
      </button>
    </PopoverContent>
  </Popover>
</template>
