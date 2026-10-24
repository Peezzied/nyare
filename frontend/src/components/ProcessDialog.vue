<script setup lang="ts">
// Process run dialog for the floating Duckota trigger.
// It opens on the pending-note details, starts the run on confirm, keeps
// the streamed progress visible, then summarizes the run. A Show more
// toggle lists the processed notes, created tasks, and created events.
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import DialogShell from '@/components/ui/DialogShell.vue'
import { resetProcess } from '@/composables/useProcess'
import type { UseProcess } from '@/composables/useProcess'
import type { ProcessNotification } from '@/composables/useNotifications'
import { useAcademicEvents } from '@/composables/useAcademicEvents'
import { usePlannerStatus } from '@/composables/usePlannerStatus'
import { useTasks } from '@/composables/useTasks'
import { useCatalog } from '@/composables/useCatalog'
import { formatEntryDate } from '@/utils/noteDate'
import { formatDuration } from '@/utils/taskUrgency'
import type { TaskResponse } from '@/types/api'

const props = withDefaults(
  defineProps<{
    open?: boolean
    /** Shared run state from AppShell. Its `onDone` and `onSavedAfterCancel` hooks stay wired. */
    proc: UseProcess
    /** Set when reopening from a notification so the terminal run state stays. */
    preserveRun?: boolean
    /** A finished record tapped in the center. Overrides proc-derived terminal phases. */
    record?: ProcessNotification | null
  }>(),
  { open: false, preserveRun: false, record: null },
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  /** Fires when the user minimizes a live run to the notification center. */
  (e: 'keep-running', event: MouseEvent): void
}>()

const planner = usePlannerStatus()
const taskStore = useTasks()
const eventStore = useAcademicEvents()
const catalog = useCatalog()

const {
  running,
  status: runStatus,
  progress,
  summary,
  error,
  cancelled,
  savedAfterCancel,
} = props.proc

const showMore = ref(false)

type Phase = 'confirm' | 'running' | 'done' | 'cancelled' | 'error'

const phase = computed<Phase>(() => {
  const record = props.record
  if (record) {
    if (record.status === 'done') {
      return 'done'
    }
    if (record.status === 'error') {
      return 'error'
    }
    // cancelled, saved-after-cancel, or a stale running record: the backend
    // cancels a disconnected run at the next checkpoint.
    return 'cancelled'
  }
  if (running.value) {
    return 'running'
  }
  if (summary.value) {
    return 'done'
  }
  if (error.value) {
    return 'error'
  }
  if (cancelled.value || savedAfterCancel.value) {
    return 'cancelled'
  }
  return 'confirm'
})

const title = computed(() => {
  switch (phase.value) {
    case 'running':
      return 'Processing notes'
    case 'done':
      return 'Process complete'
    case 'cancelled':
      return 'Process stopped'
    case 'error':
      return 'Process failed'
    default:
      return 'Process pending notes?'
  }
})

const pendingStatus = computed(() => planner.status.value)
const pendingCount = computed(() => pendingStatus.value?.dirtyNoteCount ?? 0)
const pendingCourses = computed(() => (pendingStatus.value?.courseNames ?? []).join(', '))
const pendingDates = computed(() =>
  (pendingStatus.value?.dirtyDates ?? []).map(formatEntryDate).join(', '),
)

// A tapped record supplies its own summary, error, and note list; a live
// run falls back to the proc refs.
const runSummary = computed(() => props.record?.summary ?? summary.value)
const runError = computed(() => props.record?.error ?? error.value)
const savedRun = computed(
  () => props.record?.status === 'saved-after-cancel' || savedAfterCancel.value,
)
const processedNotes = computed(
  () => props.record?.pendingNotes ?? runStatus.value?.pendingNotes ?? [],
)
const processedIds = computed(() => new Set(processedNotes.value.map((n) => n.id)))

// Process links each created task and event to its source note, so the
// run's items are the cached records whose noteId a processed note owns.
const createdTasks = computed(() =>
  taskStore.tasks.value.filter((t) => t.noteId && processedIds.value.has(t.noteId)),
)
const createdEvents = computed(() =>
  eventStore.events.value.filter((e) => e.noteId && processedIds.value.has(e.noteId)),
)

function formatDeadline(deadline: string): string {
  const [datePart, timePart] = deadline.split('T')
  const date = formatEntryDate(datePart)
  const time = (timePart ?? '').slice(0, 5)
  return time ? `${date} · ${time}` : date
}

function taskMeta(task: TaskResponse): string {
  if (task.scheduledDate) {
    return formatEntryDate(task.scheduledDate)
  }
  return formatDuration(task.duration)
}

function confirm(): void {
  void props.proc.start()
}

function cancelRun(): void {
  props.proc.cancel()
}

function keepRunning(event: MouseEvent, dismiss: () => void): void {
  emit('keep-running', event)
  dismiss()
}

watch(
  () => props.open,
  (opened) => {
    if (!opened) {
      return
    }
    // A finished or failed run leaves module state behind, so reset it
    // before the dialog asks for the next confirmation. A run still in
    // flight keeps its state, so the dialog reopens on live progress.
    // A reopen from the notification center preserves terminal state too,
    // so the tapped record shows its summary or failure, not confirm.
    if (!running.value && !props.preserveRun) {
      resetProcess()
    }
    showMore.value = false
    void planner.refresh().catch(() => {})
  },
  { immediate: true },
)
</script>

<template>
  <DialogShell :open="open" :title="title" @update:open="emit('update:open', $event)">
    <div v-if="phase === 'confirm'" class="mt-2">
      <p class="font-secondary text-sm text-text-muted">
        Duckota reads the pending journal notes and updates the study plan.
      </p>
      <dl v-if="pendingCount > 0" class="mt-3 space-y-2 font-secondary text-sm">
        <div class="flex gap-2">
          <dt class="font-semibold text-text-main">Notes</dt>
          <dd class="text-text-muted">{{ pendingCount }}</dd>
        </div>
        <div v-if="pendingCourses" class="flex gap-2">
          <dt class="font-semibold text-text-main">Courses</dt>
          <dd class="text-text-muted">{{ pendingCourses }}</dd>
        </div>
        <div v-if="pendingDates" class="flex gap-2">
          <dt class="font-semibold text-text-main">Dates</dt>
          <dd class="text-text-muted">{{ pendingDates }}</dd>
        </div>
      </dl>
      <p v-else class="mt-3 font-secondary text-sm text-text-muted">
        No notes wait for processing.
      </p>
    </div>

    <div v-else-if="phase === 'running'" class="mt-2">
      <p v-if="cancelled" class="font-secondary text-sm text-text-main">
        Stopping after the current step…
      </p>
      <p v-else-if="progress" class="font-secondary text-sm text-text-main">
        Reading notes for {{ formatEntryDate(progress.date) }} — {{ progress.index }} of
        {{ progress.total }}.
      </p>
      <p v-else class="font-secondary text-sm text-text-main">
        Starting…
      </p>
      <p class="mt-1 font-secondary text-sm text-text-muted">
        Duckota extracts tasks, events, and context.
      </p>
    </div>

    <div v-else-if="phase === 'done'" class="mt-2">
      <p class="font-secondary text-sm text-text-muted">
        Duckota processed {{ processedNotes.length }} notes and created
        {{ runSummary?.tasksCreated ?? 0 }} tasks<template
          v-if="(runSummary?.tasksPromoted ?? 0) > 0"
        >
          ({{ runSummary?.tasksPromoted }} promoted)</template
        >, {{ runSummary?.eventsCreated ?? 0 }} events, and
        {{ runSummary?.contextsCreated ?? 0 }} context items.
      </p>
      <p
        v-if="runError"
        role="alert"
        class="mt-2 font-secondary text-sm font-medium text-destructive"
      >
        {{ runError }}
      </p>

      <div
        v-if="showMore"
        data-testid="process-details"
        class="mt-3 max-h-56 space-y-3 overflow-y-auto border-t border-app-border pt-3"
      >
        <section>
          <h3 class="font-sans text-xs font-semibold tracking-wide text-text-muted uppercase">
            Notes
          </h3>
          <ul class="mt-1 space-y-1">
            <li
              v-for="note in processedNotes"
              :key="note.id"
              class="font-secondary text-sm text-text-main"
            >
              {{ note.title || 'Untitled note' }}
              <span class="text-text-muted">
                · {{ note.courseName }} · {{ formatEntryDate(note.entryDate) }}
              </span>
            </li>
            <li
              v-if="!processedNotes.length"
              class="font-secondary text-sm text-text-muted"
            >
              No notes processed.
            </li>
          </ul>
        </section>

        <section>
          <h3 class="font-sans text-xs font-semibold tracking-wide text-text-muted uppercase">
            Tasks
          </h3>
          <ul class="mt-1 space-y-1">
            <li
              v-for="task in createdTasks"
              :key="task.id"
              class="flex items-center gap-2 font-secondary text-sm text-text-main"
            >
              <span
                class="h-3 w-3 shrink-0 rounded-full border border-white/60 shadow-sm"
                :style="{ backgroundColor: catalog.courseColor(task.courseId).solid }"
                aria-hidden="true"
              />
              <span>{{ task.title }}</span>
              <span v-if="taskMeta(task)" class="text-text-muted">{{ taskMeta(task) }}</span>
            </li>
            <li
              v-if="!createdTasks.length"
              class="font-secondary text-sm text-text-muted"
            >
              No new tasks.
            </li>
          </ul>
        </section>

        <section>
          <h3 class="font-sans text-xs font-semibold tracking-wide text-text-muted uppercase">
            Events
          </h3>
          <ul class="mt-1 space-y-1">
            <li
              v-for="event in createdEvents"
              :key="event.id"
              class="flex items-center gap-2 font-secondary text-sm text-text-main"
            >
              <span
                class="h-3 w-3 shrink-0 rounded-full border border-white/60 shadow-sm"
                :style="{ backgroundColor: catalog.courseColor(event.courseId).solid }"
                aria-hidden="true"
              />
              <span>{{ event.title }}</span>
              <span class="text-text-muted">{{ formatDeadline(event.deadline) }}</span>
            </li>
            <li
              v-if="!createdEvents.length"
              class="font-secondary text-sm text-text-muted"
            >
              No new events.
            </li>
          </ul>
        </section>
      </div>
    </div>

    <div v-else-if="phase === 'cancelled'" class="mt-2">
      <p v-if="savedRun" class="font-secondary text-sm text-text-muted">
        The run saved its changes before Duckota stopped.
      </p>
      <p v-else class="font-secondary text-sm text-text-muted">
        Duckota stopped the run. Pending notes stay unprocessed.
      </p>
    </div>

    <div v-else class="mt-2">
      <p role="alert" class="font-secondary text-sm font-medium text-destructive">
        {{ runError }}
      </p>
    </div>

    <template #actions="{ dismiss }">
      <template v-if="phase === 'confirm'">
        <Button type="button" variant="tactile-secondary" size="touch" @click="dismiss">
          Back
        </Button>
        <Button
          type="button"
          data-testid="process-confirm"
          variant="tactile"
          size="touch"
          class="px-5"
          :disabled="!pendingCount"
          @click="confirm"
        >
          Process
        </Button>
      </template>

      <template v-else-if="phase === 'running'">
        <Button
          type="button"
          data-testid="process-cancel"
          variant="tactile-secondary"
          size="touch"
          :disabled="cancelled"
          @click="cancelRun"
        >
          Cancel run
        </Button>
        <Button
          type="button"
          data-testid="process-minimize"
          variant="tactile"
          size="touch"
          class="px-5"
          @click="keepRunning($event, dismiss)"
        >
          Keep running
        </Button>
      </template>

      <template v-else-if="phase === 'done'">
        <Button
          type="button"
          data-testid="process-show-more"
          variant="tactile-secondary"
          size="touch"
          @click="showMore = !showMore"
        >
          {{ showMore ? 'Show less' : 'Show more' }}
        </Button>
        <Button
          type="button"
          data-testid="process-close"
          variant="tactile"
          size="touch"
          class="px-5"
          @click="dismiss"
        >
          Done
        </Button>
      </template>

      <Button
        v-else
        type="button"
        data-testid="process-close"
        variant="tactile"
        size="touch"
        class="px-5"
        @click="dismiss"
      >
        Close
      </Button>
    </template>
  </DialogShell>
</template>
