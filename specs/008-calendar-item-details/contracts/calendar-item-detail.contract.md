# UI Contract: Calendar Item Detail (shared) and Week-View Category Markers

**Feature**: Calendar Item Details and Week-View Category Markers
**Target Files**:
- `frontend/src/components/day-view/CalendarItemDetail.vue`
- `frontend/src/components/day-view/CategoryMarker.vue`
- `frontend/src/components/day-view/EventDetailModal.vue`
- `frontend/src/components/day-view/WeekPill.vue`
- `frontend/src/components/day-view/WeekHeaderRow.vue`
- `frontend/src/types/calendarItemDetail.ts`
- `frontend/src/utils/calendarItemDetail.ts`
- `frontend/src/api/mocks/calendarItemDetailFixtures.ts`

**Date**: 2026-10-18
**Status**: Complete

---

## 1. Shared Detail Component

### `CalendarItemDetail.vue`

One component renders the class, task, and event detail content (FR-021).

```typescript
import type { CalendarItemDetailView, LinkedNoteRef } from '@/types/calendarItemDetail'

const props = defineProps<{
  item: CalendarItemDetailView
}>()

const emit = defineEmits<{
  (e: 'open-note', note: LinkedNoteRef): void
  (e: 'complete-task', taskId: string): void
}>()
```

Rendering rules:

| Element | Render when | Requirement |
| :--- | :--- | :--- |
| Color dot | always | Color comes from `getCourseDotStyle(item.courseId)`. |
| Title | always | Truncated to one line. |
| Time-window badge | `item.timeWindow != null` | FR-012, FR-016. |
| Duration badge | `item.duration != null` | FR-013, FR-017, FR-019. |
| Linked-note control | `item.note != null` | FR-008, FR-014, FR-018. |
| Complete control | `item.task != null` | FR-010. Disabled and checked when `item.task.completed`. |
| Note-control tap target | min `44px` by `44px` | FR-020. |
| Complete-control tap target | min `44px` by `44px` | FR-020. |

The component holds no animation state. The modal host owns the container transform.

---

## 2. Category Marker

### `CategoryMarker.vue`

```typescript
import type { CalendarItemCategory } from '@/types/calendarItemDetail'

const props = defineProps<{
  category: CalendarItemCategory
  completed?: boolean
}>()
```

Contract:

| Category | Rendered indicator | Accessible label |
| :--- | :--- | :--- |
| `class` | none | `Class` |
| `event` | flag or alarm icon | `Academic event` |
| `task` (open) | empty completion box | `Academic task` |
| `task` (completed) | checked completion box | `Completed academic task` |

- The marker sets `aria-hidden="true"` on the icon and exposes the label on the parent item (FR-005).
- The marker never changes the item color. `WeekPill.vue` and `WeekHeaderRow.vue` keep the course color.

---

## 3. Modal Host

### `EventDetailModal.vue`

The host renders `CalendarItemDetail.vue` for every kind and forwards the two events.

```typescript
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-note', note: LinkedNoteRef): void
  (e: 'complete-task', taskId: string): void
}>()
```

- The host keeps the existing 320ms expand and 240ms collapse, the history `popstate` handling, and the reduced-motion fallback.
- The host does not branch on item type for content. It passes `item` to the shared component.

---

## 4. Calendar Wiring Contract

| Source | Action | Result |
| :--- | :--- | :--- |
| `WeekPill.vue` tap | emit select with the class `DayEvent` and its `DOMRect` | Open the modal with a class view model (FR-006 for classes). |
| `WeekHeaderRow.vue` chip tap | emit select with the untimed item and its `DOMRect` | Open the modal with a task or event view model (FR-006, FR-007). |
| `ScheduleCalendar.vue` course card / untimed pill tap | emit select with the item and its `DOMRect` | Open the modal with the matching view model. |
| `DayViewContainer.vue` note event | `router.push({ name: 'note-edit', params: { id: note.id } })` | FR-009, FR-015. |
| `DayViewContainer.vue` complete event | `tasksApi.updateStatus(taskId, 'COMPLETED')` then update the cached task from the DTO | FR-011. No list refetch. |

---

## 5. Mock Data Contract

### `api/mocks/calendarItemDetailFixtures.ts`

```typescript
export interface CalendarItemDetailFixture {
  name: string
  item: CalendarItemDetailView
}

export const CALENDAR_ITEM_DETAIL_FIXTURES: CalendarItemDetailFixture[]
```

The fixture array MUST cover every state (FR-023, FR-024):

| # | Fixture name | Kind | State proven |
| :--- | :--- | :--- | :--- |
| 1 | `class-with-window` | class | Time window shown, no note, no duration, no complete control. |
| 2 | `task-with-note-and-duration` | task | Note control, complete control, time window, duration, open state. |
| 3 | `task-without-note` | task | Note control hidden (FR-018). |
| 4 | `task-without-duration` | task | Duration hidden (FR-019). |
| 5 | `task-without-scheduled-date` | task | Plan-category label in place of the time window. |
| 6 | `task-completed` | task | Completed state, complete control disabled. |
| 7 | `event-with-note` | event | Note control, time window, no duration (FR-017). |
| 8 | `event-without-note` | event | Note control hidden, no duration. |
| 9 | `marker-class`, `marker-event`, `marker-task-open`, `marker-task-completed` | marker | Every marker form (FR-001 through FR-005). |
| 10 | `week-overflow-day` | marker set | A day with more items than the visible limit. |

The mock adapter extends `api/mocks/fixtures.ts` so at least one task and one event carry a `noteId` that resolves to a fixture note.

---

## 6. Accessibility Contract

1. Each week-view item carries an accessible name that includes its category (FR-005).
2. The note control has an accessible name that includes the note title when known.
3. The complete control has an accessible name and a minimum `44px` by `44px` target (FR-020).
4. A completed control exposes the disabled state to assistive technology.
