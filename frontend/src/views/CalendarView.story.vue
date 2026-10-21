<script setup lang="ts">
import DayViewContainer from './DayViewContainer.vue'
</script>

<template>
  <Story title="Calendar / Full Calendar Shell (Day & Week Switcher)">
    <Variant title="Interactive Shell">
      <!-- DayViewContainer has fixed inset-0 to fill the viewport frame -->
      <div class="h-screen w-full relative">
        <DayViewContainer />
      </div>
    </Variant>
  </Story>
</template>
