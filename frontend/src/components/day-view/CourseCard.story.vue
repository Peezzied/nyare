<script setup lang="ts">
import CourseCard from './CourseCard.vue'
import type { DayEvent } from '../../types/calendar'

const greenEvent: DayEvent = {
  id: 'event-1',
  courseId: 1,
  title: 'Web Systems and Technologies',
  start: '2026-10-16 08:00',
  end: '2026-10-16 10:00',
  detail: 'Lab 302',
  colorTheme: 'green',
}

const blueEvent: DayEvent = {
  id: 'event-2',
  courseId: 2,
  title: 'Data Structures and Algorithms',
  start: '2026-10-16 10:30',
  end: '2026-10-16 12:30',
  detail: 'Lecture Hall B',
  colorTheme: 'blue',
}

const purpleEvent: DayEvent = {
  id: 'event-3',
  courseId: 3,
  title: 'Operating Systems',
  start: '2026-10-16 13:00',
  end: '2026-10-16 15:00',
  detail: 'Room 405',
  colorTheme: 'purple',
}

const orangeEvent: DayEvent = {
  id: 'event-4',
  courseId: 4,
  title: 'Database Management Systems',
  start: '2026-10-16 15:30',
  end: '2026-10-16 17:30',
  detail: 'Online / Zoom',
  colorTheme: 'orange',
}

function initState() {
  return {
    title: 'Computer Networks',
    start: '2026-10-16 09:00',
    end: '2026-10-16 11:00',
    detail: 'Room 204',
    colorTheme: 'blue' as const,
  }
}
</script>

<template>
  <Story title="Calendar / CourseCard">
    <Variant title="Color Themes">
      <div class="p-6 max-w-sm space-y-4 bg-slate-50">
        <div>
          <p class="text-xs font-semibold text-slate-500 mb-2">Green Theme</p>
          <div class="h-28">
            <CourseCard :event="greenEvent" embedded />
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold text-slate-500 mb-2">Blue Theme</p>
          <div class="h-28">
            <CourseCard :event="blueEvent" embedded />
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold text-slate-500 mb-2">Purple Theme</p>
          <div class="h-28">
            <CourseCard :event="purpleEvent" embedded />
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold text-slate-500 mb-2">Orange Theme</p>
          <div class="h-28">
            <CourseCard :event="orangeEvent" embedded />
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
                courseId: 1,
                title: state.title,
                start: state.start,
                end: state.end,
                detail: state.detail,
                colorTheme: state.colorTheme,
              }"
              embedded
            />
          </div>
        </div>
      </template>

      <template #controls="{ state }">
        <HstText v-model="state.title" title="Course Title" />
        <HstText v-model="state.detail" title="Detail Line" />
        <HstSelect
          v-model="state.colorTheme"
          title="Color Theme"
          :options="['green', 'blue', 'purple', 'orange']"
        />
      </template>
    </Variant>
  </Story>
</template>
