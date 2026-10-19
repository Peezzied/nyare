<script setup lang="ts">
import UntimedPill from './UntimedPill.vue'
import type { UntimedDayItem } from '../../utils/untimedItems'

const taskIncomplete: UntimedDayItem = {
  id: 'task-1',
  title: 'Complete Chapter 4 Homework',
  category: 'task',
  courseId: 1,
  completed: false,
  date: '2026-10-16',
}

const taskCompleted: UntimedDayItem = {
  id: 'task-2',
  title: 'Read Lecture Slides on Binary Trees',
  category: 'task',
  courseId: 2,
  completed: true,
  date: '2026-10-16',
}

const academicEvent: UntimedDayItem = {
  id: 'event-1',
  title: 'Midterm Exam - Software Engineering',
  category: 'event',
  courseId: 3,
  completed: false,
  date: '2026-10-16',
}

function initState() {
  return {
    title: 'Review Project Documentation',
    category: 'task' as const,
    courseId: 1,
    completed: false,
  }
}
</script>

<template>
  <Story title="Calendar / UntimedPill">
    <Variant title="Categories & Status">
      <div class="p-6 max-w-sm space-y-4 bg-slate-50">
        <div>
          <p class="text-xs font-semibold text-slate-500 mb-2">Pending Task</p>
          <UntimedPill :item="taskIncomplete" />
        </div>

        <div>
          <p class="text-xs font-semibold text-slate-500 mb-2">Completed Task</p>
          <UntimedPill :item="taskCompleted" />
        </div>

        <div>
          <p class="text-xs font-semibold text-slate-500 mb-2">Academic Event</p>
          <UntimedPill :item="academicEvent" />
        </div>
      </div>
    </Variant>

    <Variant title="Course Color Themes">
      <div class="p-6 max-w-sm space-y-3 bg-slate-50">
        <UntimedPill
          :item="{
            id: 'pill-1',
            title: 'Course 1 (Green)',
            category: 'task',
            courseId: 1,
            completed: false,
            date: '2026-10-16',
          }"
        />
        <UntimedPill
          :item="{
            id: 'pill-2',
            title: 'Course 2 (Blue)',
            category: 'task',
            courseId: 2,
            completed: false,
            date: '2026-10-16',
          }"
        />
        <UntimedPill
          :item="{
            id: 'pill-3',
            title: 'Course 3 (Purple)',
            category: 'task',
            courseId: 3,
            completed: false,
            date: '2026-10-16',
          }"
        />
        <UntimedPill
          :item="{
            id: 'pill-4',
            title: 'Course 4 (Orange)',
            category: 'task',
            courseId: 4,
            completed: false,
            date: '2026-10-16',
          }"
        />
      </div>
    </Variant>

    <Variant title="Interactive" :init-state="initState">
      <template #default="{ state }">
        <div class="p-6 max-w-sm bg-slate-50">
          <UntimedPill
            :item="{
              id: 'interactive-pill',
              title: state.title,
              category: state.category,
              courseId: state.courseId,
              completed: state.completed,
              date: '2026-10-16',
            }"
          />
        </div>
      </template>

      <template #controls="{ state }">
        <HstText v-model="state.title" title="Title" />
        <HstSelect v-model="state.category" title="Category" :options="['task', 'event']" />
        <HstNumber v-model="state.courseId" title="Course ID" :min="1" :max="4" />
        <HstCheckbox v-model="state.completed" title="Completed" />
      </template>
    </Variant>
  </Story>
</template>
