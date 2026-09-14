# REST API & Controller Guidelines

## 1. Paths & Endpoints

- Endpoints start with `/api/...` (unversioned, no `/v1/` prefix).
- Use plural nouns in kebab-case: `/api/tasks`, `/api/courses`, `/api/academic-events`.

## 2. HTTP Verb & Status Code Matrix

| Action | HTTP Verb | Example Path | Success Status | Error Statuses |
|---|---|---|---|---|
| List (filtered) | `GET` | `/api/academic-events?courseId=1&upcoming=true` | `200 OK` | `400 Bad Request` |
| Get by ID | `GET` | `/api/academic-events/{id}` | `200 OK` | `404 Not Found` |
| Create | `POST` | `/api/academic-events` | `201 Created` (`Location` header) | `400 Bad Request`, `404 Not Found` |
| Update Full | `PUT` | `/api/academic-events/{id}` | `200 OK` | `400 Bad Request`, `404 Not Found` |
| Update Partial | `PATCH` | `/api/tasks/{id}/status` | `200 OK` | `400 Bad Request`, `404 Not Found` |
| Delete | `DELETE` | `/api/academic-events/{id}` | `204 No Content` | `404 Not Found` |

## 3. No Paging (MVP Boundary)

Endpoints return plain `List<T>`, avoiding unnecessary pagination or envelope wrappers.

## 4. Problem Details (RFC 7807)

All error responses return standardized `ProblemDetail` payloads managed centrally by `GlobalExceptionHandler`.
