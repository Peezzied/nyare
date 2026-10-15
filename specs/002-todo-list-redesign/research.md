# Research: To-do List Redesign and Task Detail Placeholder

## Decisions & Rationale

### 1. Planning Category Derivation & Filtering
- **Decision**: Reuse `getPlanCategory` from `src/utils/planCategory.ts`.
- **Rationale**: Complies with Constitution Principle I (Virtual Study Plan) and Ponytail rules. Categories are virtual and computed locally without backend changes.
- **Alternatives Considered**: Modifying backend `TaskResponse` or fetching categorized endpoints. Rejected per Constitution and Rule FR-025.

### 2. Collapsible Category Sections
- **Decision**: Native Vue `ref` state (e.g. `expandedSections = ref({ SCHEDULED: true, LATER: false, BACKLOG: false })`) with CSS transitions and Lucide icons (`ChevronDown`, `ChevronRight`).
- **Rationale**: Minimal, accessible, zero extra dependencies, conforms to Constitution Principle VII (Ponytail minimalism).
- **Alternatives Considered**: Installing Radix/shadcn-vue Accordion. Unnecessary abstraction for three simple sections.

### 3. Date Math & Urgency Badges
- **Decision**: Pure utility function computing calendar difference in days between target date (`TASK_DUE_DATES[id] ?? task.scheduledDate`) and local midnight today.
- **Rationale**: <=0 is Red (`#D50000`), 1-2 is Yellow (`#F6BF26`), >=3 is Green (`#0B8043`), absent is neutral muted.
- **Alternatives Considered**: External date libraries (date-fns, dayjs). Rejected: native `Date` handles day difference simply.

### 4. Dedicated Full-Page Route `/tasks/:id`
- **Decision**: Add route `/tasks/:id` to `src/router/index.ts` rendering `TaskDetailView.vue`. Redirect to `/` when task ID is unknown or invalid.
- **Rationale**: Replaces `TodoItemModal.vue`. Preserves app shell with `BottomNav` active tab on To-do.
- **Alternatives Considered**: Keep modal or generic 404 page. Spec explicitly demands dedicated `/tasks/:id` placeholder with redirect on invalid ID.
