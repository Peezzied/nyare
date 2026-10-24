# Data Model: Perceived Performance

No new domain entities and no persistence changes. This feature alters only how existing client-side state is loaded and retained. Backend DTOs (`CourseResponse`, `ScheduleResponse`, `TaskResponse`, `AcademicEventResponse`, `NoteResponse`, `NoteSummaryResponse`, `PlannerStatusResponse`) are unchanged.

## Existing caches this feature relies on (unchanged contracts)

| Cache | Owner | Content | Freshness contract |
|-------|-------|---------|-------------------|
| Session | `useAuth` | Current `UserResponse` | Checked once per app load; reset on sign-out/account switch |
| Catalog | `useCatalog` | `courses`, `schedules` | Loaded once; mutations apply saved DTOs; `resetCatalog()` on course delete/archive/unarchive |
| Tasks | `useTasks` | `tasks[]` | Loaded once; mutations upsert; `refetchForCourses()` after planner runs |
| Academic events | `useAcademicEvents` | `events[]` | Same contract as tasks |
| Notes | `useNotes` | `rawNotes[]` | Loaded once; `saveNote` upserts; deletions stage/restore/commit locally |
| Archive | `useArchive` | `archivedCourses[]` | Loaded once; mutations apply locally |
| Planner status | `usePlannerStatus` | `PlannerStatusResponse` | `refresh()` on demand; invalidated by course mutations |

All caches are module-level `ref` state behind `createCache()` (dedupes in-flight loads, sequences stale results). They already satisfy FR-001/FR-009 — the feature's job is to stop bypassing them.

## New state introduced by this feature

| State | Owner | Lifetime | Notes |
|-------|-------|----------|-------|
| Kept-alive view instances | `<KeepAlive>` in `AppShell` | Session (component instances retained across tab switches) | `include` = `TodoView,CalendarView,NotesView` only; param routes excluded |
| Warmed image set | Browser HTTP/memory cache | Session | Triggered by `new Image().src` at dialog-component setup; no app-side bookkeeping |
| Async editor chunk | `defineAsyncComponent` loader | Fetched once, cached by bundler | Tiptap graph loads on first note open |

## Invariants to preserve

- A revisited screen renders from cache with zero network requests for already-held data (FR-001).
- A mutation never triggers a full-collection reload (FR-006).
- Account switch or sign-out clears every cache — kept-alive views must not leak another user's data; `resetAllCaches()` covers the composable state, and kept-alive views re-derive from cleared refs on next activation.
