<script setup lang="ts">
import CreateScheduleView from './CreateScheduleView.vue'
import { initMockAdapter } from '@/api/mocks/adapter'

initMockAdapter()
</script>

<template>
  <Story title="views/CreateScheduleView">
    <Variant title="Default">
      <div class="h-screen bg-[#F6F7EE] overflow-y-auto">
        <CreateScheduleView :open="true" :portal="false" class="!h-full" />
      </div>
    </Variant>

    <Variant title="Mobile Viewport (390px)">
      <div
        class="mx-auto h-[844px] w-[390px] overflow-hidden rounded-2xl border border-slate-300 bg-[#F6F7EE] shadow-lg relative"
      >
        <CreateScheduleView :open="true" :portal="false" class="!h-full" />
      </div>
    </Variant>
  </Story>
</template>
