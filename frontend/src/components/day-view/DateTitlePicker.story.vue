<script setup lang="ts">
import { ref } from 'vue'
import DateTitlePicker from './DateTitlePicker.vue'

const selected = ref(new Date())
const busyDays = new Set([2, 6, 14, 20, 27])

function hasItems(date: Date) {
  return busyDays.has(date.getDate())
}
</script>

<template>
  <Story title="Calendar / DateTitlePicker">
    <Variant title="With Busy Dots">
      <div class="flex h-14 items-center justify-center bg-app-bg">
        <DateTitlePicker
          title="Monday, Oct 19"
          :selected="selected"
          :has-items="hasItems"
          @select="selected = $event"
        />
      </div>
    </Variant>
  </Story>
</template>
