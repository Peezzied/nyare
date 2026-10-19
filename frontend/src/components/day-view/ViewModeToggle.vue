<script setup lang="ts">
// Day-view header action: calendar glyph toggling between day and week modes.
// The numeral reads as the target span: "7" = go to the week, "1" = go to a day.
import HeaderIconButton from '../HeaderIconButton.vue'

const props = defineProps<{
  mode: 'day' | 'week'
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()
</script>

<template>
  <HeaderIconButton
    :aria-label="props.mode === 'day' ? 'Switch to week view' : 'Switch to day view'"
    @click="emit('toggle')"
  >
    <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
        {{ props.mode === 'day' ? '7' : '1' }}
      </text>
    </svg>
  </HeaderIconButton>
</template>
