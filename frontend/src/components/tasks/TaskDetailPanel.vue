<script setup lang="ts">
// Task form and detail content. Create mode is active when taskId is null.
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarIcon, Clock, FileText, Trash2, X } from '@lucide/vue'
import { parseDate, type DateValue } from '@internationalized/date'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import DialogShell from '@/components/ui/DialogShell.vue'
import CoursePicker from '@/components/CoursePicker.vue'
import DetailTopBar from '@/components/DetailTopBar.vue'
import SaveButton from '@/components/SaveButton.vue'
import { ApiError } from '@/api'
import { useCatalog } from '@/composables/useCatalog'
import { useArchive } from '@/composables/useArchive'
import { useNotes } from '@/composables/useNotes'
import { useTasks } from '@/composables/useTasks'
import { minutesToDuration } from '@/utils/duration'
import { URGENCY_COLORS, formatDuration, getTaskUrgency } from '@/utils/taskUrgency'
import {
  formCanSave,
  formIsDirty,
  formSection,
  fromTask,
  toTaskRequest,
  type TaskFormState,
} from '@/utils/taskForm'
import type { PlanCategory, TaskResponse, TaskStatus } from '@/types/api'

interface Props {
  /** Task UUID in view mode. Null renders the create form. */
  taskId: string | null
  /** Reveals the identity and plan zones. */
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
  (e: 'deleted', task: TaskResponse): void
  (e: 'missing'): void
}>()

const route = useRoute()
const router = useRouter()
const { courses, schedules, loadCatalog } = useCatalog()
const archive = useArchive()
const { notes, loadNotes } = useNotes()
const { getTask, createTask, updateTask, updateTaskStatus, resetTasks } = useTasks()

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180] as const

const form = reactive<TaskFormState>({
  title: '',
  courseId: null,
  description: '',
  scheduledDate: '',
  durationMinutes: null,
})

const loadedTask = ref<TaskResponse | null>(null)
const saving = ref(false)
const deleteOpen = ref(false)
const errorMessage = ref<string | null>(null)

const isViewMode = computed(() => props.taskId !== null)
const done = computed(() => loadedTask.value?.status === 'COMPLETED')

/** True when the task's course is archived. The panel renders read-only. */
const isArchivedCourse = computed(() => archive.isArchived(loadedTask.value?.courseId))

const archivedCourseName = computed(
  () =>
    archive.archivedCourses.value.find((course) => course.id === loadedTask.value?.courseId)
      ?.name ?? `Course ${loadedTask.value?.courseId ?? ''}`,
)

const archivedCourseBadgeStyle = computed(() => {
  const badge = archive.courseColor(loadedTask.value?.courseId)
  return { backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }
})

/** The backend keeps `noteId` on the task after the note is deleted; the link shows only while the note still resolves in the notes cache. */
const sourceNoteId = computed(() => {
  const id = loadedTask.value?.noteId
  return id && notes.value.some((note) => note.id === id) ? id : null
})

/** Opens the source note in the global note overlay over this task panel. */
function openSourceNote(event: MouseEvent) {
  if (!router) {
    return
  }
  event.preventDefault()
  void router.replace({ query: { ...route?.query, note: sourceNoteId.value } })
}

const dirty = computed(() => formIsDirty(form, loadedTask.value))
const canSave = computed(() => formCanSave(form))
const titleError = computed(() =>
  dirty.value && form.title.trim().length === 0 ? 'Add a title to save this task.' : null,
)
const courseError = computed(() =>
  dirty.value && form.courseId === null ? 'Choose a course to save this task.' : null,
)
const section = computed<PlanCategory>(() => formSection(form))
const sectionLabel = computed(() => {
  if (section.value === 'SCHEDULED') return 'Scheduled'
  if (section.value === 'LATER') return 'Later'
  return 'Backlog'
})

const dateIconColor = computed(() => URGENCY_COLORS[getTaskUrgency(form.scheduledDate || null)])

const isDatePickerOpen = ref(false)

const calendarDate = computed<DateValue | undefined>({
  get: () => {
    if (!form.scheduledDate) {
      return undefined
    }
    try {
      return parseDate(form.scheduledDate)
    } catch {
      return undefined
    }
  },
  set: (value) => {
    form.scheduledDate = value ? value.toString() : ''
    if (value) {
      isDatePickerOpen.value = false
    }
  },
})

const formattedScheduledDate = computed(() => {
  if (!form.scheduledDate) {
    return 'Add date'
  }
  const [year, month, day] = form.scheduledDate.split('-').map(Number)
  if (year && month && day) {
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  return form.scheduledDate
})

function onDurationChange(value?: unknown) {
  if (value === '' || value === null || value === undefined) {
    form.durationMinutes = null
    return
  }
  const parsed = Number(value)
  form.durationMinutes = Number.isNaN(parsed) ? null : parsed
}

function staggeredClass(shown: boolean): string {
  return `transition-[opacity,transform] ${shown ? 'opacity-100 translate-y-0 duration-200' : 'opacity-0 translate-y-2 duration-[80ms]'}`
}

const contentStaggerClass = computed(() => staggeredClass(props.showContent))
const controlsStaggerClass = computed(() => staggeredClass(props.showControls))

function applyTask(task: TaskResponse) {
  loadedTask.value = task
  Object.assign(form, fromTask(task))
}

async function resolveTask() {
  if (!props.taskId) {
    return
  }
  try {
    // The archive check is best-effort: a failed catalog or archive load leaves the panel writable.
    const [task] = await Promise.all([getTask(props.taskId), loadCatalog().catch(() => {})])
    if (!courses.value.some((course) => course.id === task.courseId)) {
      await archive.loadArchive().catch(() => {})
    }
    applyTask(task)
    // `getTask` upserts into the shared list cache, which holds active tasks
    // only. An archived course's task must leave it so TodoView cannot render
    // a read-only row as editable.
    if (archive.isArchived(task.courseId)) {
      resetTasks()
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      emit('missing')
      return
    }
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load task'
  }
}

async function toggleDone(next: boolean | 'indeterminate') {
  if (!props.taskId || !loadedTask.value || isArchivedCourse.value) {
    return
  }
  const previous = loadedTask.value.status
  const nextStatus: TaskStatus = next === true ? 'COMPLETED' : 'TODO'
  loadedTask.value = { ...loadedTask.value, status: nextStatus }
  try {
    loadedTask.value = await updateTaskStatus(props.taskId, nextStatus)
  } catch {
    if (loadedTask.value) {
      loadedTask.value = { ...loadedTask.value, status: previous }
    }
  }
}

async function handleSave() {
  if (saving.value || !dirty.value || !canSave.value || isArchivedCourse.value) {
    return
  }

  saving.value = true
  errorMessage.value = null
  try {
    if (props.taskId === null) {
      await createTask(toTaskRequest(form, 'TODO'))
      emit('close')
      return
    }
    const updated = await updateTask(
      props.taskId,
      toTaskRequest(form, loadedTask.value?.status ?? 'TODO'),
    )
    applyTask(updated)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to save task'
  } finally {
    saving.value = false
  }
}

/** Emits the task so the caller can defer the API delete behind an undo toast. */
function confirmDelete() {
  const task = loadedTask.value
  if (!props.taskId || !task || isArchivedCourse.value) {
    return
  }
  deleteOpen.value = false
  emit('deleted', task)
}

function handleRetry() {
  void handleSave()
}

onMounted(() => {
  void loadCatalog()
  void loadNotes()
  void resolveTask()
})
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden bg-app-bg text-heading">
    <!-- Header bar: close left, title center, save right -->
    <DetailTopBar
      :title="isViewMode ? 'Task' : 'New task'"
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
          data-testid="task-save"
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
          <div
            v-if="isViewMode && !isArchivedCourse"
            class="flex h-11 w-11 shrink-0 items-start justify-center pt-1.5"
          >
            <Checkbox
              data-testid="task-complete"
              :model-value="done"
              aria-label="Mark task as completed"
              @update:model-value="toggleDone"
            />
          </div>
          <Textarea
            v-model="form.title"
            data-testid="task-title"
            :readonly="isArchivedCourse"
            aria-label="Task title"
            rows="1"
            placeholder="Task title"
            class="min-h-0 min-w-0 flex-1 resize-none rounded-none border-0 bg-transparent px-0 py-0 font-sans text-2xl font-bold text-heading shadow-none placeholder:text-text-muted outline-none focus-visible:border-0 focus-visible:ring-0 md:text-2xl"
          />
        </div>
        <p
          v-if="titleError"
          data-testid="task-title-error"
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
              data-testid="task-course-chip"
              empty-label="Required"
              aria-label="Course"
            />
          </template>
          <template v-else>
            <CoursePicker
              v-model="form.courseId"
              :courses="courses"
              :schedules="schedules"
              data-testid="task-course"
              aria-label="Course"
            />
            <p
              v-if="courses.length === 0"
              data-testid="task-course-required"
              class="text-xs font-semibold text-warn"
            >
              A course is required. Create a course first.
            </p>
            <p
              v-if="courseError"
              data-testid="task-course-error"
              class="mt-1 text-xs font-semibold text-destructive"
            >
              {{ courseError }}
            </p>
          </template>
        </div>
      </section>

      <!-- Plan zone -->
      <section class="mt-4 rounded-2xl bg-card p-1" :class="contentStaggerClass">
        <div class="flex min-h-11 items-center gap-3 px-3">
          <CalendarIcon
            class="h-5 w-5 shrink-0"
            :style="{ color: dateIconColor }"
            aria-hidden="true"
          />
          <Popover v-model:open="isDatePickerOpen">
            <PopoverTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="touch"
                data-testid="task-date"
                aria-label="Scheduled date"
                :disabled="isArchivedCourse"
                class="min-w-0 flex-1 justify-start px-0 text-sm font-normal hover:bg-transparent"
                :class="form.scheduledDate ? 'text-text-main' : 'text-text-muted'"
              >
                {{ formattedScheduledDate }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <Calendar v-model="calendarDate" initial-focus />
            </PopoverContent>
          </Popover>
          <Button
            v-if="form.scheduledDate && !isArchivedCourse"
            type="button"
            variant="ghost"
            size="icon-touch"
            data-testid="task-date-clear"
            aria-label="Clear date"
            class="rounded-full text-text-muted"
            @click="form.scheduledDate = ''"
          >
            <X class="size-4" />
          </Button>
        </div>

        <div class="h-px bg-ghost" />

        <div class="flex min-h-11 items-center gap-3 px-3">
          <Clock class="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
          <NativeSelect
            data-testid="task-duration"
            aria-label="Duration"
            class="min-w-0 flex-1"
            :disabled="isArchivedCourse"
            :model-value="form.durationMinutes ?? ''"
            @update:model-value="onDurationChange"
          >
            <NativeSelectOption value="">Not set</NativeSelectOption>
            <NativeSelectOption v-for="preset in DURATION_PRESETS" :key="preset" :value="preset">
              {{ formatDuration(minutesToDuration(preset)) }}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <div class="h-px bg-ghost" />

        <div class="flex min-h-11 items-center gap-3 px-3">
          <span class="text-sm text-text-muted">Plan</span>
          <span
            data-testid="task-section"
            :aria-label="`Plan section: ${sectionLabel}`"
            class="ml-auto rounded-full bg-ocean-soft px-3 py-1 text-xs font-bold text-primary-bevel"
          >
            {{ sectionLabel }}
          </span>
        </div>
      </section>

      <!-- Description zone -->
      <section class="mt-4 rounded-2xl bg-card p-3" :class="controlsStaggerClass">
        <label
          for="task-description"
          class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted"
        >
          Description
        </label>
        <Textarea
          id="task-description"
          v-model="form.description"
          data-testid="task-description"
          aria-label="Task description"
          :readonly="isArchivedCourse"
          rows="3"
          placeholder="Add details"
          class="min-h-0 w-full resize-none rounded-none border-0 bg-transparent px-0 py-0 text-sm text-text-main shadow-none placeholder:text-text-muted outline-none focus-visible:border-0 focus-visible:ring-0"
        />
      </section>

      <!-- Source zone: only when the task came from a note -->
      <a
        v-if="sourceNoteId"
        :href="`?note=${sourceNoteId}`"
        data-testid="task-source-note"
        class="mt-4 flex min-h-11 items-center gap-3 rounded-2xl bg-card px-3 text-sm font-semibold text-text-main"
        :class="controlsStaggerClass"
        @click="openSourceNote"
      >
        <FileText class="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
        <span>From a note</span>
      </a>

      <!-- Danger zone: delete the task (view mode only) -->
      <Button
        v-if="isViewMode && !isArchivedCourse"
        type="button"
        variant="tactile-destructive"
        size="touch"
        data-testid="task-delete"
        class="mt-4 w-full"
        :class="controlsStaggerClass"
        @click="deleteOpen = true"
      >
        <Trash2 class="size-5" aria-hidden="true" />
        Delete task
      </Button>

      <!-- Request failure -->
      <Alert
        v-if="errorMessage"
        variant="destructive"
        data-testid="task-error"
        class="mt-4 rounded-xl border-destructive-line bg-destructive-soft p-3 text-xs text-destructive-bevel"
      >
        <AlertDescription class="flex items-center justify-between text-xs text-destructive-bevel">
          <span>{{ errorMessage }}</span>
          <Button
            type="button"
            variant="link"
            size="touch"
            data-testid="task-error-retry"
            class="font-bold text-destructive-hover"
            @click="handleRetry"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </main>

    <DialogShell v-model:open="deleteOpen" title="Delete Task">
      <p class="mt-2 font-secondary text-sm text-text-muted">
        Are you sure you want to delete this task?
      </p>
      <p class="mt-3 font-sans text-sm font-semibold text-text-main">
        {{ form.title }}
      </p>

      <template #actions="{ disabled, dismiss }">
        <Button
          type="button"
          variant="secondary"
          size="touch"
          data-testid="task-delete-cancel"
          :disabled="disabled"
          @click="dismiss"
        >
          Cancel
        </Button>

        <Button
          type="button"
          variant="tactile-destructive"
          size="touch"
          data-testid="task-delete-confirm"
          :disabled="disabled"
          @click="confirmDelete"
        >
          CONFIRM
        </Button>
      </template>
    </DialogShell>
  </div>
</template>
