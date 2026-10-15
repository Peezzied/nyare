# Implementation Plan: Start, Welcome, and Schedule Header Flow

**Branch**: `001-setup-start-welcome` | **Date**: 2026-10-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-setup-start-welcome/spec.md`

## Summary

Implement the three onboarding screens for the Nyare frontend:
1. Start screen (`StartView.vue`) at `/`: Brand landing screen with DynaPuff `'Nyare` title, coastal mascot illustration, and tactile 3D "GET STARTED" button. No progress dots.
2. Welcome screen (`WelcomeView.vue`) at `/welcome`: Onboarding step 2 of 3 with a 3-dot progress indicator (middle dot active), name input field, speech bubble greeting mascot, and tactile 3D "CONTINUE" button enabled only on valid input.
3. Schedule screen top section (`ScheduleView.vue`) at `/schedule`: Onboarding step 3 of 3 with 3-dot progress indicator (third dot active), back button returning to `/welcome`, "Create a Schedule" title, and checkmark button. Strictly excludes calendar grid, time blocks, and bottom toolbar.

## Technical Context

**Language/Version**: TypeScript 5.9, Vue 3.5  
**Primary Dependencies**: Vue 3, Vue Router 4, Tailwind CSS 4  
**Storage**: Client-side reactive memory state via Vue composable (`useOnboarding.ts`). No Pinia, no persistence.  
**Testing**: Vitest (`npm run test:unit`), vue-tsc (`npm run type-check`), Oxlint & ESLint (`npm run lint`)  
**Target Platform**: Mobile-first responsive web application (390px baseline viewport)  
**Project Type**: Single-page web application frontend (`frontend/`)  
**Performance Goals**: Instant client-side route transitions (<50ms), initial page render <1s  
**Constraints**: Light mode only, warm parchment background `#F6F7EE`, tactile 3D button interactions, Ponytail minimalism (no external store or HTTP clients)  
**Scale/Scope**: 3 views, 2 reusable components, 1 composable, zero backend modifications  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Justification |
|---|---|---|
| **I. Virtual Study Plan** | PASS | Feature touches only client onboarding views; no DB study plan or time-blocking involved. |
| **II. Course Anchor** | PASS | Pre-course onboarding slice; no orphaned course items created. |
| **III. Grounded Uncertainty** | PASS | No invented dates, deadlines, or ratings. |
| **IV. Non-Destructive Planning** | PASS | No planner entities or student notes mutated. |
| **V. Architectural Layer Isolation** | PASS | Scope restricted strictly to `frontend/`; backend layers untouched. |
| **VI. Canonical Error Strategy** | PASS | Client-side input validation only (empty/whitespace guard); no server error contracts involved. |
| **VII. Ponytail Minimalism** | PASS | Reuses existing assets; forbids Pinia and Axios; uses native Vue Composition API and native Vue Router. |
| **VIII. Evidence-First Verification** | PASS | Verified through Vitest unit tests, type-check, and visual component checks. |

## Project Structure

### Documentation (this feature)

```text
specs/001-setup-start-welcome/
├── plan.md              # This implementation plan
├── research.md          # Technical research & design choices
├── data-model.md        # Entities & onboarding state definitions
├── quickstart.md        # Validation walkthrough & run commands
├── contracts/
│   └── ui-contracts.md  # Route & component interface definitions
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Implementation tasks (created in next phase by /speckit-tasks)
```

### Source Code (`frontend/`)

```text
frontend/src/
├── assets/
│   ├── mascot/
│   │   ├── duckota_in_stone.png   # Start screen mascot pose
│   │   └── duckuta_greet.png      # Welcome screen greeting mascot pose
│   └── props/
│       ├── double_cloud.svg       # Background cloud prop
│       ├── plant.png              # Start screen plant prop
│       ├── shell.png              # Start screen shell prop
│       ├── star_fish.png          # Start screen starfish prop
│       ├── sun.svg                # Background sun prop
│       └── wave_1.svg             # Bottom ocean wave prop
├── components/
│   ├── StepProgress.vue           # 3-dot progress indicator component
│   └── TactileButton.vue          # 3D ocean cyan tactile button component
├── composables/
│   └── useOnboarding.ts           # In-memory reactive student name state
├── router/
│   └── index.ts                   # Route configuration for /, /welcome, /schedule
├── views/
│   ├── ScheduleView.vue           # Step 3: Top header section only
│   ├── StartView.vue              # Step 1: Landing / Start screen
│   └── WelcomeView.vue            # Step 2: Welcome name input screen
└── components/__tests__/
    ├── StepProgress.spec.ts       # Progress dot rendering tests
    └── TactileButton.spec.ts      # Tactile button interaction tests
```

**Structure Decision**: Standard Vue 3 single-page application structure under `frontend/src/` aligning with existing repository conventions and `frontend/DESIGN.md`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No constitution violations. Architecture is fully compliant with Ponytail minimalism and project principles.*
