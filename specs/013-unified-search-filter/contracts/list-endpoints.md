# Contracts: List Endpoints

All three endpoints keep their existing params; `q`, `from`, `to` are additive and optional. All require an authenticated session (401 RFC 7807 without one) and are scoped to the session user.

## GET /api/tasks

New params (combined with existing `courseId`, `status`, `scheduled`, `archived`):

| Param | Type | Default | Notes |
|---|---|---|---|
| `q` | string | absent | substring match on `title` + `description`, case-insensitive |
| `from` | `YYYY-MM-DD` | absent | `scheduledDate >= from` |
| `to` | `YYYY-MM-DD` | absent | `scheduledDate <= to` |

Response: `200 OK` → `TaskResponse[]` (unchanged shape, `createdAt` desc).

## GET /api/notes

New params (combined with existing `courseId`, `archived`):

| Param | Type | Default | Notes |
|---|---|---|---|
| `q` | string | absent | substring match on `title` + `content`, case-insensitive |
| `from` | `YYYY-MM-DD` | absent | `entryDate >= from` |
| `to` | `YYYY-MM-DD` | absent | `entryDate <= to` |

Response: `200 OK` → `NoteSummaryResponse[]` (unchanged shape).

## GET /api/academic-events

New params (combined with existing `courseId`, `upcoming`, `archived`):

| Param | Type | Default | Notes |
|---|---|---|---|
| `q` | string | absent | substring match on `title` + `description`, case-insensitive |
| `from` | `YYYY-MM-DD` | absent | `deadline >= from` start-of-day |
| `to` | `YYYY-MM-DD` | absent | `deadline <= to` end-of-day |

Response: `200 OK` → `AcademicEventResponse[]` (unchanged shape, `deadline` asc).

## Errors (all three)

| Condition | Status | Body |
|---|---|---|
| No session | 401 | RFC 7807 problem detail |
| `from` > `to` | 400 | `BadRequestException` → RFC 7807, detail names both params |
| Malformed date | 400 | Spring binding error → RFC 7807 |

## Mock adapter parity

`src/api/mocks/adapter.ts` mirrors all three filters in-memory: lowercase `includes` on the same fields, inclusive date bounds, `from > to` → 400. Mock behavior must match this contract so dev-mode previews stay faithful.
