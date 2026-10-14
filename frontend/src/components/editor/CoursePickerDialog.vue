<script setup lang="ts">
// Modal course list that sets the course of a note. NoteEditor opens it from the course pill.
import { computed } from 'vue'
import { Check } from '@lucide/vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { getCourseBadgeStyle } from '@/utils/courseColors'
import { formatCourseSchedule } from '@/utils/scheduleFormat'
import type { CourseResponse, ScheduleResponse } from '@/types/api'

interface Props {
  /** Dialog visibility. Bind it with v-model:open. */
  open: boolean
  /** Course that gets the check mark. Null means no course is selected. */
  selectedCourseId?: number | null
  courses: CourseResponse[]
  /** All class schedules. The dialog filters them by course to show a meeting-day summary. */
  schedules?: ScheduleResponse[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedCourseId: null,
  schedules: () => [],
})

const emit = defineEmits<{
  /** Fires when the dialog opens or closes. It also fires with false after a course selection. */
  (e: 'update:open', value: boolean): void
  /** Fires when the user clicks a course. Payload is the course id. */
  (e: 'select', courseId: number): void
}>()

function getSchedulesForCourse(courseId: number): ScheduleResponse[] {
  return props.schedules.filter((s) => s.courseId === courseId)
}

function handleSelect(courseId: number) {
  emit('select', courseId)
  emit('update:open', false)
}

const courseOptions = computed(() => {
  return props.courses.map((course) => {
    const badgeStyle = getCourseBadgeStyle(course.id)
    const schedulesForCourse = getSchedulesForCourse(course.id)
    const scheduleSummary = formatCourseSchedule(schedulesForCourse)
    const isSelected = props.selectedCourseId === course.id

    return {
      course,
      badgeStyle,
      scheduleSummary,
      isSelected,
    }
  })
})
</script>

<template>
  <Dialog :open="open" @update:open="(val) => emit('update:open', val)">
    <DialogContent
      data-testid="course-picker-modal"
      class="w-[calc(100%-3rem)] max-w-sm rounded-2xl border border-[#00A4C8]/30 bg-[#FDFEF7] p-5 shadow-xl !font-sans"
    >
      <DialogHeader class="text-left pb-2">
        <DialogTitle class="text-base font-bold text-slate-800 tracking-tight">
          Select Course
        </DialogTitle>
      </DialogHeader>

      <!-- Empty State -->
      <div
        v-if="courses.length === 0"
        data-testid="empty-course-state"
        class="py-8 text-center text-sm text-[#7B8B97]"
      >
        <p class="font-semibold text-slate-700">No courses available</p>
        <p class="mt-1 text-xs">Create a course in your catalog first to associate notes.</p>
      </div>

      <!-- Course List -->
      <div
        v-else
        data-testid="course-options-list"
        class="max-h-[60vh] space-y-1.5 overflow-y-auto pr-1"
      >
        <button
          v-for="{ course, badgeStyle, scheduleSummary, isSelected } in courseOptions"
          :key="course.id"
          type="button"
          :data-testid="`course-option-${course.id}`"
          :aria-selected="isSelected"
          class="flex w-full min-h-[48px] items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-colors cursor-pointer"
          :class="
            isSelected
              ? 'bg-[#00A4C8]/15 ring-1 ring-[#00A4C8]/40'
              : 'hover:bg-[#00A4C8]/10 active:bg-[#00A4C8]/20'
          "
          @click="handleSelect(course.id)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <!-- Color Dot -->
            <span
              class="size-3 shrink-0 rounded-full border border-black/10"
              :style="{ backgroundColor: badgeStyle.color }"
              aria-hidden="true"
            />

            <!-- Title & Schedule -->
            <div class="min-w-0 flex flex-col">
              <span class="truncate text-sm font-bold text-slate-800 leading-tight">
                {{ course.name }}
              </span>
              <span class="text-xs text-[#7B8B97] font-medium leading-tight mt-0.5">
                {{ scheduleSummary }}
              </span>
            </div>
          </div>

          <!-- Selection Indicator -->
          <Check
            v-if="isSelected"
            class="size-4 shrink-0 text-[#00A4C8]"
            data-testid="selected-check"
          />
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>
