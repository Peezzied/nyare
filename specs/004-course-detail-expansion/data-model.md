# Data Model: Course Block Expansion & Detail View

**Feature**: Course Block Expansion & Detail View  
**Date**: 2026-10-16  
**Status**: Complete  

---

## Entities

### 1. `TapOriginRect`

Represents the physical viewport coordinates of the clicked or tapped calendar block.

| Field | Type | Description |
| :--- | :--- | :--- |
| `top` | `number` | Distance in pixels from the top of the viewport |
| `left` | `number` | Distance in pixels from the left of the viewport |
| `width` | `number` | Bounding width in pixels |
| `height` | `number` | Bounding height in pixels |

---

### 2. `CourseBlockDetailState`

Carries the exact information permitted for a course block detail view.

| Field | Type | Description |
| :--- | :--- | :--- |
| `courseId` | `number \| string` | Identifier of the course entity |
| `courseName` | `string` | Full title of the course |
| `colorDot` | `string` | Hex or Tailwind background class for the dot indicator |
| `timeWindow` | `string` | Formatted meeting time string (e.g., `"08:00 AM - 10:00 AM"`) |
| `tasksTarget` | `string` | Route destination for tasks list view (`"/tasks"`) |
| `notesTarget` | `string` | Route destination for notes list view (`"/notes"`) |

**Validation Rules**:
- Must not include instructor, location, or full descriptions.
- Color dot must map directly to the course color theme (`green`, `blue`, `purple`, `orange`).

---

### 3. `NonCourseBlockDetailState`

Carries the exact information permitted for other calendar items (tasks and academic events).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `number \| string` | Identifier of the task or event |
| `title` | `string` | Title of the task or event |
| `itemType` | `'task' \| 'academic-event'` | Type of calendar block |
| `linkedNote` | `string \| null` | Singular title or reference to the linked preparation note |

**Validation Rules**:
- Must not display multiple notes; displays at most one singular linked note reference.
- If no linked note is present, `linkedNote` is `null` and the note element is hidden.

---

### 4. `ActiveModalState`

Manages the overlay lifecycle inside `ScheduleCalendar.vue`.

| Field | Type | Description |
| :--- | :--- | :--- |
| `isOpen` | `boolean` | Whether the detail overlay is mounted and visible |
| `originRect` | `TapOriginRect \| null` | Coordinates of the tapped block for container transform |
| `kind` | `'course' \| 'other' \| null` | Determines whether course or non-course template renders |
| `animationPhase` | `'idle' \| 'expanding' \| 'settled' \| 'collapsing'` | Choreography phase for staggered content entrance |
| `payload` | `CourseBlockDetailState \| NonCourseBlockDetailState \| null` | Data payload |

---

## State Lifecycle

```text
[Idle] (animationPhase: 'idle')
  │
  ├─ User taps Block ──► Compute TapOriginRect ──► isOpen=true, animationPhase='expanding'
  │                                                     │
  │                                                     ▼
  │                                            Phase 1: Outer Container Expands (0-320ms)
  │                                            Phase 2: Content Fades In (100-280ms)
  │                                            Phase 3: 3D Buttons Spring In (180-340ms)
  │                                                     │
  │                                                     ▼
  │                                            animationPhase='settled'
  │                                                     │
  ├─ User taps Close / Back ◄── animationPhase='collapsing' (0-240ms)
  │                                  │
  ▼                                  ▼
[Idle]                       isOpen=false, animationPhase='idle'
```
