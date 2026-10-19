# Research: Schedule Creation Validation

## 1. Known-Course Set Source

### Decision
Build one read model from two sources. The stored source is `catalog.courses` and `catalog.schedules` in `useCatalog`. The session source is the new `useCourseDrafts` composable. Join both into one `KnownCourse[]` and one `KnownSchedule[]`, where each `KnownSchedule` carries the owning `courseName` for the clash message.

### Rationale
- The spec (FR-001) defines the known set as the stored catalog plus the encoded courses.
- The stored catalog is already user-scoped. `useCatalog` loads it once per intent.
- One join point keeps the duplicate check and the clash check on the same data.

### Alternatives Considered
- **Read `catalog.schedules` only**: Rejected. It misses the encoded courses in the current session (FR-015).
- **A backend query for known names**: Rejected. FR-019 keeps enforcement in the client, and the catalog is already cached.

## 2. Staging Seam and Persistence Handoff

### Decision
Add `useCourseDrafts`, a session composable. It holds `draftCourses` and `draftSchedules`. It exposes `stageCourse`, `stageSchedule`, and `flush`. The create view calls the stage methods on Save. The `flush` method holds the existing `coursesApi.create` and `schedulesApi.create` calls. The bulk-freeze feature calls `flush` later.

### Rationale
- The clarification states that Save stages a course and a separate finalize action persists it.
- A named seam lets the validation feature read the encoded set and lets the freeze feature write it.
- The seam keeps one owner for the encoded set. The view does not own persistence.

### Alternatives Considered
- **Keep the immediate `coursesApi.create` call in the view**: Rejected. The clarification states that Save must not persist immediately.
- **Store the drafts inside `CreateScheduleView.vue`**: Rejected. The set must outlive one open of the sheet, and the freeze feature needs the same set.

### Dependency Risk
No bulk-freeze action exists today. Until it lands, a staged course is not stored. Keep the API calls in `flush` so the freeze feature is a thin caller and no behavior is lost.

## 3. Time Normalization and Overlap Predicate

### Decision
Add `timeToMinutes(value)` in `src/utils/scheduleValidation.ts`. It parses `"HH:MM"` and `"HH:MM:SS"` into minutes since midnight. Add `rangesOverlap(aStart, aEnd, bStart, bEnd)`. It returns `aStart < bEnd && aEnd > bStart`.

### Rationale
- The backend returns `"HH:MM:SS"` (see `src/types/__tests__/api.spec.ts`). A native time input returns `"HH:MM"`. A raw string compare fails across the two formats (FR-008).
- The predicate matches FR-005. Adjacent ranges do not overlap, so an end time that equals the other start time passes (FR-006).

### Alternatives Considered
- **Compare the strings directly**: Rejected. `"09:00" < "09:30"` works, but `"09:00"` and `"09:00:00"` do not compare as equal.
- **Use `Date` objects**: Rejected. Minutes are enough. No timezone applies.

## 4. Duplicate-Name Check

### Decision
Add `findDuplicateName(name, knownCourses)`. It trims the input, lowercases both sides, and returns the first match or `null`. Scope the match to the current student's known courses only.

### Rationale
- FR-002 requires a trim and a case-insensitive match.
- Courses belong to one user. A global match would block another student from reusing a name (spec clarification).

### Alternatives Considered
- **Backend name uniqueness**: Rejected for this feature. FR-019 keeps enforcement in the client. A backend rule is a follow-up.

## 5. Weekday Availability Derivation

### Decision
Add `unavailableDaysFor(block, knownSchedules, siblingBlocks)`. For the block's current start time and end time, a weekday is unavailable when a known class or a sibling block overlaps on that weekday. Return the list of unavailable weekdays.

### Rationale
- FR-009 marks a weekday unavailable inside a block.
- FR-012 allows a shared weekday across blocks only when the times do not overlap. The function checks sibling blocks for the overlapping case.

### Alternatives Considered
- **Derive inside `TimeBlockCard.vue`**: Rejected. The component would own the known set. Keep the component presentational and pass `unavailableDays` as a prop.

## 6. Clear Selection on Time Change

### Decision
In `CreateScheduleView.vue`, when a block's start or end time changes, recompute its unavailable weekdays and drop any selected weekday that became unavailable. Keep the other selections.

### Rationale
- FR-011 requires the system to clear a selected weekday when a later time change causes a clash.
- The view owns `selectedDays`. The pure helper returns the unavailable list.

### Alternatives Considered
- **Block the time change**: Rejected. The student must be able to correct the time.

## 7. Add-Another-Time Rule

### Decision
Disable the add-another-time button when all seven weekdays are unavailable for the current block time. Keep it enabled when at least one weekday is free.

### Rationale
- FR-013 and FR-014 state the rule directly.
- The rule reuses `unavailableDaysFor` on the newest block. No new helper is needed.

### Alternatives Considered
- **Count used weekdays across all blocks**: Rejected. The rule is about clashes at the block time, not about used weekdays in general.

## 8. Cross-Block Overlap

### Decision
The clash check includes the student's other blocks in the same save. Two blocks that overlap on the same weekday block the save. Two blocks that share a weekday with different times pass.

### Rationale
- The spec clarification states that overlapping same-weekday blocks are blocked.
- A student cannot attend two classes at once, even within one course.

### Alternatives Considered
- **Check known courses only**: Rejected. It would let two of the student's own overlapping blocks through.

## 9. Close-Confirmation Trigger and Reuse

### Decision
Add `DiscardDraftConfirmDialog.vue` from the `DeleteScheduleConfirmDialog.vue` pattern. Intercept every user-initiated close in `CreateScheduleView.vue`: the X button, a swipe-down dismissal, and the Escape key. Show the dialog only when `hasUnsavedChanges` is true. Define `hasUnsavedChanges` as a non-empty title, any selected weekday or time, or a failed or pending schedule record.

### Rationale
- FR-021 to FR-025 define the trigger set and the two actions.
- `DeleteScheduleConfirmDialog.vue` already handles the overlay, the Escape key, and the focus restore. Reuse the pattern to keep one dialog style.

### Alternatives Considered
- **A native `window.confirm`**: Rejected. It breaks the design system and offers no styled actions.
- **A new dialog style**: Rejected. The project already has one confirm-dialog pattern.
