# Component Contract: CoursePickerDialog

## Component: `src/components/editor/CoursePickerDialog.vue`

### Description
A modal dialog presenting a list of courses styled with individual color dots, titles, and aggregated schedule summaries (e.g., "Mo, We, Th"). Designed for mobile-first interaction with 48px touch targets, rounded parchment surfaces, and smooth backdrop transitions.

### Props

| Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `open` | `boolean` | No | `false` | Controls whether the dialog is open (`v-model:open`) |
| `selectedCourseId` | `number \| null` | Yes | `null` | The currently selected course ID |
| `courses` | `CourseResponse[]` | Yes | `[]` | List of enrolled courses from catalog |
| `schedules` | `ScheduleResponse[]` | Yes | `[]` | List of course schedules from catalog |

### Emits

| Event | Payload | Description |
| :--- | :--- | :--- |
| `update:open` | `(value: boolean)` | Emitted when dialog open state changes |
| `select` | `(courseId: number)` | Emitted when a course option is selected |

### Slots

| Name | Description |
| :--- | :--- |
| `trigger` | Optional custom trigger element slot (wraps `DialogTrigger`) |

### Accessibility (WAI-ARIA)

- Uses `DialogRoot` and `DialogContent` with `role="dialog"`.
- `DialogTitle` bound to "Select Course" with accessible labeling.
- List items marked with `role="button"` or `tabindex="0"` with clear hit areas.
- Closes on `Escape` key and click outside overlay.
