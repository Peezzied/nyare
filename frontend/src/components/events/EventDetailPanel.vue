<script setup lang="ts">
// Event form and detail content. Create mode is active when eventId is null.
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarIcon, Clock, FileText, Trash2, X } from '@lucide/vue'
import { parseDate, type DateValue } from '@internationalized/date'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import DialogShell from '@/components/ui/DialogShell.vue'
import CoursePicker from '@/components/CoursePicker.vue'
import DetailTopBar from '@/components/DetailTopBar.vue'
import SaveButton from '@/components/SaveButton.vue'
import { ApiError } from '@/api'
import { useCatalog } from '@/composables/useCatalog'
import { useArchive } from '@/composables/useArchive'
import { useNotes } from '@/composables/useNotes'
import { useAcademicEvents } from '@/composables/useAcademicEvents'
import {
  DEFAULT_DEADLINE_TIME,
  formCanSave,
  formIsDirty,
  fromEvent,
  toEventRequest,
  type EventFormState,
} from '@/utils/eventForm'
import type { AcademicEventResponse } from '@/types/api'

interface Props {
  /** Event UUID in view mode. Null renders the create form. */
  eventId: string | null
  /** Reveals the identity and deadline zones. */
  showContent?: boolean
  /** Reveals the save action and description zone. */
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showContent: true,
  showControls: true,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'deleted', event: AcademicEventResponse): void
  (e: 'missing'): void
}>()

const route = useRoute()
const router = useRouter()
const { courses, schedules, loadCatalog } = useCatalog()
const archive = useArchive()
const { notes, loadNotes } = useNotes()
const { getEvent, createEvent, updateEvent, resetEvents } = useAcademicEvents()

const form = reactive<EventFormState>({
  title: '',
  courseId: null,
  description: '',
  deadlineDate: '',
  deadlineTime: DEFAULT_DEADLINE_TIME,
})

const loadedEvent = ref<AcademicEventResponse | null>(null)
const saving = ref(false)
const deleteOpen = ref(false)
const errorMessage = ref<string | null>(null)

const isViewMode = computed(() => props.eventId !== null)

/** True when the event's course is archived. The panel renders read-only. */
const isArchivedCourse = computed(() => archive.isArchived(loadedEvent.value?.courseId))

const archivedCourseName = computed(
  () =>
    archive.archivedCourses.value.find((course) => course.id === loadedEvent.value?.courseId)
      ?.name ?? `Course ${loadedEvent.value?.courseId ?? ''}`,
)

const archivedCourseBadgeStyle = computed(() => {
  const badge = archive.courseColor(loadedEvent.value?.courseId)
  return { backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }
})

/** The backend keeps `noteId` on the event after the note is deleted; the link shows only while the note still resolves in the notes cache. */
const sourceNoteId = computed(() => {
  const id = loadedEvent.value?.noteId
  return id && notes.value.some((note) => note.id === id) ? id : null
})

/** Opens the source note in the global note overlay over this event panel. */
function openSourceNote(event: MouseEvent) {
  if (!router) {
    return
  }
  event.preventDefault()
  void router.replace({ query: { ...route?.query, note: sourceNoteId.value } })
}

const dirty = computed(() => formIsDirty(form, loadedEvent.value))
const canSave = computed(() => formCanSave(form))
const titleError = computed(() =>
  dirty.value && form.title.trim().length === 0 ? 'Add a title to save this event.' : null,
)
const courseError = computed(() =>
  dirty.value && form.courseId === null ? 'Choose a course to save this event.' : null,
)

const isDatePickerOpen = ref(false)

const calendarDate = computed<DateValue | undefined>({
  get: () => {
    if (!form.deadlineDate) {
      return undefined
    }
    try {
      return parseDate(form.deadlineDate)
    } catch {
      return undefined
    }
  },
  set: (value) => {
    form.deadlineDate = value ? value.toString() : ''
    if (value) {
      isDatePickerOpen.value = false
    }
  },
})

const formattedDeadlineDate = computed(() => {
  if (!form.deadlineDate) {
    return 'Add date'
  }
  const [year, month, day] = form.deadlineDate.split('-').map(Number)
  if (year && month && day) {
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  return form.deadlineDate
})

function staggeredClass(shown: boolean): string {
  return `transition-[opacity,transform] ${shown ? 'opacity-100 translate-y-0 duration-200' : 'opacity-0 translate-y-2 duration-[80ms]'}`
}

const contentStaggerClass = computed(() => staggeredClass(props.showContent))
const controlsStaggerClass = computed(() => staggeredClass(props.showControls))

function applyEvent(event: AcademicEventResponse) {
  loadedEvent.value = event
  Object.assign(form, fromEvent(event))
}

async function resolveEvent() {
  if (!props.eventId) {
    return
  }
  try {
    // The archive check is best-effort: a failed catalog or archive load leaves the panel writable.
    const [event] = await Promise.all([getEvent(props.eventId), loadCatalog().catch(() => {})])
    if (!courses.value.some((course) => course.id === event.courseId)) {
      await archive.loadArchive().catch(() => {})
    }
    applyEvent(event)
    // `getEvent` upserts into the shared list cache, which holds active events
    // only. An archived course's event must leave it so list views cannot
    // render a read-only row as editable.
    if (archive.isArchived(event.courseId)) {
      resetEvents()
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      emit('missing')
      return
    }
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load event'
  }
}

async function handleSave() {
  if (saving.value || !dirty.value || !canSave.value || isArchivedCourse.value) {
    return
  }

  saving.value = true
  errorMessage.value = null
  try {
    if (props.eventId === null) {
      await createEvent(toEventRequest(form))
      emit('close')
      return
    }
    const updated = await updateEvent(
      props.eventId,
      toEventRequest(form, loadedEvent.value?.noteId),
    )
    applyEvent(updated)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to save event'
  } finally {
    saving.value = false
  }
}

/** Emits the event so the caller can defer the API delete behind an undo toast. */
function confirmDelete() {
  const event = loadedEvent.value
  if (!props.eventId || !event || isArchivedCourse.value) {
    return
  }
  deleteOpen.value = false
  emit('deleted', event)
}

function handleRetry() {
  void handleSave()
}

onMounted(() => {
  void loadCatalog()
  void loadNotes()
  void resolveEvent()
})
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden bg-app-bg text-heading">
    <!-- Header bar: close left, title center, save right -->
    <DetailTopBar
      :title="isViewMode ? 'Event' : 'New event'"
      back-label="Close"
      :class="contentStaggerClass"
      @close="emit('close')"
    >
      <template #trailing>
        <span
          v-if="isArchivedCourse"
          data-testid="archived-course-label"
          class="inline-flex min-h-11 items-center rounded-full border border-app-border bg-card px-4 text-xs font-bold uppercase tracking-wider text-text-muted"
        >
          Archived course
        </span>
        <SaveButton
          v-else
          data-testid="event-save"
          :saving="saving"
          :disabled="saving || !dirty || !canSave"
          :class="controlsStaggerClass"
          @click="handleSave"
        />
      </template>
    </DetailTopBar>

    <main class="flex-1 overflow-y-auto px-4 py-4">
      <!-- Identity zone -->
      <section :class="contentStaggerClass">
        <div class="flex items-start gap-2">
          <Textarea
            v-model="form.title"
            data-testid="event-title"
            :readonly="isArchivedCourse"
            aria-label="Event title"
            rows="1"
            placeholder="Event title"
            class="min-h-0 min-w-0 flex-1 resize-none rounded-none border-0 bg-transparent px-0 py-0 font-sans text-2xl font-bold text-heading shadow-none placeholder:text-text-muted outline-none focus-visible:border-0 focus-visible:ring-0 md:text-2xl"
          />
        </div>
        <p
          v-if="titleError"
          data-testid="event-title-error"
          class="mt-1 text-xs font-semibold text-destructive"
        >
          {{ titleError }}
        </p>

        <div class="mt-2">
          <template v-if="isViewMode">
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
              v-model="form.courseId"
              :courses="courses"
              :schedules="schedules"
              data-testid="event-course-chip"
              empty-label="Required"
              aria-label="Course"
            />
          </template>
          <template v-else>
            <CoursePicker
              v-model="form.courseId"
              :courses="courses"
              :schedules="schedules"
              data-testid="event-course"
              aria-label="Course"
            />
            <p
              v-if="courses.length === 0"
              data-testid="event-course-required"
              class="text-xs font-semibold text-warn"
            >
              A course is required. Create a course first.
            </p>
            <p
              v-if="courseError"
              data-testid="event-course-error"
              class="mt-1 text-xs font-semibold text-destructive"
            >
              {{ courseError }}
            </p>
          </template>
        </div>
      </section>

      <!-- Deadline zone -->
      <section class="mt-4 rounded-2xl bg-card p-1" :class="contentStaggerClass">
        <div class="flex min-h-11 items-center gap-3 px-3">
          <CalendarIcon class="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
          <Popover v-model:open="isDatePickerOpen">
            <PopoverTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="touch"
                data-testid="event-date"
                aria-label="Deadline date"
                :disabled="isArchivedCourse"
                class="min-w-0 flex-1 justify-start px-0 text-sm font-normal hover:bg-transparent"
                :class="form.deadlineDate ? 'text-text-main' : 'text-text-muted'"
              >
                {{ formattedDeadlineDate }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <Calendar v-model="calendarDate" initial-focus />
            </PopoverContent>
          </Popover>
          <Button
            v-if="form.deadlineDate && !isArchivedCourse"
            type="button"
            variant="ghost"
            size="icon-touch"
            data-testid="event-date-clear"
            aria-label="Clear date"
            class="rounded-full text-text-muted"
            @click="form.deadlineDate = ''"
          >
            <X class="size-4" />
          </Button>
        </div>

        <div class="h-px bg-ghost" />

        <div class="flex min-h-11 items-center gap-3 px-3">
          <Clock class="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
          <Input
            v-model="form.deadlineTime"
            type="time"
            data-testid="event-time"
            aria-label="Deadline time"
            :disabled="isArchivedCourse"
            class="w-fit"
          />
        </div>
      </section>

      <!-- Description zone -->
      <section class="mt-4 rounded-2xl bg-card p-3" :class="controlsStaggerClass">
        <label
          for="event-description"
          class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted"
        >
          Description
        </label>
        <Textarea
          id="event-description"
          v-model="form.description"
          data-testid="event-description"
          aria-label="Event description"
          :readonly="isArchivedCourse"
          rows="3"
          placeholder="Add details"
          class="min-h-0 w-full resize-none rounded-none border-0 bg-transparent px-0 py-0 text-sm text-text-main shadow-none placeholder:text-text-muted outline-none focus-visible:border-0 focus-visible:ring-0"
        />
      </section>

      <!-- Source zone: only when the event came from a note -->
      <a
        v-if="sourceNoteId"
        :href="`?note=${sourceNoteId}`"
        data-testid="event-source-note"
        class="mt-4 flex min-h-11 items-center gap-3 rounded-2xl bg-card px-3 text-sm font-semibold text-text-main"
        :class="controlsStaggerClass"
        @click="openSourceNote"
      >
        <FileText class="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
        <span>From a note</span>
      </a>

      <!-- Danger zone: delete the event (view mode only) -->
      <Button
        v-if="isViewMode && !isArchivedCourse"
        type="button"
        variant="tactile-destructive"
        size="touch"
        data-testid="event-delete"
        class="mt-4 w-full"
        :class="controlsStaggerClass"
        @click="deleteOpen = true"
      >
        <Trash2 class="size-5" aria-hidden="true" />
        Delete event
      </Button>

      <!-- Request failure -->
      <Alert
        v-if="errorMessage"
        variant="destructive"
        data-testid="event-error"
        class="mt-4 rounded-xl border-destructive-line bg-destructive-soft p-3 text-xs text-destructive-bevel"
      >
        <AlertDescription class="flex items-center justify-between text-xs text-destructive-bevel">
          <span>{{ errorMessage }}</span>
          <Button
            type="button"
            variant="link"
            size="touch"
            data-testid="event-error-retry"
            class="font-bold text-destructive-hover"
            @click="handleRetry"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </main>

    <DialogShell v-model:open="deleteOpen" title="Delete Event">
      <p class="mt-2 font-secondary text-sm text-text-muted">
        Are you sure you want to delete this event?
      </p>
      <p class="mt-3 font-sans text-sm font-semibold text-text-main">
        {{ form.title }}
      </p>

      <template #actions="{ disabled, dismiss }">
        <Button
          type="button"
          variant="secondary"
          size="touch"
          data-testid="event-delete-cancel"
          :disabled="disabled"
          @click="dismiss"
        >
          Cancel
        </Button>

        <Button
          type="button"
          variant="tactile-destructive"
          size="touch"
          data-testid="event-delete-confirm"
          :disabled="disabled"
          @click="confirmDelete"
        >
          CONFIRM
        </Button>
      </template>
    </DialogShell>
  </div>
</template>
