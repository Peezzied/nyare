# Research: Dev Audit Trace Console

**Feature**: `010-audit-trace-console` | **Date**: 2026-10-24

## 1. Audit Capture: In-Service Event Tapping vs. Log Scraping

### Decision
Tap directly into affected services (`StudyPlannerServiceImpl`, domain entity services) and AI advisors (`PlannerAuditAdvisor`) by publishing strongly typed `AuditTraceEvent` domain records via Spring's `ApplicationEventPublisher`.

### Rationale
- **Decoupled Architecture**: Log scraping or console interceptors are brittle, depend on logging formatting, and require complex regex/string parsing.
- **Spring Native**: `ApplicationEventPublisher` is built into Spring's `ApplicationContext`. In production (`main`), if no dev listeners exist, event publishing is practically a no-op with near-zero overhead.
- **Structured Metadata**: Events carry exact typed identifiers (`UUID` for notes/tasks/events/images, `Long` for course/user, `runId`, duration, error diagnostics, request origin) rather than flattened log lines.
- **YAGNI Compliance**: Avoids external messaging (Kafka/RabbitMQ) and complex logging appenders.

### Alternatives Considered
- **Logback In-Memory Appender**: Intercepts console logs. Rejected because log lines are plain text; entity references would have to be parsed back from strings, creating fragility and maintenance burden.
- **Direct Bean Injection**: Injecting the dev trace repository into services. Rejected because `src/main` cannot depend on `src/dev` without violating compile boundaries. Spring application events provide clean unidirectional decoupling.

---

## 2. Dev Presentation Library: Thymeleaf Inside Backend Dev Module

### Decision
Render the developer console UI entirely from the backend using Spring Boot Thymeleaf (`org.springframework.boot:spring-boot-starter-thymeleaf`), located strictly inside the `backend/src/dev` sourceSet.

### Rationale
- **Zero Frontend Contamination**: Constitution Principle X strictly requires that frontend presentation components remain pure, production-grade representations. Embedding dev-only views or dev routing guards in Vue/Vite violates this separation. Moving the dashboard to the backend eliminates all dev tooling from `frontend/src/`.
- **Compile-Time Isolation**: By declaring `devImplementation 'org.springframework.boot:spring-boot-starter-thymeleaf'`, Thymeleaf and its templates are compiled only for `sourceSets.dev` and `devRun`. Production JAR tasks (`bootJar`) package only `sourceSets.main`, ensuring zero template files, dev controllers, or Thymeleaf libraries leak into production artifacts (satisfies FR-001, SC-006).
- **Single-Server Developer Experience**: The dashboard is served directly from the Spring Boot dev server at `http://localhost:8080/dev/audit-trace`. Developers do not need to run or modify the frontend to monitor audits and walk database references.
- **Vanilla Dynamic Enhancements**: The server-rendered page includes minimal inline vanilla JS to consume the SSE stream (`/dev/audit-trace/stream`), dynamically appending new audit cards and updating trace node panels without external client frameworks.

### Alternatives Considered
- **Vue Dev Views in `frontend/src/views/dev/`**: Rejected. Violates the user directive that the dashboard must strictly live inside the backend, and risks leaking dev code into production frontend bundles.
- **Standalone Single Page App in `src/dev`**: Over-engineered. Thymeleaf provides immediate server rendering with zero client build toolchain required in Gradle.

---

## 3. Request Origin & User Tracking

### Decision
Capture initiating actor metadata (`originUserId`, `originUsername`, `triggerSource`) directly from session context during service invocations and attach it to each emitted `AuditTraceEvent`.

### Rationale
- **Traceability**: Allows developers to immediately correlate which student account or background job triggered an AI planning run or data change.
- **Session Alignment**: Nyare already enforces session user IDs across all protected endpoints (`/api/**`). Services receive the user ID as a parameter, making origin capture straightforward and zero-cost.
- **Trigger Source Differentiation**: Distinguishes direct user web interactions (`WEB_SESSION`) from scheduled/system executions (`SYSTEM_JOB`).

---

## 4. CRUD Mutation Auditing

### Decision
Publish `AuditTraceEvent` with category `DATA_MUTATION` for state-modifying actions (Create, Update, Delete, Archive) across core entities (Course, Note, Task, AcademicEvent, Schedule, Image). Exclude Read operations (GET queries).

### Rationale
- **Buffer Protection**: Limiting CRUD audits to mutations prevents high-frequency read queries from flooding the 500-event circular buffer.
- **Tombstone Tracing**: When an entity is deleted, the mutation audit records a tombstone snapshot (`entityKind`, `entityId`, timestamp, user). If a developer traces a deleted record, the console renders the tombstone state rather than failing.
- **Service-Level Publishing**: Emitting events upon successful database transactions guarantees that only persisted changes are recorded.

---

## 5. Event Buffering and Retention

### Decision
Retain up to 500 audit events in an in-memory bounded concurrent buffer (`ConcurrentLinkedDeque` with atomic size enforcement) in `DevAuditTraceSink`.

### Rationale
- **Ephemeral Dev Context**: Audits are scoped to local dev runs and reset on restart (Assumption 4, FR-003).
- **Memory Footprint**: 500 lightweight event records occupy under 2 MB of heap.
- **Thread Safety**: Concurrent collections safely handle virtual threads from `StudyPlannerService` without explicit locks.

---

## 6. Live Feed Delivery: Server-Sent Events (SSE)

### Decision
Provide `GET /dev/audit-trace/stream` using Spring `SseEmitter` for real-time live feed updates, complemented by initial server-rendered HTML via Thymeleaf.

### Rationale
- **Precedent in Codebase**: Nyare's planner already uses SSE for `POST /api/study-planner/process`.
- **Unidirectional Efficiency**: SSE operates over HTTP, works with standard browser `EventSource`, and requires no WebSocket dependencies.
- **Pause/Resume**: When the UI pauses the feed, the client-side JavaScript closes the `EventSource` connection or buffers DOM additions until resumed.

---

## 7. Reference Resolution and Database Navigation

### Decision
Implement `DevTraceWalker` in `src/dev` injecting existing Spring Data JPA repositories (`CourseRepository`, `NoteRepository`, `TaskRepository`, `AcademicEventRepository`, `ImageRepository`) with `@Transactional(readOnly = true)`.

### Rationale
- **Read-Only Guarantee**: Strictly enforces FR-015 by marking service methods `@Transactional(readOnly = true)`.
- **Relationship Resolution**: Queries child records per node type:
  - `Course`: schedules, notes, tasks, events, contexts.
  - `Note`: parent course, child tasks, child events, context facts, referenced image IDs from content JSON.
  - `Task`: parent course, source note.
  - `AcademicEvent`: parent course, source note.
  - `Image`: referencing notes (found by querying notes whose content contains the image UUID).
- **Display Cap**: Caps relation results to 50 items while providing total count (FR-013).
- **Safe Image Handling**: Transfers metadata only (`id`, `contentType`, `filename`, `size`, `description`); never reads or transfers binary content (FR-014).
