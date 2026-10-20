# Research: Manage Courses Page

All unknowns are resolved. Each decision follows YAGNI and Ponytail rules.

## R1. How to reuse the Create Schedule drawer

- **Decision**: Extract the `<Drawer>` block of `CreateScheduleView.vue` (template lines 1144-1381) into `components/CourseEditorDrawer.vue`. Both views use it.
- **Rationale**: The user asked for the same drawer. The block is markup plus snap-point and touch logic. The data lives in `CourseEditor` (`useCourseEditor.ts`) and `TimeBlockCard.vue`. Both already exist as shared pieces.
- **Alternatives rejected**:
  - Copy the markup into the new view. Rejected: two drawers drift apart.
  - Mount `CreateScheduleView` itself. Rejected: it owns onboarding, drafts, `flush()`, and routing.
- **Safety**: `CreateScheduleView.spec.ts` is the regression net. Run it before and after the extraction. Keep all `data-testid` values.

## R2. Backend changes

- **Decision**: Add `PUT /api/courses/{id}` that updates `name` and `description`. `CourseRequest` already says "creating or updating". Schedules already have `PUT /api/schedules/{id}`.
- **Rationale**: The current re-persist path in `useCourseDrafts.flush()` deletes then creates a course. Delete cascades to notes, tasks, and events. Edit MUST NOT use that path. FR-012 requires that notes stay linked.
- **Alternatives rejected**: Delete and recreate (data loss).
- **Governance**: Constitution line 143 says "Courses provide create and delete endpoints only". This feature needs a MINOR amendment. See Complexity Tracking in `plan.md`.

## R3. Course color (reverses the earlier clarification)

- **Finding**: `getCourseColor(courseId)` in `constants/palette.ts` derives color from the course id. `DraftCourse.colorId` exists only for the create preview. `flush()` sends only `name`. The backend stores no color.
- **Decision**: The drawer takes a `showColor` prop. Manage Courses sets it to false. Create Schedule keeps true.
- **Rationale**: An editable color needs a new backend field and a new color source in every view. No requirement outside this one line needs it. YAGNI.
- **Alternatives rejected**: Store color in `localStorage` (hidden state, breaks per-account rules). Add a backend column (scope growth).

## R4. Saving class-time edits

- **Decision**: Pure function `diffSchedules(existing, desired)` in `utils/scheduleDiff.ts`. It keys each class time by `day|start|end`. It returns `{ keep, update, create, remove }`. It pairs leftover removed and created items into `update` so ids stay stable.
- **Rationale**: The editor groups days into blocks, and the backend stores one row per day. A diff avoids deleting and re-creating unchanged rows.
- **Order**: update course name (only if changed), then schedule updates, creates, and deletes. Apply each response to `useCatalog` at once (`applyScheduleUpdated`, `applyScheduleCreated`, `applyScheduleDeleted`). No list refetch.
- **Failure**: On the first error, keep the drawer open with entered values and show a toast (FR-014). Rows that already saved stay saved and the cache reflects them.

## R5. Conflict checks

- **Decision**: Reuse `findDuplicateName`, `findClash`, `rangesOverlap`, and `unavailableDaysFor` from `utils/scheduleValidation.ts`. Add one small helper `findEditorConflict(editor, courses, schedules)` in the same file. It skips the course being edited.
- **Rationale**: `CreateScheduleView` keeps its own `editorConflictError` because it also checks staged drafts. Merging them is a refactor that this feature does not need.
- **Spec impact**: Cross-course overlap is blocked, as in Create Schedule. The spec edge case is updated.

## R6. Page placement and navigation

- **Decision**: Route `/manage-courses`, name `manage-courses`, child of the `AppShell` route. Add one menu item to `HamburgerMenu.vue` that closes the panel and pushes the route.
- **Rationale**: `AppShell` already gives the bottom bar that the drawer height math expects. No new gate logic is needed.
- **Add course**: The same drawer opens blank. The `create-schedule` route redirects to the calendar when courses exist, so the page must not link to it.

## R7. shadcn-vue usage

- **Use** (already installed): `Drawer`, `Button`, `Card`, `Popover` (inside the drawer), `Badge`, `Input` where the drawer already uses them.
- **Reuse** `DiscardDraftConfirmDialog` for the delete confirmation and the discard guard. It accepts `title`, `message`, `confirm-label`, and `cancel-label`.
- **Do not add** new shadcn-vue components. No alert-dialog, no new form library.
- **Impeccable**: Keep the existing visual system (`DESIGN.md`, Quicksand controls, 44 px targets, 4 px bevel buttons). The list shows the course color dot, name, and weekday-sorted time rows. No decorative extras.
