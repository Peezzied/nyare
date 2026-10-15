// ponytail: tri-state task derivation for the virtual study plan.

import type { PlanCategory } from '@/types/api'

/** Task fields that decide the plan category. */
interface Plannable {
  readonly scheduledDate?: string | null
  readonly duration?: string | null
}

/**
 * Derives tri-state plan category from day-level task fields.
 * `SCHEDULED` when a date is set, `LATER` for dateless work with a
 * duration, `BACKLOG` when neither is set. Mirrors `Task.getPlanCategory`.
 */
export function getPlanCategory(task: Plannable): PlanCategory {
  if (task.scheduledDate) {
    return 'SCHEDULED'
  }
  if (task.duration) {
    return 'LATER'
  }
  return 'BACKLOG'
}
