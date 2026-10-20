<script setup lang="ts">
// Pill trigger that opens CoursePickerDialog to set the course of an academic item.
import { computed, ref } from 'vue'
import { ChevronDown } from '@lucide/vue'
import CoursePickerDialog from '@/components/CoursePickerDialog.vue'
import { useCatalog } from '@/composables/useCatalog'
import type { CourseResponse, ScheduleResponse } from '@/types/api'

interface Props {
  /** Bound course id. Null renders the empty dashed pill. */
  modelValue: number | null
  courses: CourseResponse[]
  /** All class schedules. The dialog filters them by course to show a meeting-day summary. */
  schedules?: ScheduleResponse[]
  /** Label of the dashed pill when no course is selected. */
  emptyLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  schedules: () => [],
  emptyLabel: 'Required',
})

const emit = defineEmits<{
  /** Fires when the user picks a course in the dialog. Payload is the course id. */
  (e: 'update:modelValue', courseId: number): void
}>()

// Fallthrough attrs (data-testid, aria-label, id) land on the trigger button.
defineOptions({ inheritAttrs: false })

const isOpen = ref(false)
const catalog = useCatalog()

const selectedCourse = computed(() => {
  if (props.modelValue === null) {
    return null
  }
  return props.courses.find((course) => course.id === props.modelValue) ?? null
})

const badgeStyle = computed(() => {
  if (props.modelValue === null) {
    return undefined
  }
  const badge = catalog.courseColor(props.modelValue)
  return {
    backgroundColor: badge.bg,
    color: badge.text,
    borderColor: badge.border,
  }
})
</script>

<template>
  <div class="relative inline-flex items-center">
    <button
      v-bind="$attrs"
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 pr-2.5 text-xs font-semibold cursor-pointer border transition-colors outline-none max-w-[200px]"
      :style="badgeStyle"
      :class="
        modelValue ? '' : 'border-dashed border-red-400 bg-red-50 text-red-600 hover:bg-red-100/70'
      "
      @click="isOpen = true"
    >
      <span class="truncate">{{ selectedCourse ? selectedCourse.name : emptyLabel }}</span>
      <ChevronDown class="size-3.5 opacity-60 shrink-0" />
    </button>

    <CoursePickerDialog
      v-model:open="isOpen"
      :courses="courses"
      :schedules="schedules"
      :selected-course-id="modelValue"
      @select="(courseId) => emit('update:modelValue', courseId)"
    />
  </div>
</template>
