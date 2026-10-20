# Data Model: Reusable Delete Schedule Confirmation Popup

## DeleteScheduleTarget

A minimal immutable description of the selected schedule used only by the popup.

| Field | Type | Required | Rule |
|---|---|---|---|
| `id` | `number` | Yes | Existing schedule identifier passed to `schedulesApi.delete` |
| `courseId` | `number` | Yes | Used only to derive the course-color indicator |
| `name` | `string` | Yes | Displayed schedule/course name; must not be empty |

## Component state

| Field | Type | Initial | Notes |
|---|---|---|---|
| `open` | `boolean` prop | `false` | Controls visibility |
| `schedule` | `DeleteScheduleTarget \| null` | `null` | Selected schedule; `CONFIRM` remains disabled when null |
| `isDeleting` | internal boolean | `false` | Prevents repeated submission |
| `errorMessage` | internal string | `''` | Existing `ApiError` or generic failure message |

## Events

- `update:open(boolean)`
- `deleted(number)`
- `cancel()`

## Validation rules

- Do not call deletion when `schedule` is null or deletion is pending.
- Disable `CONFIRM` while pending or when no valid target exists.
- Block dismissal while deletion is pending.
- Emit `deleted(id)` only after `schedulesApi.delete` resolves.
- Do not mutate the parent catalog directly; emit `deleted(id)` for `useCatalog().applyScheduleDeleted`.