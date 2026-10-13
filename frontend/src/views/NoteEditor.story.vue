<script setup lang="ts">
import NoteEditor from './NoteEditor.vue'
import { useCatalog } from '@/composables/useCatalog'
import { createInitialFixtures } from '@/api/mocks/fixtures'

const { courses, schedules, loaded } = useCatalog()

// Seed catalog with the 3 mock courses and schedules for Histoire preview
const fixtures = createInitialFixtures()
courses.value = [...fixtures.courses]
schedules.value = [...fixtures.schedules]
loaded.value = true
</script>

<template>
  <Story title="views/NoteEditor">
    <Variant title="New Note">
      <div class="h-[600px] bg-[#F6F7EE] overflow-hidden">
        <NoteEditor class="!h-full" />
      </div>
    </Variant>

    <Variant title="Existing Note with Course">
      <div class="h-[600px] bg-[#F6F7EE] overflow-hidden">
        <NoteEditor
          class="!h-full"
          initial-title="Biology 101 Lecture Notes"
          :initial-course-id="1"
          initial-date="2026-10-12"
          initial-content="Reviewed photosynthesis concepts and cellular respiration."
        />
      </div>
    </Variant>

    <Variant title="Mobile Viewport">
      <div class="mx-auto h-[844px] w-[390px] overflow-hidden rounded-2xl border border-slate-300 bg-[#F6F7EE] shadow-lg">
        <NoteEditor
          class="!h-full"
          initial-title="Physics Seminar Notes"
          :initial-course-id="2"
          initial-date="2026-10-13"
          initial-content="Discussion on wave mechanics and harmonic motion."
        />
      </div>
    </Variant>
  </Story>
</template>
