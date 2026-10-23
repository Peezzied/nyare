# Implementation Plan: Unified Search and Filter

**Branch**: `dev/frontend` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-unified-search-filter/spec.md`

## Summary

Port the `SearchBar.vue` component from PR #45 into the current branch and make it functional. Backend list endpoints for tasks, notes, and academic events gain `q`, `from`, and `to` query parameters. The frontend gains a `useServerSearch` composable that debounces a typed query plus filter-sheet state into one server-filtered list call per surface. A filter button beside the search bar opens a bottom sheet with course, date-range, and (tasks only) status filters. Day and week calendar modes stay untouched; search lives in deadlines mode only.

## Technical Context

**Language/Version**: Java 25 / Spring Boot 4.1.1 (backend); TypeScript / Vue 3 + Vite (frontend)

**Primary Dependencies**: Spring Data JPA, Hibernate, SQLite; VueUse (`watchDebounced`), shadcn-vue (`Drawer`, `NativeSelect`, `ToggleGroup`, `Input`), `@lucide/vue`, Tailwind 4 — all already installed

**Storage**: SQLite via existing `findAllFiltered` JPQL queries; no schema changes

**Testing**: JUnit 5 + Mockito service tests, `@WebMvcTest` controller tests; Vitest + jsdom for composable/adapter/view specs

**Target Platform**: Mobile-first web (390 px baseline), backend on port 8080

**Project Type**: Web application (`backend/` + `frontend/`)

**Performance Goals**: Search lookups feel instant (<2 s perceived on hundreds of rows); one request per typing pause, not per keystroke

**Constraints**: Day-level granularity only; derived tri-state (`SCHEDULED`/`LATER`/`BACKLOG`) stays client-side; search results never write to shared caches

**Scale/Scope**: 3 backend list endpoints, 1 new component, 1 new filter sheet, 1 new composable, 3 view touchpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Virtual study plan | Pass | Search returns flat results; tri-state derivation unchanged for unfiltered list |
| V. Layer isolation | Pass | `q`/`from`/`to` flow controller → service interface → repository; DTOs only out |
| VI. Canonical errors | Pass | Invalid date range (from > to) throws existing `BadRequestException` |
| VII. Ponytail minimalism | Pass | Extends existing `findAllFiltered` queries; reuses installed deps; no new packages |
| VIII. Evidence-first | Pass | Verification steps in quickstart.md; smallest-scope tests |
| IX. Frontend-backend alignment | Pass | Server params exist → client must filter on server; date params *added*, so the constitution line "backend exposes no date range query parameters" needs a wording amendment post-implementation |
| X. Pure views | Pass | Debounce/fetch logic lives in a composable; views stay declarative |

**Gate result**: PASS — one doc-drift amendment flagged (constitution §Frontend Data Flow line on date params), not a violation.

## Project Structure

### Documentation (this feature)

```text
specs/013-unified-search-filter/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── list-endpoints.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/src/main/java/group/four/nyare/nyare/
├── controller/   # TaskController, NoteController, AcademicEventController (+q/from/to params)
├── service/      # TaskService, NoteService, AcademicEventService signatures + impls
└── repository/   # TaskRepository, NoteRepository, AcademicEventRepository findAllFiltered

backend/src/test/java/group/four/nyare/nyare/
├── service/impl/ # param passthrough + blank-q normalization tests
└── controller/   # @WebMvcTest: q/from/to binding + 400 on inverted range

frontend/src/
├── components/SearchBar.vue          # ported from PR #45 + v-model + filter affordance
├── components/FilterSheet.vue        # drawer sheet: course, date range, task status
├── composables/useServerSearch.ts    # debounced server-filtered list fetch
├── composables/useNotes.ts           # + params passthrough (mirror useTasks)
├── api/{tasks,notes,academicEvents}.ts # + q/from/to on *ListParams
├── api/mocks/adapter.ts              # mirror q/date filters
└── views/{TodoView,NotesView,CalendarView}.vue
```

## Design Decisions (from research.md)

1. **`q` param** on all three list endpoints; case-insensitive `LIKE` on title + description/content.
2. **`from`/`to` as `LocalDate`** on all three endpoints — tasks filter `scheduledDate`, notes `entryDate`, events `deadline` (service converts to day bounds).
3. **`useServerSearch(fetcher, paramsSource)`** — composable returns `results`/`pending`/`error`; `null` params = inactive → view renders cached list.
4. **`SearchBar.vue`** = input row + optional filter button (`filtersActive` dot, `filter` emit); `FilterSheet.vue` = `Drawer` bottom sheet with `NativeSelect` course picker, native `type="date"` inputs, `ToggleGroup` status (tasks only).
5. **Deadlines mode only** in CalendarView; deadline sections recompute from server-filtered events while search is active.

## Post-Design Constitution Re-check

PASS — see table above; unchanged after Phase 1 design.
