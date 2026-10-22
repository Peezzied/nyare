# Implementation Plan: Perceived Performance

**Branch**: `dev/frontend` | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-perceived-performance/spec.md`

## Summary

Remove every self-inflicted wait in the frontend: serialize-free data loading (`Promise.all` fan-outs), deferred heavy modules (lazy `CreateScheduleView`, `defineAsyncComponent` NoteEditor), preserved view state (`<KeepAlive>` on the three tabs), cache-respecting mounts (drop forced refetches), pre-fetched dialog imagery, reserved-space note images, and a non-blocking font stylesheet. All changes are frontend-only, grounded on `vue-best-practices` (KeepAlive, async components) and `vue-router-best-practices` (async guards, param-lifecycle) skills — see [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript, Vue 3.5 (`<script setup>`), Vite (rolldown) + Tailwind 4

**Primary Dependencies**: vue-router 5, `@tiptap/*` 3.31, `@schedule-x/*` 4.9 (preact + temporal-polyfill transitives), vueuse 15, reka-ui, lucide icons

**Storage**: N/A — module-level `ref` caches via `createCache()`; backend untouched

**Testing**: Vitest + @vue/test-utils (jsdom), targeted `npx vitest run <file>` + `npm run lint:oxlint` + `npm run type-check`

**Target Platform**: Mobile-first web, 390px baseline, production build (`vite preview`)

**Project Type**: Web application frontend (`frontend/` only)

**Performance Goals**: warm navigation <0.5s; first visit to any screen <2s; zero imagery pop-in

**Constraints**: no new dependencies (constitution VII); composables only, no Pinia; preserve cache/freshness contract (FR-009); pure views, no dev-env branches (constitution X)

**Scale/Scope**: 13 route views, ~40 shared components, 6 composable caches; ~10 files touched

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | Evidence |
|-----------|---------|----------|
| VII Ponytail minimalism | PASS | No new deps; smallest diffs (`new Image().src`, `Promise.all`, one-line lazy import); no new abstractions |
| VIII Evidence-first, surgical edits | PASS | Root causes traced per surface (serial awaits, `v-if` img, eager chunks); edits touch only implicated lines; verification via targeted vitest + oxlint + type-check |
| IX Frontend-backend alignment | PASS | No backend calls added or removed semantically; tri-state derivation untouched; freshness contract preserved (FR-009) |
| X Pure views | PASS | KeepAlive/async/preload are transport mechanics; no `import.meta.env`/mock branches introduced |
| Data-flow conventions (roundtrips) | PASS | Removes violations (forced `loadNotes(true)`, post-save reload); caches remain source of truth |

No violations — Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/011-perceived-performance/
├── plan.md              # This file
├── research.md          # Phase 0 output — 9 grounded decisions
├── data-model.md        # Phase 1 output — cache/state model
├── contracts/
│   └── ui-loading-contract.md  # C1–C5 observable loading contracts
├── quickstart.md        # Phase 1 output — prod-build validation scenarios
└── checklists/
    └── requirements.md  # Spec quality checklist (all passing)
```

### Source Code (repository root)

```text
frontend/
├── index.html                                  # non-blocking font stylesheet
├── src/
│   ├── router/index.ts                         # lazy CreateScheduleView
│   ├── components/
│   │   ├── AppShell.vue                        # KeepAlive-wrapped RouterView
│   │   ├── ui/DialogShell.vue                  # mascot image warm
│   │   ├── DiscardDraftConfirmDialog.vue       # mascot image warm
│   │   ├── notes/NoteEditorModal.vue           # defineAsyncComponent NoteEditor
│   │   ├── NoteCard.vue                        # reserved image space
│   │   ├── PictureNoteCard.vue                 # reserved image space
│   │   └── tasks/TaskDetailPanel.vue           # parallel load
│   └── views/
│       ├── CalendarView.vue                    # Promise.all fan-out + defineOptions name
│       ├── TodoView.vue                        # Promise.all fan-out + defineOptions name
│       ├── NotesView.vue                       # drop forced refetch + defineOptions name
│       ├── NoteEditor.vue                      # parallel onMounted chain
│       └── ArchivedCourseView.vue              # parallel archive+content load
└── src/components/editor/TiptapEditor.vue      # embedded img reserved space (if needed)
```

**Structure Decision**: Single web app — frontend only; no backend or contract changes.

## Phase 0 Output

[research.md](research.md) — 9 decisions with rationale and rejected alternatives:

1. Lazy `CreateScheduleView` (removes Schedule-X/preact/temporal from entry)
2. `defineAsyncComponent` NoteEditor (removes Tiptap from `/notes` chunk)
3. `<KeepAlive include>` on the three tab views + `defineOptions` names; param routes excluded (skill gotcha)
4. `Promise.all` fan-outs in CalendarView, TodoView, NoteEditor, TaskDetailPanel, ArchivedCourseView
5. Drop `loadNotes(true)` force-refetch and `@saved` reload (trust mutation responses)
6. `new Image().src` warm in DialogShell + DiscardDraftConfirmDialog
7. Reserved geometry for note-attached images (no layout shift)
8. Router guard unchanged (single dependent round-trip satisfies FR-003/FR-008)
9. Preload-swap font stylesheet in `index.html`

## Phase 1 Output

- [data-model.md](data-model.md) — existing cache contracts + new client state (kept-alive instances, warmed images, editor chunk)
- [contracts/ui-loading-contract.md](contracts/ui-loading-contract.md) — C1 capability boundaries, C2 concurrency, C3 revisit, C4 imagery, C5 freshness
- [quickstart.md](quickstart.md) — prod-build validation scenarios mapped to SC-001…SC-005

## Post-Design Constitution Re-Check

Re-evaluated after Phase 1: all gates still PASS. The design introduces no new layers, exceptions, state libraries, or backend surface; every edit traces to a spec FR.

## Complexity Tracking

No constitution violations — section intentionally empty.
