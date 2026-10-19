<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalog } from '@/composables/useCatalog'
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Drawer, DrawerContent, DrawerHeader } from '@/components/ui/drawer'
import DiscardDraftConfirmDialog from '@/components/DiscardDraftConfirmDialog.vue'
import { Plus, Save, SaveAll, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Toaster } from '@/components/ui/sonner'
import type { DrawerOpenChangeDetails } from 'reka-ui'
import TimeBlockCard, {
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

const router = useRouter()
const { courses: catalogCourses, schedules: catalogSchedules, loadCatalog } = useCatalog()
const { draftCourses, stageCourse, unstageCourse } = useCourseDrafts()

const catalogAvailable = ref(true)
const showDiscardDialog = ref(false)
const showRemoveDialog = ref(false)
const pendingRemoveId = ref<string | null>(null)
const showSwitchDialog = ref(false)
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
  () =>
    editors.value.find((e) => e.id === activeEditorId.value) ?? editors.value[0]!,
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
const colorOpen = computed({
  get: () => activeEditor.value.colorOpen,
  set: (v: boolean) => {
    activeEditor.value.colorOpen = v
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

const hasUnsavedChanges = computed(() => editors.value.some((e) => isEditorDirty(e)))

const dirtyEditors = computed(() => editors.value.filter((e) => isEditorDirty(e)))
const discardMessage = computed(() =>
  dirtyEditors.value.length > 1
    ? `This discards unsaved changes across ${dirtyEditors.value.length} courses.`
    : undefined,
)

const touchedEditors = computed(() => editors.value.filter((e) => isEditorTouched(e)))
const canSaveAll = computed(() => !saving.value && touchedEditors.value.length > 0)
const saveAllLabel = computed(() =>
  touchedEditors.value.length > 1 ? `Save all (${touchedEditors.value.length})` : 'Save all',
)

onMounted(async () => {
  try {
    await loadCatalog()
  } catch {
    catalogAvailable.value = false
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
    !showDiscardDialog.value &&
    !showRemoveDialog.value &&
    !showSwitchDialog.value
  ) {
    if (hasUnsavedChanges.value) {
      event.preventDefault()
      event.stopPropagation()
      showDiscardDialog.value = true
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

const SNAP_PARTIAL = '210px'
const SNAP_FULL = 1
const snapPoints = [SNAP_PARTIAL, SNAP_FULL]

const activeSnapPoint = ref<string | number>(
  props.initialStage === 'full' ? SNAP_FULL : SNAP_PARTIAL,
)

const isFull = computed(() => activeSnapPoint.value === SNAP_FULL || activeSnapPoint.value === 1)

const stage = computed<'partial' | 'full'>({
  get: () => (isFull.value ? 'full' : 'partial'),
  set: (val) => {
    activeSnapPoint.value = val === 'full' ? SNAP_FULL : SNAP_PARTIAL
  },
})

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

watch(activeSnapPoint, (val) => {
  if (val === SNAP_FULL || val === 1) {
    emit('update:stage', 'full')
  } else if (val === SNAP_PARTIAL) {
    emit('update:stage', 'partial')
  }
})

function setStage(nextStage: 'partial' | 'full') {
  stage.value = nextStage
  emit('update:stage', nextStage)
}

function toggleStage() {
  setStage(isFull.value ? 'partial' : 'full')
}

function onCourseDetailsClick() {
  if (stage.value === 'partial') {
    setStage('full')
  }
}

function handleInputFocus() {
  if (stage.value === 'partial') {
    setStage('full')
  }
}

function handleInput() {
  if (stage.value === 'partial') {
    setStage('full')
  }
}

function onColorToggleClick() {
  if (stage.value === 'partial') {
    setStage('full')
    colorOpen.value = true
  }
}

const scrollContainerRef = ref<HTMLElement | null>(null)
let touchStartY = 0
let touchStartX = 0

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  touchStartY = touch.clientY
  touchStartX = touch.clientX
}

function handleTouchEnd(e: TouchEvent) {
  const touch = e.changedTouches[0]
  if (!touch) return
  const deltaY = touch.clientY - touchStartY
  const deltaX = touch.clientX - touchStartX

  if (Math.abs(deltaY) > 35 && Math.abs(deltaY) > Math.abs(deltaX)) {
    if (deltaY < 0 && stage.value === 'partial') {
      setStage('full')
    } else if (deltaY > 0 && stage.value === 'full') {
      const isAtTop = !scrollContainerRef.value || scrollContainerRef.value.scrollTop <= 5
      if (isAtTop) {
        setStage('partial')
      }
    }
  }
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
      showDiscardDialog.value = true
      return
    }
    closeImmediately()
    return
  }
  isOpen.value = true
  emit('update:open', true)
}

const colorOptions = COURSE_PALETTE_24
const saving = ref(false)

function paletteFor(colorId: string) {
  return COURSE_PALETTE_24.find((color) => color.id === colorId) ?? COURSE_PALETTE_24[0]!
}

const selectedColor = computed(() => paletteFor(selectedColorId.value))

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
    showSwitchDialog.value = true
    return
  }
  action()
}

function selectCourseChip(id: string) {
  if (id === activeEditorId.value) {
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
  showSwitchDialog.value = true
}

function confirmSwitchDiscard() {
  const action = pendingSwitchAction
  pendingSwitchAction = null
  showSwitchDialog.value = false
  revertEditor(activeEditor.value)
  action?.()
}

function cancelSwitchGuard() {
  pendingSwitchAction = null
  showSwitchDialog.value = false
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
  removeEditor(id)
}

function removeEditor(id: string) {
  const index = editors.value.findIndex((e) => e.id === id)
  if (index < 0) return

  const editor = editors.value[index]!
  editors.value.splice(index, 1)
  if (editor.isSaved) {
    unstageCourse(editor.id)
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
    removeEditor(pendingRemoveId.value)
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

const isAddAnotherTimeDisabled = computed(() => {
  if (blocks.value.length === 0) {
    return false
  }
  const currentBlock = blocks.value[blocks.value.length - 1]!
  if (
    !currentBlock.startTime ||
    !currentBlock.endTime ||
    currentBlock.startTime >= currentBlock.endTime
  ) {
    return false
  }
  const unavail = unavailableDaysForBlock(currentBlock)
  return unavail.length === 7
})

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
        toast.error(`A class time clashes with ${clash.courseName || 'another class'} on ${day}.`)
        break
      }
      const siblings = blocks.value.filter((b) => b.id !== block.id)
      const siblingOverlap = siblings.find(
        (sib) =>
          sib.selectedDays.includes(day) &&
          rangesOverlap(block.startTime, block.endTime, sib.startTime, sib.endTime),
      )
      if (siblingOverlap) {
        toast.error(`Two time blocks for this course overlap on ${day}.`)
        break
      }
    }
  }
}

function goBack() {
  if (hasUnsavedChanges.value) {
    showDiscardDialog.value = true
    return
  }
  closeImmediately()
}

function closeImmediately() {
  if (!isOpen.value) {
    return
  }
  for (const editor of editors.value) {
    discardEditorPendingSlot(editor)
  }
  isOpen.value = false
  emit('update:open', false)
  emit('close')
  if (router.currentRoute.value.path === '/create-schedule') {
    router.push('/schedule')
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

  showDiscardDialog.value = false
  closeImmediately()
}

function handleKeepEditing() {
  showDiscardDialog.value = false
  const dirty = dirtyEditors.value[0]
  if (dirty) {
    activateEditor(dirty.id)
    setStage('full')
    return
  }
  isOpen.value = true
  emit('update:open', true)
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
  const coursesToCheck = knownSet.value.courses.filter((c) => c.id !== editor.id)
  const duplicate = findDuplicateName(editor.name, coursesToCheck)
  if (duplicate) {
    return `A course named "${editor.name.trim()}" already exists.`
  }

  const schedulesToCheck = knownSet.value.schedules.filter((s) => s.courseId !== editor.id)
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
  toast.error(message, {
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
  })

  editor.isSaved = true
  editor.lastSavedSnapshot = editorSnapshot(editor)
  editor.pendingSlot = null
  editor.pendingBlockId = null
  emit('created', editor.id as unknown as number)
}

async function saveCourse() {
  const editor = activeEditor.value
  if (!isEditorTouched(editor)) {
    toast.error('Add a course name and class time before saving.')
    return
  }

  const basicsError = editorBasicsError(editor)
  if (basicsError) {
    setStage('full')
    toast.error(basicsError)
    return
  }

  try {
    await loadCatalog()
  } catch {
    catalogAvailable.value = false
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
    toast.success('Course and schedule saved successfully.')
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    saving.value = false
  }
}

async function saveAll() {
  const touched = touchedEditors.value
  if (touched.length === 0) {
    toast.error('Add a course before saving.')
    return
  }

  for (const editor of touched) {
    const basicsError = editorBasicsError(editor)
    if (basicsError) {
      toastCourseError(basicsError, editor)
      return
    }
  }

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

  saving.value = true

  try {
    for (const editor of touched) {
      stageEditor(editor)
    }

    toast.success(
      touched.length > 1
        ? 'All courses and schedules saved successfully.'
        : 'Course and schedule saved successfully.',
    )
  } catch (error) {
    toast.error(errorMessage(error))
  } finally {
    saving.value = false
  }
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

function selectColor(colorId: string) {
  selectedColorId.value = colorId
  colorOpen.value = false
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
    <div
      class="absolute inset-x-0 top-14 z-0 bottom-[calc(4rem+env(safe-area-inset-bottom))]"
    >
      <WeekPreview
        :blocks="previewBlocks"
        @select-slot="handleSelectSlot"
        @select-block="handleSelectBlock"
        @move-block="handleMoveBlock"
      />
    </div>

    <!-- Top navigation: back on the left, global Save all on the right -->
    <header
      class="absolute inset-x-0 top-0 z-40 flex h-14 items-center justify-between px-3"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Go back"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#334155] transition-colors hover:bg-[#C2E8F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8]"
        @click="goBack"
      >
        <X class="h-5 w-5" aria-hidden="true" />
      </Button>

      <Button
        type="button"
        data-testid="save-all"
        aria-label="Save all"
        :aria-busy="saving"
        :disabled="!canSaveAll"
        class="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#007B99] px-4 font-sans text-sm font-bold text-white shadow-[0_3px_0_#00556B] transition-all hover:bg-[#006B85] active:translate-y-0.5 active:shadow-[0_1px_0_#00556B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007B99] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:translate-y-0"
        style="font-family: 'Quicksand', sans-serif; font-weight: 700"
        @click="saveAll"
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
        <SaveAll v-else class="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
        <span>{{ saving ? 'Saving...' : saveAllLabel }}</span>
      </Button>
    </header>

    <Drawer
      :open="isOpen"
      :modal="false"
      v-model:snap-point="activeSnapPoint"
      :snap-points="snapPoints"
      :default-snap-point="SNAP_PARTIAL"
      @update:open="onOpenChange"
    >
      <DrawerContent
        :portal="props.portal"
        :full-view="stage === 'full'"
        class="border-t border-[#C2E8F1] bg-[#FDFEF7] outline-none shadow-2xl data-[swipe-direction=down]:bottom-[calc(4rem+env(safe-area-inset-bottom))] data-[swipe-direction=down]:h-[calc(100svh-4rem-env(safe-area-inset-bottom))]"
        @click:handle="toggleStage"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        @interact-outside.prevent
      >
        <DrawerHeader class="relative z-10 flex w-full flex-row items-center justify-between px-5 !py-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close drawer"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#334155] transition-colors hover:bg-[#C2E8F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8]"
            @click="goBack"
          >
            <X class="size-5" aria-hidden="true" />
          </Button>

          <Button
            v-show="stage === 'full'"
            type="button"
            data-testid="save-course"
            aria-label="Save course"
            :aria-busy="saving"
            :disabled="saving || !isEditorValid(activeEditor)"
            class="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#007B99] px-4 font-sans text-sm font-bold text-white shadow-[0_3px_0_#00556B] transition-all hover:bg-[#006B85] active:translate-y-0.5 active:shadow-[0_1px_0_#00556B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007B99] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:translate-y-0"
            style="font-family: 'Quicksand', sans-serif; font-weight: 700"
            @click="saveCourse"
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
            <Save v-else class="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
            <span>{{ saving ? 'Saving...' : 'Save' }}</span>
          </Button>
        </DrawerHeader>

        <div
          ref="scrollContainerRef"
          class="relative z-10 min-h-0 flex-1 overflow-x-hidden"
          :class="
            stage === 'full'
              ? 'overflow-y-auto py-2 overscroll-contain'
              : 'overflow-y-hidden pt-2 pb-6'
          "
        >
          <form class="min-w-0 space-y-6" @submit.prevent="saveAll">
            <!-- Course details -->
            <section
              data-testid="course-details-section"
              class="space-y-4 px-12"
              :class="{ 'cursor-pointer select-none': stage === 'partial' }"
              @click="onCourseDetailsClick"
            >
              <input
                id="course-name-input"
                v-model.trim="courseName"
                type="text"
                required
                maxlength="128"
                placeholder="Add Course Title"
                :readonly="stage === 'partial'"
                :tabindex="stage === 'partial' ? -1 : 0"
                :disabled="saving"
                aria-label="Course name"
                class="w-full bg-transparent px-0 py-1 font-sans text-2xl font-bold text-[#1E293B] placeholder:font-semibold placeholder:text-slate-400 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                :class="{ 'cursor-pointer': stage === 'partial' }"
                @focus="handleInputFocus"
                @input="handleInput"
              />
              <Popover v-model:open="colorOpen">
                <PopoverTrigger as-child>
                  <button
                    type="button"
                    data-testid="color-toggle"
                    :aria-expanded="colorOpen"
                    :aria-haspopup="true"
                    aria-label="Course color"
                    :disabled="saving"
                    class="inline-flex min-w-0 items-center gap-2 rounded-lg border border-[#D5EBF1] bg-[#F0F8FA] px-3 py-2 shadow-xs transition-all hover:border-[#00A4C8] hover:bg-[#E5F3F7] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="onColorToggleClick"
                  >
                    <span
                      class="h-5 w-5 shrink-0 rounded-full border border-black/10 shadow-xs"
                      :style="{ backgroundColor: selectedColor.solid }"
                      aria-hidden="true"
                    ></span>
                    <span
                      class="min-w-0 truncate text-left font-sans text-sm font-semibold text-[#1E293B]"
                      >{{ selectedColor.name }}</span
                    >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 shrink-0 text-[#7B8B97]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  :portal="false"
                  class="z-50 w-auto max-w-full rounded-2xl border border-[#D5EBF1] bg-[#FDFEF7] p-2 shadow-lg"
                  role="listbox"
                  aria-label="Course color options"
                >
                  <div class="grid grid-cols-4 gap-1 p-0.5">
                    <button
                      v-for="color in colorOptions"
                      :key="color.id"
                      type="button"
                      role="option"
                      :aria-selected="selectedColorId === color.id"
                      :aria-pressed="selectedColorId === color.id"
                      :aria-label="color.name"
                      :title="color.name"
                      data-testid="color-swatch"
                      :data-color-id="color.id"
                      class="flex h-11 w-11 items-center justify-center rounded-xl p-1 transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2"
                      @click="selectColor(color.id)"
                    >
                      <span
                        class="flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-bold shadow-xs transition-transform"
                        :class="
                          selectedColorId === color.id
                            ? 'border-[#334155] ring-2 ring-[#00A4C8]'
                            : 'border-black/10'
                        "
                        :style="{ backgroundColor: color.solid }"
                      >
                        <span
                          v-if="selectedColorId === color.id"
                          class="text-white mix-blend-difference"
                          aria-hidden="true"
                          >✓</span
                        >
                      </span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </section>

            <!-- Divider -->
            <hr class="-mx-5 sm:-mx-6 border-t border-[#E2E8F0]/80" />

            <!-- Time blocks -->
            <section class="space-y-4 px-12" aria-labelledby="time-blocks-heading">
              <h2
                id="time-blocks-heading"
                class="text-xs font-bold tracking-wider text-[#475569] uppercase"
              >
                Class times
              </h2>

              <TransitionGroup tag="div" name="time-block" class="relative flex flex-col gap-5">
                <TimeBlockCard
                  v-for="(block, index) in blocks"
                  :id="`block-card-${block.id}`"
                  :key="block.id"
                  :data-block-id="block.id"
                  :block="block"
                  :index="index"
                  :saving="saving"
                  :unavailable-days="unavailableDaysForBlock(block)"
                  @remove="removeBlock(block)"
                  @toggle-day="toggleDay(block, $event)"
                  @update:start-time="onStartTimeChange(block, $event)"
                  @update:end-time="onEndTimeChange(block, $event)"
                />

                <Button
                  key="add-time"
                  type="button"
                  data-testid="add-another-time"
                  :disabled="saving || isAddAnotherTimeDisabled"
                  class="flex min-h-12 w-full items-center justify-center rounded-xl border border-[#BCE3ED] bg-[#E8F6FA] px-4 py-3 font-sans text-sm font-bold text-[#007B99] shadow-[0_3px_0_#B0DBE5] transition-all hover:bg-[#DCF1F7] hover:text-[#006880] active:translate-y-0.5 active:shadow-[0_1px_0_#B0DBE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:active:translate-y-0"
                  @click="addBlock"
                >
                  <Plus class="mr-2 h-4 w-4 stroke-2" aria-hidden="true" />
                  Add another time
                </Button>
              </TransitionGroup>
            </section>

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
          </form>
        </div>
      </DrawerContent>
    </Drawer>

    <!-- Course dock: one chip per course editor, pinned + at the right -->
    <footer
      class="absolute inset-x-0 bottom-0 z-[60] flex min-h-16 items-center gap-2 border-t border-[#CBD5E1] bg-[#FDFEF7] px-3 pb-[env(safe-area-inset-bottom)]"
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
      </div>

      <button
        type="button"
        data-testid="add-course"
        aria-label="Add another course"
        :disabled="saving"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#BCE3ED] bg-[#E8F6FA] text-[#007B99] shadow-[0_3px_0_#B0DBE5] transition-all hover:bg-[#DCF1F7] hover:text-[#006880] active:translate-y-0.5 active:shadow-[0_1px_0_#B0DBE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0"
        @click="guardCourseNavigation(addCourseEditor)"
      >
        <Plus class="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
      </button>
    </footer>

    <DiscardDraftConfirmDialog
      :open="showDiscardDialog"
      :message="discardMessage"
      @update:open="showDiscardDialog = $event"
      @keep-editing="handleKeepEditing"
      @discard="handleDiscard"
    />
    <DiscardDraftConfirmDialog
      :open="showSwitchDialog"
      title="Discard changes?"
      :message="switchGuardMessage"
      @update:open="showSwitchDialog = $event"
      @keep-editing="cancelSwitchGuard"
      @discard="confirmSwitchDiscard"
    />
    <DiscardDraftConfirmDialog
      :open="showRemoveDialog"
      title="Remove course?"
      :message="`This removes ${pendingRemoveName} and its class times from your draft.`"
      confirm-label="Remove"
      cancel-label="Keep course"
      @update:open="showRemoveDialog = $event"
      @keep-editing="cancelRemoveEditor"
      @discard="confirmRemoveEditor"
    />
    <Toaster />
  </div>
</template>

<style scoped>
.time-block-enter-active {
  animation: time-block-land 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
  transform-origin: top center;
}

@keyframes time-block-land {
  0% {
    opacity: 0;
    transform: translateY(26px) scale(0.96) rotate(-0.8deg);
    filter: blur(6px);
  }

  55% {
    opacity: 1;
    filter: blur(0);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0);
    filter: blur(0);
  }
}

.time-block-move {
  transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1);
}

.time-block-leave-active {
  position: absolute;
  width: 100%;
  transition:
    opacity 200ms ease-in,
    transform 280ms cubic-bezier(0.4, 0, 1, 1),
    filter 200ms ease-in;
}

.time-block-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.94);
  filter: blur(6px);
}

@media (prefers-reduced-motion: reduce) {
  .time-block-enter-active {
    animation: time-block-fade 220ms ease-out both;
  }

  .time-block-move,
  .time-block-leave-active {
    transition: none;
  }
}

@keyframes time-block-fade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
