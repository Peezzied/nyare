import type { ScheduleRequest, ScheduleResponse } from '@/types/api'
import type { DraftSchedule } from '@/composables/useCourseDrafts'

/** Class-meeting payload without `courseId`. The caller binds the course id. */
export type ScheduleRequestDraft = Omit<ScheduleRequest, 'courseId'>

export interface ScheduleDiffUpdate {
  /** Id of the persisted row that takes the new day and times. */
  id: number
  next: ScheduleRequestDraft
}

export interface ScheduleDiff {
  /** Persisted rows whose key still exists in `desired`. */
  keep: ScheduleResponse[]
  /** Removed rows paired with added rows, in input order, to keep ids stable. */
  update: ScheduleDiffUpdate[]
  /** Added rows without a removed row to pair with. */
  create: ScheduleRequestDraft[]
  /** Ids of removed rows without an added row to pair with. */
  remove: number[]
}

function rowKey(day: string, startTime: string, endTime: string): string {
  return `${day}|${startTime}|${endTime}`
}

/**
 * Diffs persisted class meetings against desired rows keyed `day|start|end`.
 * Matching rows stay in `keep`. Leftover removed rows pair with leftover
 * added rows in input order and become `update` entries so ids stay stable.
 */
export function diffSchedules(
  existing: ScheduleResponse[],
  desired: DraftSchedule[],
): ScheduleDiff {
  const byKey = new Map<string, ScheduleResponse[]>()
  for (const row of existing) {
    const key = rowKey(row.day, row.startTime, row.endTime)
    const queue = byKey.get(key)
    if (queue) {
      queue.push(row)
    } else {
      byKey.set(key, [row])
    }
  }

  const consumed = new Set<ScheduleResponse>()
  const added: ScheduleRequestDraft[] = []
  for (const row of desired) {
    const matched = byKey.get(rowKey(row.day, row.startTime, row.endTime))?.shift()
    if (matched) {
      consumed.add(matched)
    } else {
      added.push({ day: row.day, startTime: row.startTime, endTime: row.endTime })
    }
  }

  const keep = existing.filter((row) => consumed.has(row))
  const removed = existing.filter((row) => !consumed.has(row))

  const update: ScheduleDiffUpdate[] = []
  const pairCount = Math.min(removed.length, added.length)
  for (let i = 0; i < pairCount; i++) {
    update.push({ id: removed[i]!.id, next: added[i]! })
  }

  return {
    keep,
    update,
    create: added.slice(pairCount),
    remove: removed.slice(pairCount).map((row) => row.id),
  }
}
