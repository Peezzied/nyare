# Implementation Plan: Revise To-do List Screen and Task Detail Placeholder

**Branch**: `002-todo-list-redesign` | **Date**: 2026-10-15 | **Spec**: [spec.md](file:///D:/IdeaProjects/nyare/specs/002-todo-list-redesign/spec.md)

## Summary
Revise the To-do list view to match the new reference: segmented category pills (All, Scheduled, Later, Backlog), collapsible accordion sections for "All", color-coded calendar urgency icons, and replace the popup modal with a dedicated full-page placeholder route `/tasks/:id`.

## Technical Context
- **Stack**: Vue 3 (Composition API, `<script setup>`), TypeScript, Tailwind CSS 4, Vite, vue-router 4.
- **Dependencies**: Lucide Vue Next (`ChevronDown`, `ChevronRight`, `Calendar`, `ArrowLeft`). No new dependencies.
- **State & Data**: Virtual plan categories computed locally via `getPlanCategory`. Local urgency calculation using calendar day diffs against mock `TASK_DUE_DATES`.
- **Testing & Quality**: Vitest (`npm run test:unit`), oxlint (`npm run lint:oxlint`), vue-tsc (`npm run type-check`).

## Constitution & Invariants Check
- **Principle I (Virtual Study Plan)**: Categories derived on client; zero backend/DB persistence. PASS.
- **Principle VII (Ponytail Minimalism)**: Reuses existing composables/helpers, no Pinia/Axios, native fetch and Vue refs. PASS.
- **Principle VIII (Surgical Edits)**: Delete obsolete `TodoItemModal.vue`, add `TaskDetailView.vue`, update `TodoView.vue` and `router/index.ts`. PASS.

## Execution Steps
1. **Fixture & Helpers**: Add urgency calculation and fixture due date mappings in `src/utils/taskUrgency.ts` and `src/api/mocks/fixtures.ts`.
2. **Task Detail Route**: Register `/tasks/:id` in `src/router/index.ts` and implement `TaskDetailView.vue` with redirect for unknown IDs.
3. **To-do List Refactor**: Update `src/views/TodoView.vue` with segmented filter, collapsible sections, urgency icons, and row click navigation. Remove `TodoItemModal.vue`.
4. **Verification**: Run `npm run lint:oxlint`, `npm run type-check`, and `npm run test:unit`.
