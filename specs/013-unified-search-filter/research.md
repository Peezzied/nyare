# Research: Unified Search and Filter

All Technical Context items resolved; no NEEDS CLARIFICATION remains.

## Decision 1: Search parameter shape

- **Decision**: Add `q` (`String`, optional) to `GET /api/tasks`, `GET /api/notes`, `GET /api/academic-events`. Repository `findAllFiltered` queries gain `AND (:q IS NULL OR LOWER(e.title) LIKE :pattern OR LOWER(e.description|content) LIKE :pattern)` with `pattern = '%' + q.toLowerCase() + '%'` built in the service.
- **Rationale**: Extends the existing optional-param `findAllFiltered` pattern verbatim. LIKE-substring is sufficient for SQLite MVP scale (hundreds of rows).
- **Alternatives considered**: SQLite FTS5 virtual tables — rejected (schema weight, no ranking need). Client-side search — rejected (spec FR-003 requires coverage of all stored items, and constitution mandates server filtering when params exist).

## Decision 2: Date-range parameters

- **Decision**: `from`/`to` as `LocalDate` on all three endpoints. Tasks filter `scheduledDate`; notes filter `entryDate`; events filter `deadline` (service maps `from` → start-of-day, `to` → exclusive next-day `LocalDateTime`). `from > to` → `BadRequestException`. Open-ended ranges allowed (either bound optional).
- **Rationale**: Uniform day-level contract matches the domain's day-level granularity. `LocalDate` keeps the API honest about precision.
- **Alternatives considered**: `LocalDateTime` bounds for events — rejected (leaks time precision the UI does not expose). Reusing `upcoming` — kept for compat but `from` subsumes it.

## Decision 3: Client fetch mechanics

- **Decision**: `useServerSearch(fetcher, paramsSource)` composable. `paramsSource` is a `ComputedRef<Params | null>` built by each view from `query` + `filters`. `watchDebounced` (VueUse, already installed, 300 ms) fires `fetcher(params)`; `null` params short-circuit to inactive. Returns `{ results, pending, error }`; `results === null` means "render the cached list".
- **Rationale**: Mirrors the established non-cache `loadTasks(params)` semantics, keeps caches intact (FR-012), and centralizes debounce + race-staleness handling in one place for three views.
- **Alternatives considered**: Per-view inline watchers — rejected (tripled debounce/race logic). Filtering the cached arrays client-side — rejected (FR-003).

## Decision 4: Filter UI container and controls

- **Decision**: `FilterSheet.vue` built on the existing `ui/drawer` bottom-sheet pattern (same as `TaskQuickActionsSheet`). Course picker = `ui/native-select`. Task status = `ui/toggle-group` (Todo / Completed / Any). Dates = two native `<input type="date">`.
- **Rationale**: Mobile-first bottom sheet matches the app shell; native date inputs give platform pickers for free on mobile; all chosen components are installed shadcn-vue parts.
- **Alternatives considered**: `ui/calendar` range picker — deferred (heavier UX for a two-field range; `ponytail:` note if adopted). Popover — rejected (too small for a form with 3+ controls).

## Decision 5: SearchBar port

- **Decision**: Copy `SearchBar.vue` from `pr-45` (fetched locally; file verified to need no changes to compile here — `ui/input` and `@lucide/vue` both exist). Add `v-model` (`modelValue`/`update:modelValue`) and a trailing filter icon-button (`SlidersHorizontal`, `aria-label="Filter"`, active dot when `filtersActive`).
- **Rationale**: PR #45's styling already matches DESIGN.md tokens; the current views diverged from its base, so a cherry-pick is wrong — the component file is copied, the view mounts are rewritten by hand.
