# Data Model: To-do List Redesign

## Entities & Derived Types

### PlanCategory (Virtual Presentation Type)
```typescript
type PlanCategory = 'SCHEDULED' | 'LATER' | 'BACKLOG'
```
- Derived from `task.scheduledDate` and `task.duration`:
  - `SCHEDULED`: task has `scheduledDate`
  - `LATER`: task has `duration` and no `scheduledDate`
  - `BACKLOG`: task has neither `scheduledDate` nor `duration`

### TaskUrgency (Display Type)
```typescript
type TaskUrgency = 'OVERDUE_OR_TODAY' | 'APPROACHING' | 'FUTURE' | 'NONE'
```
- Calculated from calendar day delta (due date - today at midnight):
  - `<= 0`: `OVERDUE_OR_TODAY` (token: `#D50000`, label: `TODAY` if delta == 0 else `mm/dd`)
  - `1..2`: `APPROACHING` (token: `#F6BF26`, label: `mm/dd`)
  - `>= 3`: `FUTURE` (token: `#0B8043`, label: `mm/dd`)
  - `null/undefined`: `NONE` (token: muted text color, no date label)

### View State
- `activeFilter`: `'ALL' | PlanCategory` (default: `'ALL'`)
- `expandedSections`: `Record<PlanCategory, boolean>` (default: `{ SCHEDULED: true, LATER: false, BACKLOG: false }`)
