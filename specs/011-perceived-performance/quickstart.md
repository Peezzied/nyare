# Quickstart: Perceived Performance Validation

Validates the spec end-to-end against a **production build** (clarified measurement environment). Run in `frontend/`.

## Prerequisites

- Backend running on `:8080` with a sessioned dev user (`npm run dev` profile or manual login).
- Production build: `npm run build && npm run preview` (serves the built app; do NOT measure on `vite dev`).

## Static verification (fast loop)

```bash
npm run lint:oxlint      # fast lint
npm run type-check       # vue-tsc --build
npx vitest run           # full unit suite — SC-005 regression gate
```

Targeted runs during implementation:

```bash
npx vitest run src/views/__tests__/NotesView.spec.ts
npx vitest run src/views/__tests__/NoteEditor.spec.ts
npx vitest run src/components/__tests__/<changed>.spec.ts
```

## Scenario 1 — Instant tab switching (SC-001, C3)

1. Open `/tasks`, `/calendar`, `/notes` once each (cold).
2. Switch between the three tabs repeatedly.
3. **Expect**: content usable in <0.5s per switch; DevTools Network shows zero `/api/*` requests on return visits; the calendar view does not re-initialize (no visible re-layout/flicker).

## Scenario 2 — Prompt first visits (SC-002, C2)

1. Fresh session (clear cache/new incognito) on `vite preview`.
2. Open `/calendar`, then `/notes`, then a note editor, then a task detail.
3. **Expect**: each surface usable in <2s; Network waterfall shows its data requests overlapping (one stage), not queued serially.

## Scenario 3 — Deferred heavy capabilities (SC-004, C1)

1. Fresh load of `/` (start screen).
2. **Expect**: Network panel shows no `@schedule-x`, `preact`, `temporal`, or `@tiptap` modules/chunks fetched; start screen is interactive.
3. Open `/notes` — still no Tiptap chunk. Open a note — Tiptap chunk fetches then; editor appears without a spinner flash.

## Scenario 4 — Instant imagery (SC-003, C4)

1. Fresh session. Trigger any mascot dialog (e.g., task delete, archive course, discard draft).
2. **Expect**: mascot art visible the moment the dialog renders — record/eyeball zero pop-ins across every dialog type.
3. Notes grid with image-attached notes: cards reserve their image space; no layout shift as thumbnails resolve.

## Scenario 5 — Failure resilience (FR-008)

1. Stop the backend. Navigate between screens.
2. **Expect**: navigation resolves promptly to each screen's error/empty state — no hangs on the guard or spinners without end.

## Scenario 6 — Freshness regression (SC-005, C5)

1. Create/edit/delete a task and a note; run a Process cycle.
2. **Expect**: lists update from mutation responses (no visible reload), planner-affected courses refresh, and kept-alive tabs reflect changes on activation.

## Pass criteria

All scenarios pass on the production build against a local backend; `lint:oxlint`, `type-check`, and the Vitest suite are green.
