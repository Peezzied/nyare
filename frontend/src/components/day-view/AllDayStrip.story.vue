<script setup lang="ts">
import AllDayStrip from './AllDayStrip.vue'
import type { UntimedDayItem } from '../../utils/untimedItems'
import { mockCourses } from '../../mocks/calendarData'
import { useCatalog } from '../../composables/useCatalog'

useCatalog().courses.value = mockCourses

const mixedItems: UntimedDayItem[] = [
  {
    id: 't-1',
    title: 'Review Chapter 5 Sorting Algorithms',
    category: 'task',
    courseId: 1,
    completed: false,
    date: '2026-10-16',
  },
  {
    id: 'e-1',
    title: 'Midterm Exam - Web Systems',
    category: 'event',
    courseId: 2,
    completed: false,
    date: '2026-10-16',
  },
  {
    id: 't-2',
    title: 'Submit Lab Exercise 3',
    category: 'task',
    courseId: 3,
    completed: true,
    date: '2026-10-16',
  },
  {
    id: 't-3',
    title: 'Read Operating Systems Chapter 7',
    category: 'task',
    courseId: 4,
    completed: false,
    date: '2026-10-16',
  },
]
</script>

<template>
  <Story title="Calendar / AllDayStrip">
    <Variant title="Multiple Untimed Items">
      <div class="max-w-md bg-white border border-slate-200">
        <AllDayStrip :items="mixedItems" />
      </div>
    </Variant>

    <Variant title="Single Task">
      <div class="max-w-md bg-white border border-slate-200">
        <AllDayStrip :items="mixedItems.slice(0, 1)" />
      </div>
    </Variant>
  </Story>
</template>
