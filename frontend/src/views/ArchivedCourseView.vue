<script setup lang="ts">
// Read-only snapshot of one archived course: class times, notes, tasks, and
// events. Row components render their archived data without edit, status, or
// delete controls. The header action unarchives the course and navigates back.
import { computed, h, onMounted, ref } from 'vue'
import { ArchiveRestore, ArrowLeft } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'
import HeaderIconButton from '@/components/HeaderIconButton.vue'
import NoteCard from '@/components/NoteCard.vue'
import TaskRow from '@/components/TaskRow.vue'
import DeadlineRow from '@/components/day-view/DeadlineRow.vue'
import NoteEditorModal from '@/components/notes/NoteEditorModal.vue'
import TaskContainerModal from '@/components/tasks/TaskContainerModal.vue'
import { Button } from '@/components/ui/button'
import { useArchive, type ArchivedCourseContent } from '@/composables/useArchive'
import { useCatalog } from '@/composables/useCatalog'
import { toTapOriginRect } from '@/composables/useNoteTransition'
import { useShellHeader } from '@/composables/useShellHeader'
import { useToasts } from '@/composables/useToasts'
import { deriveDeadlineSections, type DeadlineSections } from '@/utils/deadlineSections'
import { formatEntryDate } from '@/utils/noteDate'
import type { CourseResponse, DayOfWeek } from '@/types/api'
import type { TapOriginRect } from '@/types/notesTransition'

const route = useRoute()
const router = useRouter()
const archive = useArchive()
const catalog = useCatalog()

const courseId = computed<number | null>(() => {
  const raw = route.params['courseId']
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isInteger(id) && id > 0 ? id : null
})

const course = computed<CourseResponse | null>(
  () => archive.archivedCourses.value.find((item) => item.id === courseId.value) ?? null,
)

useShellHeader({
  title: () => course.value?.name ?? 'Archived course',
  left: () =>
    h(
      HeaderIconButton,
      {
        'aria-label': 'Back to archive',
        'data-testid': 'archived-course-back',
        onClick: goBack,
      },
      () => h(ArrowLeft, { class: 'h-6 w-6', 'aria-hidden': 'true' }),
    ),
  right: () =>
    course.value
      ? h(
          HeaderIconButton,
          {
            'aria-label': `Unarchive ${course.value.name}`,
            'data-testid': 'archived-course-unarchive',
            onClick: unarchiveCourse,
          },
          () => h(ArchiveRestore, { class: 'h-6 w-6', 'aria-hidden': 'true' }),
        )
      : h('span', { class: 'block h-11 w-11', 'aria-hidden': 'true' }),
})

const loading = ref(true)
const loadFailed = ref(false)
const content = ref<ArchivedCourseContent | null>(null)
const unarchiving = ref(false)

const DAY_ORDER: Record<DayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
}

const sortedSchedules = computed(() =>
  [...(content.value?.schedules ?? [])].sort(
    (a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day] || a.startTime.localeCompare(b.startTime),
  ),
)

const eventSections = computed<DeadlineSections>(() =>
  deriveDeadlineSections(content.value?.events ?? [], new Date()),
)

const courseName = computed(() => course.value?.name ?? '')

const courseBadgeColor = computed(() => archive.courseColor(course.value?.id))

const archivedLabel = computed(() => {
  const formatted = formatEntryDate(course.value?.archivedAt?.slice(0, 10))
  return formatted ? `Archived ${formatted}` : 'Archived'
})

function formatTime(value: string): string {
  return value.slice(0, 5)
}

interface MorphModalState {
  open: boolean
  id: string | null
  originRect: TapOriginRect | null
}

const noteModal = ref<MorphModalState>({ open: false, id: null, originRect: null })
const taskModal = ref<MorphModalState>({ open: false, id: null, originRect: null })

function openNote(noteId: string, event?: Event): void {
  if (noteModal.value.open) {
    return
  }
  const el = (event?.currentTarget ?? event?.target) as Element | null
  noteModal.value = { open: true, id: noteId, originRect: el ? toTapOriginRect(el) : null }
}

function openTask(taskId: string, event?: Event): void {
  if (taskModal.value.open) {
    return
  }
  const el = (event?.currentTarget ?? event?.target) as Element | null
  taskModal.value = { open: true, id: taskId, originRect: el ? toTapOriginRect(el) : null }
}

async function unarchiveCourse(): Promise<void> {
  const target = course.value
  if (!target || unarchiving.value) {
    return
  }
  unarchiving.value = true
  try {
    await catalog.unarchiveCourses([target.id])
    archive.applyCourseRemoved(target.id)
    useToasts().pushToast({ kind: 'success', title: 'Course restored.' })
    goBack()
  } catch (error) {
    useToasts().pushToast({
      kind: 'error',
      title: 'Could not restore the course.',
      detail: error instanceof Error ? error.message : undefined,
    })
  } finally {
    unarchiving.value = false
  }
}

function goBack(): void {
  if (window.history.length > 1) {
    router.back()
    return
  }
  void router.push({ name: 'archive' })
}

async function load(): Promise<void> {
  loading.value = true
  loadFailed.value = false
  try {
    await archive.loadArchive()
    if (courseId.value !== null && course.value) {
      content.value = await archive.loadCourseContent(courseId.value)
    }
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div data-testid="archived-course-page" class="h-full overflow-y-auto bg-app-bg px-4 pb-8 pt-4">
    <p
      v-if="loading"
      data-testid="archived-course-loading"
      class="py-8 text-center text-sm text-text-muted"
    >
      Loading archived course…
    </p>

    <div
      v-else-if="loadFailed"
      data-testid="archived-course-error"
      role="alert"
      class="mt-6 rounded-2xl border border-app-border bg-card p-6 text-center"
    >
      <p class="text-base font-semibold text-text-main">Archived course failed to load.</p>
      <Button type="button" variant="tactile" size="touch" class="mt-4" @click="load">
        Retry
      </Button>
    </div>

    <div
      v-else-if="!course"
      data-testid="archived-course-not-found"
      role="alert"
      class="mt-6 rounded-2xl border border-app-border bg-card p-6 text-center"
    >
      <p class="text-base font-semibold text-text-main">Course not found in the archive.</p>
      <p class="mt-1 text-sm text-text-muted">It may have been restored or deleted.</p>
      <Button type="button" variant="tactile" size="touch" class="mt-4" @click="goBack">
        Back to archive
      </Button>
    </div>

    <div v-else class="flex flex-col gap-6">
      <p data-testid="archived-course-meta" class="text-sm text-text-muted">
        {{ archivedLabel }} · Read-only
      </p>

      <section data-testid="archived-course-schedules">
        <h2 class="text-lg font-bold text-text-main">Class times</h2>
        <ul v-if="sortedSchedules.length > 0" class="mt-2 flex flex-col gap-1">
          <li
            v-for="schedule in sortedSchedules"
            :key="schedule.id"
            data-testid="archived-course-time"
            class="flex items-center gap-2 text-sm"
          >
            <span class="w-9 font-semibold text-text-main">{{ DAY_LABELS[schedule.day] }}</span>
            <span class="text-text-muted">
              {{ formatTime(schedule.startTime) }}–{{ formatTime(schedule.endTime) }}
            </span>
          </li>
        </ul>
        <p v-else class="mt-2 text-sm italic text-text-muted">No class times</p>
      </section>

      <section data-testid="archived-course-notes">
        <h2 class="text-lg font-bold text-text-main">Notes</h2>
        <div v-if="content && content.notes.length > 0" class="columns-2 gap-2 pt-2">
          <div v-for="note in content.notes" :key="note.id" class="break-inside-avoid pb-2">
            <NoteCard
              :note="note"
              :course-name="courseName"
              :badge-color="courseBadgeColor"
              @open="openNote(note.id, $event)"
            />
          </div>
        </div>
        <p v-else class="mt-2 text-sm italic text-text-muted">No notes</p>
      </section>

      <section data-testid="archived-course-tasks">
        <h2 class="text-lg font-bold text-text-main">Tasks</h2>
        <ul v-if="content && content.tasks.length > 0" class="-mx-4 mt-2">
          <TaskRow
            v-for="task in content.tasks"
            :key="task.id"
            :task="task"
            :course-name="courseName"
            :due-date="task.scheduledDate ?? null"
            :time="''"
            readonly
            @click="openTask(task.id, $event)"
            @keydown.enter="openTask(task.id, $event)"
          />
        </ul>
        <p v-else class="mt-2 text-sm italic text-text-muted">No tasks</p>
      </section>

      <section data-testid="archived-course-events">
        <h2 class="text-lg font-bold text-text-main">Events</h2>
        <template v-if="eventSections.upcoming.length > 0 || eventSections.past.length > 0">
          <div v-for="day in eventSections.upcoming" :key="day.dateKey" class="mt-2">
            <p class="px-2 py-1 text-sm font-bold text-text-muted">{{ day.label }}</p>
            <ul class="flex flex-col gap-2">
              <li v-for="row in day.rows" :key="row.event.id">
                <DeadlineRow :row="row" :course-name="courseName" />
              </li>
            </ul>
          </div>
          <div v-for="day in eventSections.past" :key="day.dateKey" class="mt-2">
            <p class="px-2 py-1 text-sm font-bold text-text-muted">{{ day.label }}</p>
            <ul class="flex flex-col gap-2">
              <li v-for="row in day.rows" :key="row.event.id">
                <DeadlineRow :row="row" :course-name="courseName" past />
              </li>
            </ul>
          </div>
        </template>
        <p v-else class="mt-2 text-sm italic text-text-muted">No events</p>
      </section>
    </div>

    <NoteEditorModal
      :is-open="noteModal.open"
      :note-id="noteModal.id"
      :origin-rect="noteModal.originRect"
      @close="noteModal = { ...noteModal, open: false }"
    />

    <TaskContainerModal
      :is-open="taskModal.open"
      :task-id="taskModal.id"
      :origin-rect="taskModal.originRect"
      @close="taskModal = { ...taskModal, open: false }"
    />
  </div>
</template>
