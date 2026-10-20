# Contracts: To-do List Redesign

## UI Component & Route Contracts

### Route: `/tasks/:id`
- **Component**: `src/views/TaskDetailView.vue`
- **Params**: `id` (numeric string)
- **Behavior**:
  - Valid task: renders top header with 44px back button (`ArrowLeft`), centered title "Task Detail", empty body, and `BottomNav` with `todo` active.
  - Invalid task ID or not found in task store: redirects immediately to `/`.

### Component: TaskRow
- **Props**:
  - `task`: `TaskResponse`
  - `courseName`: `string`
  - `courseColor`: `string`
  - `displayTime`?: `string`
  - `dueDate`?: `string`
- **Emits**:
  - `toggle`: `(task: TaskResponse) => void`
  - `select`: `(task: TaskResponse) => void`
