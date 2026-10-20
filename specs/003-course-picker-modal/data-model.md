# Data Model: Course Picker Modal

## Entities & Interfaces

### 1. Course Option Representation

Derived directly from existing `CourseResponse` and `ScheduleResponse` objects in `src/types/api.ts`. No new DB or backend entities required.

```typescript
export interface CourseOptionItem {
  id: number
  name: string
  colorDotHex: string
  scheduleSummary: string
  isSelected: boolean
}
```

### 2. Schedule Day Shorthand Mapping

```typescript
export const DAY_ORDER: Record<DayOfWeek, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
}

export const DAY_SHORTHAND: Record<DayOfWeek, string> = {
  MONDAY: 'Mo',
  TUESDAY: 'Tu',
  WEDNESDAY: 'We',
  THURSDAY: 'Th',
  FRIDAY: 'Fr',
  SATURDAY: 'Sa',
  SUNDAY: 'Su',
}
```

### 3. NoteEditor Validation State

```typescript
export interface NoteEditorValidationState {
  hasCourse: boolean      // selectedCourseId !== null
  hasValidDate: boolean   // Boolean(entryDate.trim())
  hasContent: boolean     // Boolean(contentMarkdown.trim())
  isSaving: boolean       // boolean
  canSave: boolean        // hasCourse && hasValidDate && hasContent && !isSaving
}
```

## State Transitions

```
[NoteEditor Mounted]
   │
   ▼
[User Taps Course Trigger] ──────────► [CoursePickerDialog Opens (open = true)]
                                                 │
                                                 ├── User taps Backdrop / Esc ──► [Dialog Closes (no change)]
                                                 │
                                                 └── User selects Course Option ─► [selectedCourseId updated]
                                                                                   [isDirty = true]
                                                                                   [Dialog Closes (open = false)]
                                                                                   [Trigger updates badge & name]
```
