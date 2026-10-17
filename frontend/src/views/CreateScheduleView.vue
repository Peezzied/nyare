<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalog } from '@/composables/useCatalog'
import { useCourseDrafts, type DraftCourse, type DraftSchedule } from '@/composables/useCourseDrafts'
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
import { Drawer, DrawerClose, DrawerContent, DrawerHeader } from '@/components/ui/drawer'
import DiscardDraftConfirmDialog from '@/components/DiscardDraftConfirmDialog.vue'
import { Check, Plus, X } from 'lucide-vue-next'
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
const { draftCourses, draftSchedules, stageCourse } = useCourseDrafts()

const catalogAvailable = ref(true)
const currentDraftTempId = ref<string | null>(null)
const isSaved = ref(false)
const showDiscardDialog = ref(false)

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
  if (event.key === 'Escape' && isOpen.value && !showDiscardDialog.value) {
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
  return buildKnownSet(catalogCourses.value, catalogSchedules.value, {
    courses: draftCourses.value,
    schedules: draftSchedules.value,
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

const courseName = ref('')
const selectedColorId = ref(COURSE_PALETTE_24[0]!.id)
const colorOpen = ref(false)
const blocks = ref<TimeBlockDraft[]>([createBlock()])
const saving = ref(false)

const pendingSlot = ref<PendingSlot | null>(null)
const pendingBlockId = ref<string | null>(null)

const selectedColor = computed(
  () =>
    COURSE_PALETTE_24.find((color) => color.id === selectedColorId.value) ?? COURSE_PALETTE_24[0]!,
)

const previewBlocks = computed(() => {
  const activeList = derivePreviewBlocks(blocks.value, courseName.value, selectedColor.value)

  const otherDraftBlocks: PreviewBlock[] = []
  for (const course of draftCourses.value) {
    if (currentDraftTempId.value && course.tempId === currentDraftTempId.value) {
      continue
    }
    const color =
      COURSE_PALETTE_24.find((c) => c.id === course.colorId) ?? COURSE_PALETTE_24[0]!
    for (const schedule of course.schedules) {
      const safeTime = schedule.startTime.replace(/[^a-zA-Z0-9_-]/g, '')
      otherDraftBlocks.push({
        id: `${course.tempId}-${schedule.day}-${safeTime}`,
        day: schedule.day,
        title: course.name,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        color: color.solid,
        blockId: course.tempId,
      })
    }
  }

  return [...otherDraftBlocks, ...activeList]
})

function loadCourseDraft(course: DraftCourse) {
  courseName.value = course.name
  selectedColorId.value = course.colorId
  currentDraftTempId.value = course.tempId
  isSaved.value = true

  const grouped = new Map<string, DayOfWeek[]>()
  for (const s of course.schedules) {
    const key = `${s.startTime}|${s.endTime}`
    const days = grouped.get(key) ?? []
    days.push(s.day)
    grouped.set(key, days)
  }

  if (grouped.size > 0) {
    const newBlocks: TimeBlockDraft[] = []
    for (const [key, days] of grouped.entries()) {
      const [start = '', end = ''] = key.split('|')
      const block = createBlock()
      block.selectedDays = days
      block.startTime = start
      block.endTime = end
      block.state = 'saved'
      syncScheduleDrafts(block)
      for (const s of block.schedules) {
        s.state = 'saved'
      }
      newBlocks.push(block)
    }
    blocks.value = newBlocks
  } else {
    blocks.value = [createBlock()]
  }

  lastSavedSnapshot.value = JSON.stringify({
    name: courseName.value.trim(),
    color: selectedColorId.value,
    blocks: blocks.value.map((b) => ({
      days: b.selectedDays,
      start: b.startTime,
      end: b.endTime,
    })),
  })
}

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
    setStage('full')
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
  setStage('full')
}

function handleSelectBlock(blockId: string) {
  isOpen.value = true
  setStage('partial')

  const matchedCourse = draftCourses.value.find((c) => c.tempId === blockId)
  if (matchedCourse && matchedCourse.tempId !== currentDraftTempId.value) {
    if (hasUnsavedChanges.value) {
      showDiscardDialog.value = true
      return
    }
    loadCourseDraft(matchedCourse)
    return
  }

  const el = document.getElementById(`block-card-${blockId}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function discardPendingSlot() {
  if (pendingSlot.value) {
    pendingSlot.value = null
    if (pendingBlockId.value) {
      blocks.value = blocks.value.filter((b) => b.id !== pendingBlockId.value)
      if (blocks.value.length === 0) {
        blocks.value = [createBlock()]
      }
      pendingBlockId.value = null
    }
  }
}

const allBlocksValid = computed(
  () =>
    blocks.value.length > 0 &&
    blocks.value.every((block) => {
      const selected = block.selectedDays.length > 0
      const validTimes =
        block.startTime !== '' && block.endTime !== '' && block.startTime < block.endTime
      return selected && validTimes
    }),
)

const canSubmit = computed(
  () => courseName.value.trim().length > 0 && allBlocksValid.value && !saving.value,
)

const pendingScheduleCount = computed(
  () =>
    blocks.value
      .flatMap((block) => block.schedules)
      .filter((schedule) => schedule.state !== 'saved').length,
)

interface SavedSnapshot {
  name: string
  color: string
  blocks: { days: DayOfWeek[]; start: string; end: string }[]
}

const lastSavedSnapshot = ref<string>('')

const hasUnsavedChanges = computed(() => {
  if (isSaved.value) {
    const effectiveBlocks =
      pendingSlot.value && pendingBlockId.value
        ? blocks.value.filter((b) => {
            if (b.id !== pendingBlockId.value) return true
            const matchesDays =
              b.selectedDays.length === 1 && b.selectedDays[0] === pendingSlot.value!.day
            const matchesTimes =
              b.startTime === pendingSlot.value!.startTime &&
              b.endTime === pendingSlot.value!.endTime
            return !(matchesDays && matchesTimes)
          })
        : blocks.value

    const current = JSON.stringify({
      name: courseName.value.trim(),
      color: selectedColorId.value,
      blocks: effectiveBlocks.map((b) => ({
        days: b.selectedDays,
        start: b.startTime,
        end: b.endTime,
      })),
    })
    if (current === lastSavedSnapshot.value) {
      return false
    }
    return true
  }
  if (courseName.value.trim().length > 0) {
    return true
  }
  const hasFailedOrPending = blocks.value.some((b) =>
    b.schedules.some((s) => s.state === 'failed' || (s.submitted && s.state !== 'saved')),
  )
  if (hasFailedOrPending) {
    return true
  }
  if (
    pendingSlot.value &&
    pendingBlockId.value &&
    blocks.value.length === 1 &&
    blocks.value[0]?.id === pendingBlockId.value
  ) {
    const block = blocks.value[0]
    const matchesPendingDays =
      block.selectedDays.length === 1 && block.selectedDays[0] === pendingSlot.value.day
    const matchesPendingTimes =
      block.startTime === pendingSlot.value.startTime && block.endTime === pendingSlot.value.endTime
    if (matchesPendingDays && matchesPendingTimes) {
      return false
    }
  }
  const hasSelectedDays = blocks.value.some((b) => b.selectedDays.length > 0)
  const hasTimes = blocks.value.some((b) => b.startTime !== '' || b.endTime !== '')
  return hasSelectedDays || hasTimes
})

function unavailableDaysForBlock(block: TimeBlockDraft): DayOfWeek[] {
  if (!catalogAvailable.value) {
    return []
  }
  const knownSchedules = currentDraftTempId.value
    ? knownSet.value.schedules.filter((s) => s.courseId !== currentDraftTempId.value)
    : knownSet.value.schedules

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
      const clash = findClash(candidate, knownSet.value.schedules)
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
  discardPendingSlot()
  isOpen.value = false
  emit('update:open', false)
  emit('close')
  if (router.currentRoute.value.path === '/create-schedule') {
    router.push('/schedule')
  }
}

function resetFormState() {
  courseName.value = ''
  selectedColorId.value = COURSE_PALETTE_24[0]!.id
  blocks.value = [createBlock()]
  currentDraftTempId.value = null
  isSaved.value = false
  lastSavedSnapshot.value = ''
}

function handleDiscard() {
  discardPendingSlot()

  const staged = currentDraftTempId.value
    ? draftCourses.value.find((c) => c.tempId === currentDraftTempId.value)
    : undefined

  if (isSaved.value && lastSavedSnapshot.value) {
    try {
      const saved = JSON.parse(lastSavedSnapshot.value) as SavedSnapshot
      courseName.value = saved.name || ''
      selectedColorId.value = saved.color || COURSE_PALETTE_24[0]!.id
      if (Array.isArray(saved.blocks) && saved.blocks.length > 0) {
        blocks.value = saved.blocks.map((b) => {
          const newBlock = createBlock()
          newBlock.selectedDays = b.days || []
          newBlock.startTime = b.start || ''
          newBlock.endTime = b.end || ''
          newBlock.state = 'saved'
          syncScheduleDrafts(newBlock)
          for (const s of newBlock.schedules) {
            s.state = 'saved'
          }
          return newBlock
        })
      } else if (staged) {
        loadCourseDraft(staged)
      } else {
        blocks.value = [createBlock()]
      }
    } catch {
      if (staged) {
        loadCourseDraft(staged)
      } else {
        resetFormState()
      }
    }
  } else if (staged) {
    loadCourseDraft(staged)
  } else {
    resetFormState()
  }

  showDiscardDialog.value = false
  closeImmediately()
}

function handleKeepEditing() {
  showDiscardDialog.value = false
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
  return 'Something went wrong while saving the course.'
}

async function submit() {
  if (courseName.value.trim().length === 0) {
    toast.error('Enter a course name before saving.')
    return
  }
  if (!allBlocksValid.value) {
    toast.error(
      'Each time block needs at least one weekday, and every time must have an end time after its start time.',
    )
    return
  }

  try {
    await loadCatalog()
  } catch {
    catalogAvailable.value = false
  }

  if (catalogAvailable.value) {
    const currentTempId = currentDraftTempId.value
    const coursesToCheck = currentTempId
      ? knownSet.value.courses.filter((c) => c.id !== currentTempId)
      : knownSet.value.courses

    const duplicate = findDuplicateName(courseName.value, coursesToCheck)
    if (duplicate) {
      toast.error(`A course named "${courseName.value.trim()}" already exists.`)
      return
    }

    const schedulesToCheck = currentTempId
      ? knownSet.value.schedules.filter((s) => s.courseId !== currentTempId)
      : knownSet.value.schedules

    for (let i = 0; i < blocks.value.length; i++) {
      const b1 = blocks.value[i]!
      for (const day of b1.selectedDays) {
        const candidate: ScheduleCandidate = {
          day,
          startTime: b1.startTime,
          endTime: b1.endTime,
        }
        const clash = findClash(candidate, schedulesToCheck)
        if (clash) {
          toast.error(`A class time clashes with ${clash.courseName || 'another class'} on ${day}.`)
          return
        }

        for (let j = i + 1; j < blocks.value.length; j++) {
          const b2 = blocks.value[j]!
          if (
            b2.selectedDays.includes(day) &&
            rangesOverlap(b1.startTime, b1.endTime, b2.startTime, b2.endTime)
          ) {
            toast.error(`Two time blocks for this course overlap on ${day}.`)
            return
          }
        }
      }
    }
  }

  saving.value = true

  try {
    const tempId = currentDraftTempId.value ?? `draft-${Date.now()}`
    currentDraftTempId.value = tempId

    const stagedSchedules: DraftSchedule[] = []
    for (const block of blocks.value) {
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
      tempId,
      name: courseName.value.trim(),
      colorId: selectedColorId.value,
      schedules: stagedSchedules,
    })

    isSaved.value = true
    lastSavedSnapshot.value = JSON.stringify({
      name: courseName.value.trim(),
      color: selectedColorId.value,
      blocks: blocks.value.map((b) => ({
        days: b.selectedDays,
        start: b.startTime,
        end: b.endTime,
      })),
    })
    toast.success('Course and schedule saved successfully.')
    pendingSlot.value = null
    pendingBlockId.value = null
    emit('created', tempId as unknown as number)
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

  void submit()
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
})
</script>

<template>
  <div class="relative h-[100svh] w-full overflow-hidden bg-[#F6F7EE]">
    <!-- Background Week Calendar Preview -->
    <div class="absolute inset-0 z-0">
      <WeekPreview
        :blocks="previewBlocks"
        :pending-slot="pendingSlot"
        :selected-color="selectedColor.solid"
        @select-slot="handleSelectSlot"
        @select-block="handleSelectBlock"
      />
    </div>

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
        class="border-t border-[#C2E8F1] bg-[#FDFEF7] outline-none shadow-2xl"
        @click:handle="toggleStage"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <!-- Header -->
        <DrawerHeader
          class="relative z-10 flex flex-row w-full items-center justify-between px-5 py-0"
        >
          <DrawerClose as-child>
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
          </DrawerClose>

          <Button
            v-show="stage === 'full'"
            type="button"
            aria-label="Confirm"
            :aria-busy="saving"
            :disabled="!canSubmit"
            class="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#007B99] px-4 font-sans text-sm font-bold text-white shadow-[0_3px_0_#00556B] transition-all hover:bg-[#006B85] active:translate-y-0.5 active:shadow-[0_1px_0_#00556B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007B99] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:translate-y-0"
            style="font-family: 'Quicksand', sans-serif; font-weight: 700"
            @click="submit"
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
          <form class="min-w-0 space-y-6" @submit.prevent="submit">
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
                class="w-full bg-transparent px-0 py-1 font-sans text-lg font-bold text-[#1E293B] placeholder:font-semibold placeholder:text-slate-400 outline-none disabled:cursor-not-allowed disabled:text-slate-400 sm:text-2xl"
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

            <p
              v-if="pendingScheduleCount > 0 && currentDraftTempId !== null && stage === 'full'"
              class="text-xs font-medium text-[#7B8B97]"
            >
              {{ pendingScheduleCount }} schedule record{{ pendingScheduleCount === 1 ? '' : 's' }}
              still pending.
            </p>

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

    <DiscardDraftConfirmDialog
      :open="showDiscardDialog"
      @update:open="showDiscardDialog = $event"
      @keep-editing="handleKeepEditing"
      @discard="handleDiscard"
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
