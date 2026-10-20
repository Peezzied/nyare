# Data Model: Task FAB and Task Detail Container Transform

No backend or storage change. The feature uses existing types in `frontend/src/types/api.ts` and `frontend/src/types/notesTransition.ts`.

## Task (existing `TaskResponse`)

| Field | Type | Detail display | Editable |
|---|---|---|---|
| `id` | string | Hidden | No |
| `courseId` | number | Course chip | Yes (required) |
| `noteId` | string or null | "From a note" link when set | No |
| `title` | string | Headline | Yes (required, non-blank) |
| `description` | string or null | Description card | Yes |
| `scheduledDate` | `YYYY-MM-DD` or null | Date row | Yes |
| `duration` | ISO-8601 or null | Duration row | Yes |
| `status` | `TODO` or `COMPLETED` | Checkbox | Yes (toggle) |
| `planCategory` | derived | Section badge | No (derived by `getPlanCategory()`) |
| `createdAt` | string | Hidden | No |

## TaskFormState (new, local to `TaskDetailPanel`)

| Field | Type | Rule |
|---|---|---|
| `title` | string | Required after trim |
| `courseId` | number or null | Required |
| `description` | string | Empty becomes `null` in the request |
| `scheduledDate` | string | Empty becomes `null`. Format `YYYY-MM-DD`. |
| `durationMinutes` | number or null | Null means "Not set". Converted with `minutesToDuration()`. |

Derived values:

- `isDirty`: form differs from the loaded task. A new task is dirty after any input.
- `canSave`: `title` has non-blank text and `courseId` is set.
- `section`: `getPlanCategory({ scheduledDate, duration })`.

## TaskRequest (existing)

Built from `TaskFormState` by `toTaskRequest(form, status)` in `utils/taskForm.ts`. `status` carries the current status (`TODO` for a new task).

## TaskModalState (new, local to `TodoView`)

| Field | Type | Meaning |
|---|---|---|
| `open` | boolean | Overlay active |
| `taskId` | string or null | Null means create mode |
| `originRect` | `TapOriginRect` or null | Captured before open |
| `triggerKind` | `'row'` or `'fab'` | Source of the tap |

The animation phase uses the existing `AnimationPhase` (`idle`, `expanding`, `settled`, `collapsing`).

## State transitions

```text
closed --tap FAB--> expanding(create) --> settled --save--> collapsing --> closed (task appended)
closed --tap row--> expanding(view)   --> settled --save--> stay open, DTO replaced
settled --delete--> collapsing (fade) --> closed (task removed)
settled --back/Esc/scrim--> collapsing --> closed
```
