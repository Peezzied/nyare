# Implementation Plan: Note Editor View

**Branch**: `002-note-editor-view` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-note-editor-view/spec.md`

## Summary

Deliver a dedicated, coastal-styled `NoteEditor` view (`NoteEditor.vue`) for Nyare's Vue 3 mobile-first frontend. The view integrates the existing `TiptapEditor` component with a single-line, horizontally scrollable bottom toolbar featuring standout Undo/Redo buttons, image uploading, and rich text formatting. It enforces course parentage gating (typing disabled until course selected), past/present date restrictions (up to 14 days), bidirectional Markdown conversion for API persistence (`POST`/`PUT /api/notes`), and image database validation.

## Technical Context

**Language/Version**: TypeScript 5.9+, Vue 3.5+ (Composition API with `<script setup>`)

**Primary Dependencies**: `@tiptap/vue-3` (v3.31), `@tiptap/starter-kit`, `@tiptap/extension-image`, `reka-ui`, `@lucide/vue`, Tailwind CSS v4, Vue Router 4

**Storage**: REST API `/api/notes` (Markdown note persistence) + `/api/images` (image binary upload) + SQLite

**Testing**: Vitest (`jsdom`), `@vue/test-utils`, vue-tsc

**Target Platform**: Web browsers (Mobile-first baseline 390px, responsive to desktop)

**Project Type**: Web application frontend view and components

**Performance Goals**: View loads in < 500ms; note saves complete in < 500ms; zero layout shifts on horizontal toolbar scroll

**Constraints**: Mobile touch targets >= 32x32px; course parentage invariant strictly enforced; no extraneous npm dependencies (Ponytail minimalism); ASD-STE100 active terminology

**Scale/Scope**: 1 view component (`NoteEditor.vue`), router updates, toolbar horizontal scroll enhancement, course color palette utility, markdown conversion utility, unit test suites

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evaluation |
|---|---|---|
| I. Virtual Study Plan and Tri-State Planning | PASS | Note editor creates source notes; no direct modification of virtual study plan derivation. |
| II. Course Anchor and Single Parentage | PASS | Strictly enforces course selection before allowing note typing or saving; course is root container. |
| III. Grounded Uncertainty Preservation | PASS | Preserves student input accurately; does not synthesize deadlines or durations. |
| IV. Non-Destructive Additive Planning | PASS | Stores authentic user note text in Markdown without rewriting. |
| V. Strict Architectural Layer Isolation | PASS | Frontend communicates with backend strictly via DTOs through `notesApi` and `imagesApi`. |
| VI. Canonical Error Strategy | PASS | Catches and displays API error responses (RFC 7807) cleanly without corrupting user input. |
| VII. Ponytail Minimalism and Native Features | PASS | Reuses existing Tiptap editor, catalog composable, and native fetch. No Pinia or external heavy parsers. |
| VIII. Evidence-First Verification and Surgical Edits | PASS | Fully verifiable with unit tests, type-check, and lint gates. |

## Project Structure

### Documentation (this feature)

```text
specs/002-note-editor-view/
├── plan.md              # Implementation plan (/speckit-plan output)
├── research.md          # Phase 0 architecture research and decisions
├── data-model.md        # Phase 1 data entities and validation flows
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # Phase 1 component contracts
│   └── note-editor.contract.md
└── checklists/
    └── requirements.md  # Requirements quality checklist
```

### Source Code Layout

```text
frontend/
└── src/
    ├── router/
    │   └── index.ts                                    # Register /notes/new and /notes/:id routes
    ├── views/
    │   ├── NoteEditor.vue                              # Main NoteEditor view component
    │   └── __tests__/
    │       └── NoteEditor.spec.ts                      # View unit test suite
    ├── components/
    │   └── editor/
    │       ├── TiptapToolbar.vue                       # Updated for one-liner horizontal scrolling & standout undo/redo
    │       ├── TiptapEditor.vue                        # Wired with bottom toolbar and markdown support
    │       └── __tests__/
    │           └── TiptapToolbar.spec.ts               # Toolbar layout test updates
    ├── utils/
    │   ├── courseColors.ts                             # 24-color course palette mapping
    │   ├── markdown.ts                                 # Minimal HTML <-> Markdown conversion utility
    │   └── __tests__/
    │       ├── courseColors.spec.ts                    # Course colors unit tests
    │       └── markdown.spec.ts                        # Markdown conversion unit tests
    └── types/
        └── api.ts                                      # Update NoteRequest/NoteResponse to include title & entryDate
```

## Complexity Tracking

No constitution violations detected. Standard minimal implementation without extraneous abstractions.
