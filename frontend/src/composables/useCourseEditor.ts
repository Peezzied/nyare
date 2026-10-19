import { reactive } from 'vue'
import type { DayOfWeek } from '@/types/api'
import type { DraftCourse, DraftSchedule } from '@/composables/useCourseDrafts'
import { COURSE_PALETTE_24 } from '@/constants/palette'
import { createBlock, syncScheduleDrafts, type TimeBlockDraft } from '@/components/TimeBlockCard.vue'
import type { PendingSlot } from '@/utils/weekPreview'

export interface CourseEditor {
  id: string
  name: string
  colorId: string
  colorOpen: boolean
  blocks: TimeBlockDraft[]
  pendingSlot: PendingSlot | null
  pendingBlockId: string | null
  isSaved: boolean
  lastSavedSnapshot: string
}

interface SavedSnapshot {
  name: string
  color: string
  blocks: { days: DayOfWeek[]; start: string; end: string }[]
}

let nextEditorId = 0

export function createCourseEditor(draft?: DraftCourse): CourseEditor {
  const editor = reactive<CourseEditor>({
    id: draft?.tempId ?? `editor-${nextEditorId++}`,
    name: draft?.name ?? '',
    colorId: draft?.colorId ?? COURSE_PALETTE_24[0]!.id,
    colorOpen: false,
    blocks: [createBlock()],
    pendingSlot: null,
    pendingBlockId: null,
    isSaved: false,
    lastSavedSnapshot: '',
  })

  if (draft) {
    loadDraftIntoEditor(editor, draft)
  }

  return editor
}

function snapshotFor(name: string, colorId: string, blocks: TimeBlockDraft[]): string {
  return JSON.stringify({
    name: name.trim(),
    color: colorId,
    blocks: blocks.map((b) => ({
      days: b.selectedDays,
      start: b.startTime,
      end: b.endTime,
    })),
  })
}

export function editorSnapshot(editor: CourseEditor): string {
  return snapshotFor(editor.name, editor.colorId, editor.blocks)
}

export function captureSnapshot(editor: CourseEditor): void {
  editor.lastSavedSnapshot = editorSnapshot(editor)
}

export function loadDraftIntoEditor(editor: CourseEditor, draft: DraftCourse): void {
  editor.name = draft.name
  editor.colorId = draft.colorId
  editor.isSaved = true

  const grouped = new Map<string, DayOfWeek[]>()
  for (const s of draft.schedules) {
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
    editor.blocks = newBlocks
  } else {
    editor.blocks = [createBlock()]
  }

  captureSnapshot(editor)
}

/**
 * True when the editor holds user work that differs from its last staged
 * snapshot. A pending slot identical to its prefill block does not count.
 */
export function isEditorDirty(editor: CourseEditor): boolean {
  if (editor.isSaved) {
    const effectiveBlocks =
      editor.pendingSlot && editor.pendingBlockId
        ? editor.blocks.filter((b) => {
            if (b.id !== editor.pendingBlockId) return true
            const matchesDays =
              b.selectedDays.length === 1 && b.selectedDays[0] === editor.pendingSlot!.day
            const matchesTimes =
              b.startTime === editor.pendingSlot!.startTime &&
              b.endTime === editor.pendingSlot!.endTime
            return !(matchesDays && matchesTimes)
          })
        : editor.blocks

    return snapshotFor(editor.name, editor.colorId, effectiveBlocks) !== editor.lastSavedSnapshot
  }

  if (editor.name.trim().length > 0) {
    return true
  }

  const hasFailedOrPending = editor.blocks.some((b) =>
    b.schedules.some((s) => s.state === 'failed' || (s.submitted && s.state !== 'saved')),
  )
  if (hasFailedOrPending) {
    return true
  }

  if (
    editor.pendingSlot &&
    editor.pendingBlockId &&
    editor.blocks.length === 1 &&
    editor.blocks[0]?.id === editor.pendingBlockId
  ) {
    const block = editor.blocks[0]
    const matchesPendingDays =
      block.selectedDays.length === 1 && block.selectedDays[0] === editor.pendingSlot.day
    const matchesPendingTimes =
      block.startTime === editor.pendingSlot.startTime &&
      block.endTime === editor.pendingSlot.endTime
    if (matchesPendingDays && matchesPendingTimes) {
      return false
    }
  }

  return editor.blocks.some(
    (b) => b.selectedDays.length > 0 || b.startTime !== '' || b.endTime !== '',
  )
}

export function isEditorTouched(editor: CourseEditor): boolean {
  return (
    editor.name.trim().length > 0 ||
    editor.blocks.some(
      (b) => b.selectedDays.length > 0 || b.startTime !== '' || b.endTime !== '',
    )
  )
}

export function allBlocksValid(editor: CourseEditor): boolean {
  return (
    editor.blocks.length > 0 &&
    editor.blocks.every((block) => {
      const selected = block.selectedDays.length > 0
      const validTimes =
        block.startTime !== '' && block.endTime !== '' && block.startTime < block.endTime
      return selected && validTimes
    })
  )
}

export function isEditorValid(editor: CourseEditor): boolean {
  return editor.name.trim().length > 0 && allBlocksValid(editor)
}

/**
 * Valid day/time pairs for a course editor. Used to build the known set and
 * to stage drafts; blocks without complete times are excluded.
 */
export function validSchedulesOf(editor: CourseEditor): DraftSchedule[] {
  const schedules: DraftSchedule[] = []
  for (const block of editor.blocks) {
    if (!block.startTime || !block.endTime || block.startTime >= block.endTime) {
      continue
    }
    for (const day of block.selectedDays) {
      schedules.push({ day, startTime: block.startTime, endTime: block.endTime })
    }
  }
  return schedules
}

export function discardEditorPendingSlot(editor: CourseEditor): void {
  if (!editor.pendingSlot) {
    return
  }
  editor.pendingSlot = null
  if (editor.pendingBlockId) {
    editor.blocks = editor.blocks.filter((b) => b.id !== editor.pendingBlockId)
    if (editor.blocks.length === 0) {
      editor.blocks = [createBlock()]
    }
    editor.pendingBlockId = null
  }
}

export function restoreEditorSnapshot(editor: CourseEditor): void {
  if (!editor.lastSavedSnapshot) {
    resetEditor(editor)
    return
  }
  const saved = JSON.parse(editor.lastSavedSnapshot) as SavedSnapshot
  editor.name = saved.name || ''
  editor.colorId = saved.color || COURSE_PALETTE_24[0]!.id
  if (Array.isArray(saved.blocks) && saved.blocks.length > 0) {
    editor.blocks = saved.blocks.map((b) => {
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
  } else {
    editor.blocks = [createBlock()]
  }
}

export function resetEditor(editor: CourseEditor): void {
  editor.name = ''
  editor.colorId = COURSE_PALETTE_24[0]!.id
  editor.blocks = [createBlock()]
  editor.pendingSlot = null
  editor.pendingBlockId = null
  editor.isSaved = false
  editor.lastSavedSnapshot = ''
}
