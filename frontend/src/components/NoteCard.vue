<script setup lang="ts">
import { computed } from 'vue'
import { getCourseColor, type CoursePaletteColor } from '@/constants/palette'
import { formatEntryDate } from '@/utils/noteDate'
import { extractFirstImageUrl, stripImageMarkdown } from '@/utils/noteImage'
import type { NoteSummaryResponse } from '@/types/api'

const emit = defineEmits<{ open: [event: Event] }>()

const props = defineProps<{
  note: NoteSummaryResponse
  courseName?: string | null
  badgeColor?: CoursePaletteColor | null
}>()

const color = computed(() => props.badgeColor ?? getCourseColor(props.note.courseId))
const entryLabel = computed(() => formatEntryDate(props.note.entryDate))
const imageUrl = computed(() => extractFirstImageUrl(props.note.preview))
const displayText = computed(() => stripImageMarkdown(props.note.preview))
</script>

<template>
  <article
    class="cursor-pointer break-inside-avoid overflow-hidden rounded-2xl border border-app-border bg-card p-4 transition-transform active:scale-[0.98]"
    role="button"
    tabindex="0"
    data-testid="note-card"
    @click="emit('open', $event)"
    @keydown.enter="emit('open', $event)"
    @keydown.space.prevent="emit('open', $event)"
  >
    <span
      class="inline-block max-w-full truncate rounded-full border px-2 py-1 text-xs font-medium"
      :style="{
        backgroundColor: color.bg,
        color: color.text,
        borderColor: color.border,
      }"
      data-testid="note-course-badge"
    >
      {{ courseName ?? `Course ${note.courseId}` }}
    </span>
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="note.title"
      loading="lazy"
      class="mt-2 w-full rounded-lg object-cover"
      data-testid="note-image"
    />
    <h3 class="mt-2 font-sans text-base font-semibold text-text-main" data-testid="note-title">
      {{ note.title }}
    </h3>
    <p
      v-if="displayText"
      class="mt-1 break-words font-editor text-sm text-text-main"
      data-testid="note-preview"
    >
      {{ displayText }}
    </p>
    <p class="mt-2 text-right text-xs text-text-muted" data-testid="note-entry-date">
      {{ entryLabel }}
    </p>
  </article>
</template>
