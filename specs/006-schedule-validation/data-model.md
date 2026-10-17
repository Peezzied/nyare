# Data Model: Schedule Creation Validation

The feature adds no database entity. All types live in the frontend. The stored entities stay `CourseResponse` and `ScheduleResponse` in `src/types/api.ts`.

## Entities and Interfaces

### 1. KnownCourse

One course the checks may match against. It comes from the stored catalog or the session encoded set.

```typescript
export interface KnownCourse {
  id: number | string   // stored id, or the draft tempId
  name: string          // display name, compared after trim and lowercase
}
```

### 2. KnownSchedule

One class time on a known course. It carries the course name for the clash message.

```typescript
export interface KnownSchedule {
  courseId: number | string
  courseName: string    // owning course name for the clash message
  day: DayOfWeek
  startTime: string     // "HH:MM" or "HH:MM:SS"
  endTime: string       // "HH:MM" or "HH:MM:SS"
}
```

### 3. ScheduleCandidate

The class time under test. It comes from one time block.

```typescript
export interface ScheduleCandidate {
  day: DayOfWeek
  startTime: string
  endTime: string
}
```

### 4. DraftCourse and DraftSchedule

The session encoded set. A draft course has a `tempId`, because it is not stored yet.

```typescript
export interface DraftSchedule {
  day: DayOfWeek
  startTime: string
  endTime: string
}

export interface DraftCourse {
  tempId: string
  name: string
  colorId: string
  schedules: DraftSchedule[]
}
```

### 5. Unsaved State

The close guard reads this state.

```typescript
export interface UnsavedState {
  title: string                 // trimmed; non-empty means unsaved
  blocks: TimeBlockDraft[]      // any selected weekday or time means unsaved
  pendingOrFailed: boolean      // any failed or pending schedule record
}
```

## Reused Types

| Type | Source | Use |
|:---|:---|:---|
| `CourseResponse` | `src/types/api.ts` | Stored course. Source of a known name. |
| `ScheduleResponse` | `src/types/api.ts` | Stored class time. Source of a known schedule. |
| `TimeBlockDraft` | `src/components/TimeBlockCard.vue` | Existing form draft. Source of a candidate. |
| `DayOfWeek` | `src/types/api.ts` | Weekday value. |
| `WEEKDAYS` | `src/components/TimeBlockCard.vue` | The seven weekdays in order. |

## Validation Rules

| Rule | Requirement | Behavior |
|:---|:---|:---|
| Empty title | FR-001, FR-017, FR-020 | Block the save with a clear message. |
| Duplicate name | FR-002, FR-003 | Block the save. Name the entered course. |
| Same-weekday overlap | FR-004, FR-005, FR-007 | Block the save. Name the clashing course and weekday. |
| Adjacent ranges | FR-006 | Pass. An end time equal to the other start time does not clash. |
| Time format | FR-008 | Compare `"HH:MM"` and `"HH:MM:SS"` as equal. |
| Unavailable weekday | FR-009, FR-010 | Mark the weekday. Prevent selection. |
| Time change clears selection | FR-011 | Clear a selected weekday that becomes unavailable. |
| Shared weekday across blocks | FR-012 | Allow when the times do not overlap. Block when they do. |
| All weekdays clash | FR-013, FR-014 | Disable add-another-time only when all seven clash. |
| Register on save | FR-015 | Add the saved draft to the known set for later checks. |
| Known set unavailable | FR-016 | Skip the checks and let the save proceed. |
| No false clash on retry | FR-017 | A retry does not report a duplicate or a clash. |
| No time-blocking | FR-018 | No hourly control and no priority value. |
| Client-only checks | FR-019 | No backend change. |
| Close with unsaved work | FR-021, FR-022 | Show the keep-editing or discard dialog. |
| Discard reset | FR-023 | Reset to one blank block. Clear the pending slot and the color. |
| Failed or pending records | FR-024 | Treat as unsaved. Show the dialog. |
| Dialog actions | FR-025 | Offer exactly "Keep editing" and "Discard". |

## State Transitions

```text
[Form opens]
   │
   ▼
[Known set = stored catalog + encoded drafts]
   │
   ├── Student edits title / weekday / time
   │      └─► [Duplicate check] ──► [Clash check] ──► [Weekday marks recompute]
   │
   ├── Student sets a time that clashes on a selected weekday
   │      └─► [Selection cleared] ──► [Weekday marked unavailable]
   │
   ├── Student views add-another-time with all seven weekdays clashing
   │      └─► [Action disabled]
   │
   ├── Student saves a valid form
   │      └─► [Draft staged in useCourseDrafts] ──► [Known set includes the draft]
   │
   └── Student closes with unsaved work
          ├─► "Keep editing" ──► [Dialog closes. Draft stays.]
          └─► "Discard" ────────► [Form resets. Sheet closes.]
```
