# Research: Enforce Backend Session

Sources: `dr-jskill` (`SKILL.md`, `references/SECURITY.md`), `vue-best-practices`, `vue-router-best-practices`, project constitution, and the current code.

## Current state (verified in code)

- `SessionContext.getUserId()` returns `Optional<Long>`. Controllers call `.orElse(null)`, so an anonymous call reaches the service with a null user ID and sees all data.
- `CourseController.list` accepts a client `userId` parameter. `CourseServiceImpl` falls back to `request.getUserId()` when the session is empty.
- By-ID service methods (`getCourse`, `getTask`, `getNote`, `getSchedule`, `getEvent`, update, delete) take no user ID. Any caller who knows an ID can read or change the record.
- `GlobalExceptionHandler` handles only `ResourceNotFoundException`, `BadRequestException`, and `MethodArgumentNotValidException`.
- `WebConfig` holds CORS only. The backend has no Spring Security dependency.
- Frontend: `apiClient` sends `credentials: 'include'`. `useAuth.ensureSession` and the router guard handle the session at load time only. No code handles a 401 during use. `grep` found no `userId` use in frontend source.
- `AccountSelectView` calls `GET /api/users` before login to show the account picker.

## Decision 1: Use a HandlerInterceptor, not Spring Security

- **Decision**: Add `SessionInterceptor` registered in `WebConfig` for `/api/**`. Exclude `POST /api/users`, `POST /api/users/login`, `POST /api/users/logout`, `GET /api/users/me`, and the open user endpoints listed in Decision 5.
- **Rationale**: `dr-jskill` says to add Spring Security only when needed. The need here is a cookie-session 401 check. Spring Security would add CSRF, a default login form, a filter chain, and test setup for every `@WebMvcTest`. The Ponytail rule and constitution VII prefer no new dependency.
- **Alternatives**: Spring Security with a custom `AuthenticationEntryPoint`. Rejected: larger change and larger test impact. Revisit when passwords or roles arrive.

## Decision 2: 401 uses `ResponseStatusException` and Problem Details

- **Decision**: The interceptor and `SessionContext.requireUserId()` throw `ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required")`. Set `spring.mvc.problemdetails.enabled=true`.
- **Rationale**: Constitution VI forbids new exception classes. `ResponseStatusException` is a Spring class. `dr-jskill` recommends the `problemdetails` property for RFC 7807. This keeps the error format the same as other errors (FR-008).
- **Alternatives**: Write the JSON body by hand in the interceptor. Rejected: duplicates format logic. Add a custom exception. Rejected by the constitution.
- **Open check for implementation**: Confirm with a `@WebMvcTest` that the body is `application/problem+json` with the project advice present. If not, add one `@ExceptionHandler(ResponseStatusException.class)` to `GlobalExceptionHandler`.

## Decision 3: Scope all access by owner in the service layer

- **Decision**: Controllers call `sessionContext.requireUserId()` and pass the value to service interfaces. Repositories gain derived queries such as `findByIdAndCourseUserId`. A mismatch throws `ResourceNotFoundException`. Create methods check that the target course belongs to the session user. Remove the `userId` request parameter and `CourseRequest.userId`.
- **Rationale**: The interceptor proves identity. Only the service layer can prove ownership. Returning 404, not 403, avoids confirming that a record exists. This follows layer isolation (constitution V) and uses no new exception.
- **Alternatives**: Check ownership in the interceptor. Rejected: needs repository access in config. Return 403. Rejected: leaks existence and needs a new status path.

## Decision 4: Frontend handles 401 in the API client and router

- **Decision**: `client.ts` exports `setUnauthorizedHandler(fn)`. After a 401 on any path except `/api/users/me` and `/api/users/login`, the client calls the handler once and still throws `ApiError`. `router/index.ts` registers a handler that runs `clearSessionUser()` and pushes the `start` route. The same code path covers mock responses.
- **Rationale**: Vue best practice keeps views thin, with state in composables and one boundary for side effects. Constitution X keeps session rules out of views. A router module already imports `useAuth`, so it avoids a circular import between client and composable. The navigation guard then runs `ensureSession`, which re-runs dev auto-login when enabled (FR-011).
- **Alternatives**: Catch 401 in each view or composable. Rejected: duplicates logic in many places. Use an Axios interceptor. Rejected: Axios is banned.

## Decision 5: Keep user-list endpoints open in this feature

- **Decision**: `GET /api/users`, `GET /api/users/{id}`, and `DELETE /api/users/{id}` stay reachable without a session.
- **Rationale**: The account picker needs the list before login, and login has no password. Locking the list needs a new sign-in design. The spec scopes protection to course, task, note, schedule, event, image, and planner data.
- **Risk (follow-up)**: Anyone can still list users, log in as any user by name, or delete a user. This feature enforces session presence and ownership, not user identity strength. Record a follow-up spec for passwords or a protected user list.

## Decision 6: Test strategy

- **Decision**: Controller tests add `sessionAttr(SESSION_USER_ID, 1L)` to protected calls. One new `@WebMvcTest` class checks that each protected path returns 401 with no session. Service unit tests add owner and cross-user cases. The mock adapter returns 401 on protected routes when `currentUser` is null. The flow suite adds an anonymous 401 flow. Integration tests run one at a time and need user approval before more.
- **Rationale**: Constitution testing standards. Existing tests use 84 `status()` or session matches in controller tests, so the sweep is mechanical.
- **Alternatives**: Disable the interceptor in tests. Rejected: tests would not prove the rule.

## Spring Boot 4 notes

- The interceptor is a plain `@Component` that reads `request.getSession(false)`. It does not use the request-scoped `SessionContext`, so it works in `@WebMvcTest` without extra beans.
- `WebMvcConfigurer` beans load in `@WebMvcTest`, so the interceptor is active in controller tests. Tests must set the session attribute.
- Keep session reads on `UserController.SESSION_USER_ID`. A session whose user was deleted: `requireUserId()` passes, then the service finds no user and answers 404. `UserController.deleteUser` already invalidates the session for the deleted user.

## Resolved clarifications

None open. The plan uses the spec assumptions unchanged.
