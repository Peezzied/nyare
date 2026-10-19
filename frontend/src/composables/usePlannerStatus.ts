import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { studyPlannerApi } from '@/api'
import { createCache } from './createCache'
import type { PlannerStatusResponse } from '@/types/api'

// Module-level shared state, so every usePlannerStatus() caller reads one status.
const status = ref<PlannerStatusResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const cache = createCache(() => {
  status.value = null
  loading.value = false
  error.value = null
})

// The count comes from the backend status call only, never from the notes list (FR-015).
const pendingCount = computed(() => status.value?.dirtyNoteCount ?? 0)
const canProcess = computed(() => pendingCount.value > 0)

export interface UsePlannerStatus {
  status: Ref<PlannerStatusResponse | null>
  pendingCount: ComputedRef<number>
  canProcess: ComputedRef<boolean>
  loading: Ref<boolean>
  error: Ref<string | null>

  refresh: () => Promise<void>
  reset: () => void
}

export function usePlannerStatus(): UsePlannerStatus {
  async function refresh(): Promise<void> {
    const g = cache.begin()
    const seq = cache.beginLoad()
    loading.value = true
    error.value = null
    try {
      const result = await studyPlannerApi.status()
      if (cache.isLatest(seq, g)) {
        status.value = result
      }
    } catch (err) {
      if (cache.isLatest(seq, g)) {
        error.value = err instanceof Error ? err.message : 'Failed to load planner status'
      }
      throw err
    } finally {
      if (cache.isLatest(seq, g)) {
        loading.value = false
      }
    }
  }

  function reset(): void {
    cache.reset()
  }

  return {
    status,
    pendingCount,
    canProcess,
    loading,
    error,
    refresh,
    reset,
  }
}
