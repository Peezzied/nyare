# UI Contract: Frontend Composable Layer

**Feature**: `005-headless-flow-harness`
**Date**: 2026-10-18

This document serves as the "plug and play" contract for presentation components and views. Presentation views should import and consume these composables directly, with zero knowledge of HTTP endpoints, network routing, or raw API clients.

---

## 1. `useAuth`
Manages user authentication and session status.

```ts
import { useAuth } from '@/composables/useAuth'

const {
  user,               // Ref<UserResponse | null>: Current logged-in user
  isDevUserMissing,   // Ref<boolean>: True if VITE_DEV_USER is not found in database
  configuredDevUser,  // string: Configured dev user name
  ensureSession,      // () => Promise<UserResponse | null | undefined>
  setSessionUser,     // (user: UserResponse) => void
  clearSessionUser,   // () => void
} = useAuth()
```

### Covering Flow Test
- `01-session-catalog.flow.spec.ts` (Authentication, Logout)
- `03-failures-cancel.flow.spec.ts` (Scenario 1)

---

## 2. `useCatalog`
Manages the user's courses and course schedules (cached).

```ts
import { useCatalog } from '@/composables/useCatalog'

const {
  courses,              // Ref<CourseResponse[]>: List of user courses
  schedules,            // Ref<ScheduleResponse[]>: List of weekly schedule slots
  loaded,               // Ref<boolean>: True if catalog has been loaded
  loadCatalog,          // (force?: boolean) => Promise<void>
  applyCourseCreated,   // (course: CourseResponse) => void
  applyCourseDeleted,   // (courseId: number) => void
  applyScheduleCreated, // (schedule: ScheduleResponse) => void
  applyScheduleUpdated, // (schedule: ScheduleResponse) => void
  applyScheduleDeleted, // (scheduleId: number) => void
  resetCatalog,         // () => void
} = useCatalog()
```

### Covering Flow Test
- `01-session-catalog.flow.spec.ts` (Catalog)

---

## 3. `useNotes`
Manages note listings and note preview styling.

```ts
import { useNotes } from '@/composables/useNotes'

const {
  notes,            // ComputedRef<NoteSummaryResponse[]>: Cached note summaries
  pictureNote,      // ComputedRef<PictureNotePreview | null>: Prototype/dev preview card
  loading,          // Ref<boolean>
  error,            // Ref<string | null>
  loadNotes,        // (force?: boolean) => Promise<void>
  resetNotes,       // () => void
  getCourseName,    // (courseId: number, catalogMap?: Map<number, string>) => string | undefined
  getBadgeColor,    // (courseId: number) => CoursePaletteColor
} = useNotes()
```

### Covering Flow Test
- `02-journal-planner.flow.spec.ts` (Setup note creation)
- `frontend/src/views/__tests__/NotesView.spec.ts`

---

## 4. `useTasks`
Manages task collection and task mutations.

```ts
import { useTasks } from '@/composables/useTasks'

const {
  tasks,              // Ref<TaskResponse[]>: All tasks loaded for user
  loading,            // Ref<boolean>
  error,              // Ref<string | null>
  loadTasks,          // (params?: TaskListParams, force?: boolean) => Promise<void>
  createTask,         // (request: TaskRequest) => Promise<TaskResponse>
  updateTask,         // (id: string, request: TaskRequest) => Promise<TaskResponse>
  updateTaskStatus,   // (id: string, status: TaskStatus) => Promise<TaskResponse>
  deleteTask,         // (id: string) => Promise<void>
  refetchForCourses,  // (courseIds: number[]) => Promise<void>
  resetTasks,         // () => void
} = useTasks()
```

### Covering Flow Test
- `02-journal-planner.flow.spec.ts` (T012 Planner Flow)

---

## 5. `useAcademicEvents`
Manages academic events and exam deadlines.

```ts
import { useAcademicEvents } from '@/composables/useAcademicEvents'

const {
  events,             // Ref<AcademicEventResponse[]>: All academic events loaded
  loading,            // Ref<boolean>
  error,              // Ref<string | null>
  loadEvents,         // (params?: AcademicEventListParams, force?: boolean) => Promise<void>
  createEvent,        // (request: AcademicEventRequest) => Promise<AcademicEventResponse>
  updateEvent,        // (id: string, request: AcademicEventRequest) => Promise<AcademicEventResponse>
  deleteEvent,        // (id: string) => Promise<void>
  refetchForCourses,  // (courseIds: number[]) => Promise<void>
  resetEvents,        // () => void
} = useAcademicEvents()
```

### Covering Flow Test
- `02-journal-planner.flow.spec.ts` (T012 Planner Flow)

---

## 6. `usePlannerStatus`
Exposes dirty note status and eligibility for the Duckota Button.

```ts
import { usePlannerStatus } from '@/composables/usePlannerStatus'

const {
  status,         // Ref<PlannerStatusResponse | null>: Raw planner status
  pendingCount,   // ComputedRef<number>: Count of dirty/unprocessed notes eligible
  canProcess,     // ComputedRef<boolean>: True if pendingCount > 0
  loading,        // Ref<boolean>
  error,          // Ref<string | null>
  refresh,        // () => Promise<void>: Refetches status from backend
  reset,          // () => void
} = usePlannerStatus()
```

### Covering Flow Test
- `02-journal-planner.flow.spec.ts` (T011 Status Check, T012 Refresh)

---

## 7. `useProcess`
Controls the study planner AI stream execution.

```ts
import { useProcess } from '@/composables/useProcess'

const {
  running,           // Ref<boolean>: True during SSE streaming
  status,            // Ref<PlannerStatusResponse | null>: Received from init event
  progress,          // Ref<ProcessProgressEvent | null>: Per-date progress
  summary,           // Ref<ProcessSummaryResponse | null>: Terminal summary
  error,             // Ref<string | null>: Error message if failed
  cancelled,         // Ref<boolean>: True if cancelled by user
  savedAfterCancel,  // Ref<boolean>: True if run committed before cancel took effect
  start,             // () => Promise<ProcessSummaryResponse | null>
  cancel,            // () => void
} = useProcess({
  onDone: async (summary) => {
    // Refresh tasks and events for affected courses
    await Promise.all([
      useTasks().refetchForCourses(summary.affectedCourseIds),
      useAcademicEvents().refetchForCourses(summary.affectedCourseIds),
      usePlannerStatus().refresh(),
    ])
  },
  onSavedAfterCancel: async () => {
    // Full refetch when run committed despite cancel
    await Promise.all([
      useTasks().loadTasks(undefined, true),
      useAcademicEvents().loadEvents(undefined, true),
      usePlannerStatus().refresh(),
    ])
  }
})
```

### Covering Flow Test
- `02-journal-planner.flow.spec.ts` (T012 AI Flow)
- `03-failures-cancel.flow.spec.ts` (Scenario 3 Cancel)

---

## 8. `useStudyPlan`
Virtual presentation derivation calculated dynamically from `useTasks`.

```ts
import { useStudyPlan } from '@/composables/useStudyPlan'

const {
  scheduledByDate,  // ComputedRef<Map<string, TaskResponse[]>>: Tasks keyed by YYYY-MM-DD
  laterTasks,       // ComputedRef<TaskResponse[]>: Tasks with duration and no scheduled date
  backlogTasks,     // ComputedRef<TaskResponse[]>: Tasks with no duration and no scheduled date
  scheduledCount,   // ComputedRef<number>
  laterCount,       // ComputedRef<number>
  backlogCount,     // ComputedRef<number>
} = useStudyPlan()
```

### Covering Flow Test
- `02-journal-planner.flow.spec.ts` (T012 Study Plan Verification)