# Component Contract: WeekPreview

## Component: `src/components/WeekPreview.vue`

### Description
A presentational week grid for the create schedule form. It renders a seven-column layout and an hourly time axis. It draws one colored block per `PreviewBlock`. A tap on empty grid space emits the tapped slot. A tap on a block emits the source block id. The component holds no data and derives nothing.

### Props

| Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `blocks` | `PreviewBlock[]` | Yes | `[]` | The derived rectangles to draw |
| `pendingSlot` | `PendingSlot \| null` | No | `null` | The outlined slot after an empty tap |
| `selectedColor` | `string` | No | — | The palette `solid` hex for the prefill outline |

### Emits

| Event | Payload | Description |
| :--- | :--- | :--- |
| `selectSlot` | `(slot: PendingSlot)` | Emitted on a tap on empty grid space |
| `selectBlock` | `(blockId: string)` | Emitted on a tap on an existing block |

### Layout Contract

- The grid has seven columns and one row per hour, at `HOUR_HEIGHT = 80` pixels.
- The header row shows the seven labels from `WEEKDAYS` only. It shows no date.
- A block is placed by `startTime`, `endTime`, and `day`.
- A block shows `title` only. It shows no room and no description.
- The grid scrolls vertically. It does not scroll horizontally.
- The pending outline covers one hour, from `startTime` to `endTime`.

### Accessibility (WAI-ARIA)

- The root uses `role="grid"` with an `aria-label` of `Week preview`.
- Each block is a `button` with `aria-label` set to the block title and time range.
- Each empty column area carries a `data-day` attribute and a keyboard `Enter` and `Space` handler.
- Every interactive element meets the 44px minimum touch target.
- The pending outline uses `aria-hidden="true"`. It is decorative.

### Ownership Boundaries

- The component owns only layout and pointer math. It derives no block.
- `CreateScheduleView.vue` owns the draft state, the derivation call, and the save flow.
