<script setup lang="ts">
import UntimedBlockDetail from './UntimedBlockDetail.vue'
import type { NonCourseBlockDetailState } from '@/types/detailModal'

const withNote: NonCourseBlockDetailState = {
  id: 'task-101',
  title: 'Implement Queue using Stacks',
  itemType: 'task',
  linkedNote: 'Data Structures Week 5 Notes',
}

const withoutNote: NonCourseBlockDetailState = {
  id: 'event-201',
  title: 'Database Architecture Exam',
  itemType: 'academic-event',
  linkedNote: null,
}

function initState() {
  return {
    title: 'Study for Software Design Pattern Quiz',
    itemType: 'task' as const,
    linkedNote: 'Design Patterns Lecture Summary',
  }
}
</script>

<template>
  <Story title="Calendar / UntimedBlockDetail">
    <Variant title="With Linked Note">
      <div class="p-6 max-w-sm bg-[#F5F6EE] rounded-2xl border-2 border-[#CBD5E1] shadow-lg">
        <UntimedBlockDetail :data="withNote" />
      </div>
    </Variant>

    <Variant title="Without Linked Note">
      <div class="p-6 max-w-sm bg-[#F5F6EE] rounded-2xl border-2 border-[#CBD5E1] shadow-lg">
        <UntimedBlockDetail :data="withoutNote" />
      </div>
    </Variant>

    <Variant title="Interactive" :init-state="initState">
      <template #default="{ state }">
        <div class="p-6 max-w-sm bg-[#F5F6EE] rounded-2xl border-2 border-[#CBD5E1] shadow-lg">
          <UntimedBlockDetail
            :data="{
              id: 'custom-1',
              title: state.title,
              itemType: state.itemType,
              linkedNote: state.linkedNote || null,
            }"
          />
        </div>
      </template>

      <template #controls="{ state }">
        <HstText v-model="state.title" title="Title" />
        <HstSelect
          v-model="state.itemType"
          title="Item Type"
          :options="['task', 'academic-event']"
        />
        <HstText v-model="state.linkedNote" title="Linked Note Title" />
      </template>
    </Variant>
  </Story>
</template>
