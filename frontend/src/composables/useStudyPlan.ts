import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useTasks } from '@/composables/useTasks'
import { getPlanCategory } from '@/utils/planCategory'
import type { TaskResponse } from '@/types/api'

// Virtual study plan: pure derivation from the task cache. No DB table, no backend call.
export interface VirtualStudyPlan {
  scheduledByDate: ComputedRef<Map<string, TaskResponse[]>>
  laterTasks: ComputedRef<TaskResponse[]>
  backlogTasks: ComputedRef<TaskResponse[]>

  scheduledCount: ComputedRef<number>
  laterCount: ComputedRef<number>
  backlogCount: ComputedRef<number>
}

export function useStudyPlan(): VirtualStudyPlan {
  const { tasks } = useTasks()

  const scheduledByDate = computed(() => {
    const grouped = new Map<string, TaskResponse[]>()
    for (const task of tasks.value) {
      // scheduledDate is already the YYYY-MM-DD day key.
      if (!task.scheduledDate) {
        continue
      }
      const bucket = grouped.get(task.scheduledDate)
      if (bucket) {
        bucket.push(task)
      } else {
        grouped.set(task.scheduledDate, [task])
      }
    }
    return grouped
  })

  const laterTasks = computed(() => tasks.value.filter((task) => getPlanCategory(task) === 'LATER'))

  const backlogTasks = computed(() =>
    tasks.value.filter((task) => getPlanCategory(task) === 'BACKLOG'),
  )

  const scheduledCount = computed(
    () => tasks.value.filter((task) => getPlanCategory(task) === 'SCHEDULED').length,
  )
  const laterCount = computed(() => laterTasks.value.length)
  const backlogCount = computed(() => backlogTasks.value.length)

  return {
    scheduledByDate,
    laterTasks,
    backlogTasks,
    scheduledCount,
    laterCount,
    backlogCount,
  }
}
