import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type {
  PendingNoteSummary,
  PlannerStatusResponse,
  ProcessProgressEvent,
  ProcessSummaryResponse,
} from '@/api'
import { uuid } from '@/utils/uuid'
import { createCache } from './createCache'
import { useAuth } from './useAuth'

/** Terminal or live state of one Process run record. */
export type ProcessNotificationStatus =
  'running' | 'done' | 'cancelled' | 'saved-after-cancel' | 'error'

/** One Process run captured for the notification center. */
export interface ProcessNotification {
  id: string
  status: ProcessNotificationStatus
  startedAt: string
  finishedAt?: string
  /** Fields below populate from the stream as the run reports them. */
  noteCount: number
  courseNames: string[]
  dirtyDates: string[]
  pendingNotes: PendingNoteSummary[]
  progress?: ProcessProgressEvent
  summary?: ProcessSummaryResponse
  error?: string
  /** Unread until the user opens the notification center. */
  read: boolean
}

const MAX_RECORDS = 20
const STORAGE_PREFIX = 'nyare.notifications.v1:'

// Module-level history, so records survive navigation between views.
const records = ref<ProcessNotification[]>([])

const { user } = useAuth()

function storageKey(): string | null {
  if (typeof localStorage === 'undefined' || !user.value) {
    return null
  }
  return `${STORAGE_PREFIX}${user.value.id}`
}

function persist(): void {
  const key = storageKey()
  if (!key) {
    return
  }
  try {
    localStorage.setItem(key, JSON.stringify(records.value))
  } catch {
    // A full or blocked localStorage just loses history.
  }
}

function restore(key: string): ProcessNotification[] {
  try {
    const raw = localStorage.getItem(key)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter(
        (r): r is ProcessNotification =>
          typeof r === 'object' &&
          r !== null &&
          typeof (r as ProcessNotification).id === 'string' &&
          typeof (r as ProcessNotification).status === 'string',
      )
      .map((r) =>
        // A reload severs the stream: the backend cancels a disconnected run at
        // the next checkpoint, so a record left mid-flight is a stopped one.
        r.status === 'running'
          ? { ...r, status: 'cancelled', finishedAt: r.finishedAt ?? new Date().toISOString() }
          : r,
      )
  } catch {
    return []
  }
}

// Load the signed-in user's stored records; a session change swaps the list.
watch(
  () => user.value?.id ?? null,
  () => {
    const key = storageKey()
    records.value = key ? restore(key) : []
  },
  // Sync so a new session's records restore before any run can write one.
  { immediate: true, flush: 'sync' },
)

watch(records, persist, { deep: true })

const cache = createCache(() => {
  records.value = []
})

/** Clears the record list. `resetAllCaches()` calls this on session change. */
export function resetNotifications(): void {
  cache.reset()
}

/** State and actions that `useNotifications` returns. */
export interface UseNotifications {
  /** Run records, newest first. */
  records: Ref<ProcessNotification[]>
  /** The in-flight run record, or null. */
  active: Ref<ProcessNotification | undefined>
  /** Count of finished records the user has not seen. */
  unreadCount: Ref<number>
  /** Creates a `running` record and returns its id. Called once per run. */
  openRecord: () => string
  /** Merges fields into a record by id. Ignores unknown ids. */
  patchRecord: (id: string, patch: Partial<ProcessNotification>) => void
  /** Applies the `init` payload to a record. */
  applyInit: (id: string, status: PlannerStatusResponse) => void
  /** Sets the terminal status, stamps `finishedAt`, and marks the record unread. */
  finishRecord: (id: string, status: ProcessNotificationStatus) => void
  /** Flags every record as seen. */
  markAllRead: () => void
  /** Removes read finished records. Running and unread records stay. */
  clearFinished: () => void
  /** Removes every record. Persists the empty list. */
  clearRecords: () => void
}

/**
 * Stores Process run history for the notification center. `useProcess` calls
 * the record actions at each stream lifecycle point. `resetAllCaches()` clears
 * the list on session change; `resetProcess()` on dialog reopen keeps history.
 */
export function useNotifications(): UseNotifications {
  function openRecord(): string {
    const id = uuid()
    records.value.unshift({
      id,
      status: 'running',
      startedAt: new Date().toISOString(),
      noteCount: 0,
      courseNames: [],
      dirtyDates: [],
      pendingNotes: [],
      read: true,
    })
    if (records.value.length > MAX_RECORDS) {
      records.value.length = MAX_RECORDS
    }
    return id
  }

  function patchRecord(id: string, patch: Partial<ProcessNotification>): void {
    const record = records.value.find((r) => r.id === id)
    if (record) {
      Object.assign(record, patch)
    }
  }

  function applyInit(id: string, status: PlannerStatusResponse): void {
    patchRecord(id, {
      noteCount: status.dirtyNoteCount,
      courseNames: [...status.courseNames],
      dirtyDates: [...status.dirtyDates],
      pendingNotes: [...status.pendingNotes],
    })
  }

  function finishRecord(id: string, status: ProcessNotificationStatus): void {
    patchRecord(id, { status, finishedAt: new Date().toISOString(), read: false })
  }

  function markAllRead(): void {
    for (const record of records.value) {
      record.read = true
    }
  }

  function clearFinished(): void {
    records.value = records.value.filter((r) => r.status === 'running' || !r.read)
  }

  function clearRecords(): void {
    records.value = []
  }

  return {
    records,
    active: computed(() => records.value.find((r) => r.status === 'running')),
    unreadCount: computed(() => records.value.filter((r) => !r.read).length),
    openRecord,
    patchRecord,
    applyInit,
    finishRecord,
    markAllRead,
    clearFinished,
    clearRecords,
  }
}
