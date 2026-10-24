# Data Model: Course Archive

## Course (changed)

| Field | Type | Rule |
|-------|------|------|
| `archivedAt` | `LocalDateTime`, nullable, column `archived_at` | `NULL` = active. Non-null = archived at that time. |

Existing fields and cascade rules do not change. Child entities (`Schedule`, `Note`, `Task`, `AcademicEvent`, `AcademicContext`) get no new field. Their archive state derives from `course.archivedAt`.

## State transitions

```text
active --archive / archive-all--> archived
archived --unarchive / unarchive(ids)--> active
active | archived --delete--> removed (cascade)
```

- Archive sets `archivedAt = now`. `archive-all` uses one `now` for all courses of the call.
- Unarchive sets `archivedAt = null`. No child row changes. Task status, `scheduledDate`, and `duration` stay as before (SC-003).
- Archive on an archived course and unarchive on an active course are no-ops that return the course.

## Validation rules

- Only the owner can change state. Lookup uses `findByIdAndUserId`. Foreign or unknown ID -> 404.
- Create, update, status change, or delete of a `Schedule`, `Note`, `Task`, or `AcademicEvent` whose course is archived -> 400 `Course is archived`.
- Update of an archived course (name, description, color) -> 400 `Course is archived`.
- Delete of an archived course is allowed.

## DTOs

- `CourseResponse`: add `archivedAt` (ISO local date-time or `null`).
- `UnarchiveRequest`: `courseIds: List<Long>`, `@NotEmpty`, elements `@NotNull`.

## Frontend types (`src/types/api.ts`)

- `CourseResponse.archivedAt: string | null`.
- `UnarchiveRequest { courseIds: number[] }`.
- List params gain `archived?: boolean` for courses, schedules, notes, tasks, and academic events.
