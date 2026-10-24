# Contract: Course Archive API

All paths need a session (401 RFC 7807 without one). Services scope every call to the session user.

## New endpoints

| Method | Path | Body | Success | Errors |
|--------|------|------|---------|--------|
| POST | `/api/courses/{id}/archive` | none | `200 CourseResponse` (`archivedAt` set) | 404 unknown or foreign course |
| POST | `/api/courses/{id}/unarchive` | none | `200 CourseResponse` (`archivedAt` null) | 404 |
| POST | `/api/courses/archive-all` | none | `200 CourseResponse[]` (same `archivedAt`) | none. Returns `[]` with no active course |
| POST | `/api/courses/unarchive` | `{ "courseIds": [1,2] }` | `200 CourseResponse[]` | 400 empty list. 404 any unknown or foreign ID, no change |

`archive-all` and batch `unarchive` are single transactions. A failure changes no course.

## Changed endpoints

`GET /api/courses`, `/api/schedules`, `/api/notes`, `/api/tasks`, `/api/academic-events` accept `archived` (boolean, default `false`).

- `archived=false`: rows of active courses only.
- `archived=true`: rows of archived courses only. Combine with `courseId` to read one archived course.

Mutations (`POST`, `PUT`, `PATCH`, `DELETE`) on notes, tasks, schedules, and events of an archived course return `400` with detail `Course is archived`. `PUT /api/courses/{id}` on an archived course returns `400`. `DELETE /api/courses/{id}` stays allowed.

`GET /api/{notes|tasks|schedules|academic-events}/{id}` return archived items (read-only use).

## Planner

`GET /api/study-planner/status` and `POST /api/study-planner/process` ignore archived courses: dirty notes, existing tasks, events, and schedules all use `archived=false`.

## Frontend service contract (`src/api`)

```ts
coursesApi.list(params?: { archived?: boolean }): Promise<CourseResponse[]>
coursesApi.archive(id: number): Promise<CourseResponse>
coursesApi.unarchive(id: number): Promise<CourseResponse>
coursesApi.archiveAll(): Promise<CourseResponse[]>
coursesApi.unarchiveMany(ids: number[]): Promise<CourseResponse[]>
```

The mock adapter implements the same paths and the `archived` param.

## UI contract

- Hamburger panel: `data-testid="archive-item"`, route `archive`.
- Routes: `/archive` (`archive`), `/archive/:courseId` (`archived-course`).
- Undo toast: 8000 ms, action label `Undo`, sends the exact IDs from `archive-all`.
