<script setup lang="ts">
import { computed } from 'vue'
import { Calendar } from '@lucide/vue'
import { getCourseColor } from '@/constants/palette'
import { formatDuration, formatDueLabel, getTaskUrgency, URGENCY_COLORS } from '@/utils/taskUrgency'
import { Checkbox } from '@/components/ui/checkbox'
import type { TaskResponse } from '@/types/api'

const props = defineProps<{
  task: TaskResponse
  courseName: string
  dueDate: string | null
  time: string
}>()

const emit = defineEmits<{ open: []; toggle: [] }>()

const done = computed(() => props.task.status === 'COMPLETED')
const iconColor = computed(() => URGENCY_COLORS[getTaskUrgency(props.dueDate)])
</script>

<template>
  <li
    class="mx-4 flex cursor-pointer items-center gap-3 border-b border-(--color-app-border) py-4 transition-opacity last:border-b-0"
    :class="{ 'opacity-50': done }"
    role="button"
    tabindex="0"
    @click="emit('open')"
    @keydown.enter="emit('open')"
  >
    <div class="flex h-11 w-11 shrink-0 items-center justify-center" @click.stop>
      <Checkbox
        :model-value="done"
        :aria-label="`Mark ${task.title} as completed`"
        @update:model-value="emit('toggle')"
      />
    </div>

    <div class="flex min-w-0 flex-1 flex-col">
      <span
        class="text-base leading-snug font-bold break-words"
        :style="{ color: getCourseColor(task.courseId).text }"
      >
        {{ courseName }}
      </span>
      <span
        class="text-base font-semibold text-(--color-text-main)"
        :class="{ 'line-through': done }"
      >
        {{ task.title }}
      </span>
      <span class="text-sm text-(--color-text-muted)">{{ time }}</span>
    </div>

    <div class="flex shrink-0 items-start gap-2">
      <span
        v-if="formatDuration(task.duration)"
        class="flex h-8 items-center text-sm font-medium text-(--color-primary) opacity-80"
      >
        {{ formatDuration(task.duration) }}
      </span>
      <div class="flex min-w-12 flex-col items-center gap-1">
        <Calendar class="h-8 w-8" :style="{ color: iconColor }" aria-hidden="true" />
        <span
          v-if="formatDueLabel(dueDate)"
          class="text-sm leading-none font-semibold text-(--color-text-main)"
        >
          {{ formatDueLabel(dueDate) }}
        </span>
      </div>
    </div>
  </li>
</template>
