# Implementation Plan: Lift Navigation Bar Component

**Branch**: `001-lift-navigation-bar` | **Date**: 2026-10-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-lift-navigation-bar/spec.md`

## Summary

Build a mobile-first bottom navigation bar component (`NavigationBar.vue`) featuring three academic destinations (Tasks, Calendar, Notes). Implement Duolingo-inspired tactile 3D lift physics where the active icon lifts with an Ocean Cyan accent color (`#00A4C8`) and a physical bottom bevel (`#007B99`). Deploy a specialized subagent using the `/histoire` skill to build an interactive component story (`NavigationBar.story.vue`).

---

## Technical Context

**Language/Version**: TypeScript 5.8+ with Vue 3.5.42 (Composition API, `<script setup lang="ts">`)

**Primary Dependencies**: `reka-ui` (^2.11.0), `@lucide/vue` (^1.55.0), Tailwind CSS 4 (^4.3.3), Histoire (^1.0.0-beta.1)

**Storage**: None (Presentation component)

**Testing**: Vitest (^4.1.11) with `@vue/test-utils` (^2.5.0) in `jsdom`

**Target Platform**: Mobile-first Web Application (390px baseline viewport)

**Project Type**: Web Application Component

**Performance Goals**: 60 fps GPU-accelerated CSS transforms, zero layout shifts, <100ms press response

**Constraints**: Touch targets >= 44x44 points, safe-area chin padding, `prefers-reduced-motion` compliance

**Scale/Scope**: 1 UI component (`NavigationBar.vue`), 1 story (`NavigationBar.story.vue`), 1 unit test suite (`NavigationBar.spec.ts`)

---

## Constitution Check

*GATE: All gates passed before design. Re-checked post-design.*

- **Principle I (Virtual Study Plan)**: Pass. Navigation links point to virtual planner views without persisting state.
- **Principle V (Strict Architectural Layer Isolation)**: Pass. Component is strictly in the presentation layer.
- **Principle VII (Ponytail Minimalism & Native Features)**: Pass. Reuses existing `reka-ui` and Tailwind 4 without adding any new npm dependencies.
- **Principle VIII (Evidence-First Verification)**: Pass. Verifies behavior with Vitest and Histoire before completion.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-lift-navigation-bar/
├── plan.md              # This implementation plan
├── research.md          # Phase 0 technical research
├── data-model.md        # Phase 1 data model & interaction transitions
├── contracts/           # Phase 1 component & story contracts
│   └── navigation-bar.contract.md
├── quickstart.md        # Phase 1 verification and runnable scenarios
└── checklists/
    └── requirements.md  # Spec quality validation checklist
```

### Source Code

```text
frontend/
├── src/
│   ├── components/
│   │   ├── NavigationBar.vue          # Core navigation bar component
│   │   ├── NavigationBar.story.vue    # Histoire story generated via subagent
│   │   └── __tests__/
│   │       └── NavigationBar.spec.ts  # Vitest unit test suite
```

**Structure Decision**: Place `NavigationBar.vue` in `src/components/` with sibling Histoire story and unit tests in `src/components/__tests__/` per repository conventions.

---

## Subagent Deployment Plan (Histoire Story Generation)

To ensure isolated visual testing and preserve main agent context:

1. **Subagent Role**: Histoire Story Author
2. **Skill Invoked**: `histoire` (`.agents/skills/histoire/SKILL.md`)
3. **Target File**: `frontend/src/components/NavigationBar.story.vue`
4. **Subagent Workflow**:
   - Inspect `NavigationBar.vue` props and contract.
   - Author `NavigationBar.story.vue` with three variants: `Default`, `Active States`, and `Mobile Frame`.
   - Verify story structure against project conventions (no unit test code inside stories).
   - Report verification back to main agent.

---

## Complexity Tracking

> **No Constitution violations detected. Table empty.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| None | N/A | N/A |
