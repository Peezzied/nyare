import { ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { watchDebounced } from '@vueuse/core'

export interface UseServerSearch<T> {
  results: Ref<T[] | null>
  pending: Ref<boolean>
  error: Ref<string | null>
  retry: () => void
}

/**
 * Runs `fetcher` 300 ms after `params` stops changing. A `null` params value
 * deactivates the search and clears state; the caller then renders its cached
 * list. Only the latest call writes `results` or `error`. A rejection keeps
 * prior `results` so the UI can keep showing them. `retry()` re-runs the
 * current request at once while search is active.
 */
export function useServerSearch<T, P>(
  fetcher: (params: P) => Promise<T[]>,
  params: ComputedRef<P | null>,
): UseServerSearch<T> {
  const results = ref<T[] | null>(null) as Ref<T[] | null>
  const pending = ref(false)
  const error = ref<string | null>(null)
  let seq = 0

  async function run(value: P | null) {
    const ticket = ++seq
    if (value === null) {
      results.value = null
      pending.value = false
      error.value = null
      return
    }
    pending.value = true
    try {
      const data = await fetcher(value)
      if (ticket === seq) {
        results.value = data
        error.value = null
      }
    } catch (err) {
      if (ticket === seq) {
        error.value = err instanceof Error ? err.message : 'Search failed'
      }
    } finally {
      if (ticket === seq) {
        pending.value = false
      }
    }
  }

  watchDebounced(params, run, { debounce: 300, deep: true })

  /** Re-runs `fetcher` with the current params; inactive search is a no-op. */
  function retry() {
    if (params.value !== null) {
      void run(params.value)
    }
  }

  return { results, pending, error, retry }
}
