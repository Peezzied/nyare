# Implementation Plan: Notes View Container Transform Animation

**Branch**: `004-notes-container-transform` | **Date**: 2026-10-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-notes-container-transform/spec.md`

## Summary

Build an in-page expanding container transform overlay for the notes view (`/notes`), applying the exact motion choreography and interaction mechanics from `feat/calendar-improvements` (`EventDetailModal.vue`). Tapping any existing note card (`NoteCard` or `PictureNoteCard`) or the floating action button (`notes-fab`) captures its screen coordinates with `getBoundingClientRect()` and fluidly expands outward from origin coordinates into the full note editor (320ms decelerate curve). The editor features a 3-stage staggered entrance (content at 100ms, toolbar/controls at 180ms) and contracts back to origin coordinates upon dismissal (240ms accelerate curve), preserving 100% of the notes masonry grid scroll position and intercepting mobile back gestures via ephemeral `window.history.pushState`.

## Technical Context

**Language/Version**: TypeScript 5.8+, Vue 3.5+ (Composition API with `<script setup>`)  
**Primary Dependencies**: Vue 3, Vite, Tailwind CSS 4, `@lucide/vue`, Tiptap (already installed)  
**Storage**: N/A (Frontend presentation and interaction layer; delegates note persistence to existing `notesApi`)  
**Testing**: Vitest (`jsdom`)  
**Target Platform**: Mobile-first web application (baseline viewport 390px width)  
**Project Type**: Single-page web application frontend component  
**Performance Goals**: 60 fps container transform, animation completion under 350ms, zero layout shifts on masonry grid  
**Constraints**: Zero new npm dependencies (Ponytail Rule), preserve 100% of notes grid scroll position, handle device back gestures via `popstate`  
**Scale/Scope**: Notes view (`/notes`), note cards, FAB button, and note editor integration  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Justification |
| :--- | :--- | :--- |
| **I. Virtual Study Plan** | PASS | Feature touches only presentation layer animation for notes; does not alter planning rules. |
| **II. Course Anchor** | PASS | Notes retain their single-course parentage and badge styling. |
| **III. Grounded Uncertainty** | PASS | Does not fabricate or invent dates, deadlines, or note contents. |
| **VII. Ponytail Minimalism** | PASS | Zero new external dependencies. Reuses existing Vue 3 reactivity and native CSS transitions. |
| **VIII. Evidence-First Verification** | PASS | Backed by unit tests and quickstart validation guide. |
| **IX. Frontend-Backend Alignment** | PASS | Conforms to mobile-first standards in `DESIGN.md` and uses local reactive state without extra backend endpoints. |

## Project Structure

### Documentation (this feature)

```text
specs/004-notes-container-transform/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── notes-container-transform.contract.md
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code Layout

```text
frontend/src/
├── views/
│   ├── NotesView.vue                 # Coordinates container transform overlay, origin rect capture, and grid state
│   └── NoteEditor.vue                # Full-screen note editor; embedded in modal overlay or used standalone
├── components/
│   ├── NoteCard.vue                  # Emits click event with card DOM element / bounding rect
│   ├── PictureNoteCard.vue           # Emits click event with picture card DOM element / bounding rect
│   └── notes/
│       └── NoteEditorModal.vue       # In-page container transform overlay component managing animation and popstate
└── composables/
    └── useNoteTransition.ts          # Shared container transform utilities, reduced motion checks, and geometry calculations
```

**Structure Decision**:
Place the expanding modal wrapper in `src/components/notes/NoteEditorModal.vue` (or encapsulate directly within `NotesView.vue` and `useNoteTransition.ts`). This isolates animation state, reflow triggers, and popstate handling from the masonry notes grid while embedding `NoteEditor.vue` cleanly.

## Impeccable Design & Motion Craft

### 1. Motion Choreography
- **Expansion Physics**: 320ms Material 3 Emphasized Decelerate (`cubic-bezier(0.05, 0.7, 0.1, 1.0)`).
- **Staggered Content Entrance**:
  - Title, date badge, and body text enter at `100ms` offset (`translate-y-2` → `translate-y-0`, `opacity-0` → `opacity-100`) to prevent font stretching during container expansion.
  - Formatting toolbar and action controls enter at `180ms` offset.
- **Collapse Physics**: 240ms Emphasized Accelerate (`cubic-bezier(0.3, 0.0, 0.8, 0.15)`). Inner details fade out in the first `80ms` so only the clean card boundary contracts back to trigger coordinates.
- **Backdrop Scrim**: `bg-black/20` fading in smoothly over `300ms`.

### 2. Design Tokens & Visual Craft
- **Parchment Surface**: Editor card background uses `#F5F6EE` / `#FFFFFF` with warm border accents.
- **Card Corner Radius**: Initial `16px` radius smoothly transitions to `0px` full-screen viewport.
- **FAB Expansion**: Seamlessly transitions from circular/rounded FAB (`min-w-14 min-h-14 rounded-2xl`) into full viewport editor.

### 3. Ergonomics & Accessibility
- **Scroll Preservation**: `NotesView.vue` remains mounted; background scroll position is 100% retained after dismissal.
- **Scroll Lock**: `document.body.style.overflow = 'hidden'` while editor overlay is open.
- **History Back Integration**: Ephemeral `history.pushState({ nyareNoteModal: true }, '')` allows native mobile back gestures to collapse the editor.
- **Reduced Motion Support**: Bypasses spatial scaling and applies an instantaneous layout with a gentle `150ms` opacity crossfade.

## Complexity Tracking

*No violations. Design complies fully with Nyare Constitution and Ponytail Minimalism.*
