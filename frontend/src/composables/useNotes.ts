import { ref, computed } from 'vue'
import type { ComputedRef } from 'vue'
import { notesApi } from '@/api'
import type { NoteSummaryResponse } from '@/types/api'
import {
  devPreviewNotes,
  devPreviewCourseNames,
  devPreviewEnabled,
} from '@/api/mocks/notesDevPreview'
import {
  pictureNotePreview,
  prototypeBadgeFor,
  prototypePreviewEnabled,
  type PictureNotePreview,
} from '@/api/mocks/notesPrototypePreview'
import { getCourseColor, type CoursePaletteColor } from '@/constants/palette'

const rawNotes = ref<NoteSummaryResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let loaded = false
let pending: Promise<void> | null = null

// ponytail: read-only note list cache with isolated dev/prototype fallback.
export function useNotes() {
  async function loadNotes(force = false): Promise<void> {
    if (loaded && !force) {
      return
    }
    if (pending) {
      await pending
      return
    }
    loading.value = true
    error.value = null
    pending = (async () => {
      rawNotes.value = await notesApi.list()
      loaded = true
    })()
    try {
      await pending
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Notes failed to load'
    } finally {
      loading.value = false
      pending = null
    }
  }

  function resetNotes(): void {
    rawNotes.value = []
    loading.value = false
    error.value = null
    loaded = false
  }

  const showDevPreview = computed(
    () => devPreviewEnabled() && !loading.value && !error.value && rawNotes.value.length === 0,
  )

  const notes: ComputedRef<NoteSummaryResponse[]> = computed(() =>
    showDevPreview.value ? devPreviewNotes() : rawNotes.value,
  )

  const showPictureCard = computed(() => prototypePreviewEnabled() || showDevPreview.value)

  const pictureNote: ComputedRef<PictureNotePreview | null> = computed(() =>
    showPictureCard.value ? pictureNotePreview : null,
  )

  function getCourseName(courseId: number, catalogMap?: Map<number, string>): string | undefined {
    if (showDevPreview.value) {
      return devPreviewCourseNames().get(courseId)
    }
    return catalogMap?.get(courseId)
  }

  function getBadgeColor(courseId: number): CoursePaletteColor {
    if (showPictureCard.value) {
      return prototypeBadgeFor(courseId) ?? getCourseColor(courseId)
    }
    return getCourseColor(courseId)
  }

  return {
    notes,
    pictureNote,
    loading,
    error,
    loadNotes,
    resetNotes,
    getCourseName,
    getBadgeColor,
  }
}
