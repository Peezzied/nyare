<script setup lang="ts">
// Full-screen journal note editor for /notes/new, /notes/:id, and /note/:id. An id route param selects edit mode.
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import {
  AlertCircle,
  CalendarIcon,
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  EllipsisVertical,
  Trash2,
  Sparkles,
  EyeOff,
  Info,
} from '@lucide/vue'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { parseDate, type DateValue } from '@internationalized/date'
import DialogShell from '@/components/ui/DialogShell.vue'
import DetailTopBar from '@/components/DetailTopBar.vue'
import SaveButton from '@/components/SaveButton.vue'
import { Button } from '@/components/ui/button'
import TiptapEditor from '@/components/editor/TiptapEditor.vue'
import { useNotes, isUntitledTitle } from '@/composables/useNotes'
import { imagesApi } from '@/api/images'
import { useProcess } from '@/composables/useProcess'
import { useToasts } from '@/composables/useToasts'
import { useCatalog } from '@/composables/useCatalog'
import { useArchive } from '@/composables/useArchive'
import CoursePicker from '@/components/CoursePicker.vue'
import { markdownToHtml, htmlToMarkdown, extractImageUrls } from '@/utils/markdown'
import {
  getNoteProcessingStatus,
  getNoteStatusConfig,
  countWords,
  formatWordCount,
} from '@/utils/noteStatus'
import type { ImageUploadResponse, NoteResponse } from '@/types/api'

interface Props {
  /** Prefills the title. A loaded note replaces it in edit mode. */
  initialTitle?: string
  /** Prefills the course of a new note. It takes precedence over the courseId query param. */
  initialCourseId?: number | null
  /** Prefills the entry date as YYYY-MM-DD. It takes precedence over the entryDate query param. Undefined means today. */
  initialDate?: string
  /** Prefills the note body as Markdown. */
  initialContent?: string
  /** Extra image URLs that save accepts, in addition to URLs in initial or loaded content and images uploaded in this session. */
  validImageUrls?: string[]
  /** Seeds the processing status badge until a load or save returns server values. */
  initialLastProcessedAt?: string | null
  /** Seeds the processing status badge until a load or save returns server values. */
  initialUpdatedAt?: string | null
  /** Note UUID when embedded in a modal. Null means new note. Ignored outside embedded mode. */
  noteId?: string | null
  /** Renders inside NoteEditorModal: route guards and viewport listeners are disabled. */
  embedded?: boolean
  /** Drives the staggered content entrance classes on metadata and body. */
  showContent?: boolean
  /** Drives the staggered entrance classes on the header and toolbar. */
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialTitle: '',
  initialCourseId: null,
  initialDate: undefined,
  initialContent: '',
  validImageUrls: () => [],
  initialLastProcessedAt: null,
  initialUpdatedAt: null,
  noteId: undefined,
  embedded: false,
  showContent: true,
  showControls: true,
})

const emit = defineEmits<{
  /** Requests dismissal of the surrounding context (embedded modal or route). */
  (e: 'close'): void
  /** Fires after a successful save. Payload is the saved note UUID. */
  (e: 'saved', noteId: string): void
}>()

const route = useRoute()
const router = useRouter()
const { courses, schedules, loadCatalog } = useCatalog()
const archive = useArchive()
const {
  saveNote: persistNote,
  getNote,
  stageNoteDeletion,
  restoreStagedNote,
  commitNoteDeletion,
} = useNotes()
const { pushToast } = useToasts()

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getTodayString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Notes may backdate at most 14 days. The backend rejects dates outside its own horizon (default 14 days).
function getMinDateString(maxDaysBack = 14): string {
  const d = new Date()
  d.setDate(d.getDate() - maxDaysBack)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const todayString = getTodayString()
const minDateString = getMinDateString(14)

const title = ref(props.initialTitle)
const selectedCourseId = ref<number | null>(props.initialCourseId)
const entryDate = ref(props.initialDate !== undefined ? props.initialDate : todayString)
const isCalendarOpen = ref(false)
const lastProcessedAt = ref<string | null>(props.initialLastProcessedAt ?? null)
const updatedAt = ref<string | null>(props.initialUpdatedAt ?? null)
const excludedFromAi = ref(false)

const activeNoteId = computed(() => {
  if (props.embedded) {
    return props.noteId ?? null
  }
  const paramId = route?.params?.id
  return paramId ? String(paramId) : null
})

const isEditMode = computed(() => !!activeNoteId.value)

/** True when the note's course is archived. The editor renders read-only. */
const isArchivedCourse = computed(() => archive.isArchived(selectedCourseId.value))

const archivedCourseName = computed(
  () =>
    archive.archivedCourses.value.find((course) => course.id === selectedCourseId.value)?.name ??
    `Course ${selectedCourseId.value ?? ''}`,
)

const archivedCourseBadgeStyle = computed(() => {
  const badge = archive.courseColor(selectedCourseId.value)
  return { backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }
})

/**
 * Loads the archive list when the selected course is missing from the active
 * catalog. A failed lookup leaves the editor writable.
 */
async function checkArchivedCourse(): Promise<void> {
  const courseId = selectedCourseId.value
  if (courseId === null) {
    return
  }
  // The course check needs the catalog; this dedupes with any in-flight load.
  await loadCatalog().catch(() => {})
  if (courses.value.some((course) => course.id === courseId)) {
    return
  }
  try {
    await archive.loadArchive()
  } catch {
    // A failed lookup leaves the editor writable.
  }
}

const processingStatus = computed(() => {
  return getNoteProcessingStatus({
    isSaved: isEditMode.value,
    isDirty: isDirty.value,
    excludedFromAi: excludedFromAi.value,
    updatedAt: updatedAt.value,
    lastProcessedAt: lastProcessedAt.value,
  })
})

const statusConfig = computed(() => {
  return getNoteStatusConfig(processingStatus.value)
})

const statusIcon = computed(() => {
  switch (processingStatus.value) {
    case 'draft':
      return FileText
    case 'unprocessed':
      return Clock
    case 'dirty':
      return RefreshCw
    case 'processed':
      return CheckCircle2
    case 'skipped':
      return EyeOff
    default:
      return FileText
  }
})

const wordCount = computed(() => {
  return countWords(contentMarkdown.value)
})

const wordCountDisplay = computed(() => {
  return formatWordCount(wordCount.value)
})

const calendarDateValue = computed<DateValue | undefined>({
  get: () => {
    if (!entryDate.value) {
      return undefined
    }
    try {
      return parseDate(entryDate.value)
    } catch {
      return undefined
    }
  },
  set: (val) => {
    if (val) {
      entryDate.value = val.toString()
      isCalendarOpen.value = false
    }
  },
})

const minCalendarDate = computed(() => {
  try {
    return parseDate(minDateString)
  } catch {
    return undefined
  }
})

const maxCalendarDate = computed(() => {
  try {
    return parseDate(todayString)
  } catch {
    return undefined
  }
})

const formattedDisplayDate = computed(() => {
  if (!entryDate.value) {
    return 'Select date'
  }
  if (entryDate.value === todayString) {
    return 'Today'
  }
  try {
    const parts = entryDate.value.split('-')
    const y = Number(parts[0])
    const m = Number(parts[1])
    const d = Number(parts[2])
    if (y && m && d) {
      const dateObj = new Date(y, m - 1, d)
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  } catch {
    // fallback
  }
  return entryDate.value
})

const contentMarkdown = ref(props.initialContent)
const htmlContent = ref(markdownToHtml(props.initialContent))
interface NoteFormState {
  title: string
  courseId: number | null
  entryDate: string
  content: string
  excludedFromAi: boolean
}

function isTitleEqual(current?: string | null, baseline?: string | null): boolean {
  const a = current ?? ''
  const b = baseline ?? ''
  if (a === b) {
    return true
  }
  return a.trim() === b.trim()
}

function isCourseIdEqual(current?: number | null, baseline?: number | null): boolean {
  return (current ?? null) === (baseline ?? null)
}

function isEntryDateEqual(current?: string | null, baseline?: string | null): boolean {
  return (current ?? '').trim() === (baseline ?? '').trim()
}

function isContentEqual(current?: string | null, baseline?: string | null): boolean {
  const a = current ?? ''
  const b = baseline ?? ''
  if (a === b) {
    return true
  }
  if (a.trim() === b.trim()) {
    return true
  }
  return htmlToMarkdown(markdownToHtml(a)) === htmlToMarkdown(markdownToHtml(b))
}

function isEqualState(a: NoteFormState, b: NoteFormState): boolean {
  return (
    isTitleEqual(a.title, b.title) &&
    isCourseIdEqual(a.courseId, b.courseId) &&
    isEntryDateEqual(a.entryDate, b.entryDate) &&
    isContentEqual(a.content, b.content) &&
    a.excludedFromAi === b.excludedFromAi
  )
}

function getCurrentState(): NoteFormState {
  return {
    title: title.value ?? '',
    courseId: selectedCourseId.value ?? null,
    entryDate: entryDate.value ?? '',
    content: contentMarkdown.value ?? '',
    excludedFromAi: excludedFromAi.value,
  }
}

const initialState = ref<NoteFormState>({
  title: props.initialTitle ?? '',
  courseId: props.initialCourseId ?? null,
  entryDate: props.initialDate !== undefined ? props.initialDate : todayString,
  content: props.initialContent ?? '',
  excludedFromAi: false,
})

const isNavigatingAway = ref(false)

const isDirty = computed(() => {
  if (isNavigatingAway.value) {
    return false
  }
  return !isEqualState(getCurrentState(), initialState.value)
})
const isSaving = ref(false)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
// Image URLs that saveNote accepts: prop URLs, URLs in initial or loaded content, and session uploads.
// This blocks references to images that were never uploaded.
const knownImageUrls = ref(new Set<string>())

// URLs uploaded during this editor session. Candidates for cleanup when the save leaves them unreferenced.
const sessionImageUrls = new Set<string>()

// Initialize known images from initial props
if (props.validImageUrls.length > 0) {
  for (const url of props.validImageUrls) {
    knownImageUrls.value.add(url)
  }
}
if (props.initialContent) {
  for (const url of extractImageUrls(props.initialContent)) {
    knownImageUrls.value.add(url)
  }
}

const isSaveDisabled = computed(() => {
  if (selectedCourseId.value === null) {
    return true
  }
  if (!entryDate.value || !entryDate.value.trim()) {
    return true
  }
  if (!contentMarkdown.value || !contentMarkdown.value.trim()) {
    return true
  }
  if (isSaving.value) {
    return true
  }
  if (!isDirty.value) {
    return true
  }
  return false
})

function validateEmbeddedImages(markdown: string): { valid: boolean; error?: string } {
  const imageUrls = extractImageUrls(markdown)
  for (const url of imageUrls) {
    const prefix = '/api/images/'
    if (!url.startsWith(prefix)) {
      return { valid: false, error: `Invalid image URL: ${url}` }
    }
    const uuid = url.slice(prefix.length)
    if (!UUID_REGEX.test(uuid)) {
      return { valid: false, error: `Image reference does not contain a valid UUID: ${url}` }
    }
    if (!knownImageUrls.value.has(url)) {
      return { valid: false, error: `Image reference is unpersisted or invalid: ${url}` }
    }
  }
  return { valid: true }
}

function onEditorContentChange(newHtml: string) {
  // Ignore editor updates while loadNote applies server content, so the load does not mark the note dirty.
  if (isLoading.value) {
    return
  }
  htmlContent.value = newHtml
  contentMarkdown.value = htmlToMarkdown(newHtml)
}

function onImageUploaded(response: ImageUploadResponse) {
  if (response?.url) {
    knownImageUrls.value.add(response.url)
    sessionImageUrls.add(response.url)
  }
}

function onUploadError(error: Error) {
  errorMessage.value = error.message
}

const coursePickerRef = ref<InstanceType<typeof CoursePicker> | null>(null)

function openCoursePicker() {
  coursePickerRef.value?.open()
}

const isUnsavedDialogOpen = ref(false)
const pendingNavigation = ref<(() => void) | null>(null)
const isActionsMenuOpen = ref(false)
const isDeleteDialogOpen = ref(false)

function openDeleteDialog() {
  isActionsMenuOpen.value = false
  isDeleteDialogOpen.value = true
}

function hasMeaningfulContent(): boolean {
  return (
    Boolean(contentMarkdown.value && contentMarkdown.value.trim().length > 0) ||
    Boolean(title.value && title.value.trim().length > 0)
  )
}

function navigateBack() {
  isNavigatingAway.value = true
  if (props.embedded) {
    emit('close')
    return
  }
  if (router) {
    router.back()
  }
}

function handleBack() {
  if (isDirty.value && hasMeaningfulContent()) {
    isUnsavedDialogOpen.value = true
    pendingNavigation.value = () => navigateBack()
    return
  }
  navigateBack()
}

function confirmDiscard() {
  isUnsavedDialogOpen.value = false
  const action = pendingNavigation.value
  pendingNavigation.value = null
  if (action) {
    action()
  } else {
    navigateBack()
  }
}

function cancelDiscard() {
  isUnsavedDialogOpen.value = false
  pendingNavigation.value = null
}

/**
 * Deletes the open note. The confirm dialog gates intent; the undo toast gates
 * the server commit. The Undo action restores the staged summary. Expiry or
 * dismissal commits the delete; a failed commit restores it and reports an
 * error.
 */
function confirmDelete() {
  const id = activeNoteId.value
  if (!id) {
    return
  }
  isDeleteDialogOpen.value = false
  const staged = stageNoteDeletion(id)
  navigateBack()
  if (!staged) {
    void commitNoteDeletion(id).catch(() => {
      pushToast({ kind: 'error', title: 'Could not delete the note' })
    })
    return
  }
  let cancelled = false
  const restore = () => {
    cancelled = true
    restoreStagedNote(staged)
  }
  const commit = () => {
    if (cancelled) {
      return
    }
    void commitNoteDeletion(id).catch(() => {
      restore()
      pushToast({
        kind: 'error',
        title: 'Delete failed',
        detail: 'The note was restored.',
      })
    })
  }
  pushToast({
    kind: 'success',
    title: 'Note deleted',
    action: { label: 'Undo', onClick: restore },
    onDismiss: commit,
    onAutoClose: commit,
  })
}

if (!props.embedded) {
  try {
    onBeforeRouteLeave(() => {
      if (!isNavigatingAway.value && isDirty.value && hasMeaningfulContent()) {
        return window.confirm('You have unsaved changes. Leave anyway?')
      }
      return true
    })
  } catch {
    // Ignore when mounted outside Vue Router view context
  }
}

async function loadNote(id: string) {
  try {
    isLoading.value = true
    errorMessage.value = null
    const note = await getNote(id)
    title.value = note.title ?? ''
    selectedCourseId.value = note.courseId ?? null
    entryDate.value = note.entryDate ?? todayString
    contentMarkdown.value = note.content ?? ''
    htmlContent.value = markdownToHtml(note.content ?? '')
    lastProcessedAt.value = note.lastProcessedAt ?? null
    updatedAt.value = note.updatedAt ?? null
    excludedFromAi.value = note.excludedFromAi ?? false
    for (const url of extractImageUrls(note.content ?? '')) {
      knownImageUrls.value.add(url)
    }
    await nextTick()
    initialState.value = getCurrentState()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load note'
  } finally {
    isLoading.value = false
  }
}

async function saveNote() {
  if (isArchivedCourse.value || isSaveDisabled.value) {
    return
  }

  // Pre-save validation
  if (entryDate.value > todayString) {
    errorMessage.value = 'Entry date cannot be in the future'
    return
  }
  if (entryDate.value < minDateString) {
    errorMessage.value = 'Entry date cannot be older than 14 days'
    return
  }

  const imageValidation = validateEmbeddedImages(contentMarkdown.value)
  if (!imageValidation.valid) {
    errorMessage.value = imageValidation.error ?? 'Invalid embedded image reference'
    return
  }

  const trimmedTitle = title.value.trim()
  const payload = {
    courseId: selectedCourseId.value!,
    title: trimmedTitle || null,
    content: contentMarkdown.value,
    entryDate: entryDate.value || todayString,
    excludedFromAi: excludedFromAi.value,
  }

  try {
    isSaving.value = true
    errorMessage.value = null
    let savedNote: NoteResponse
    if (isEditMode.value && activeNoteId.value) {
      savedNote = await persistNote(payload, activeNoteId.value)
    } else {
      savedNote = await persistNote(payload)
    }
    lastProcessedAt.value = savedNote.lastProcessedAt ?? null
    updatedAt.value = savedNote.updatedAt ?? null
    excludedFromAi.value = savedNote.excludedFromAi

    // Deleted image nodes can return through undo or a discarded save, so their rows are deleted
    // only after the save commits. Removal failures leave orphan rows and need no user feedback.
    const savedImageUrls = new Set(extractImageUrls(savedNote.content ?? ''))
    const cleanupCandidates = new Set([
      ...extractImageUrls(initialState.value.content),
      ...sessionImageUrls,
    ])
    for (const url of cleanupCandidates) {
      if (url.startsWith('/api/images/') && !savedImageUrls.has(url)) {
        void imagesApi.delete(url.slice('/api/images/'.length)).catch(() => {})
      }
    }
    sessionImageUrls.clear()

    initialState.value = {
      title: trimmedTitle,
      courseId: savedNote.courseId ?? null,
      entryDate: savedNote.entryDate ?? todayString,
      content: savedNote.content ?? '',
      excludedFromAi: savedNote.excludedFromAi,
    }
    if (props.embedded) {
      emit('saved', savedNote.id)
    }
    navigateBack()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to save note'
  } finally {
    isSaving.value = false
  }
}

// These watchers apply late prefill props only to empty fields, so they never overwrite user input.
watch(
  () => props.initialContent,
  (newContent) => {
    if (newContent && !contentMarkdown.value) {
      contentMarkdown.value = newContent
      htmlContent.value = markdownToHtml(newContent)
      for (const url of extractImageUrls(newContent)) {
        knownImageUrls.value.add(url)
      }
      if (!isEditMode.value) {
        initialState.value.content = newContent
      }
    }
  },
)

watch(
  () => props.initialCourseId,
  (newCourseId) => {
    if (newCourseId !== undefined && newCourseId !== null && selectedCourseId.value === null) {
      selectedCourseId.value = newCourseId
      if (!isEditMode.value) {
        initialState.value.courseId = newCourseId
      }
    }
  },
)

watch(
  () => props.initialTitle,
  (newTitle) => {
    if (newTitle && !title.value) {
      title.value = newTitle
      if (!isEditMode.value) {
        initialState.value.title = newTitle
      }
    }
  },
)

// A committed Process run may rename a note still titled "Untitled Note".
// Adopt the new title in place only while the field still shows an untitled
// value, so typed input is never overwritten.
const proc = useProcess()
watch([proc.summary, proc.savedAfterCancel], async ([done, committed]) => {
  const id = activeNoteId.value
  if ((!done && !committed) || !id) {
    return
  }
  if (!isUntitledTitle(initialState.value.title) || !isUntitledTitle(title.value)) {
    return
  }
  const affected = done?.affectedCourseIds
  if (
    affected?.length &&
    selectedCourseId.value !== null &&
    !affected.includes(selectedCourseId.value)
  ) {
    return
  }
  try {
    const fresh = await getNote(id)
    if (isUntitledTitle(fresh.title) || !isUntitledTitle(title.value)) {
      return
    }
    title.value = fresh.title
    initialState.value.title = fresh.title
    lastProcessedAt.value = fresh.lastProcessedAt ?? null
    updatedAt.value = fresh.updatedAt ?? null
  } catch {
    // The refresh is best-effort; the next load picks the title up.
  }
})

// The selected course may arrive late through loadNote or prefill props.
watch(selectedCourseId, () => {
  void checkArchivedCourse()
})

function staggeredClass(shown: boolean): string {
  return `transition-[opacity,transform] ${shown ? 'opacity-100 translate-y-0 duration-200' : 'opacity-0 translate-y-2 duration-[80ms]'}`
}

const contentStaggerClass = computed(() => staggeredClass(props.showContent))
const controlsStaggerClass = computed(() => staggeredClass(props.showControls))

// ponytail: visualViewport height resizes the scroll container when the virtual keyboard opens
const viewportHeight = ref<number | null>(null)

function updateViewportHeight() {
  if (typeof window !== 'undefined' && window.visualViewport) {
    viewportHeight.value = window.visualViewport.height
  }
}

onMounted(async () => {
  // Embedded mode skips viewport listeners: the fixed modal sizes the container, not the viewport.
  if (!props.embedded && typeof window !== 'undefined' && window.visualViewport) {
    updateViewportHeight()
    window.visualViewport.addEventListener('resize', updateViewportHeight)
  }
  if (activeNoteId.value) {
    await Promise.all([loadCatalog(), loadNote(activeNoteId.value)])
  } else {
    const catalogPromise = loadCatalog()
    // New note: props take precedence over the courseId and entryDate query params.
    if (props.initialCourseId !== null && props.initialCourseId !== undefined) {
      selectedCourseId.value = props.initialCourseId
    } else if (route?.query?.courseId) {
      selectedCourseId.value = Number(route.query.courseId)
    }
    if (props.initialTitle) {
      title.value = props.initialTitle
    }
    if (props.initialDate) {
      entryDate.value = props.initialDate
    } else if (route?.query?.entryDate) {
      entryDate.value = String(route.query.entryDate)
    }
    await catalogPromise
    await nextTick()
    initialState.value = getCurrentState()
  }
  await checkArchivedCourse()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && window.visualViewport) {
    window.visualViewport.removeEventListener('resize', updateViewportHeight)
  }
})

defineExpose({ requestBack: handleBack })
</script>

<template>
  <div
    data-testid="note-editor-container"
    data-note-scrollport
    class="flex flex-col bg-app-bg font-sans text-text-main overflow-y-auto"
    :class="embedded ? 'h-full' : viewportHeight ? '' : 'h-dvh'"
    :style="!embedded && viewportHeight ? { height: `${viewportHeight}px` } : undefined"
  >
    <!-- Header Navigation & Save Action -->
    <DetailTopBar
      :title="isEditMode ? 'Note' : 'New note'"
      back-label="Back"
      :class="[controlsStaggerClass, 'sticky top-0 z-20']"
      @close="handleBack"
    >
      <template #trailing>
        <span
          v-if="isArchivedCourse"
          data-testid="archived-course-label"
          class="inline-flex min-h-11 items-center rounded-full border border-app-border bg-card px-4 text-xs font-bold uppercase tracking-wider text-text-muted"
        >
          Archived course
        </span>
        <div v-else class="flex items-center">
          <Popover v-if="isEditMode" v-model:open="isActionsMenuOpen">
            <PopoverTrigger as-child>
              <button
                type="button"
                data-testid="note-actions-trigger"
                aria-label="Note actions"
                class="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full p-2.5 text-text-main transition-all hover:bg-ghost/70 active:scale-95"
              >
                <EllipsisVertical class="h-6 w-6 stroke-[2.2]" aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" :side-offset="8" class="w-44 rounded-2xl p-1.5">
              <button
                type="button"
                data-testid="delete-note-action"
                class="flex h-11 w-full cursor-pointer items-center gap-2 rounded-xl px-3 text-left font-semibold text-destructive-hover transition-colors hover:bg-black/5"
                @click="openDeleteDialog"
              >
                <Trash2 class="h-4 w-4 shrink-0" aria-hidden="true" />
                <span class="min-w-0 flex-1 truncate">Delete note</span>
              </button>
            </PopoverContent>
          </Popover>
          <SaveButton
            data-testid="save-button"
            :saving="isSaving"
            :disabled="isSaveDisabled"
            @click="saveNote"
          />
        </div>
      </template>
    </DetailTopBar>

    <!-- Error Banner -->
    <div
      v-if="errorMessage"
      role="alert"
      data-testid="error-banner"
      class="shrink-0 mx-4 mt-3 flex items-center justify-between rounded-xl border border-destructive-line bg-destructive-soft p-3 text-xs text-destructive-bevel"
    >
      <div class="flex items-center gap-2">
        <AlertCircle class="size-4 shrink-0 text-destructive" />
        <span>{{ errorMessage }}</span>
      </div>
      <button
        type="button"
        class="shrink-0 min-h-11 -my-2 px-2 font-medium text-destructive-hover hover:underline cursor-pointer"
        @click="errorMessage = null"
      >
        Dismiss
      </button>
    </div>

    <!-- Note Metadata Section -->
    <section class="shrink-0 space-y-4 px-4 pt-3 pb-2" :class="contentStaggerClass">
      <!-- Title Input -->
      <div>
        <textarea
          v-model="title"
          data-testid="title-input"
          rows="1"
          placeholder="Untitled Note..."
          :readonly="isArchivedCourse"
          class="field-sizing-content w-full h-fit resize-none break-words bg-transparent !font-sans text-2xl font-bold leading-tight text-text-main placeholder:text-text-muted outline-none"
          @keydown.enter.prevent
        />
      </div>

      <!-- Plan zone -->
      <section class="mt-4 rounded-2xl bg-card p-1">
        <!-- Course row -->
        <div class="flex min-h-11 items-center gap-3 px-3" data-testid="course-pill">
          <GraduationCap class="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
          <span
            v-if="isArchivedCourse"
            data-testid="archived-course-chip"
            class="inline-flex max-w-[200px] items-center rounded-full border px-3 py-1 text-xs font-semibold"
            :style="archivedCourseBadgeStyle"
          >
            <span class="truncate">{{ archivedCourseName }}</span>
          </span>
          <CoursePicker
            v-else
            ref="coursePickerRef"
            id="course-picker-trigger"
            data-testid="course-picker-trigger"
            aria-label="Course"
            v-model="selectedCourseId"
            :courses="courses"
            :schedules="schedules"
          />
        </div>

        <div class="h-px bg-ghost" />

        <!-- Date row -->
        <div class="flex min-h-11 items-center gap-3 px-3" data-testid="date-pill">
          <CalendarIcon class="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
          <Popover v-model:open="isCalendarOpen">
            <PopoverTrigger as-child>
              <Button
                id="date-picker-trigger"
                type="button"
                variant="ghost"
                size="touch"
                data-testid="date-picker"
                aria-label="Date"
                :disabled="isArchivedCourse"
                class="min-w-0 flex-1 justify-start px-0 text-sm font-normal hover:bg-transparent"
                :class="entryDate ? 'text-text-main' : 'text-text-muted'"
              >
                {{ formattedDisplayDate }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <Calendar
                v-model="calendarDateValue"
                :min-value="minCalendarDate"
                :max-value="maxCalendarDate"
                initial-focus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div class="h-px bg-ghost" />

        <!-- Skip AI row -->
        <div class="flex min-h-11 items-center gap-3 px-3" data-testid="skip-ai-row">
          <Sparkles class="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
          <Label
            for="skip-ai-switch"
            class="flex min-h-11 cursor-pointer items-center text-sm font-normal text-text-main"
          >
            Skip AI processing
          </Label>
          <Popover>
            <PopoverTrigger as-child>
              <button
                type="button"
                data-testid="skip-ai-info"
                aria-label="About skipping AI processing"
                class="flex min-h-11 min-w-11 flex-1 cursor-pointer items-center justify-start text-text-muted transition-colors hover:text-text-main"
              >
                <Info class="h-4 w-4" aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" :side-offset="4" class="w-64 rounded-2xl p-3 text-xs">
              Nyare ignores this note when you process. Tasks, events, and context from earlier runs
              stay. Turn this off to include the note again.
            </PopoverContent>
          </Popover>
          <Switch
            id="skip-ai-switch"
            v-model="excludedFromAi"
            data-testid="skip-ai-switch"
            :disabled="isArchivedCourse"
          />
        </div>
      </section>
    </section>

    <!-- Teal Horizontal Divider Accent -->
    <div class="shrink-0 mx-4 my-2 h-px bg-primary/30" :class="contentStaggerClass" />

    <!-- Locked Editor Helper Prompt (when courseId is unassigned) -->
    <button
      v-if="!selectedCourseId"
      type="button"
      data-testid="course-gating-prompt"
      class="shrink-0 mx-4 my-2 flex items-center gap-2.5 rounded-xl border border-border-soft bg-ocean-soft px-3.5 py-2.5 text-left text-xs cursor-pointer transition-colors hover:bg-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      :class="contentStaggerClass"
      @click="openCoursePicker"
    >
      <GraduationCap class="size-4 shrink-0 text-primary-bevel" />
      <span class="leading-snug text-primary-deep">
        <span class="font-bold text-heading">Select a course to start writing.</span>
        Nyare files every note under a course.
      </span>
      <ArrowRight class="size-3.5 ml-auto shrink-0 text-primary-bevel/60" />
    </button>

    <!-- Editor Body Container -->
    <main class="flex-1 flex flex-col w-full pt-2 pb-0" :class="contentStaggerClass">
      <TiptapEditor
        class="flex-1 w-full"
        :toolbar-class="controlsStaggerClass"
        :model-value="htmlContent"
        :editable="!!selectedCourseId && !isArchivedCourse"
        :placeholder="
          selectedCourseId ? 'Write note content...' : 'Select a course to start writing'
        "
        @update:model-value="onEditorContentChange"
        @image-uploaded="onImageUploaded"
        @upload-error="onUploadError"
      >
        <template #status-bar>
          <div
            data-testid="editor-status-bar"
            class="shrink-0 flex items-center justify-between border-t border-app-border bg-card px-3 py-1.5 text-xs text-text-soft select-none"
          >
            <div class="flex items-center gap-1.5" data-testid="status-indicator-group">
              <span class="font-bold uppercase tracking-wider text-text-muted text-[10px]">
                Status:
              </span>
              <div
                data-testid="processing-status-badge"
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors"
                :class="statusConfig.classes"
              >
                <component :is="statusIcon" class="size-3" />
                <span>{{ statusConfig.label }}</span>
              </div>
            </div>

            <div data-testid="word-count" class="font-medium text-text-muted">
              {{ wordCountDisplay }}
            </div>
          </div>
        </template>
      </TiptapEditor>
    </main>

    <!-- Unsaved Changes Dialog -->
    <DialogShell v-model:open="isUnsavedDialogOpen" title="Discard Changes" @cancel="cancelDiscard">
      <p
        data-testid="unsaved-changes-dialog"
        class="mt-2 font-secondary text-sm text-text-muted"
      >
        You have unsaved changes in this note. Discard them and leave?
      </p>

      <template #actions="{ disabled, dismiss }">
        <Button
          type="button"
          variant="secondary"
          size="touch"
          data-testid="cancel-discard-button"
          :disabled="disabled"
          @click="dismiss"
        >
          Keep Editing
        </Button>
        <Button
          type="button"
          variant="tactile-destructive"
          size="touch"
          data-testid="confirm-discard-button"
          :disabled="disabled"
          @click="confirmDiscard"
        >
          Discard
        </Button>
      </template>
    </DialogShell>

    <!-- Delete Note Dialog -->
    <DialogShell v-model:open="isDeleteDialogOpen" title="Delete Note">
      <p
        data-testid="delete-note-dialog"
        class="mt-2 font-secondary text-sm text-text-muted"
      >
        Delete this note? You can undo the delete for a few seconds.
      </p>

      <template #actions="{ disabled, dismiss }">
        <Button
          type="button"
          variant="secondary"
          size="touch"
          data-testid="cancel-delete-button"
          :disabled="disabled"
          @click="dismiss"
        >
          Back
        </Button>
        <Button
          type="button"
          variant="tactile-destructive"
          size="touch"
          data-testid="confirm-delete-button"
          :disabled="disabled"
          @click="confirmDelete"
        >
          Delete
        </Button>
      </template>
    </DialogShell>
  </div>
</template>
