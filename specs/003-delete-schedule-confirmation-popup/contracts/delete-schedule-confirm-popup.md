# Delete Schedule Confirmation Popup Contract

## Component

Proposed source path: `frontend/src/components/DeleteScheduleConfirmDialog.vue`

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `open` | `boolean` | Yes | Controls popup visibility |
| `schedule` | `DeleteScheduleTarget \| null` | Yes | Selected schedule target |

### Emits

| Event | Payload | When |
|---|---|---|
| `update:open` | `boolean` | Visibility changes |
| `deleted` | `number` | After `schedulesApi.delete` succeeds |
| `cancel` | none | On non-destructive dismissal |

### Parent integration

1. Parent owns Delete button, selected schedule state, and `useCatalog`.
2. Parent sets `schedule` and `open` to `true`.
3. Popup calls `schedulesApi.delete(schedule.id)` only on CONFIRM.
4. On success, popup emits `deleted(schedule.id)`, then `update:open(false)`.
5. Parent calls `useCatalog().applyScheduleDeleted(schedule.id)`.