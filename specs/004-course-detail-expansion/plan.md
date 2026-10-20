# Implementation Plan: Course Block Expansion & Detail View

**Branch**: `004-course-detail-expansion` | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-course-detail-expansion/spec.md`

## Summary

Build an in-page expanding container transform overlay for calendar blocks on the mobile schedule view (`/schedule`). Tapping a course block captures its bounding rectangle with `getBoundingClientRect()` and fluidly expands it into a full-height mobile view (390px baseline) displaying strictly the course color dot, course name, meeting time window, and navigation buttons to `/tasks` and `/notes`. Non-course blocks (tasks, academic events) expand to show strictly the title and a singular linked note. Dismissing reverses the animation into the origin slot coordinates, preserving calendar scroll position and handling the device back button via ephemeral `history.pushState`.

## Technical Context

**Language/Version**: TypeScript 5.8+, Vue 3.5+ (Composition API with `<script setup>`)  
**Primary Dependencies**: Vue 3, Vite, Tailwind CSS 4, `@lucide/vue`, `@schedule-x/vue` (already installed)  
**Storage**: N/A (Presentation layer in-page UI state only)  
**Testing**: Vitest (`jsdom`)  
**Target Platform**: Mobile-first web application (baseline viewport 390px width)  
**Project Type**: Single-page web application frontend component  
**Performance Goals**: 60 fps container transform, animation completion in under 350ms, zero layout shifts on calendar grid  
**Constraints**: Zero new npm dependencies (Ponytail Rule), preserve 100% of calendar scroll position and day state, handle mobile back gesture  
**Scale/Scope**: Day view calendar schedule blocks and untimed items strip  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Justification |
| :--- | :--- | :--- |
| **I. Virtual Study Plan** | PASS | Does not persist any plan or timetable entities to the database. |
| **II. Course Anchor** | PASS | Course cards and detail states map directly to existing parent courses. |
| **III. Grounded Uncertainty** | PASS | Does not invent or fabricate meeting times, deadlines, or rooms. |
| **VII. Ponytail Minimalism** | PASS | Zero new external dependencies. Reuses existing Vue 3 reactive features and native CSS transitions. |
| **VIII. Evidence-First Verification** | PASS | Includes unit test coverage for state and interaction contracts. |
| **IX. Frontend-Backend Alignment** | PASS | Conforms to mobile-first standards in `DESIGN.md` and uses local reactive state. |

## Project Structure

### Documentation (this feature)

```text
specs/004-course-detail-expansion/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── detail-overlay.contract.md
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code Layout

```text
frontend/src/components/day-view/
├── CourseCard.vue            # Emits DOM click event with bounding rectangle
├── AllDayStrip.vue           # Emits select event for untimed tasks/events with bounding rect
├── ScheduleCalendar.vue      # Coordinates active modal state, day calendar grid, and overlay
├── EventDetailModal.vue      # Manages container transform animation, backdrop, and history back
├── CourseBlockDetail.vue     # Renders strictly color dot, course name, time, and action buttons
└── UntimedBlockDetail.vue    # Renders strictly title and singular linked note
```

**Structure Decision**:
Extend the existing `src/components/day-view/` directory. Create modular detail view components while keeping the container transform orchestration inside `EventDetailModal.vue` to avoid cluttering `ScheduleCalendar.vue`.

## Impeccable Design & Motion Craft

### 1. Motion Choreography
- **Expansion Physics**: 320ms Material 3 Emphasized Decelerate (`cubic-bezier(0.05, 0.7, 0.1, 1.0)`).
- **Staggered Content Entrance**: Inner text and pills enter at 100ms offset (`translate-y-2` → `translate-y-0`, `opacity-0` → `opacity-100`) to prevent font stretching during card expansion.
- **Button Spring Entrance**: 3D action buttons enter at 180ms offset with subtle overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1.0)`).
- **Collapse Physics**: 240ms Emphasized Accelerate (`cubic-bezier(0.3, 0.0, 0.8, 0.15)`), fading content in 80ms while collapsing geometry to origin coordinates.

### 2. Design Tokens & Visual Craft
- **Typography**: Header uses `Quicksand` 700 (`text-2xl font-bold text-[#334155]`). Time badge uses `Quicksand` 600.
- **Course Color Bead**: 10px circular bead with subtle inner border matching the course theme (`green`, `blue`, `purple`, `orange`).
- **3D Tactile Buttons**:
  - Face: `#00A4C8` (Ocean Cyan), font: Quicksand 700, text: `#FFFFFF`.
  - Bevel: `4px solid #007799`.
  - Tap State: `active:translate-y-1 active:border-b-0`.
- **Backdrop**: `bg-slate-900/40 backdrop-blur-[3px]` fading in smoothly.

### 3. Ergonomics & Accessibility
- Minimum touch target 44×44px for close button and action buttons.
- Body scroll locked when modal is open to prevent background grid shifting.
- Ephemeral `history.pushState` integration for natural mobile back gesture dismissal.

## Complexity Tracking

*No violations. Design complies fully with Nyare Constitution and Ponytail Minimalism.*
