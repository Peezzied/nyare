<script setup lang="ts">
import CourseCard from './CourseCard.vue'
import type { DayEvent } from '../../types/calendar'
import { mockCourses } from '../../mocks/calendarData'
import { useCatalog } from '../../composables/useCatalog'

useCatalog().courses.value = mockCourses

const basilEvent: DayEvent = {
  id: 'event-1',
  courseId: 1,
  title: 'Web Systems and Technologies',
  start: '2026-10-16 08:00',
  end: '2026-10-16 10:00',
  detail: 'Lab 302',
}

const peacockEvent: DayEvent = {
  id: 'event-2',
  courseId: 2,
  title: 'Data Structures and Algorithms',
  start: '2026-10-16 10:30',
  end: '2026-10-16 12:30',
  detail: 'Lecture Hall B',
}

const grapeEvent: DayEvent = {
  id: 'event-3',
  courseId: 3,
  title: 'Operating Systems',
  start: '2026-10-16 13:00',
  end: '2026-10-16 15:00',
  detail: 'Room 405',
}

const pumpkinEvent: DayEvent = {
  id: 'event-4',
  courseId: 4,
  title: 'Database Management Systems',
  start: '2026-10-16 15:30',
  end: '2026-10-16 17:30',
  detail: 'Online / Zoom',
}

function initState() {
  return {
    title: 'Computer Networks',
    start: '2026-10-16 09:00',
    end: '2026-10-16 11:00',
    detail: 'Room 204',
    courseId: 1,
  }
}
</script>

<template>
  <Story title="Calendar / CourseCard">
    <Variant title="Course Colors">
      <div class="p-6 max-w-sm space-y-4 bg-slate-50">
        <div>
          <p class="text-xs font-semibold text-slate-500 mb-2">Basil</p>
          <div class="h-28">
            <CourseCard :event="basilEvent" embedded />
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold text-slate-500 mb-2">Peacock</p>
          <div class="h-28">
            <CourseCard :event="peacockEvent" embedded />
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold text-slate-500 mb-2">Grape</p>
          <div class="h-28">
            <CourseCard :event="grapeEvent" embedded />
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold text-slate-500 mb-2">Pumpkin</p>
          <div class="h-28">
            <CourseCard :event="pumpkinEvent" embedded />
          </div>
        </div>
      </div>
    </Variant>

    <Variant title="Interactive" :init-state="initState">
      <template #default="{ state }">
        <div class="p-6 max-w-sm bg-slate-50">
          <div class="h-28">
            <CourseCard
              :event="{
                id: 'interactive-1',
                courseId: state.courseId,
                title: state.title,
                start: state.start,
                end: state.end,
                detail: state.detail,
              }"
              embedded
            />
          </div>
        </div>
      </template>

      <template #controls="{ state }">
        <HstText v-model="state.title" title="Course Title" />
        <HstText v-model="state.detail" title="Detail Line" />
        <HstNumber v-model="state.courseId" title="Course ID" :min="1" :max="8" />
      </template>
    </Variant>
  </Story>
</template>
