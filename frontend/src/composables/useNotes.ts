import { ref, computed } from 'vue'
import type { ComputedRef } from 'vue'
import { notesApi } from '@/api'
import type { NoteRequest, NoteResponse, NoteSummaryResponse } from '@/types/api'
import { createCache } from './createCache'
import { usePlannerStatus } from './usePlannerStatus'
import {
  devPreviewNotes,
  devPreviewCourseNames,
  devPreviewEnabled,
} from '@/api/mocks/notesDevPreview'
import { useCatalog } from './useCatalog'
import type { CoursePaletteColor } from '@/constants/palette'

const rawNotes = ref<NoteSummaryResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const cache = createCache(() => {
  rawNotes.value = []
  loading.value = false
  error.value = null
})

/** Title the backend stores when no title is derivable; the planner may rename these. */
const UNTITLED_TITLE = 'untitled note'

/** True when a title is blank or the backend's default "Untitled Note". */
export function isUntitledTitle(title?: string | null): boolean {
  const normalized = (title ?? '').trim().toLowerCase()
  return normalized === '' || normalized === UNTITLED_TITLE
}

/** Maps a saved note DTO to its list summary, mirroring the backend preview cut. */
function toSummary(note: NoteResponse): NoteSummaryResponse {
  return {
    id: note.id,
    courseId: note.courseId,
    title: note.title,
    preview: note.content.slice(0, 200),
    truncated: note.content.length > 200,
    contentLength: note.content.length,
    entryDate: note.entryDate,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }
}

/** A locally removed note plus its list index, so undo can restore it in place. */
export interface StagedNote {
  summary: NoteSummaryResponse
  index: number
}

// ponytail: note list cache with isolated dev/prototype fallback.
export function useNotes() {
  async function loadNotes(force = false): Promise<void> {
    if (cache.loaded && !force) {
      return
    }
    if (cache.pending) {
      await cache.pending
      return
    }
    const g = cache.begin()
    const seq = cache.beginLoad()
    loading.value = true
    error.value = null
    const fetchPromise = (async () => {
      const result = await notesApi.list()
      if (cache.isLatest(seq, g)) {
        rawNotes.value = result
        cache.loaded = true
      }
    })()
    cache.pending = fetchPromise
    try {
      await fetchPromise
    } catch (err) {
      if (cache.isLatest(seq, g)) {
        error.value = err instanceof Error ? err.message : 'Notes failed to load'
      }
    } finally {
      if (cache.isLatest(seq, g)) {
        loading.value = false
      }
      if (cache.pending === fetchPromise) {
        cache.pending = null
      }
    }
  }

  /** Fetches one note with its full content. Leaves the cached list untouched. */
  async function getNote(id: string): Promise<NoteResponse> {
    return notesApi.get(id)
  }

  /**
   * Creates a note, or updates it when `id` is given. Applies the saved DTO to
   * the local list, refreshes the planner status, and rethrows API errors.
   */
  async function saveNote(request: NoteRequest, id?: string): Promise<NoteResponse> {
    const saved = id ? await notesApi.update(id, request) : await notesApi.create(request)
    const summary = toSummary(saved)
    if (rawNotes.value.some((n) => n.id === saved.id)) {
      rawNotes.value = rawNotes.value.map((n) => (n.id === saved.id ? summary : n))
    } else {
      rawNotes.value = [...rawNotes.value, summary]
    }
    await usePlannerStatus()
      .refresh()
      .catch(() => {})
    return saved
  }

  /** Removes a note from the local list and returns it with its index. Null when absent. */
  function stageNoteDeletion(id: string): StagedNote | null {
    const index = rawNotes.value.findIndex((n) => n.id === id)
    const summary = index === -1 ? undefined : rawNotes.value[index]
    if (!summary) {
      return null
    }
    rawNotes.value = rawNotes.value.filter((n) => n.id !== id)
    return { summary, index }
  }

  /** Reinserts a staged note at its original position. The undo path of stageNoteDeletion. */
  function restoreStagedNote(staged: StagedNote): void {
    const next = [...rawNotes.value]
    next.splice(Math.min(staged.index, next.length), 0, staged.summary)
    rawNotes.value = next
  }

  /** Commits a staged note deletion to the server and refreshes the planner status. */
  async function commitNoteDeletion(id: string): Promise<void> {
    await notesApi.delete(id)
    await usePlannerStatus()
      .refresh()
      .catch(() => {})
  }

  /**
   * True when the list holds a note the planner may rename on Process:
   * a blank or default title. `courseIds` scopes the check to affected
   * courses; an empty or missing list checks every note.
   */
  function hasUntitledNotes(courseIds?: number[]): boolean {
    return notes.value.some((n) => {
      if (courseIds?.length && !courseIds.includes(n.courseId)) {
        return false
      }
      return isUntitledTitle(n.title)
    })
  }

  function resetNotes(): void {
    cache.reset()
  }

  const showDevPreview = computed(
    () => devPreviewEnabled() && !loading.value && !error.value && rawNotes.value.length === 0,
  )

  const notes: ComputedRef<NoteSummaryResponse[]> = computed(() =>
    showDevPreview.value ? devPreviewNotes() : rawNotes.value,
  )

  function getCourseName(courseId: number, catalogMap?: Map<number, string>): string | undefined {
    if (showDevPreview.value) {
      return devPreviewCourseNames().get(courseId)
    }
    return catalogMap?.get(courseId)
  }

  function getBadgeColor(courseId: number): CoursePaletteColor {
    return useCatalog().courseColor(courseId)
  }

  return {
    notes,
    loading,
    error,
    loadNotes,
    getNote,
    saveNote,
    stageNoteDeletion,
    restoreStagedNote,
    commitNoteDeletion,
    hasUntitledNotes,
    resetNotes,
    getCourseName,
    getBadgeColor,
  }
}
