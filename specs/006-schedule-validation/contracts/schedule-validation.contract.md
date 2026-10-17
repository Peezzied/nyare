# Contract: Schedule Creation Validation

## Module: `src/utils/scheduleValidation.ts`

### Description
Pure compare helpers for the create schedule form. The module holds no state and touches no DOM. Every function is unit tested.

### API

| Function | Signature | Behavior |
| :--- | :--- | :--- |
| `timeToMinutes` | `(value: string) => number` | Parses `"HH:MM"` or `"HH:MM:SS"` into minutes since midnight. Returns `NaN` for an empty or malformed value. |
| `rangesOverlap` | `(aStart: string, aEnd: string, bStart: string, bEnd: string) => boolean` | Returns `aStart < bEnd && aEnd > bStart` in minutes. Adjacent ranges return `false`. |
| `findDuplicateName` | `(name: string, known: KnownCourse[]) => KnownCourse \| null` | Trims and lowercases both sides. Returns the first match or `null`. |
| `findClash` | `(candidate: ScheduleCandidate, known: KnownSchedule[]) => KnownSchedule \| null` | Returns the first known schedule with the same day and an overlapping range, or `null`. |
| `unavailableDaysFor` | `(block: TimeBlockDraft, known: KnownSchedule[], siblings: TimeBlockDraft[]) => DayOfWeek[]` | Returns every weekday where a known schedule or a sibling block overlaps the block time. An empty or invalid block time returns `[]`. |

### Edge Rules

- An empty or malformed start or end time yields no match.
- A start time equal to an end time is invalid and yields no match.
- The same course may hold two class times on one weekday when the times do not overlap.
- The comparison ignores letter case and surrounding spaces for a name.

---

## Component: `src/components/DiscardDraftConfirmDialog.vue`

### Description
A confirm dialog for a close with unsaved work. It renders the project confirm-popup style. It holds no draft data.

### Props

| Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `open` | `boolean` | Yes | `false` | Controls visibility |

### Emits

| Event | Payload | Description |
| :--- | :--- | :--- |
| `update:open` | `(value: boolean)` | Emitted when the dialog wants to close |
| `keepEditing` | `()` | Emitted on "Keep editing" |
| `discard` | `()` | Emitted on "Discard" |

### Behavior Contract

- The dialog offers exactly two actions: "Keep editing" and "Discard" (FR-025).
- "Keep editing" and the overlay tap and the Escape key emit `keepEditing`.
- "Discard" emits `discard`.
- The dialog restores focus to the prior element on close.

### Accessibility (WAI-ARIA)

- The root uses `role="dialog"` with `aria-modal="true"`.
- The title is `aria-labelledby`. The body text is `aria-describedby`.
- The "Discard" action is destructive-styled and is the confirm action.
- Every action meets the 44px minimum touch target.

---

## Component: `src/components/TimeBlockCard.vue`

### New Prop

| Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `unavailableDays` | `DayOfWeek[]` | No | `[]` | Weekdays that clash at the current block time |

### Behavior Contract

- A weekday in `unavailableDays` renders disabled (FR-010).
- A weekday in `unavailableDays` cannot be selected.
- The card still shows a selected weekday that the known set does not mark unavailable.
- The card holds no known-course data. The parent derives the list.

---

## Composable: `src/composables/useCourseDrafts.ts`

### Description
The session encoded-course set. It is the shared read source for validation and the shared write target for the freeze feature.

### API

| Member | Signature | Behavior |
| :--- | :--- | :--- |
| `draftCourses` | `Ref<DraftCourse[]>` | The staged courses |
| `draftSchedules` | `Ref<DraftSchedule[]>` | The staged class times, with the owning tempId |
| `stageCourse` | `(course: DraftCourse) => void` | Adds one staged course |
| `stageSchedule` | `(tempId: string, schedule: DraftSchedule) => void` | Adds one staged class time |
| `flush` | `() => Promise<void>` | Persists every staged course and class time through the existing APIs |
| `resetDrafts` | `() => void` | Clears the staged set |

### Ownership Boundaries

- The composable owns the encoded set only.
- The create view stages on Save. The freeze feature calls `flush`.
- No component reads `draftCourses` directly. The known set join lives in the view or a helper.
