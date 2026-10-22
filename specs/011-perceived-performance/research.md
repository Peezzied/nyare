# Research: Perceived Performance

Grounded on `frontend/.agents/skills/vue-best-practices` (references: keep-alive, async components) and `vue-router-best-practices` (async guard pattern, param-change lifecycle gotcha).

## Decision 1: Lazy-load `CreateScheduleView` at the router

- **Decision**: Convert the static `import CreateScheduleView` to `() => import('@/views/CreateScheduleView.vue')`, matching the lazy pattern every other view already uses.
- **Rationale**: `CreateScheduleView` → `WeekPreview` → `@schedule-x/calendar` + `@schedule-x/vue` + `preact` + `temporal-polyfill` sits in the entry chunk. The onboarding flow runs once per account; the start screen pays for it on every load (FR-004, SC-004).
- **Alternatives considered**: Manual chunk splitting in `vite.config.ts` — rejected: treats the symptom, adds config, and keeps dead weight in the entry graph.

## Decision 2: `defineAsyncComponent` for `NoteEditor` inside `NoteEditorModal`

- **Decision**: `const NoteEditor = defineAsyncComponent(() => import('@/views/NoteEditor.vue'))` in `NoteEditorModal.vue`.
- **Rationale**: `NotesView` → `NoteEditorModal` → `NoteEditor` → `@tiptap/*` chains statically, so the Notes tab loads the entire editor graph before any note opens (FR-004). Async component splits Tiptap into a chunk fetched on first open. The modal's morph container (320ms expand) already gives visual cover for the chunk fetch; skill guidance says avoid a loading UI that flickers for usually-fast loads, so no `loadingComponent` on a warm dev/prod path.
- **Alternatives considered**: Route-level laziness — the editor is modal-embedded, not routed to from `/notes`; a `loadingComponent` spinner — rejected per skill (spinner flicker for sub-200ms loads); SSR hydration helpers — not applicable (client-rendered SPA).

## Decision 3: `<KeepAlive>` for the three tab views in `AppShell`

- **Decision**: Wrap the shell's `<RouterView>` in `<router-view v-slot>` + `<KeepAlive :include="['TodoView','CalendarView','NotesView']">`; add `defineOptions({ name: '…View' })` to each of the three views.
- **Rationale**: FR-007 — tab switches currently destroy and recreate each view, re-running `onMounted` fetch chains and re-instantiating Schedule-X `createCalendar` (day + week). KeepAlive is the skill-recommended fit for "tabs where state should persist"; `include` matching requires explicit component names (skill gotcha).
- **Alternatives considered**: Caching all child views — rejected: `archive/:courseId` and other param routes share components, and KeepAlive + param routes produces stale instances unless keyed by `route.fullPath` (skill: param-change-no-lifecycle). Excluded views (`ManageCoursesView`, `ArchiveView`, `ArchivedCourseView`) stay fresh per visit — correct by default and their mounts are cheap. `:key="route.fullPath"` on everything — rejected: forfeits the state preservation the feature wants.
- **Data freshness**: Kept-alive views do not re-run `onMounted`. Freshness stays correct because the shared composable caches are the data source and mutations update them; the planner run already refetches affected courses. NotesView's forced refetch (Decision 5) is removed, so no view needs `onActivated`.

## Decision 4: Parallelize independent fetches per screen

- **Decision**: Collapse serial `await` chains into single `Promise.all` fan-outs:
  - `CalendarView.loadData`: `loadCatalog()` + `loadTasks()` + `loadEvents()` + `loadNotes()` — all independent; the view renders from reactive refs as each resolves.
  - `TodoView.loadData`: `loadCatalog()` + `loadTasks()`.
  - `NoteEditor.onMounted`: `loadCatalog()` + `getNote(id)` concurrently, then the conditional archive lookup.
  - `TaskDetailPanel.resolveTask` / `onMounted`: `loadCatalog()` + `getTask()` concurrently (the two calls at lines 248-251 are already unawaited-parallel; `resolveTask` internals re-serialize — flatten).
  - `ArchivedCourseView`: `loadArchive()` + `loadCourseContent(id)` concurrently.
- **Rationale**: FR-002. The router-skill async-guard reference confirms `Promise.all` for independent checks; the same rule applies to view mounts. Catalog is cached after first load, but concurrency also removes the microtask ordering even when warm.
- **Alternatives considered**: A shared `loadScreenData()` composable — rejected (ponytail): each screen needs a different subset; per-view `Promise.all` is shorter.

## Decision 5: Drop forced/refetch-on-mount calls

- **Decision**: `NotesView.onMounted` → `loadNotes()` (cache-respecting); remove `@saved="loadNotes(true)"`; keep the error-state Retry calling `loadNotes(true)`.
- **Rationale**: FR-001 + FR-006. `saveNote` already upserts the list and refreshes planner status; the extra forced list reload duplicates a roundtrip the mutation response makes unnecessary (constitution: trust mutation responses).
- **Alternatives considered**: Moving the refetch to `onActivated` — rejected: nothing invalidates the notes cache except mutations, which update it locally.

## Decision 6: Warm bundled artwork before first open

- **Decision**: `new Image().src = <imported url>` in the setup of `DialogShell` and `DiscardDraftConfirmDialog` — the only two components gating mascot `<img>` behind `v-if`. All consumers mount these components eagerly (`:open`/`v-model`), so setup-time warming runs at parent-view mount.
- **Rationale**: FR-005. Static `import x from './x.png'` yields a URL string; the browser fetches bytes only when an `<img>` enters the DOM. `v-if` defers that to open-time → pop-in. One line per file, no abstractions (ponytail).
- **Alternatives considered**: `<link rel="preload">` — hashed asset URLs are unknowable at `index.html` author time; `v-show` instead of `v-if` — keeps hidden DOM/dialog semantics alive, messier than a one-line warm; a `useImagePreloader` composable — rejected, two call sites don't justify it.
- **Scope per clarified spec**: onboarding/decorative art renders `<img>` eagerly at mount — already compliant; only the two dialog components need warming.

## Decision 7: Note-attached images render without pop-in

- **Decision**: `NoteCard` thumbnails and editor-embedded images keep reserved geometry (fixed height / `aspect-ratio`) so late-arriving `/api/images` bytes never shift layout; images fetch eagerly when their container mounts.
- **Rationale**: FR-010. User images can't all prefetch at app start; the testable guarantee is no layout shift and no flicker, per SC-003.
- **Alternatives considered**: Prefetching all note images on list load — rejected: unbounded payload, wastes bandwidth for images below the fold; blur placeholders — deferred (no placeholder pipeline exists; reserved space satisfies the spec).

## Decision 8: Router guard stays a single dependent round-trip

- **Decision**: Keep `beforeEach`'s `ensureSession()` → `loadCatalog()` shape; no additional awaits. It already resolves instantly once caches are warm.
- **Rationale**: FR-003 caps the guard at one dependent round-trip — the onboarding gate genuinely needs `hasCourses`, which needs the session. The serial cost lives in views (Decision 4), not the guard. On backend failure, `loadCatalog` throws, is caught, and navigation proceeds — already satisfies FR-008.
- **Alternatives considered**: Removing the catalog await and gating in views — rejected: would flash gated content before redirect to `/welcome`.

## Decision 9: Non-blocking font stylesheet

- **Decision**: Convert the Google Fonts `<link rel="stylesheet">` to the preload-swap pattern (`rel="preload" as="style" onload="this.rel='stylesheet'"` + `<noscript>` fallback).
- **Rationale**: `index.html` font CSS render-blocks first paint; FR-004 covers deferred resource cost on the initial screen. `display=swap` already governs font-face swapping.
- **Alternatives considered**: Self-hosting fonts — rejected: new asset pipeline for marginal gain; leaving it — it's the last render-blocking resource.

## Resolved unknowns

None outstanding — all NEEDS CLARIFICATION items resolved through `/speckit-clarify` (scope = all screens, imagery = bundled + note images, measurement = production build).
