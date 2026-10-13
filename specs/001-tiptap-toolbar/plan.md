# Implementation Plan: Rich Text Toolbar and Editor

**Branch**: `001-tiptap-toolbar` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-tiptap-toolbar/spec.md`

## Summary

Deliver a modular, accessible rich text toolbar and editor component for Nyare's Vue 3 frontend. The solution adopts the **Shadcn-Vue / Tiptap Primitives Pattern**, composing `@tiptap/vue-3`, official `@tiptap/extension-image`, `reka-ui`, and `@/components/ui/button`. It includes inline text marks, headings, lists, quotes, undo/redo history controls, and image upload connected to the existing `/api/images` endpoint.

## Technical Context

**Language/Version**: TypeScript 5.9+, Vue 3.5+ (Composition API with `<script setup>`)

**Primary Dependencies**: `@tiptap/vue-3` (v3.31), `@tiptap/starter-kit` (v3.31), `@tiptap/extension-image` (v3.31), `@tiptap/pm`, `reka-ui`, `@lucide/vue`, Tailwind CSS v4

**Storage**: REST API `/api/images` (image binary upload via `imagesApi.upload()`) + Note document HTML persistence

**Testing**: Vitest (`jsdom`), `@vue/test-utils`, Histoire (`histoire dev`)

**Target Platform**: Web browsers (Mobile-first, responsive from 360px viewport up to 1920px desktop)

**Project Type**: Web application frontend component

**Performance Goals**: Text formatting renders in < 100ms; image uploads render in < 3s over standard network; zero layout shifts

**Constraints**: Touch targets >= 32x32px; no unmaintained/vulnerable third-party editor packages; ASD-STE100 active terminology

**Scale/Scope**: 1 toolbar component, 1 editor wrapper component, 1 Histoire story, 1 unit test suite

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evaluation |
|---|---|---|
| I. Virtual Study Plan and Tri-State Planning | PASS | Editor formats note content; no changes to virtual study plan derivation. |
| II. Course Anchor and Single Parentage | PASS | Notes remain linked to their parent course container. |
| III. Grounded Uncertainty Preservation | PASS | No synthetic deadlines or scores generated. |
| IV. Non-Destructive Additive Planning | PASS | User text is preserved without alteration. |
| V. Strict Architectural Layer Isolation | PASS | Editor interacts with backend exclusively via `imagesApi` and `notesApi`. |
| VI. Canonical Error Strategy | PASS | Image upload failures surface clear error notices without corrupting notes. |
| VII. Ponytail Minimalism and Native Features | PASS | Reuses existing `@/components/ui/button`, `@lucide/vue`, and standard Tiptap primitives. No bloated third-party wrapper dependencies. |
| VIII. Evidence-First Verification and Surgical Edits | PASS | Includes unit tests (`TiptapToolbar.spec.ts`) and Histoire visual stories. |

## Project Structure

### Documentation (this feature)

```text
specs/001-tiptap-toolbar/
├── plan.md              # Implementation plan (/speckit-plan output)
├── research.md          # Phase 0 architecture research and decisions
├── data-model.md        # Phase 1 data entities and history state transitions
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # Phase 1 component contracts
│   ├── tiptap-toolbar.contract.md
│   └── tiptap-editor.contract.md
└── checklists/
    └── requirements.md  # Requirements quality checklist
```

### Source Code Layout

```text
frontend/
├── package.json                                         # Add @tiptap/extension-image
└── src/
    ├── components/
    │   └── editor/
    │       ├── TiptapToolbar.vue                       # Rich text toolbar component
    │       ├── TiptapEditor.vue                        # Editor wrapper with ProseMirror container
    │       ├── TiptapEditor.story.vue                  # Histoire visual preview
    │       └── __tests__/
    │           └── TiptapToolbar.spec.ts               # Vitest unit test suite
    └── api/
        └── images.ts                                   # Existing image upload client
```

**Structure Decision**: Standard Vue 3 component pattern under `src/components/editor/` alongside existing `src/components/ui/` design tokens.

## Complexity Tracking

No constitution violations detected. Standard minimal implementation without extraneous abstractions.
