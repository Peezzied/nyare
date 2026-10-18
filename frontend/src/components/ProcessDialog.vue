<script setup lang="ts">
// Process run dialog for the floating Duckota trigger.
// It opens on the pending-note details, starts the run on confirm, keeps
// the streamed progress visible, then summarizes the run. A Show more
// toggle lists the processed notes, created tasks, and created events.
import { computed, ref, watch } from 'vue'
import DialogShell from '@/components/ui/DialogShell.vue'
import { resetProcess } from '@/composables/useProcess'
import type { UseProcess } from '@/composables/useProcess'
import { useAcademicEvents } from '@/composables/useAcademicEvents'
import { usePlannerStatus } from '@/composables/usePlannerStatus'
import { useTasks } from '@/composables/useTasks'
import { getCourseColor } from '@/constants/palette'
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
  }>(),
  { open: false, preserveRun: false },
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  /** Fires when the user minimizes a live run to the notification center. */
  (e: 'keep-running', event: MouseEvent): void
}>()

const planner = usePlannerStatus()
const taskStore = useTasks()
const eventStore = useAcademicEvents()

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

const processedNotes = computed(() => runStatus.value?.pendingNotes ?? [])
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

function keepRunning(event: MouseEvent): void {
  emit('keep-running', event)
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
  <DialogShell
    :open="open"
    :title="title"
    @update:open="emit('update:open', $event)"
  >
    <div v-if="phase === 'confirm'" class="mt-2">
      <p class="text-sm text-[#7B8B97]" style="font-family: 'Inter', sans-serif; font-weight: 400">
        Duckota reads the pending journal notes and updates the study plan.
      </p>
      <dl
        v-if="pendingCount > 0"
        class="mt-3 space-y-2 text-sm"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        <div class="flex gap-2">
          <dt class="font-semibold text-[#334155]">Notes</dt>
          <dd class="text-[#7B8B97]">{{ pendingCount }}</dd>
        </div>
        <div v-if="pendingCourses" class="flex gap-2">
          <dt class="font-semibold text-[#334155]">Courses</dt>
          <dd class="text-[#7B8B97]">{{ pendingCourses }}</dd>
        </div>
        <div v-if="pendingDates" class="flex gap-2">
          <dt class="font-semibold text-[#334155]">Dates</dt>
          <dd class="text-[#7B8B97]">{{ pendingDates }}</dd>
        </div>
      </dl>
      <p
        v-else
        class="mt-3 text-sm text-[#7B8B97]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        No notes wait for processing.
      </p>
    </div>

    <div v-else-if="phase === 'running'" class="mt-2">
      <p
        v-if="cancelled"
        class="text-sm text-[#334155]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        Stopping after the current step…
      </p>
      <p
        v-else-if="progress"
        class="text-sm text-[#334155]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        Reading notes for {{ formatEntryDate(progress.date) }} — {{ progress.index }} of
        {{ progress.total }}.
      </p>
      <p
        v-else
        class="text-sm text-[#334155]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        Starting…
      </p>
      <p
        class="mt-1 text-sm text-[#7B8B97]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        Duckota extracts tasks, events, and context.
      </p>
    </div>

    <div v-else-if="phase === 'done'" class="mt-2">
      <p class="text-sm text-[#7B8B97]" style="font-family: 'Inter', sans-serif; font-weight: 400">
        Duckota processed {{ processedNotes.length }} notes and created
        {{ summary?.tasksCreated ?? 0 }} tasks, {{ summary?.eventsCreated ?? 0 }} events, and
        {{ summary?.contextsCreated ?? 0 }} context items.
      </p>
      <p
        v-if="error"
        role="alert"
        class="mt-2 text-sm font-medium text-[#DC2626]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        {{ error }}
      </p>

      <div
        v-if="showMore"
        data-testid="process-details"
        class="mt-3 max-h-56 space-y-3 overflow-y-auto border-t border-[#CBD5E1] pt-3"
      >
        <section>
          <h3
            class="text-xs font-semibold tracking-wide text-[#7B8B97] uppercase"
            style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          >
            Notes
          </h3>
          <ul class="mt-1 space-y-1">
            <li
              v-for="note in processedNotes"
              :key="note.id"
              class="text-sm text-[#334155]"
              style="font-family: 'Inter', sans-serif; font-weight: 400"
            >
              {{ note.title || 'Untitled note' }}
              <span class="text-[#7B8B97]">
                · {{ note.courseName }} · {{ formatEntryDate(note.entryDate) }}
              </span>
            </li>
            <li
              v-if="!processedNotes.length"
              class="text-sm text-[#7B8B97]"
              style="font-family: 'Inter', sans-serif; font-weight: 400"
            >
              No notes processed.
            </li>
          </ul>
        </section>

        <section>
          <h3
            class="text-xs font-semibold tracking-wide text-[#7B8B97] uppercase"
            style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          >
            Tasks
          </h3>
          <ul class="mt-1 space-y-1">
            <li
              v-for="task in createdTasks"
              :key="task.id"
              class="flex items-center gap-2 text-sm text-[#334155]"
              style="font-family: 'Inter', sans-serif; font-weight: 400"
            >
              <span
                class="h-3 w-3 shrink-0 rounded-full border border-white/60 shadow-sm"
                :style="{ backgroundColor: getCourseColor(task.courseId).solid }"
                aria-hidden="true"
              />
              <span>{{ task.title }}</span>
              <span v-if="taskMeta(task)" class="text-[#7B8B97]">{{ taskMeta(task) }}</span>
            </li>
            <li
              v-if="!createdTasks.length"
              class="text-sm text-[#7B8B97]"
              style="font-family: 'Inter', sans-serif; font-weight: 400"
            >
              No new tasks.
            </li>
          </ul>
        </section>

        <section>
          <h3
            class="text-xs font-semibold tracking-wide text-[#7B8B97] uppercase"
            style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          >
            Events
          </h3>
          <ul class="mt-1 space-y-1">
            <li
              v-for="event in createdEvents"
              :key="event.id"
              class="flex items-center gap-2 text-sm text-[#334155]"
              style="font-family: 'Inter', sans-serif; font-weight: 400"
            >
              <span
                class="h-3 w-3 shrink-0 rounded-full border border-white/60 shadow-sm"
                :style="{ backgroundColor: getCourseColor(event.courseId).solid }"
                aria-hidden="true"
              />
              <span>{{ event.title }}</span>
              <span class="text-[#7B8B97]">{{ formatDeadline(event.deadline) }}</span>
            </li>
            <li
              v-if="!createdEvents.length"
              class="text-sm text-[#7B8B97]"
              style="font-family: 'Inter', sans-serif; font-weight: 400"
            >
              No new events.
            </li>
          </ul>
        </section>
      </div>
    </div>

    <div v-else-if="phase === 'cancelled'" class="mt-2">
      <p
        v-if="savedAfterCancel"
        class="text-sm text-[#7B8B97]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        The run saved its changes before Duckota stopped.
      </p>
      <p
        v-else
        class="text-sm text-[#7B8B97]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        Duckota stopped the run. Pending notes stay unprocessed.
      </p>
    </div>

    <div v-else class="mt-2">
      <p
        role="alert"
        class="text-sm font-medium text-[#DC2626]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        {{ error }}
      </p>
    </div>

    <template #actions="{ dismiss }">
      <template v-if="phase === 'confirm'">
        <button
          type="button"
          class="min-h-[44px] rounded-xl border-b-4 border-[#CBD5E1] bg-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#334155] transition-all duration-75 hover:bg-[#D7DEE8] focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-60"
          style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          @click="dismiss"
        >
          Back
        </button>
        <button
          type="button"
          data-testid="process-confirm"
          :disabled="!pendingCount"
          class="min-h-[44px] rounded-xl border-b-4 border-[#007B99] bg-[#00A4C8] px-5 py-2.5 text-sm font-bold text-white transition-all duration-75 hover:bg-[#0090B0] focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-60"
          style="font-family: 'Quicksand', sans-serif; font-weight: 700"
          @click="confirm"
        >
          Process
        </button>
      </template>

      <template v-else-if="phase === 'running'">
        <button
          type="button"
          data-testid="process-cancel"
          :disabled="cancelled"
          class="min-h-[44px] rounded-xl border-b-4 border-[#CBD5E1] bg-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#334155] transition-all duration-75 hover:bg-[#D7DEE8] focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-60"
          style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          @click="cancelRun"
        >
          Cancel run
        </button>
        <button
          type="button"
          data-testid="process-minimize"
          class="min-h-[44px] rounded-xl border-b-4 border-[#007B99] bg-[#00A4C8] px-5 py-2.5 text-sm font-bold text-white transition-all duration-75 hover:bg-[#0090B0] focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-60"
          style="font-family: 'Quicksand', sans-serif; font-weight: 700"
          @click="keepRunning($event); dismiss()"
        >
          Keep running
        </button>
      </template>

      <template v-else-if="phase === 'done'">
        <button
          type="button"
          data-testid="process-show-more"
          class="min-h-[44px] rounded-xl border-b-4 border-[#CBD5E1] bg-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#334155] transition-all duration-75 hover:bg-[#D7DEE8] focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-60"
          style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          @click="showMore = !showMore"
        >
          {{ showMore ? 'Show less' : 'Show more' }}
        </button>
        <button
          type="button"
          data-testid="process-close"
          class="min-h-[44px] rounded-xl border-b-4 border-[#007B99] bg-[#00A4C8] px-5 py-2.5 text-sm font-bold text-white transition-all duration-75 hover:bg-[#0090B0] focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-60"
          style="font-family: 'Quicksand', sans-serif; font-weight: 700"
          @click="dismiss"
        >
          Done
        </button>
      </template>

      <button
        v-else
        type="button"
        data-testid="process-close"
        class="min-h-[44px] rounded-xl border-b-4 border-[#007B99] bg-[#00A4C8] px-5 py-2.5 text-sm font-bold text-white transition-all duration-75 hover:bg-[#0090B0] focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-1 active:border-b-0 disabled:cursor-not-allowed disabled:opacity-60"
        style="font-family: 'Quicksand', sans-serif; font-weight: 700"
        @click="dismiss"
      >
        Close
      </button>
    </template>
  </DialogShell>
</template>
