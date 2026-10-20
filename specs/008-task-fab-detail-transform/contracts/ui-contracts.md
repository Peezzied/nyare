# UI Contracts: Task FAB and Task Detail Container Transform

The feature exposes no new HTTP endpoint. It consumes `/api/tasks` as defined in `frontend/src/api/tasks.ts`.

## Component: `TaskContainerModal`

Path: `frontend/src/components/tasks/TaskContainerModal.vue`

| Prop | Type | Meaning |
|---|---|---|
| `isOpen` | boolean | Overlay state |
| `taskId` | string or null | Null opens the create form |
| `originRect` | `TapOriginRect` or null | Start and end geometry |

| Event | Payload | When |
|---|---|---|
| `close` | none | After the collapse ends |

Test IDs: `task-modal`, `task-modal-backdrop`, `task-modal-container`.
Role and label: `role="dialog"`, `aria-modal="true"`, `aria-label="Task"`.
Behavior: expand 320 ms, collapse 240 ms, content at 100 ms, controls at 180 ms, reduced motion fade 150 ms. Lock body scroll while open. Push one history entry. Close on Escape, scrim tap, and `popstate`. Ignore a second open while `isOpen` is true.

## Component: `TaskDetailPanel`

Path: `frontend/src/components/tasks/TaskDetailPanel.vue`

| Prop | Type | Meaning |
|---|---|---|
| `taskId` | string or null | Null is create mode |
| `showContent` | boolean | Reveal identity and plan zones |
| `showControls` | boolean | Reveal save, delete, description |
| `embedded` | boolean | True inside the modal. False on the direct link route. |

| Event | Payload | When |
|---|---|---|
| `close` | none | Back control, save in create mode |
| `deleted` | none | After delete succeeds (parent collapses with fade) |
| `missing` | none | Task not found (404) |

Test IDs: `task-title`, `task-course`, `task-date`, `task-duration`, `task-section`, `task-description`, `task-source-note`, `task-save`, `task-delete`, `task-error`.
Accessible names: title input "Task title". Checkbox "Mark task as completed". Section badge "Plan section: Scheduled, Later, or Backlog".
Behavior: See `data-model.md` for validation. A failed request keeps the form data and shows `task-error` with a Retry action.

## View: `TodoView` additions

| Element | Contract |
|---|---|
| FAB | `data-testid="tasks-fab"`, `aria-label="Add task"`, 56 by 56 px, `Plus` icon, bottom right |
| Row tap | Captures the row rect with `toTapOriginRect(event.currentTarget)` and opens the modal with `taskId` |
| FAB tap | Captures the FAB rect and opens the modal with `taskId = null` |

## Route: `/tasks/:id` (`TaskDetailView`)

Renders `TaskDetailPanel` with `embedded = false`. No origin animation. On `missing`, replace the route with `/tasks`.

## Consumed API (existing)

| Action | Call | Request | Response |
|---|---|---|---|
| Create | `POST /api/tasks` | `TaskRequest` | `TaskResponse` |
| Read | `GET /api/tasks/{id}` | none | `TaskResponse` or 404 |
| Replace | `PUT /api/tasks/{id}` | `TaskRequest` | `TaskResponse` |
| Status | `PATCH /api/tasks/{id}/status` | `TaskStatusRequest` | `TaskResponse` |
| Delete | `DELETE /api/tasks/{id}` | none | 204 |
