import { ref } from 'vue'
import { notesApi } from '@/api'
import type { NoteSummaryResponse } from '@/types/api'

const notes = ref<NoteSummaryResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let loaded = false
let pending: Promise<void> | null = null

// ponytail: read-only note list cache. The page loads once per intent.
export function useNotes() {
  async function loadNotes(force = false): Promise<void> {
    if (loaded && !force) {
      return
    }
    if (pending) {
      await pending
      return
    }
    loading.value = true
    error.value = null
    pending = (async () => {
      notes.value = await notesApi.list()
      loaded = true
    })()
    try {
      await pending
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Notes failed to load'
    } finally {
      loading.value = false
      pending = null
    }
  }

  function resetNotes(): void {
    notes.value = []
    loading.value = false
    error.value = null
    loaded = false
  }

  return { notes, loading, error, loadNotes, resetNotes }
}
