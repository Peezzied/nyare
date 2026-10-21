<script setup lang="ts">
import { computed, h, nextTick, onMounted, ref, watch } from 'vue'
import { Archive, ArrowLeft, BookOpen, Pencil, Plus, Trash2 } from '@lucide/vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import type { DrawerOpenChangeDetails } from 'reka-ui'
import HeaderIconButton from '@/components/HeaderIconButton.vue'
import CourseEditorDrawer from '@/components/CourseEditorDrawer.vue'
import DiscardDraftConfirmDialog from '@/components/DiscardDraftConfirmDialog.vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import DialogShell from '@/components/ui/DialogShell.vue'
import {
  createBlock,
  syncScheduleDrafts,
  type TimeBlockDraft,
} from '@/components/TimeBlockCard.vue'
import { useCatalog } from '@/composables/useCatalog'
import { useShellHeader } from '@/composables/useShellHeader'
import { useToasts } from '@/composables/useToasts'
import {
  captureSnapshot,
  createCourseEditor,
  isEditorDirty,
  validSchedulesOf,
  type CourseEditor,
} from '@/composables/useCourseEditor'
import type { DraftCourse } from '@/composables/useCourseDrafts'
import { coursesApi, schedulesApi } from '@/api'
import { ApiError } from '@/api/client'
import { diffSchedules } from '@/utils/scheduleDiff'
import {
  buildKnownSet,
  findClash,
  findEditorConflict,
  rangesOverlap,
  unavailableDaysFor,
} from '@/utils/scheduleValidation'
import type { CourseResponse, DayOfWeek, ScheduleResponse } from '@/types/api'

const router = useRouter()
const catalog = useCatalog()
const { pushToast, dismissToast } = useToasts()

function toastSuccess(title: string): void {
  pushToast({ kind: 'success', title })
}

function toastError(title: string): void {
  pushToast({ kind: 'error', title })
}

useShellHeader({
  title: 'Manage courses',
  left: () =>
    h(
      HeaderIconButton,
      {
        'aria-label': 'Back to calendar',
        'data-testid': 'manage-courses-back',
        onClick: goBack,
      },
      () => h(ArrowLeft, { class: 'h-6 w-6', 'aria-hidden': 'true' }),
    ),
  right: () =>
    h(
      HeaderIconButton,
      {
        'aria-label': 'Add course',
        'data-testid': 'manage-add-course',
        onClick: () => guardEditorExit(addCourse),
      },
      () => h(Plus, { class: 'h-6 w-6', 'aria-hidden': 'true' }),
    ),
})

const loading = ref(true)
const loadFailed = ref(false)

// `addingCourse` marks a blank editor for a new course; `editingCourse` marks
// an editor prefilled from a persisted course. They never hold values together.
const addingCourse = ref(false)
const editingCourse = ref<CourseResponse | null>(null)
const deletingCourse = ref<CourseResponse | null>(null)
const archivingCourse = ref<CourseResponse | null>(null)
const archiveAllOpen = ref(false)
// Id of the bulk-Undo toast, so route leave dismisses only that toast.
const undoToastId = ref<string | null>(null)

const editingEditor = ref<CourseEditor | null>(null)
// The drawer needs a live editor prop to stay mounted while `open` flips
// false, so it keeps the last editor for the close animation to run against.
const drawerEditor = ref<CourseEditor | null>(null)
const editorOpen = ref(false)
const editorStage = ref<'partial' | 'full'>('full')
const editorSaving = ref(false)
const showDiscardDialog = ref(false)
let pendingExit: (() => void) | null = null

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

const schedulesByCourse = computed(() => {
  const grouped = new Map<number, ScheduleResponse[]>()
  for (const schedule of catalog.schedules.value) {
    const list = grouped.get(schedule.courseId)
    if (list) {
      list.push(schedule)
    } else {
      grouped.set(schedule.courseId, [schedule])
    }
  }
  for (const list of grouped.values()) {
    list.sort(
      (a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day] || a.startTime.localeCompare(b.startTime),
    )
  }
  return grouped
})

function schedulesFor(courseId: number): ScheduleResponse[] {
  return schedulesByCourse.value.get(courseId) ?? []
}

function formatTime(value: string): string {
  return value.slice(0, 5)
}

async function load(): Promise<void> {
  loading.value = true
  loadFailed.value = false
  try {
    await catalog.loadCatalog()
  } catch {
    loadFailed.value = true
    toastError('Courses failed to load.')
  } finally {
    loading.value = false
  }
}

function addCourse(): void {
  editingCourse.value = null
  addingCourse.value = true
}

function startEdit(course: CourseResponse): void {
  addingCourse.value = false
  editingCourse.value = course
}

function startDelete(course: CourseResponse): void {
  deletingCourse.value = course
}

function startArchive(course: CourseResponse): void {
  archivingCourse.value = course
}

function startArchiveAll(): void {
  archiveAllOpen.value = true
}

// The drawer edits one course at a time. `addingCourse` opens a blank editor;
// `editingCourse` rebuilds a fresh editor from the catalog. Clearing both
// closes the drawer.
watch([editingCourse, addingCourse], ([course, adding]) => {
  if (adding) {
    editingEditor.value = createCourseEditor()
    drawerEditor.value = editingEditor.value
    editorStage.value = 'full'
    editorOpen.value = true
    return
  }
  if (!course) {
    editingEditor.value = null
    editorOpen.value = false
    showDiscardDialog.value = false
    return
  }
  editingEditor.value = createCourseEditor(draftForCourse(course))
  drawerEditor.value = editingEditor.value
  editorStage.value = 'full'
  editorOpen.value = true
})

function draftForCourse(course: CourseResponse): DraftCourse {
  return {
    tempId: `course-${course.id}`,
    name: course.name,
    colorId: catalog.courseColor(course.id).id,
    schedules: schedulesFor(course.id).map((schedule) => ({
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    })),
    courseId: course.id,
  }
}

/** Class meetings of every catalog course except the one being edited. */
function otherKnownSchedules(courseId?: number) {
  return buildKnownSet(catalog.courses.value, catalog.schedules.value).schedules.filter(
    (s) => s.courseId !== courseId,
  )
}

function unavailableDaysForBlock(block: TimeBlockDraft): DayOfWeek[] {
  const ed = editingEditor.value
  if (!ed) {
    return []
  }
  const siblings = ed.blocks.filter((b) => b.id !== block.id)
  return unavailableDaysFor(block, otherKnownSchedules(editingCourse.value?.id), siblings)
}

/** Drops days a time change made clashing and reports the first reason. */
function syncUnavailableDays(block: TimeBlockDraft) {
  const ed = editingEditor.value
  if (!ed) {
    return
  }
  const unavailable = unavailableDaysForBlock(block)
  const removedDays = block.selectedDays.filter((day) => unavailable.includes(day))
  if (removedDays.length === 0) {
    return
  }
  block.selectedDays = block.selectedDays.filter((day) => !unavailable.includes(day))
  syncScheduleDrafts(block)

  const others = otherKnownSchedules(editingCourse.value?.id)
  const siblings = ed.blocks.filter((b) => b.id !== block.id)
  for (const day of removedDays) {
    const clash = findClash({ day, startTime: block.startTime, endTime: block.endTime }, others)
    if (clash) {
      toastError(`A class time clashes with ${clash.courseName || 'another class'} on ${day}.`)
      return
    }
    const siblingOverlap = siblings.find(
      (sib) =>
        sib.selectedDays.includes(day) &&
        rangesOverlap(block.startTime, block.endTime, sib.startTime, sib.endTime),
    )
    if (siblingOverlap) {
      toastError(`Two time blocks for this course overlap on ${day}.`)
      return
    }
  }
}

function addBlock() {
  const ed = editingEditor.value
  if (ed) {
    ed.blocks = [...ed.blocks, createBlock()]
  }
}

// Edit mode allows removing the last block; the course then shows "No class times".
function removeBlock(block: TimeBlockDraft) {
  const ed = editingEditor.value
  if (ed) {
    ed.blocks = ed.blocks.filter((item) => item.id !== block.id)
  }
}

function toggleDay(block: TimeBlockDraft, day: DayOfWeek) {
  if (block.selectedDays.includes(day)) {
    block.selectedDays = block.selectedDays.filter((item) => item !== day)
  } else {
    block.selectedDays = [...block.selectedDays, day]
  }
  block.error = ''
  syncScheduleDrafts(block)
}

function onStartTimeChange(block: TimeBlockDraft, value: string) {
  block.startTime = value
  block.error = ''
  syncUnavailableDays(block)
}

function onEndTimeChange(block: TimeBlockDraft, value: string) {
  block.endTime = value
  block.error = ''
  syncUnavailableDays(block)
}

function blockIsBlank(block: TimeBlockDraft): boolean {
  return block.selectedDays.length === 0 && block.startTime === '' && block.endTime === ''
}

function blockIsComplete(block: TimeBlockDraft): boolean {
  return (
    block.selectedDays.length > 0 &&
    block.startTime !== '' &&
    block.endTime !== '' &&
    block.startTime < block.endTime
  )
}

// A course with no class times is valid in edit mode, unlike allBlocksValid.
// Completely blank blocks count as "no class time"; partial blocks block saves.
const editorCanSave = computed(() => {
  const ed = editingEditor.value
  if (!ed) {
    return false
  }
  return (
    ed.name.trim().length > 0 &&
    ed.blocks.every((block) => blockIsBlank(block) || blockIsComplete(block))
  )
})

function editorBasicsError(ed: CourseEditor): string | null {
  if (ed.name.trim().length === 0) {
    return 'Enter a course name before saving.'
  }
  if (ed.blocks.some((block) => !blockIsBlank(block) && !blockIsComplete(block))) {
    return `"${ed.name.trim()}" needs at least one weekday, and every time must have an end time after its start time.`
  }
  return null
}

/** Writes a reason under each invalid block card for FR-009. */
function markBlockErrors(ed: CourseEditor): void {
  for (const block of ed.blocks) {
    if (blockIsBlank(block) || blockIsComplete(block)) {
      block.error = ''
    } else if (block.selectedDays.length === 0) {
      block.error = 'Pick at least one day.'
    } else {
      block.error = 'End time must be after start time.'
    }
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong while saving the course.'
}

/**
 * Validates the editor, then creates or updates the course. Stops at the first
 * failed request so already-saved rows stay saved and the drawer keeps the
 * entered values.
 */
async function saveCourseEdit() {
  const ed = editingEditor.value
  const course = editingCourse.value
  if (!ed || editorSaving.value || (!addingCourse.value && !course)) {
    return
  }

  const conflict = findEditorConflict(ed, catalog.courses.value, catalog.schedules.value)
  if (conflict) {
    toastError(conflict)
    return
  }

  const basicsError = editorBasicsError(ed)
  if (basicsError) {
    markBlockErrors(ed)
    toastError(basicsError)
    return
  }

  editorSaving.value = true
  try {
    if (addingCourse.value) {
      await createCourseFromEditor(ed)
    } else if (course) {
      await updateCourseFromEditor(ed, course)
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && course) {
      // A 404 means the record is gone or belongs to another user; drop the
      // stale course from the list and close the editor.
      catalog.applyCourseDeleted(course.id)
      editingCourse.value = null
    }
    toastError(errorMessage(error))
  } finally {
    editorSaving.value = false
  }
}

/** Creates the course first so its id can own each new class time. */
async function createCourseFromEditor(ed: CourseEditor) {
  const course = await coursesApi.create({ name: ed.name.trim(), color: ed.colorId })
  catalog.applyCourseCreated(course)
  // ponytail: a failed schedule create leaves the course saved without the
  // remaining class times; the student can re-add them through Edit.
  for (const schedule of validSchedulesOf(ed)) {
    catalog.applyScheduleCreated(await schedulesApi.create({ ...schedule, courseId: course.id }))
  }
  addingCourse.value = false
  toastSuccess('Course added.')
}

/** Persists name, color, and class-time changes of a persisted course. */
async function updateCourseFromEditor(ed: CourseEditor, course: CourseResponse) {
  const name = ed.name.trim()
  if (name !== course.name || ed.colorId !== catalog.courseColor(course.id).id) {
    try {
      catalog.applyCourseUpdated(
        await coursesApi.update(course.id, {
          name,
          description: course.description ?? undefined,
          color: ed.colorId,
        }),
      )
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // The course was deleted in another session; drop it from the list.
        catalog.applyCourseDeleted(course.id)
        editingCourse.value = null
        toastError('This course no longer exists.')
        return
      }
      throw error
    }
  }

  const diff = diffSchedules(schedulesFor(course.id), validSchedulesOf(ed))
  for (const row of diff.update) {
    catalog.applyScheduleUpdated(
      await schedulesApi.update(row.id, { ...row.next, courseId: course.id }),
    )
  }
  for (const item of diff.create) {
    catalog.applyScheduleCreated(await schedulesApi.create({ ...item, courseId: course.id }))
  }
  for (const id of diff.remove) {
    await schedulesApi.delete(id)
    catalog.applyScheduleDeleted(id)
  }

  captureSnapshot(ed)
  editingCourse.value = null
  toastSuccess('Course updated.')
}

const deleteMessage = computed(() =>
  deletingCourse.value
    ? `This deletes ${deletingCourse.value.name} and all its notes, tasks, events, and class times.`
    : '',
)

async function confirmDelete() {
  const course = deletingCourse.value
  if (!course) {
    return
  }
  deletingCourse.value = null
  try {
    await catalog.deleteCourse(course.id)
    // Close the editor when the student deleted the course it was editing.
    if (editingCourse.value?.id === course.id) {
      editingCourse.value = null
    }
    toastSuccess('Course deleted.')
  } catch (error) {
    toastError(errorMessage(error))
  }
}

const archiveMessage = computed(() =>
  archivingCourse.value
    ? `Archive ${archivingCourse.value.name}? Its notes, tasks, events, and class times leave your active views.`
    : '',
)

async function confirmArchive() {
  const course = archivingCourse.value
  if (!course) {
    return
  }
  archivingCourse.value = null
  try {
    await catalog.archiveCourse(course.id)
    // Close the editor when the student archived the course it was editing.
    if (editingCourse.value?.id === course.id) {
      editingCourse.value = null
    }
    toastSuccess('Course archived.')
  } catch (error) {
    toastError(errorMessage(error))
  }
}

const archiveAllMessage = computed(() => {
  const count = catalog.courses.value.length
  const noun = count === 1 ? 'course' : 'courses'
  return `Archive all ${count} ${noun}? Notes, tasks, events, and class times leave your active views.`
})

async function confirmArchiveAll() {
  archiveAllOpen.value = false
  try {
    const ids = await catalog.archiveAllCourses()
    if (ids.length === 0) {
      return
    }
    // A bulk archive removes every course, so any open editor is stale.
    editingCourse.value = null
    const noun = ids.length === 1 ? 'course' : 'courses'
    undoToastId.value = pushToast(
      {
        kind: 'info',
        title: `Archived ${ids.length} ${noun}`,
        action: {
          label: 'Undo',
          onClick: () => void undoArchiveAll(ids),
        },
      },
      8000,
    )
  } catch (error) {
    toastError(errorMessage(error))
  }
}

/** Restores exactly the courses the last bulk archive archived (FR-019). */
async function undoArchiveAll(ids: number[]) {
  try {
    await catalog.unarchiveCourses(ids)
    toastSuccess('Courses restored.')
  } catch (error) {
    toastError(errorMessage(error))
  }
}

function requestEditorClose() {
  if (editorSaving.value) {
    return
  }
  if (editingEditor.value && isEditorDirty(editingEditor.value)) {
    editorOpen.value = true
    showDiscardDialog.value = true
    return
  }
  editingCourse.value = null
  addingCourse.value = false
}

function onDrawerOpenChange(value: boolean, details?: DrawerOpenChangeDetails) {
  if (!value && details?.reason === 'swipe') {
    details.cancel()
    if (editorStage.value === 'full') {
      editorStage.value = 'partial'
    }
    return
  }
  if (value) {
    editorOpen.value = true
    return
  }
  requestEditorClose()
}

function handleDiscardEdits() {
  showDiscardDialog.value = false
  const action = pendingExit
  pendingExit = null
  // The watcher drops the editor during the next flush. A pending exit runs
  // after that flush so a reopened editor rebuilds a fresh one.
  editingCourse.value = null
  addingCourse.value = false
  void nextTick(() => action?.())
}

function handleKeepEditing() {
  pendingExit = null
  showDiscardDialog.value = false
  editorOpen.value = true
  editorStage.value = 'full'
}

function editorHasUnsavedChanges(): boolean {
  return editingEditor.value !== null && isEditorDirty(editingEditor.value)
}

/** Runs `action` at once, or after the student confirms discarding edits. */
function guardEditorExit(action: () => void): void {
  if (editorHasUnsavedChanges()) {
    pendingExit = action
    editorOpen.value = true
    showDiscardDialog.value = true
    return
  }
  action()
}

function goBack(): void {
  guardEditorExit(() => void router.push({ name: 'calendar' }))
}

// Direct navigation (nav bar, browser back) asks through the same dialog.
onBeforeRouteLeave((to) => {
  if (!editorHasUnsavedChanges()) {
    // The Undo toast belongs to this page; close it when the student leaves.
    if (undoToastId.value !== null) {
      dismissToast(undoToastId.value)
      undoToastId.value = null
    }
    return true
  }
  pendingExit = () => void router.push(to.fullPath)
  editorOpen.value = true
  showDiscardDialog.value = true
  return false
})

defineExpose({
  addingCourse,
  editingCourse,
  deletingCourse,
  archivingCourse,
  archiveAllOpen,
  editingEditor,
  editorOpen,
})

onMounted(load)
</script>

<template>
  <div data-testid="manage-courses-page" class="h-full overflow-y-auto bg-app-bg px-4 pb-8 pt-4">
    <p
      v-if="loading"
      data-testid="manage-courses-loading"
      class="py-8 text-center text-sm text-text-muted"
    >
      Loading courses…
    </p>

    <div
      v-else-if="loadFailed"
      data-testid="manage-courses-error"
      role="alert"
      class="mt-6 rounded-2xl border border-app-border bg-card p-6 text-center"
    >
      <p class="text-base font-semibold text-text-main">Courses failed to load.</p>
      <Button type="button" variant="tactile" size="touch" class="mt-4" @click="load">
        Retry
      </Button>
    </div>

    <div
      v-else-if="catalog.courses.value.length === 0"
      data-testid="manage-empty-state"
      class="flex flex-col items-center px-6 py-16 text-center"
    >
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F6FA]">
        <BookOpen class="h-8 w-8 text-[#007B99]" aria-hidden="true" />
      </div>
      <p class="mt-4 text-lg font-bold text-text-main">No courses yet</p>
      <p class="mt-1 text-sm text-text-muted">
        Add a course to plan class times, notes, and tasks.
      </p>
      <Button type="button" variant="tactile" size="touch" class="mt-6" @click="addCourse">
        <Plus class="h-5 w-5" aria-hidden="true" />
        Add course
      </Button>
    </div>

    <div v-else class="flex flex-col gap-4">
      <button
        type="button"
        data-testid="manage-archive-all"
        class="flex min-h-[44px] items-center justify-center gap-2 self-end rounded-xl border border-[#BCE3ED] bg-[#E8F6FA] px-4 text-sm font-bold text-[#007B99] shadow-[0_3px_0_#B0DBE5] transition-all duration-75 hover:bg-[#DDEFF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 active:translate-y-0.5 active:shadow-[0_1px_0_#B0DBE5]"
        style="font-family: 'Quicksand', sans-serif; font-weight: 700"
        @click="guardEditorExit(startArchiveAll)"
      >
        <Archive class="h-5 w-5" aria-hidden="true" />
        Archive all
      </button>

      <ul class="flex flex-col gap-4">
        <li v-for="course in catalog.courses.value" :key="course.id">
          <Card
            as="article"
            data-testid="manage-course-card"
            class="gap-0 rounded-2xl border-[#D5EBF1] bg-[#FDFEF7] px-4 py-4 shadow-[0_4px_0_#D5EBF1]"
          >
            <div class="flex items-start gap-3">
              <span
                class="mt-1 h-4 w-4 shrink-0 rounded-full"
                :style="{ backgroundColor: catalog.courseColor(course.id).solid }"
                aria-hidden="true"
              />
              <div class="min-w-0 flex-1">
                <h2 class="truncate text-base font-bold text-text-main">{{ course.name }}</h2>
                <ul v-if="schedulesFor(course.id).length > 0" class="mt-2 flex flex-col gap-1">
                  <li
                    v-for="schedule in schedulesFor(course.id)"
                    :key="schedule.id"
                    data-testid="manage-course-time"
                    class="flex items-center gap-2 text-sm"
                  >
                    <span class="w-9 font-semibold text-text-main">{{
                      DAY_LABELS[schedule.day]
                    }}</span>
                    <span class="text-text-muted">
                      {{ formatTime(schedule.startTime) }}–{{ formatTime(schedule.endTime) }}
                    </span>
                  </li>
                </ul>
                <p v-else class="mt-2 text-sm italic text-text-muted">No class times</p>
              </div>
              <div class="flex shrink-0 items-center">
                <button
                  type="button"
                  data-testid="manage-course-edit"
                  :aria-label="`Edit ${course.name}`"
                  class="flex h-11 w-11 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-black/5 hover:text-text-main focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  @click="guardEditorExit(() => startEdit(course))"
                >
                  <Pencil class="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  data-testid="manage-course-archive"
                  :aria-label="`Archive ${course.name}`"
                  class="flex h-11 w-11 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-black/5 hover:text-text-main focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  @click="guardEditorExit(() => startArchive(course))"
                >
                  <Archive class="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  data-testid="manage-course-delete"
                  :aria-label="`Delete ${course.name}`"
                  class="flex h-11 w-11 items-center justify-center rounded-lg text-[#B91C1C] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  @click="guardEditorExit(() => startDelete(course))"
                >
                  <Trash2 class="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </Card>
        </li>
      </ul>
    </div>

    <CourseEditorDrawer
      v-if="drawerEditor"
      :editor="drawerEditor"
      :open="editorOpen"
      :stage="editorStage"
      :saving="editorSaving"
      :can-save="editorCanSave"
      can-remove
      cover-bottom-when-full
      portal
      :unavailable-days="unavailableDaysForBlock"
      @update:open="onDrawerOpenChange"
      @update:stage="editorStage = $event"
      @save="saveCourseEdit"
      @close="requestEditorClose"
      @submit="saveCourseEdit"
      @add-block="addBlock"
      @remove="removeBlock"
      @toggle-day="toggleDay"
      @update:start-time="onStartTimeChange"
      @update:end-time="onEndTimeChange"
    />

    <DiscardDraftConfirmDialog
      :open="showDiscardDialog"
      @update:open="showDiscardDialog = $event"
      @keep-editing="handleKeepEditing"
      @discard="handleDiscardEdits"
    />

    <DiscardDraftConfirmDialog
      :open="deletingCourse !== null"
      title="Delete course?"
      :message="deleteMessage"
      confirm-label="Delete"
      cancel-label="Keep course"
      @keep-editing="deletingCourse = null"
      @discard="confirmDelete"
    />

    <DialogShell
      :open="archivingCourse !== null"
      title="Archive course?"
      @update:open="archivingCourse = null"
    >
      <p
        class="mt-2 text-sm text-[#7B8B97]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        {{ archiveMessage }}
      </p>

      <template #actions="{ dismiss }">
        <button
          type="button"
          data-testid="manage-archive-cancel"
          class="min-h-[44px] rounded-xl border-b-4 border-[#CBD5E1] bg-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#334155] transition-all duration-75 hover:bg-[#D7DEE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 active:translate-y-1 active:border-b-0"
          style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          @click="dismiss"
        >
          Keep course
        </button>

        <button
          type="button"
          data-testid="manage-archive-confirm"
          class="min-h-[44px] rounded-xl border-b-4 border-[#991B1B] bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white transition-all duration-75 hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2 active:translate-y-1 active:border-b-0"
          style="font-family: 'Quicksand', sans-serif; font-weight: 700"
          @click="confirmArchive"
        >
          Archive
        </button>
      </template>
    </DialogShell>

    <DialogShell
      :open="archiveAllOpen"
      title="Archive all courses?"
      @update:open="archiveAllOpen = $event"
    >
      <p
        class="mt-2 text-sm text-[#7B8B97]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        {{ archiveAllMessage }}
      </p>

      <template #actions="{ dismiss }">
        <button
          type="button"
          data-testid="manage-archive-all-cancel"
          class="min-h-[44px] rounded-xl border-b-4 border-[#CBD5E1] bg-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#334155] transition-all duration-75 hover:bg-[#D7DEE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 active:translate-y-1 active:border-b-0"
          style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          @click="dismiss"
        >
          Keep courses
        </button>

        <button
          type="button"
          data-testid="manage-archive-all-confirm"
          class="min-h-[44px] rounded-xl border-b-4 border-[#991B1B] bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white transition-all duration-75 hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2 active:translate-y-1 active:border-b-0"
          style="font-family: 'Quicksand', sans-serif; font-weight: 700"
          @click="confirmArchiveAll"
        >
          Archive all
        </button>
      </template>
    </DialogShell>
  </div>
</template>
