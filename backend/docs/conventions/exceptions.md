# Canonical Exception Strategy

## 1. Core Policy: No Custom Exception Explosion

**Do NOT create custom exception classes per entity or feature** (e.g. do not create `CourseNotFoundException`, `NoteNotFoundException`, or `InvalidDeadlineException`).

In REST architectures, domain exceptions exist to signal the appropriate HTTP status code category to `GlobalExceptionHandler`. Developers must throw one of the two canonical domain exceptions with a descriptive message in the constructor.

## 2. Canonical Exception Matrix

| Exception | Purpose | Mapped Status | Handled By |
|---|---|---|---|
| `ResourceNotFoundException` | Entity ID does not exist in persistence | `404 Not Found` | `GlobalExceptionHandler` |
| `BadRequestException` | Domain invariant / cross-entity rule violated (e.g. Note doesn't belong to Course) | `400 Bad Request` | `GlobalExceptionHandler` |
| `MethodArgumentNotValidException` | Jakarta validation constraint failed (`@NotNull`, `@NotBlank`, `@Size`) | `400 Bad Request` | `GlobalExceptionHandler` (automatic) |

## 3. RFC 7807 Problem Details Response

`GlobalExceptionHandler` centrally formats exceptions into RFC 7807 payloads:

```json
{
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Academic event not found with ID: 550e8400-e29b-41d4-a716-446655440000"
}
```
Controllers never catch domain exceptions or format manual error JSONs.
