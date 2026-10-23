# Data Model: Unified Search and Filter

No schema changes. This feature adds read-side query parameters to three existing entities.

## Entities

### Task (existing)

- Searchable fields: `title` (String, required), `description` (String, optional)
- Filterable fields: `course.id` (courseId), `status` (TODO/COMPLETED), `scheduledDate` (LocalDate, nullable — `from`/`to` bound it; null dates never match a date filter)
- Derived: `planCategory` stays client-side (Constitution I)

### Note (existing)

- Searchable fields: `title`, `content` (JSON string; LIKE-substring matches raw content)
- Filterable fields: `course.id`, `entryDate` (LocalDate)
- Response used by search: `NoteSummaryResponse` (preview truncated at 200 chars — match may be in non-preview text; acceptable per spec)

### AcademicEvent (existing)

- Searchable fields: `title`, `description`
- Filterable fields: `course.id`, `deadline` (LocalDateTime; `from`/`to` LocalDate converted to day bounds in the service)
- Existing `upcoming` retained; `from` subsumes it

## Query contract additions

| Param | Type | Applies to | Semantics |
|---|---|---|---|
| `q` | String | all three | case-insensitive substring on title + body; blank/whitespace treated as absent |
| `from` | LocalDate (`YYYY-MM-DD`) | all three | item date >= from |
| `to` | LocalDate (`YYYY-MM-DD`) | all three | item date <= to (inclusive; events convert to exclusive end-of-day) |

Validation: `from > to` → `400 BadRequestException` (RFC 7807 body via `GlobalExceptionHandler`).

## Client-side filter state (per view, not persisted)

```ts
interface ListFilters {
  courseId?: number        // single-select; absent = all courses
  from?: string            // ISO date
  to?: string              // ISO date
  status?: TaskStatus      // tasks only
}
```

`searchActive = query.trim() !== '' || filters.courseId != null || filters.from != null || filters.to != null || filters.status != null`

When `searchActive`, the view renders `useServerSearch` results; otherwise the cached list.
