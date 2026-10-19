# Data Model: Create Schedule Week Calendar Preview

The feature adds no database entity. The preview derives from form state. All types live in the frontend.

## Entities and Interfaces

### 1. PreviewBlock

One rectangle on the preview grid. One time block yields up to seven preview blocks, one per selected weekday.

```typescript
export interface PreviewBlock {
  id: string            // `${block.id}-${day}` — unique per rectangle
  day: DayOfWeek        // column placement
  title: string         // trimmed course name; empty string when the name is blank
  startTime: string     // "HH:mm", 24-hour
  endTime: string       // "HH:mm", 24-hour
  color: string         // CoursePaletteColor.solid hex value
  blockId: string       // source TimeBlockDraft.id, used for the edit tap
}
```

### 2. PendingSlot

The outlined slot after an empty tap. It also carries the prefill for the new class time.

```typescript
export interface PendingSlot {
  day: DayOfWeek
  startTime: string     // "HH:mm", snapped down to the tapped hour
  endTime: string       // "HH:mm", start plus one hour
}
```

### 3. Reused Types

| Type | Source | Use |
|:---|:---|:---|
| `TimeBlockDraft` | `src/components/TimeBlockCard.vue` | Existing form draft. Source of the preview. |
| `DayOfWeek` | `src/types/api.ts` | Weekday value. |
| `CoursePaletteColor` | `src/constants/palette.ts` | `id`, `name`, `solid`, `bg`, `text`, `border`. |
| `WEEKDAYS` | `src/components/TimeBlockCard.vue` | Ordered labels `Su`..`Sa` and their `DayOfWeek` values. |

## Derivation Rules

`derivePreviewBlocks(blocks, name, color)` applies these rules:

1. For each block, for each weekday in `block.selectedDays`, emit one `PreviewBlock`.
2. Skip a block when `selectedDays` is empty.
3. Skip a block when `startTime` is empty, `endTime` is empty, or `startTime >= endTime`.
4. Set `title` to `name.trim()`. A blank name yields `title: ''`.
5. Set `color` to `color.solid`.

## Tap Mapping

`slotFromOffset(offsetX, offsetY, gridWidth)` applies these rules:

1. `dayIndex = floor(offsetX / (gridWidth / 7))`. Read the weekday from `WEEKDAYS[dayIndex]`.
2. `startHour = floor(offsetY / HOUR_HEIGHT)`, snapped down. Clamp to 23.
3. `endHour = startHour + 1`.
4. Return `null` when `offsetX` or `offsetY` is outside the grid.

## Validation Rules

| Rule | Requirement | Behavior |
|:---|:---|:---|
| No weekday selected | FR-008 | Emit no preview block. |
| Invalid time | FR-009 | Emit no preview block. |
| Blank name | FR-010 | Emit a block with an empty title. |
| Long name | FR-011 | Clip the title with CSS inside the block. |
| Selected color | FR-012 | Apply `solid` as the block background. |
| No storage | FR-013 | The preview writes no data. It changes no save result. |

## State Transitions

```
[Form opens]
   │
   ▼
[Preview shows the draft blocks from the form]
   │
   ├── Student edits name / color / weekday / time ──► [Preview recomputes immediately]
   │
   ├── Student taps empty grid space
   │      └─► [PendingSlot set] ──► [New draft block prefilled]
   │             └─► [Sheet opens at the partial stage] ──► [Outline shown on the grid]
   │
   ├── Student taps an existing block
   │      └─► [Sheet opens to edit that block] ──► [No new class time]
   │
   └── Student closes the sheet without a save
          └─► [PendingSlot cleared] ──► [Pending draft discarded] ──► [Preview returns to prior state]
```
