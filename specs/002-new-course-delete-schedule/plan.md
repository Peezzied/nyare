# Implementation Plan: New Course Interface

**Branch**: `feat/setup-pages` | **Date**: 2026-10-14 | **Spec**: `/specs/002-new-course-delete-schedule/spec.md`

**Input**: Feature specification from `/specs/002-new-course-delete-schedule/spec.md`

**Scope**: Frontend only for this phase. No backend, database, Hibernate, API contract, router, shared styling, or migration changes are included.

## Summary

Implement the New Course interface on the existing schedule-creation surface at `/schedule`. The form supports course name, a selected 24-palette course color, and independently editable time-block cards with weekday, start time, end time, and room. It uses the existing `coursesApi` and `schedulesApi` contracts, updates `useCatalog` from successful mutation responses, and reports partial creation failures clearly.

Selected color and room are used immediately in the UI only. They are not sent to the backend and are not persisted. Backend persistence for these fields remains future approved work.

## Technical Context

**Language/Version**: TypeScript 5.x with Vue 3.5 and Vite; backend is an existing contract dependency only.
**Primary Dependencies**: Vue 3, Tailwind CSS 4, Vitest. No new dependencies.
**Storage**: Frontend component state and `useCatalog` reactive state only. No database or local persistence changes.
**Testing**: Vitest component tests, Oxlint, and `npm run type-check`.
**Target Platform**: Mobile-first web application, 390px baseline, Vitest jsdom environment.
**Project Type**: Web application; implementation is frontend-only.
**Performance Goals**: Keep one catalog load per intent and update local state from mutation responses.
**Constraints**: Existing API contracts, no transactional composite endpoint, no router/shared style changes, no dependency additions.
**Scale/Scope**: One implementation surface and corresponding frontend tests.

## Constitution Check

**Gate Status: PASS for frontend-only scope**

- Strict architectural layering: all changes stay in Vue components/composables.
- Canonical error strategy: frontend displays existing API/RFC 7807 error messages.
- Ponytail minimalism: native Vue/Tailwind only; no Pinia or Axios; no new dependency.
- Evidence-first verification: type-check, lint, Vitest, and 390px visual review.
- Surgical edits: only files directly required for the approved UI scope.

## Project Structure

### Documentation (this feature)

```text
specs/002-new-course-delete-schedule/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── views/
│   │   └── ScheduleView.vue                    # modify
│   ├── composables/
│   │   └── useCatalog.ts                     # use only; no intended changes
│   ├── api/
│   │   ├── courses.ts                         # use only; no API changes
│   │   └── schedules.ts                       # use only; no API changes
│   ├── constants/
│   │   └── palette.ts                         # use only; no breaking changes
│   └── ...
└── frontend/src/views/__tests__/
    └── ScheduleView.spec.ts                    # modify
```

**Structure Decision**: Implement the New Course UI in the existing `ScheduleView.vue` surface because `WelcomeView.vue` already navigates to `/schedule` and no separate creation route is evidenced. No route changes are planned.

## Planned Files to Create or Modify

Modify:
- `frontend/src/views/ScheduleView.vue`
- `frontend/src/views/__tests__/ScheduleView.spec.ts`

No changes in this phase:
- `backend/**`
- database files
- `frontend/src/router/index.ts`
- `frontend/src/api/courses.ts`
- `frontend/src/api/schedules.ts`
- `frontend/src/types/api.ts`
- `frontend/src/composables/useCatalog.ts`
- `frontend/src/constants/palette.ts`
- shared global styles
- any Delete Schedule component, test, or behavior

## Frontend Implementation Outline

1. Preserve the existing page shell and onboarding context: max-width 390-like layout, back button, title, and primary action.
2. Store form state with Vue `ref` / `reactive`:
   - course name
   - selected 24-palette color ID
   - ordered time-block drafts
   - create/save error and loading state
3. Render each time block as a rounded white card with a consistent gap.
4. Each card contains:
   - rounded-square weekday selector
   - start time input
   - end time input
   - room text input
5. Use selected color visually for every time block and newly created schedule entries shown in the current flow.
6. Keep course name and color selection visually separate from repeated time-block cards.
7. Add a new independent time block when “Add another time” is activated and move the action beneath it.
8. Validate client-side:
   - course name required
   - at least one complete time block before save
   - weekday required
   - start time before end time
9. Create Course first with existing `coursesApi.create`, using name and resolved user identifier.
10. Use returned `CourseResponse.id` for each Schedule creation.
11. Apply only successful responses with existing `useCatalog` helpers.
12. Preserve failed drafts and allow retry only for failed blocks.
13. Do not send `color` or `room` under existing contracts.
14. Report clear partial-failure and full-success states.
15. Use neutral success/error messaging that does not imply color or room was persisted.

## Dependencies Between Work Items

1. Existing API and catalog helpers must be reviewed before changes; no signature changes are allowed.
2. Form state and block rendering implementation precedes test updates.
3. Partial-failure handling depends on the successful response tracking in the component.
4. No Delete Schedule work is included.

## Targeted Testing and Verification

Run in `frontend/`:

```bash
npm run type-check
npm run lint:oxlint
npm run lint
npm run format
npm run test:unit
```

Focused tests:

```bash
npx vitest run src/views/__tests__/ScheduleView.spec.ts
```

Manual review:
- 390px viewport rendering
- color selection visual treatment
- weekday selector visual distinction
- gap spacing and append behavior
- partial failure and retry behavior
- no accidental backend/API field additions

## Out of Scope for Verification

- Backend compile or test commands
- Database/schema commands
- Delete Schedule
- API contract changes

## Risks and Assumptions

1. Course color and room are UI-only and will not persist or reload.
2. No atomic course-plus-schedules endpoint exists; partial creation remains possible and must be communicated honestly.
3. Existing `ScheduleView.spec.ts` tests reference placeholder behavior and must be updated in the same approved change.
4. Screenshot-only visual details are approximated through `frontend/DESIGN.md` and existing component patterns.
5. Existing users or hidden tests may still assume the old placeholder ScheduleView behavior.

## Decisions Pending Approval

1. Whether success messages should be completely neutral or explicitly state that color and room were not saved.
2. Whether weekday labels should be abbreviations or include full names while enum values remain the source of truth.
3. Whether the existing StepProgress should remain visually unchanged on this surface. Recommended yes, because WelcomeView routes to `/schedule` as the final onboarding step.

Wait for review before implementation. No application code has been added.