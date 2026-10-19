<script setup lang="ts">
import { ref } from 'vue'
import TimeBlockCard, { createBlock, createScheduleDraft } from './TimeBlockCard.vue'
import type { TimeBlockDraft } from './TimeBlockCard.vue'

const draftBlock = ref<TimeBlockDraft>(createBlock())

const populatedBlock = ref<TimeBlockDraft>({
  ...createBlock(),
  selectedDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
  startTime: '09:00',
  endTime: '10:30',
})

const savedBlock = ref<TimeBlockDraft>({
  ...createBlock(),
  selectedDays: ['TUESDAY', 'THURSDAY'],
  startTime: '13:00',
  endTime: '14:30',
  state: 'saved',
  schedules: [
    { ...createScheduleDraft('TUESDAY'), state: 'saved', savedId: 1 },
    { ...createScheduleDraft('THURSDAY'), state: 'saved', savedId: 2 },
  ],
})

const failedBlock = ref<TimeBlockDraft>({
  ...createBlock(),
  selectedDays: ['MONDAY'],
  startTime: '15:00',
  endTime: '16:00',
  state: 'failed',
  schedules: [
    {
      ...createScheduleDraft('MONDAY'),
      state: 'failed',
      error: 'Schedule overlaps with existing course',
    },
  ],
})
</script>

<template>
  <Story title="components/TimeBlockCard">
    <Variant title="Default Draft">
      <div class="max-w-[420px] bg-[#F6F7EE] p-4">
        <TimeBlockCard
          :block="draftBlock"
          :index="0"
          @update:start-time="draftBlock.startTime = $event"
          @update:end-time="draftBlock.endTime = $event"
        />
      </div>
    </Variant>

    <Variant title="Configured">
      <div class="max-w-[420px] bg-[#F6F7EE] p-4">
        <TimeBlockCard
          :block="populatedBlock"
          :index="1"
          @update:start-time="populatedBlock.startTime = $event"
          @update:end-time="populatedBlock.endTime = $event"
        />
      </div>
    </Variant>

    <Variant title="Saved">
      <div class="max-w-[420px] bg-[#F6F7EE] p-4">
        <TimeBlockCard :block="savedBlock" :index="0" />
      </div>
    </Variant>

    <Variant title="Failed">
      <div class="max-w-[420px] bg-[#F6F7EE] p-4">
        <TimeBlockCard :block="failedBlock" :index="0" />
      </div>
    </Variant>
  </Story>
</template>
