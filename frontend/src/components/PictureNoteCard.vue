<script setup lang="ts">
import { computed } from 'vue'
import { useCatalog } from '@/composables/useCatalog'
import type { CoursePaletteColor } from '@/constants/palette'
import { formatCardTimestamp } from '@/utils/noteDate'
import { collapseBlankLines } from '@/utils/noteImage'

const emit = defineEmits<{ open: [event: Event] }>()
const props = defineProps<{
  photoUrl: string
  courseId: number
  courseName?: string | null
  badgeColor?: CoursePaletteColor | null
  title: string
  text: string
  entryDate: string
  createdAt: string
}>()

const catalog = useCatalog()

const color = computed(() => props.badgeColor ?? catalog.courseColor(props.courseId))
const entryLabel = computed(() => formatCardTimestamp(props.entryDate, props.createdAt))
const displayText = computed(() => collapseBlankLines(props.text))
</script>

<template>
  <article
    class="cursor-pointer break-inside-avoid overflow-hidden rounded-2xl border border-app-border bg-card transition-transform active:scale-[0.98]"
    role="button"
    tabindex="0"
    data-testid="picture-note-card"
    @click="emit('open', $event)"
    @keydown.enter="emit('open', $event)"
    @keydown.space.prevent="emit('open', $event)"
  >
    <img
      :src="photoUrl"
      :alt="title"
      loading="lazy"
      class="max-h-40 w-full object-cover"
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
        class="mt-2 line-clamp-1 break-words font-sans text-base font-semibold text-text-main"
        data-testid="picture-note-title"
      >
        {{ title }}
      </h3>
      <p
        class="mt-1 line-clamp-2 break-words whitespace-pre-line font-secondary text-sm text-text-soft"
        data-testid="picture-note-text"
      >
        {{ displayText }}
      </p>
      <p class="mt-2 text-right text-xs text-text-muted" data-testid="picture-note-date">
        {{ entryLabel }}
      </p>
    </div>
  </article>
</template>
