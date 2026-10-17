<script setup lang="ts">
import CourseBlockDetail from './CourseBlockDetail.vue'
import type { CourseBlockDetailState } from '@/types/detailModal'

const sampleCourse: CourseBlockDetailState = {
  courseId: 1,
  courseName: 'Web Systems and Technologies',
  colorDot: 'bg-[#80C2F8]',
  timeWindow: '08:00 AM - 10:00 AM',
  tasksTarget: '/tasks',
  notesTarget: '/notes',
}

const greenCourse: CourseBlockDetailState = {
  courseId: 2,
  courseName: 'Data Structures and Algorithms',
  colorDot: 'bg-[#7CE19D]',
  timeWindow: '10:30 AM - 12:30 PM',
  tasksTarget: '/tasks',
  notesTarget: '/notes',
}

function initState() {
  return {
    courseName: 'Operating Systems',
    timeWindow: '01:00 PM - 03:00 PM',
    colorDot: 'bg-[#C084FC]',
    showButtons: true,
  }
}
</script>

<template>
  <Story title="Calendar / CourseBlockDetail">
    <Variant title="Default (3D Tactile Buttons)">
      <div class="p-6 max-w-sm bg-[#F5F6EE] rounded-2xl border-2 border-[#CBD5E1] shadow-lg">
        <CourseBlockDetail :data="sampleCourse" />
      </div>
    </Variant>

    <Variant title="Green Theme (DSA)">
      <div class="p-6 max-w-sm bg-[#F5F6EE] rounded-2xl border-2 border-[#CBD5E1] shadow-lg">
        <CourseBlockDetail :data="greenCourse" />
      </div>
    </Variant>

    <Variant title="Stagger Phase (Buttons Hidden)">
      <div class="p-6 max-w-sm bg-[#F5F6EE] rounded-2xl border-2 border-[#CBD5E1] shadow-lg">
        <CourseBlockDetail :data="sampleCourse" :show-buttons="false" />
      </div>
    </Variant>

    <Variant title="Interactive" :init-state="initState">
      <template #default="{ state }">
        <div class="p-6 max-w-sm bg-[#F5F6EE] rounded-2xl border-2 border-[#CBD5E1] shadow-lg">
          <CourseBlockDetail
            :data="{
              courseId: 99,
              courseName: state.courseName,
              colorDot: state.colorDot,
              timeWindow: state.timeWindow,
              tasksTarget: '/tasks',
              notesTarget: '/notes',
            }"
            :show-buttons="state.showButtons"
          />
        </div>
      </template>

      <template #controls="{ state }">
        <HstText v-model="state.courseName" title="Course Name" />
        <HstText v-model="state.timeWindow" title="Time Window" />
        <HstSelect
          v-model="state.colorDot"
          title="Color Dot"
          :options="['bg-[#80C2F8]', 'bg-[#7CE19D]', 'bg-[#C084FC]', 'bg-[#FB923C]']"
        />
        <HstCheckbox v-model="state.showButtons" title="Show Buttons" />
      </template>
    </Variant>
  </Story>
</template>
