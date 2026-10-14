<script setup lang="ts">
import { computed } from 'vue'
import { getCourseColor, type CoursePaletteColor } from '@/constants/palette'
import { formatEntryDateLong } from '@/utils/noteDate'

// ponytail: prototype picture card is visual-only and has no click action.
const props = defineProps<{
  photoUrl: string
  courseId: number
  courseName?: string | null
  badgeColor?: CoursePaletteColor | null
  title: string
  text: string
  entryDate: string
}>()

const color = computed(() => props.badgeColor ?? getCourseColor(props.courseId))
const entryLabel = computed(() => formatEntryDateLong(props.entryDate))
</script>

<template>
  <article
    class="cursor-default break-inside-avoid overflow-hidden rounded-2xl border border-app-border bg-card"
    data-testid="picture-note-card"
  >
    <img
      :src="photoUrl"
      :alt="title"
      loading="lazy"
      class="w-full object-cover"
      data-testid="picture-note-photo"
    />
    <div class="p-4">
      <span
        class="inline-block max-w-full truncate rounded-full border px-2 py-1 text-xs font-medium"
        :style="{
          backgroundColor: color.bg,
          color: color.text,
          borderColor: color.border,
        }"
        data-testid="picture-note-badge"
      >
        {{ courseName ?? `Course ${courseId}` }}
      </span>
      <h3
        class="mt-2 font-sans text-base font-semibold text-text-main"
        data-testid="picture-note-title"
      >
        {{ title }}
      </h3>
      <p
        class="mt-1 break-words font-editor text-sm text-text-main"
        data-testid="picture-note-text"
      >
        {{ text }}
      </p>
      <p class="mt-2 text-right text-xs text-text-muted" data-testid="picture-note-date">
        {{ entryLabel }}
      </p>
    </div>
  </article>
</template>
