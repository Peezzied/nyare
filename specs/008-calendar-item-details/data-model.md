# Data Model: Calendar Item Details and Week-View Category Markers

**Feature**: Calendar Item Details and Week-View Category Markers
**Branch**: `008-calendar-item-details`
**Date**: 2026-10-18
**Status**: Complete

---

## View Entities

These are frontend-only view models. They are derived, never persisted. The backend DTOs (`TaskResponse`, `AcademicEventResponse`, `ScheduleResponse`, `NoteResponse`) are the sources.

### 1. `CalendarItemKind`

Classifies a calendar item for the marker and the detail view.

```typescript
type CalendarItemKind = 'class' | 'task' | 'event'
```

- `'class'`: a class meeting from a schedule. Has a start and an end time.
- `'task'`: an academic task. Has a status, an optional scheduled date, and an optional duration.
- `'event'`: an academic event. Has a deadline and no duration.

---

### 2. `CalendarItemCategory`

The three marker categories. It maps one-to-one to `CalendarItemKind`.

```typescript
type CalendarItemCategory = 'class' | 'event' | 'task'
```

Marker rules (FR-002, FR-003, FR-004):

| Category | Indicator | Fill | Optional badge |
| :--- | :--- | :--- | :--- |
| `class` | none | lower-contrast tint | none |
| `event` | flag or alarm icon | solid course fill | none |
| `task` | completion check | course fill | duration badge |

---

### 3. `LinkedNoteRef`

The source journal entry of a task or an event.

```typescript
interface LinkedNoteRef {
  id: string
  title: string | null
}
```

- Built from `TaskResponse.noteId` or `AcademicEventResponse.noteId`.
- `null` when the item has no source note. The detail view hides the note control then (FR-018).
- `title` is `null` when the cached notes list has no matching note. The control then shows a generic note label and stays navigable.

---

### 4. `CalendarItemDetailView`

The single view model for the shared `CalendarItemDetail.vue` component (FR-021).

| Field | Type | Applies to | Description |
| :--- | :--- | :--- | :--- |
| `kind` | `CalendarItemKind` | all | Selects the detail shape. |
| `id` | `string` | all | Item id. Tasks and events use the DTO id. A class uses the expanded schedule event id. |
| `title` | `string` | all | Item title. |
| `courseId` | `number` | all | Drives the color dot through `getCourseDotStyle`. |
| `timeWindow` | `string \| null` | all | See the time-window rules below. |
| `duration` | `string \| null` | task only | Formatted task duration. `null` for a class, an event, or a task with no duration. |
| `note` | `LinkedNoteRef \| null` | task, event | Source note. `null` hides the note control. A class has no source note. |
| `task` | `{ id: string; completed: boolean } \| null` | task only | Drives the complete control. `null` for a class and an event. |
| `originRect` | `TapOriginRect \| null` | all | Tap geometry for the container transform. Lives in the modal host state, not in the row. |

Time-window rules:

| Kind | `timeWindow` source | Example |
| :--- | :--- | :--- |
| `class` | `formatTimeRange(start, end)` from the expanded schedule event | `9:00 AM – 10:30 AM` |
| `task` | scheduled date, or the plan-category label when no scheduled date exists | `Oct 22, 2026` or `Backlog` |
| `event` | deadline date and time | `Oct 22, 2026, 9:00 AM` |

---

### 5. `CalendarItemMarkerState`

Derived marker data for the week view (FR-001, FR-005).

| Field | Type | Description |
| :--- | :--- | :--- |
| `category` | `CalendarItemCategory` | Selects the marker form. |
| `completed` | `boolean` | A completed task shows the checked state. |
| `label` | `string` | The accessible name. Names the category, for example `Academic task`. |

## Builder Inputs

`utils/calendarItemDetail.ts` builds the view model from:

- `DayEvent` plus a `CalendarItemKind` for class items.
- `TaskResponse` plus the cached notes list for task items.
- `AcademicEventResponse` plus the cached notes list for event items.

The builder sets a field to `null` when the source field is absent. The component never renders a null field (FR-022).

## State Transition Lifecycle: Task Complete

```text
[Task detail open]
   task.completed = false, complete control enabled
        │
        ├─ User activates the complete control
        │     └─ PATCH /api/tasks/{id}/status { status: 'COMPLETED' }
        │
        ├─ Success: saved DTO returns
        │     └─ Parent updates the cached task ref from the DTO
        │           task.completed = true, control shows the completed state
        │           No list refetch (FR-011)
        │
        └─ Failure: API error
              └─ Control keeps task.completed = false
                    Error message shown, no state change
```

## Validation Rules

1. A task or event with an empty `noteId` sets `note` to `null` (FR-018).
2. A task with no `duration` sets `duration` to `null` (FR-019).
3. An event always sets `duration` to `null` (FR-017).
4. A task with no `scheduledDate` sets `timeWindow` to its plan-category label.
5. The builder never invents a duration or a deadline (FR-019, Constitution Principle III).
