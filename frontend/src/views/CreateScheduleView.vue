<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalog } from '@/composables/useCatalog'
import { setSessionUser, useAuth } from '@/composables/useAuth'
import { useOnboarding } from '@/composables/useOnboarding'
import { authApi } from '@/api'
import { useCourseDrafts, type DraftSchedule } from '@/composables/useCourseDrafts'
import {
  createCourseEditor,
  isEditorDirty,
  isEditorTouched,
  allBlocksValid,
  isEditorValid,
  restoreEditorSnapshot,
  resetEditor,
  discardEditorPendingSlot,
  validSchedulesOf,
  editorSnapshot,
  type CourseEditor,
} from '@/composables/useCourseEditor'
import {
  buildKnownSet,
  findDuplicateName,
  findClash,
  unavailableDaysFor,
  rangesOverlap,
  type ScheduleCandidate,
} from '@/utils/scheduleValidation'
import { ApiError } from '@/api/client'
import type { DayOfWeek } from '@/types/api'
import { COURSE_PALETTE_24 } from '@/constants/palette'
import { Button } from '@/components/ui/button'
import CourseEditorDrawer from '@/components/CourseEditorDrawer.vue'
import StepProgress from '@/components/StepProgress.vue'
import DialogShell from '@/components/ui/DialogShell.vue'
import { ArrowLeft, Check, Plus, X } from 'lucide-vue-next'
import { useToasts } from '@/composables/useToasts'
import { useTopBarInset } from '@/composables/useTopBarInset'
import type { DrawerOpenChangeDetails } from 'reka-ui'
import {
  createBlock,
  blockStatus,
  syncScheduleDrafts,
  type TimeBlockDraft,
} from '@/components/TimeBlockCard.vue'
import WeekPreview from '@/components/WeekPreview.vue'
import { derivePreviewBlocks, type PendingSlot, type PreviewBlock } from '@/utils/weekPreview'

const props = withDefaults(
  defineProps<{
    open?: boolean
    portal?: boolean
    initialStage?: 'partial' | 'full'
  }>(),
  {
    open: true,
    portal: false,
    initialStage: 'partial',
  },
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:stage', value: 'partial' | 'full'): void
  (e: 'created', courseId: number): void
  (e: 'close'): void
}>()

const { pushToast } = useToasts()
const topBarEl = ref<HTMLElement | null>(null)
useTopBarInset(topBarEl)

function toastSuccess(title: string): void {
  pushToast({ kind: 'success', title })
}

function toastError(title: string): void {
  pushToast({ kind: 'error', title })
}

const router = useRouter()
const {
  courses: catalogCourses,
  schedules: catalogSchedules,
  loadCatalog,
  deleteCourse,
} = useCatalog()
const { draftCourses, draftSchedules, stageCourse, unstageCourse, resetDrafts, flush } =
  useCourseDrafts()
const { user } = useAuth()
const { studentName, isNameValid, setSavedSummary } = useOnboarding()

const catalogAvailable = ref(true)
const showSubmitConfirm = ref(false)
const pendingStepTarget = ref<string | null>(null)
const showRemoveDialog = ref(false)
const pendingRemoveId = ref<string | null>(null)
const drawerRef = ref<InstanceType<typeof CourseEditorDrawer> | null>(null)
let pendingSwitchAction: (() => void) | null = null

// One editor per course being drafted. Previously staged drafts hydrate into
// editors so every staged course is reachable from the course dock.
const editors = ref<CourseEditor[]>(
  draftCourses.value.length > 0
    ? draftCourses.value.map((draft) => createCourseEditor(draft))
    : [createCourseEditor()],
)
const activeEditorId = ref(editors.value[0]!.id)

const activeEditor = computed(
  () => editors.value.find((e) => e.id === activeEditorId.value) ?? editors.value[0]!,
)

const courseName = computed({
  get: () => activeEditor.value.name,
  set: (v: string) => {
    activeEditor.value.name = v
  },
})
const selectedColorId = computed({
  get: () => activeEditor.value.colorId,
  set: (v: string) => {
    activeEditor.value.colorId = v
  },
})
const blocks = computed({
  get: () => activeEditor.value.blocks,
  set: (v: TimeBlockDraft[]) => {
    activeEditor.value.blocks = v
  },
})
const pendingSlot = computed({
  get: () => activeEditor.value.pendingSlot,
  set: (v: PendingSlot | null) => {
    activeEditor.value.pendingSlot = v
  },
})
const pendingBlockId = computed({
  get: () => activeEditor.value.pendingBlockId,
  set: (v: string | null) => {
    activeEditor.value.pendingBlockId = v
  },
})

// Staged drafts persist only through Save all, so they count as unsaved work.
const hasUnsavedChanges = computed(
  () => editors.value.some((e) => isEditorDirty(e)) || draftCourses.value.length > 0,
)

const dirtyEditors = computed(() => editors.value.filter((e) => isEditorDirty(e)))
const discardMessage = computed(() =>
  dirtyEditors.value.length > 1
    ? `This discards unsaved changes across ${dirtyEditors.value.length} courses.`
    : undefined,
)

const touchedEditors = computed(() => editors.value.filter((e) => isEditorTouched(e)))
const canSaveAll = computed(() => !saving.value && touchedEditors.value.length > 0)

// Dock onboarding: a lone editor means the student has not discovered the add
// action yet, so the dock advertises it until a second course exists.
const showAddCourseHint = computed(() => editors.value.length <= 1)
const submitConfirmMessage = computed(() => {
  if (user.value) {
    return touchedEditors.value.length > 1
      ? `This saves ${touchedEditors.value.length} courses and their class times to your account.`
      : 'This saves your course and its class times to your account.'
  }
  return 'This creates your account and saves your class schedule.'
})

onMounted(async () => {
  // Sessionless onboarding defers registration to Save all; there is no
  // catalog to load before an account exists.
  if (user.value) {
    try {
      await loadCatalog()
    } catch {
      catalogAvailable.value = false
    }
  }
  window.addEventListener('keydown', handleWindowKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
})

function handleWindowKeydown(event: KeyboardEvent) {
  if (
    event.key === 'Escape' &&
    isOpen.value &&
    !drawerRef.value?.discardOpen &&
    !showRemoveDialog.value &&
    !showSubmitConfirm.value
  ) {
    if (hasUnsavedChanges.value) {
      event.preventDefault()
      event.stopPropagation()
      drawerRef.value?.requestDiscard(discardMessage.value)
    }
  }
}

const knownSet = computed(() => {
  if (!catalogAvailable.value) {
    return { courses: [], schedules: [] }
  }
  const editorIds = new Set(editors.value.map((e) => e.id))
  const stagedNotInEditors = draftCourses.value.filter((d) => !editorIds.has(d.tempId))
  return buildKnownSet(catalogCourses.value, catalogSchedules.value, {
    courses: [
      ...stagedNotInEditors,
      ...editors.value.map((e) => ({
        tempId: e.id,
        name: e.name,
        colorId: e.colorId,
        schedules: validSchedulesOf(e),
      })),
    ],
  })
})

const isOpen = ref(props.open)

// The drawer owns the snap point; this mirrors its emitted stage so preview
// and chip handlers can read or drive the same state.
const stage = ref<'partial' | 'full'>(props.initialStage)

watch(
  () => props.open,
  (val) => {
    isOpen.value = val
    if (val) {
      stage.value = props.initialStage
    }
  },
)

watch(
  () => props.initialStage,
  (val) => {
    stage.value = val
  },
)

function setStage(nextStage: 'partial' | 'full') {
  stage.value = nextStage
  emit('update:stage', nextStage)
}

function onOpenChange(val: boolean, details?: DrawerOpenChangeDetails) {
  if (!val && details?.reason === 'swipe') {
    details.cancel()
    if (stage.value === 'full') {
      setStage('partial')
    }
    return
  }
  if (!val) {
    if (hasUnsavedChanges.value) {
      isOpen.value = true
      drawerRef.value?.requestDiscard(discardMessage.value)
      return
    }
    closeImmediately()
    return
  }
  isOpen.value = true
  emit('update:open', true)
}

const saving = ref(false)

function paletteFor(colorId: string) {
  return COURSE_PALETTE_24.find((color) => color.id === colorId) ?? COURSE_PALETTE_24[0]!
}

function activateEditor(id: string) {
  if (!editors.value.some((e) => e.id === id)) return
  activeEditorId.value = id
  isOpen.value = true
  emit('update:open', true)
  nextTick(() => {
    document
      .getElementById(`course-chip-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
  })
}

function addCourseEditor() {
  const editor = createCourseEditor()
  editors.value.push(editor)
  activateEditor(editor.id)
  setStage('full')
}

const switchGuardMessage = computed(
  () => `You have unsaved changes to ${activeEditor.value.name.trim() || 'New course'}.`,
)

/**
 * Blocks a dock/navigation action while the active editor is dirty. The
 * confirm dialog either keeps the user on the dirty course or reverts it
 * and runs the deferred action.
 */
function guardCourseNavigation(action: () => void) {
  if (isEditorDirty(activeEditor.value)) {
    pendingSwitchAction = action
    drawerRef.value?.requestDiscard(switchGuardMessage.value)
    return
  }
  action()
}

function selectCourseChip(id: string) {
  if (id === activeEditorId.value) {
    // Tapping the active chip reopens a closed drawer.
    isOpen.value = true
    emit('update:open', true)
    return
  }
  guardCourseNavigation(() => {
    activateEditor(id)
    setStage('full')
  })
}

function requestEditorSwitch(id: string, after?: () => void) {
  if (id === activeEditorId.value) {
    after?.()
    return
  }
  const run = () => {
    activateEditor(id)
    after?.()
  }
  if (!isEditorDirty(activeEditor.value)) {
    run()
    return
  }
  pendingSwitchAction = run
  drawerRef.value?.requestDiscard(switchGuardMessage.value)
}

function confirmSwitchDiscard() {
  const action = pendingSwitchAction
  pendingSwitchAction = null
  revertEditor(activeEditor.value)
  action?.()
}

function cancelSwitchGuard() {
  pendingSwitchAction = null
  activateEditor(activeEditorId.value)
  setStage('full')
}

const pendingRemoveName = computed(() => {
  const editor = editors.value.find((e) => e.id === pendingRemoveId.value)
  return editor?.name.trim() || 'New course'
})

function requestRemoveEditor(id: string) {
  const editor = editors.value.find((e) => e.id === id)
  if (!editor) return
  if (editor.isSaved || isEditorDirty(editor)) {
    pendingRemoveId.value = id
    showRemoveDialog.value = true
    return
  }
  void removeEditor(id)
}

async function removeEditor(id: string) {
  const index = editors.value.findIndex((e) => e.id === id)
  if (index < 0) return

  const editor = editors.value[index]!
  editors.value.splice(index, 1)
  if (editor.isSaved) {
    unstageCourse(editor.id)
  }
  if (editor.persistedId != null) {
    try {
      await deleteCourse(editor.persistedId)
    } catch (error) {
      toastError(errorMessage(error))
    }
  }

  if (editors.value.length === 0) {
    editors.value.push(createCourseEditor())
  }

  if (activeEditorId.value === id) {
    const next = editors.value[Math.min(index, editors.value.length - 1)]!
    activateEditor(next.id)
  }
}

function confirmRemoveEditor() {
  if (pendingRemoveId.value) {
    void removeEditor(pendingRemoveId.value)
  }
  pendingRemoveId.value = null
  showRemoveDialog.value = false
}

function cancelRemoveEditor() {
  pendingRemoveId.value = null
  showRemoveDialog.value = false
}

const previewBlocks = computed(() => {
  const list: PreviewBlock[] = []
  for (const editor of editors.value) {
    const color = paletteFor(editor.colorId)
    const dimmed = editor.id !== activeEditorId.value
    for (const block of derivePreviewBlocks(editor.blocks, editor.name, color)) {
      list.push({
        ...block,
        blockId: `${editor.id}/${block.blockId}`,
        dimmed,
      })
    }
  }
  return list
})

function handleSelectSlot(slot: PendingSlot) {
  pendingSlot.value = slot
  isOpen.value = true
  setStage('partial')

  const existingBlock = pendingBlockId.value
    ? blocks.value.find((b) => b.id === pendingBlockId.value)
    : undefined

  if (existingBlock) {
    existingBlock.selectedDays = [slot.day]
    existingBlock.startTime = slot.startTime
    existingBlock.endTime = slot.endTime
    syncScheduleDrafts(existingBlock)
    return
  }

  const isSingleUntouched =
    blocks.value.length === 1 &&
    blocks.value[0]!.selectedDays.length === 0 &&
    !blocks.value[0]!.startTime &&
    !blocks.value[0]!.endTime

  let targetBlock: TimeBlockDraft
  if (isSingleUntouched) {
    targetBlock = blocks.value[0]!
    targetBlock.selectedDays = [slot.day]
    targetBlock.startTime = slot.startTime
    targetBlock.endTime = slot.endTime
    syncScheduleDrafts(targetBlock)
  } else {
    targetBlock = createBlock()
    targetBlock.selectedDays = [slot.day]
    targetBlock.startTime = slot.startTime
    targetBlock.endTime = slot.endTime
    syncScheduleDrafts(targetBlock)
    blocks.value = [...blocks.value, targetBlock]
  }

  pendingBlockId.value = targetBlock.id
}

function handleMoveBlock(blockId: string, fromDay: DayOfWeek, slot: PendingSlot) {
  const [editorId, innerBlockId] = blockId.split('/')
  const editor = editors.value.find((e) => e.id === editorId)
  const block = editor?.blocks.find((b) => b.id === innerBlockId)
  if (!editor || !block) return

  block.startTime = slot.startTime
  block.endTime = slot.endTime
  block.selectedDays = [
    ...block.selectedDays.filter((d) => d !== fromDay && d !== slot.day),
    slot.day,
  ]
  syncScheduleDrafts(block)
  requestEditorSwitch(editor.id)
}

function handleSelectBlock(blockId: string) {
  isOpen.value = true
  setStage('partial')

  const [editorId, innerBlockId] = blockId.split('/')
  if (editorId && innerBlockId) {
    requestEditorSwitch(editorId, () => {
      nextTick(() => {
        document
          .getElementById(`block-card-${innerBlockId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    })
    return
  }

  const byId = editors.value.find((e) => e.id === blockId)
  if (byId) {
    requestEditorSwitch(byId.id)
    return
  }

  const el = document.getElementById(`block-card-${blockId}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function unavailableDaysForBlock(block: TimeBlockDraft): DayOfWeek[] {
  if (!catalogAvailable.value) {
    return []
  }
  const knownSchedules = knownSet.value.schedules.filter(
    (s) => s.courseId !== activeEditor.value.id,
  )

  const siblings = blocks.value.filter((b) => b.id !== block.id)
  return unavailableDaysFor(block, knownSchedules, siblings)
}

function onStartTimeChange(block: TimeBlockDraft, value: string) {
  block.startTime = value
  syncUnavailableDays(block)
}

function onEndTimeChange(block: TimeBlockDraft, value: string) {
  block.endTime = value
  syncUnavailableDays(block)
}

function syncUnavailableDays(block: TimeBlockDraft) {
  const unavail = unavailableDaysForBlock(block)
  const stillValid = block.selectedDays.filter((day) => !unavail.includes(day))
  if (stillValid.length !== block.selectedDays.length) {
    const removedDays = block.selectedDays.filter((day) => unavail.includes(day))
    block.selectedDays = stillValid
    syncScheduleDrafts(block)

    for (const day of removedDays) {
      const candidate: ScheduleCandidate = {
        day,
        startTime: block.startTime,
        endTime: block.endTime,
      }
      const clash = findClash(
        candidate,
        knownSet.value.schedules.filter((s) => s.courseId !== activeEditor.value.id),
      )
      if (clash) {
        toastError(`A class time clashes with ${clash.courseName || 'another class'} on ${day}.`)
        break
      }
      const siblings = blocks.value.filter((b) => b.id !== block.id)
      const siblingOverlap = siblings.find(
        (sib) =>
          sib.selectedDays.includes(day) &&
          rangesOverlap(block.startTime, block.endTime, sib.startTime, sib.endTime),
      )
      if (siblingOverlap) {
        toastError(`Two time blocks for this course overlap on ${day}.`)
        break
      }
    }
  }
}

const ONBOARDING_STEP_ROUTES = ['/', '/welcome', '/create-schedule'] as const
const ONBOARDING_STEP_LABELS = ['Start', 'Your name', 'Class schedule']

function goBack() {
  if (hasUnsavedChanges.value) {
    drawerRef.value?.requestDiscard(discardMessage.value)
    return
  }
  closeImmediately()
}

function onStepSelect(step: number) {
  const target = ONBOARDING_STEP_ROUTES[step - 1]
  if (!target) {
    return
  }
  if (hasUnsavedChanges.value) {
    pendingStepTarget.value = target
    drawerRef.value?.requestDiscard(discardMessage.value)
    return
  }
  closeImmediately(target)
}

/** Closes only the editor drawer; the week preview and course dock stay open. */
function closeDrawer() {
  for (const editor of editors.value) {
    discardEditorPendingSlot(editor)
  }
  isOpen.value = false
  emit('update:open', false)
}

function closeImmediately(target = '/welcome') {
  for (const editor of editors.value) {
    discardEditorPendingSlot(editor)
  }
  if (isOpen.value) {
    isOpen.value = false
    emit('update:open', false)
    emit('close')
  }
  if (router.currentRoute.value.path === '/create-schedule') {
    router.push(target)
  }
}

function revertEditor(editor: CourseEditor) {
  if (editor.isSaved && editor.lastSavedSnapshot) {
    try {
      restoreEditorSnapshot(editor)
    } catch {
      resetEditor(editor)
    }
    return
  }
  resetEditor(editor)
}

function handleDiscard() {
  for (const editor of editors.value) {
    revertEditor(editor)
  }
  resetDrafts()

  const target = pendingStepTarget.value ?? '/welcome'
  pendingStepTarget.value = null
  closeImmediately(target)
}

function handleKeepEditing() {
  pendingStepTarget.value = null
  const dirty = dirtyEditors.value[0]
  if (dirty) {
    activateEditor(dirty.id)
    setStage('full')
    return
  }
  isOpen.value = true
  emit('update:open', true)
}

function handleConfirmedDiscard() {
  if (pendingSwitchAction) {
    confirmSwitchDiscard()
    return
  }
  handleDiscard()
}

function handleConfirmedKeepEditing() {
  if (pendingSwitchAction) {
    cancelSwitchGuard()
    return
  }
  handleKeepEditing()
}

function addBlock() {
  blocks.value = [...blocks.value, createBlock()]
}

function removeBlock(block: TimeBlockDraft) {
  if (blocks.value.length === 1) {
    return
  }

  blocks.value = blocks.value.filter((item) => item.id !== block.id)
}

function toggleDay(block: TimeBlockDraft, day: DayOfWeek) {
  if (block.selectedDays.includes(day)) {
    block.selectedDays = block.selectedDays.filter((item) => item !== day)
  } else {
    block.selectedDays = [...block.selectedDays, day]
  }

  syncScheduleDrafts(block)
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong while saving the courses.'
}

function editorBasicsError(editor: CourseEditor): string | null {
  if (editor.name.trim().length === 0) {
    return 'Enter a course name before saving.'
  }
  if (!allBlocksValid(editor)) {
    return `"${editor.name.trim()}" needs at least one weekday, and every time must have an end time after its start time.`
  }
  return null
}

function editorConflictError(editor: CourseEditor): string | null {
  const coursesToCheck = knownSet.value.courses.filter(
    (c) => c.id !== editor.id && c.id !== editor.persistedId,
  )
  const duplicate = findDuplicateName(editor.name, coursesToCheck)
  if (duplicate) {
    return `A course named "${editor.name.trim()}" already exists.`
  }

  const schedulesToCheck = knownSet.value.schedules.filter(
    (s) => s.courseId !== editor.id && s.courseId !== editor.persistedId,
  )
  const editorBlocks = editor.blocks

  for (let i = 0; i < editorBlocks.length; i++) {
    const b1 = editorBlocks[i]!
    for (const day of b1.selectedDays) {
      const candidate: ScheduleCandidate = {
        day,
        startTime: b1.startTime,
        endTime: b1.endTime,
      }
      const clash = findClash(candidate, schedulesToCheck)
      if (clash) {
        return `A class time clashes with ${clash.courseName || 'another class'} on ${day}.`
      }

      for (let j = i + 1; j < editorBlocks.length; j++) {
        const b2 = editorBlocks[j]!
        if (
          b2.selectedDays.includes(day) &&
          rangesOverlap(b1.startTime, b1.endTime, b2.startTime, b2.endTime)
        ) {
          return `Two time blocks for this course overlap on ${day}.`
        }
      }
    }
  }

  return null
}

/** Error toast with an action button that jumps to the offending course drawer. */
function toastCourseError(message: string, editor: CourseEditor) {
  pushToast({
    kind: 'error',
    title: message,
    action: {
      label: 'Open course',
      onClick: () => {
        activateEditor(editor.id)
        setStage('full')
      },
    },
  })
}

function stageEditor(editor: CourseEditor): void {
  const stagedSchedules: DraftSchedule[] = []
  for (const block of editor.blocks) {
    syncScheduleDrafts(block)
    for (const schedule of block.schedules) {
      if (block.selectedDays.includes(schedule.day)) {
        schedule.state = 'saved'
        stagedSchedules.push({
          day: schedule.day,
          startTime: block.startTime,
          endTime: block.endTime,
        })
      }
    }
    block.state = 'saved'
  }

  stageCourse({
    tempId: editor.id,
    name: editor.name.trim(),
    colorId: editor.colorId,
    schedules: stagedSchedules,
    courseId: editor.persistedId,
  })

  editor.isSaved = true
  editor.lastSavedSnapshot = editorSnapshot(editor)
  editor.pendingSlot = null
  editor.pendingBlockId = null
}

async function saveCourse() {
  const editor = activeEditor.value
  if (!isEditorTouched(editor)) {
    toastError('Add a course name and class time before saving.')
    return
  }

  const basicsError = editorBasicsError(editor)
  if (basicsError) {
    setStage('full')
    toastError(basicsError)
    return
  }

  if (user.value) {
    try {
      await loadCatalog()
    } catch {
      catalogAvailable.value = false
    }
  }

  if (catalogAvailable.value) {
    const conflictError = editorConflictError(editor)
    if (conflictError) {
      toastCourseError(conflictError, editor)
      return
    }
  }

  saving.value = true

  try {
    stageEditor(editor)
    toastSuccess('Course kept for this session. Use Submit to save it to your account.')
  } catch (error) {
    toastError(errorMessage(error))
  } finally {
    saving.value = false
  }
}

/**
 * Validates the touched editors, then asks the student to confirm submission.
 * The shared dialogs stay closed while the confirm sheet is up.
 */
function requestSubmit() {
  // Sessionless onboarding needs the welcome name to register an account.
  if (!user.value && !isNameValid.value) {
    void router.replace('/welcome')
    return
  }

  const touched = touchedEditors.value
  if (touched.length === 0) {
    toastError('Add a course before submitting.')
    return
  }

  for (const editor of touched) {
    const basicsError = editorBasicsError(editor)
    if (basicsError) {
      toastCourseError(basicsError, editor)
      return
    }
  }

  showSubmitConfirm.value = true
}

function confirmSubmit() {
  showSubmitConfirm.value = false
  void saveAll()
}

async function saveAll() {
  // Sessionless onboarding needs the welcome name to register an account.
  if (!user.value && !isNameValid.value) {
    void router.replace('/welcome')
    return
  }

  const touched = touchedEditors.value
  if (touched.length === 0) {
    toastError('Add a course before submitting.')
    return
  }

  if (user.value) {
    try {
      await loadCatalog()
    } catch {
      catalogAvailable.value = false
    }

    if (catalogAvailable.value) {
      for (const editor of touched) {
        const conflictError = editorConflictError(editor)
        if (conflictError) {
          toastCourseError(conflictError, editor)
          return
        }
      }
    }
  }

  saving.value = true
  const firstSetup = !user.value

  try {
    for (const editor of touched) {
      if (!editor.isSaved || isEditorDirty(editor)) {
        stageEditor(editor)
      }
    }

    // Registration happens at the end of onboarding: the welcome name becomes
    // the new account's username before the drafts are persisted.
    if (!user.value) {
      const createdUser = await authApi.register({ username: studentName.value.trim() })
      const sessionUser = await authApi.login({ username: createdUser.username })
      setSessionUser(sessionUser)
    }

    // The recap slip reads real numbers, so capture the draft counts before
    // flush() unstages them.
    const summaryCourses = draftCourses.value.map((c) => ({
      name: c.name,
      colorId: c.colorId,
    }))
    const classBlocks = draftSchedules.value.length

    const created = await flush()
    for (const { tempId, course } of created) {
      const editor = editors.value.find((e) => e.id === tempId)
      if (editor) {
        editor.persistedId = course.id
      }
      emit('created', course.id)
    }

    // First setup celebrates on its own screen; mid-app adds keep the toast.
    if (firstSetup) {
      setSavedSummary({ courses: summaryCourses, classBlocks })
    }

    toastSuccess(
      touched.length > 1
        ? 'All courses and schedules saved successfully.'
        : 'Course and schedule saved successfully.',
    )
  } catch (error) {
    toastError(errorMessage(error))
    return
  } finally {
    saving.value = false
  }

  router.replace(firstSetup ? '/setup-complete' : '/calendar')
}

function retryFailed() {
  for (const block of blocks.value) {
    for (const schedule of block.schedules) {
      if (schedule.state === 'failed') {
        schedule.state = 'draft'
        schedule.error = ''
      }
    }
    block.state = blockStatus(block)
  }

  void saveAll()
}

defineExpose({
  courseName,
  selectedColorId,
  blocks,
  pendingSlot,
  hasUnsavedChanges,
  isOpen,
  stage,
  editors,
  activeEditorId,
})
</script>

<template>
  <div class="relative h-[100svh] w-full overflow-hidden bg-[#F6F7EE]">
    <!-- Background Week Calendar Preview -->
    <div class="absolute inset-x-0 top-[100px] z-0 bottom-[calc(4rem+env(safe-area-inset-bottom))]">
      <WeekPreview
        :blocks="previewBlocks"
        :bottom-clearance="isOpen && stage === 'partial' ? 210 : 0"
        @select-slot="handleSelectSlot"
        @select-block="handleSelectBlock"
        @move-block="handleMoveBlock"
      />
    </div>

    <!-- Top navigation: actions and onboarding steps above the title row -->
    <header ref="topBarEl" class="absolute inset-x-0 top-0 z-40 px-3 pt-2">
      <div class="relative flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Go back"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00A4C8] text-white shadow-[0_3px_0_#007B99] transition-all hover:bg-[#0096B7] active:translate-y-0.5 active:shadow-[0_1px_0_#007B99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2"
          @click="goBack"
        >
          <ArrowLeft class="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
        </Button>

        <StepProgress
          class="absolute left-1/2 -translate-x-1/2"
          :active-step="3"
          :step-labels="ONBOARDING_STEP_LABELS"
          interactive
          @select="onStepSelect"
        />

        <Button
          type="button"
          data-testid="submit-schedule"
          aria-label="Submit schedule"
          :aria-busy="saving"
          :disabled="!canSaveAll"
          class="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#007B99] px-4 font-sans text-sm font-bold text-white shadow-[0_3px_0_#00556B] transition-all hover:bg-[#006B85] active:translate-y-0.5 active:shadow-[0_1px_0_#00556B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007B99] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:translate-y-0"
          style="font-family: 'Quicksand', sans-serif; font-weight: 700"
          @click="requestSubmit"
        >
          <svg
            v-if="saving"
            class="h-4 w-4 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <Check v-else class="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          <span>{{ saving ? 'Saving...' : 'Submit' }}</span>
        </Button>
      </div>

      <div class="flex h-12 items-center justify-center">
        <h1
          class="min-w-0 flex-1 truncate px-2 text-center text-2xl font-bold text-[#1E293B]"
          style="font-family: 'Quicksand', sans-serif"
        >
          Create a Schedule
        </h1>
      </div>
    </header>

    <CourseEditorDrawer
      ref="drawerRef"
      :editor="activeEditor"
      :open="isOpen"
      :stage="stage"
      :saving="saving"
      :can-save="isEditorValid(activeEditor)"
      :dirty="isEditorDirty(activeEditor)"
      :portal="props.portal"
      :unavailable-days="unavailableDaysForBlock"
      @update:open="onOpenChange"
      @update:stage="setStage"
      @save="saveCourse"
      @close="closeDrawer"
      @discard="handleConfirmedDiscard"
      @keep-editing="handleConfirmedKeepEditing"
      @submit="requestSubmit"
      @add-block="addBlock"
      @remove="removeBlock"
      @toggle-day="toggleDay"
      @update:start-time="onStartTimeChange"
      @update:end-time="onEndTimeChange"
    >
      <template #footer>
        <div v-show="stage === 'full'" class="flex gap-2">
          <Button
            v-if="blocks.some((block) => blockStatus(block) === 'failed')"
            type="button"
            variant="outline"
            class="flex-1 rounded-xl border border-red-200 bg-[#FDFEF7] px-4 py-3 font-sans text-sm font-bold text-red-700 transition-colors hover:bg-red-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            :disabled="saving"
            @click="retryFailed"
          >
            Retry failed blocks
          </Button>
        </div>
      </template>
    </CourseEditorDrawer>

    <!-- Course dock: one chip per course editor, pinned + at the right -->
    <footer
      class="absolute inset-x-0 bottom-0 z-[60] flex min-h-16 items-center gap-2 border-t border-[#CBD5E1] bg-[#F6F7EE] px-3 pb-[env(safe-area-inset-bottom)]"
    >
      <div
        class="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-2.5"
        style="scrollbar-width: none"
      >
        <div
          v-for="editor in editors"
          :id="`course-chip-${editor.id}`"
          :key="editor.id"
          data-testid="course-chip"
          role="group"
          class="flex h-11 max-w-44 shrink-0 items-stretch overflow-hidden rounded-xl border font-sans text-sm font-bold transition-all"
          :class="
            editor.id === activeEditorId
              ? 'border-transparent'
              : 'border-[#D5EBF1] bg-[#FDFEF7] text-[#1E293B] shadow-[0_2px_0_#E2E8F0] hover:border-[#00A4C8] hover:bg-[#F0F8FA]'
          "
          :style="
            editor.id === activeEditorId
              ? {
                  backgroundColor: paletteFor(editor.colorId).bg,
                  borderColor: paletteFor(editor.colorId).border,
                  color: paletteFor(editor.colorId).text,
                  boxShadow: `0 3px 0 ${paletteFor(editor.colorId).border}`,
                }
              : {}
          "
        >
          <button
            type="button"
            :aria-pressed="editor.id === activeEditorId"
            :aria-label="`Switch to ${editor.name.trim() || 'New course'}`"
            class="flex min-w-0 flex-1 items-center gap-2 px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00A4C8] active:scale-[0.97]"
            @click="selectCourseChip(editor.id)"
          >
            <span
              class="h-3 w-3 shrink-0 rounded-full"
              :style="{ backgroundColor: paletteFor(editor.colorId).solid }"
              aria-hidden="true"
            ></span>
            <span class="min-w-0 truncate">{{ editor.name.trim() || 'New course' }}</span>
            <span
              v-if="isEditorDirty(editor)"
              class="ml-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
              :style="{ backgroundColor: paletteFor(editor.colorId).solid }"
              aria-label="Unsaved changes"
            ></span>
          </button>
          <button
            v-if="editor.id === activeEditorId"
            type="button"
            data-testid="remove-course"
            :aria-label="`Remove ${editor.name.trim() || 'New course'}`"
            class="flex w-11 shrink-0 items-center justify-center border-l transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00A4C8]"
            :style="{ borderColor: paletteFor(editor.colorId).border }"
            @click.stop="requestRemoveEditor(editor.id)"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <!-- Empty-dock hint: a working CTA that doubles as the add affordance -->
        <button
          v-if="showAddCourseHint"
          type="button"
          data-testid="add-course-hint"
          aria-label="Add a course"
          :disabled="saving"
          class="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-[#7FC8DC] bg-[#F0F8FA] px-3.5 font-sans text-xs font-bold whitespace-nowrap text-[#007B99] transition-all hover:bg-[#E8F6FA] hover:text-[#006880] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60"
          @click="guardCourseNavigation(addCourseEditor)"
        >
          <Plus class="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          Add a course
        </button>
      </div>

      <button
        type="button"
        data-testid="add-course"
        aria-label="Add another course"
        :disabled="saving"
        class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#BCE3ED] bg-[#E8F6FA] text-[#007B99] shadow-[0_3px_0_#B0DBE5] transition-all hover:bg-[#DCF1F7] hover:text-[#006880] active:translate-y-0.5 active:shadow-[0_1px_0_#B0DBE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0"
        @click="guardCourseNavigation(addCourseEditor)"
      >
        <span
          v-if="showAddCourseHint"
          class="absolute -inset-1 rounded-full border-2 border-[#00A4C8]/50 motion-safe:animate-ping"
          aria-hidden="true"
        />
        <Plus class="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
      </button>
    </footer>

    <DialogShell v-model:open="showSubmitConfirm" title="Submit your schedule?" :busy="saving">
      <p
        class="mt-2 text-sm text-[#7B8B97]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        {{ submitConfirmMessage }}
      </p>

      <template #actions="{ disabled, dismiss }">
        <Button
          type="button"
          variant="secondary"
          size="touch"
          data-testid="submit-cancel"
          :disabled="disabled"
          style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          @click="dismiss"
        >
          Keep editing
        </Button>

        <Button
          type="button"
          variant="tactile"
          size="touch"
          data-testid="submit-confirm"
          :disabled="disabled"
          :aria-busy="saving"
          style="font-family: 'Quicksand', sans-serif; font-weight: 700"
          @click="confirmSubmit"
        >
          Submit
        </Button>
      </template>
    </DialogShell>

    <DialogShell
      :open="showRemoveDialog"
      title="Remove course?"
      @update:open="showRemoveDialog = $event"
      @cancel="cancelRemoveEditor"
    >
      <p
        class="mt-2 text-sm text-[#7B8B97]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        This removes {{ pendingRemoveName }} and its class times from your draft.
      </p>

      <template #actions="{ dismiss }">
        <button
          type="button"
          class="min-h-[44px] rounded-xl border-b-4 border-[#CBD5E1] bg-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#334155] transition-all duration-75 hover:bg-[#D7DEE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 active:translate-y-1 active:border-b-0"
          style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          @click="dismiss"
        >
          Keep course
        </button>

        <button
          type="button"
          class="min-h-[44px] rounded-xl border-b-4 border-[#991B1B] bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white transition-all duration-75 hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2 active:translate-y-1 active:border-b-0"
          style="font-family: 'Quicksand', sans-serif; font-weight: 700"
          @click="confirmRemoveEditor"
        >
          Remove
        </button>
      </template>
    </DialogShell>
  </div>
</template>
