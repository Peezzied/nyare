# Data Model: Enforce Backend Session

No schema change. No new table or column. Ownership derives from existing relations.

## Entities

| Entity | Owner path | Ownership rule |
|---|---|---|
| Course | `Course.user` | Owner is the user who created the course. |
| Schedule | `Schedule.course.user` | Owner is the course owner. |
| Task | `Task.course.user` | Owner is the course owner. |
| Note | `Note.course.user` | Owner is the course owner. |
| AcademicEvent | `AcademicEvent.course.user` | Owner is the course owner. |
| Session | HTTP session attribute `USER_ID` (`UserController.SESSION_USER_ID`) | Holds one `Long` user ID. Created at login, removed at logout or user deletion. |

## Validation Rules

- A protected request needs a session with a `Long` `USER_ID`. Otherwise the answer is 401.
- A read, update, or delete of a record whose owner differs from the session user answers 404.
- A create request names a course. The course owner must equal the session user. Otherwise the answer is 404.
- The request body and query string never set the owner. `CourseRequest.userId` and `GET /api/courses?userId=` are removed.

## Repository Queries (new, derived)

| Repository | Method |
|---|---|
| CourseRepository | `Optional<Course> findByIdAndUserId(Long id, Long userId)` |
| ScheduleRepository | `Optional<Schedule> findByIdAndCourseUserId(Long id, Long userId)` |
| TaskRepository | `Optional<Task> findByIdAndCourseUserId(UUID id, Long userId)` |
| NoteRepository | `Optional<Note> findByIdAndCourseUserId(UUID id, Long userId)` |
| AcademicEventRepository | `Optional<AcademicEvent> findByIdAndCourseUserId(UUID id, Long userId)` |

List methods already take a user ID. After this change the value is never null.

## State Transitions

```text
no session --login--> session(userId) --logout / user delete / expiry--> no session
no session: protected request -> 401
session(userId): own record -> 200/201/204, other record -> 404
```

Frontend state: `useAuth.user` becomes `null` and `sessionChecked` resets when the client sees a 401 on a protected path.
