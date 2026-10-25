# Data Model: Exclude Note From AI Processing

## Note (changed)

| Field | Type | Rule |
|-------|------|------|
| `excludedFromAi` | boolean, column `excluded_from_ai`, `BOOLEAN NOT NULL DEFAULT 0` | Default `false`. Set by the owner through note update. |

All other `Note` fields stay unchanged.

## Derived rule

A note is **pending** (dirty) when all conditions hold:

1. `excludedFromAi` is false.
2. `lastProcessedAt` is null, or `updatedAt` is later than `lastProcessedAt`.
3. The course is active and belongs to the user.

## State transitions

| From | Action | To | Effect |
|------|--------|----|--------|
| Included | Save with toggle on | Excluded | Note leaves the pending set. Extracted data stays. |
| Excluded | Edit content, save | Excluded | `updatedAt` changes. Note stays out of the pending set. |
| Excluded | Save with toggle off | Included | Pending only if `lastProcessedAt` is null or older than the new `updatedAt`. |

## Migration

Production uses `ddl-auto=update`. The column default adds the column to existing rows with `false`. No manual script runs.

## Frontend types (`frontend/src/types/api.ts`)

- `NoteResponse.excludedFromAi: boolean`
- `NoteRequest.excludedFromAi?: boolean | null`
- `NoteProcessingStatus` adds `'skipped'`
- `NoteStatusInput.excludedFromAi?: boolean`
