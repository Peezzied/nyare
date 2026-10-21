<script setup lang="ts">
import CalendarView from './CalendarView.vue'
</script>

<template>
  <Story title="Calendar / Full Calendar Shell (Day & Week Switcher)">
    <Variant title="Interactive Shell">
      <!-- CalendarView has fixed inset-0 to fill the viewport frame -->
      <div class="h-screen w-full relative">
        <CalendarView />
      </div>
    </Variant>
  </Story>
</template>
