<script setup lang="ts">
import { ref } from 'vue'
import CoursePickerDialog from './CoursePickerDialog.vue'
import { createInitialFixtures } from '@/api/mocks/fixtures'

const isDialogOpen = ref(false)
const selectedCourseId = ref<number | null>(1)

const fixtures = createInitialFixtures()
const mockCourses = fixtures.courses
const mockSchedules = fixtures.schedules

function onSelectCourse(id: number) {
  selectedCourseId.value = id
}
</script>

<template>
  <Story title="CoursePickerDialog" group="editor">
    <Variant title="Default Course Picker Dialog">
      <div class="p-6 bg-[#F6F7EE] min-h-[400px] flex flex-col items-center justify-center">
        <button
          type="button"
          class="rounded-full bg-[#00A4C8] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_0_0_#007B99] hover:bg-[#0093B4] cursor-pointer"
          @click="isDialogOpen = true"
        >
          Open Course Picker
        </button>

        <p class="mt-4 text-xs text-slate-600">
          Selected Course ID: {{ selectedCourseId ?? 'None' }}
        </p>

        <CoursePickerDialog
          v-model:open="isDialogOpen"
          :selected-course-id="selectedCourseId"
          :courses="mockCourses"
          :schedules="mockSchedules"
          @select="onSelectCourse"
        />
      </div>
    </Variant>

    <Variant title="Empty Catalog State">
      <div class="p-6 bg-[#F6F7EE] min-h-[400px] flex flex-col items-center justify-center">
        <CoursePickerDialog
          :open="true"
          :selected-course-id="null"
          :courses="[]"
          :schedules="[]"
        />
      </div>
    </Variant>
  </Story>
</template>
