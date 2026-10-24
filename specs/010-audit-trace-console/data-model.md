# Data Model: Dev Audit Trace Console

**Feature**: `010-audit-trace-console` | **Date**: 2026-10-24

## 1. Domain Events (`src/main/java/group/four/nyare/nyare/ai/event/`)

### `AuditTraceEvent`
Domain record published to Spring's `ApplicationEventPublisher`. Decouples production services from developer tooling.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `UUID` | Yes | Unique event identifier |
| `timestamp` | `Instant` | Yes | Event generation timestamp |
| `category` | `AuditCategory` | Yes | Audit classification (7 categories) |
| `severity` | `AuditSeverity` | Yes | `INFO`, `WARN`, or `ERROR` |
| `message` | `String` | Yes | Human-readable log or summary message |
| `originUserId` | `Long` | No | User ID who initiated the request/action |
| `originUsername` | `String` | No | Username or display name of the actor |
| `triggerSource` | `TriggerSource` | No | `WEB_SESSION` or `SYSTEM_JOB` |
| `mutationAction` | `MutationAction` | No | `CREATE`, `UPDATE`, `DELETE`, or `ARCHIVE` (if category is `DATA_MUTATION`) |
| `entityKind` | `TraceKind` | No | Target entity kind (for mutations or direct record audits) |
| `entityId` | `String` | No | Target entity primary key or UUID string |
| `changeSummary` | `String` | No | Short description of mutation change |
| `runId` | `UUID` | No | Planning run identifier for lifecycle correlation |
| `noteId` | `UUID` | No | Source or referenced note ID |
| `taskId` | `UUID` | No | Target task ID |
| `eventId` | `UUID` | No | Target academic event ID |
| `imageId` | `UUID` | No | Target image attachment ID |
| `courseId` | `Long` | No | Owning course identifier |
| `rationale` | `String` | No | AI planning reasoning or derivation explanation |
| `quotedText` | `String` | No | Verbatim quoted text (e.g. for unrelated note info) |
| `durationMs` | `Long` | No | Elapsed run execution time in milliseconds |
| `lifecycleState` | `LifecycleState` | No | `STARTED`, `COMPLETED`, `FAILED`, or `CANCELLED` |
| `extractedCounts` | `Map<String, Integer>` | No | Counts of tasks, events, contexts created |
| `errorDiagnostic` | `ErrorDiagnostic` | No | Exception details if severity is `ERROR` |

### `ErrorDiagnostic`
Nested record capturing execution failure details.

| Field | Type | Required | Description |
|---|---|---|---|
| `exceptionClass` | `String` | Yes | Fully qualified or simple exception class name |
| `message` | `String` | Yes | Exception error message |
| `rootCause` | `String` | No | Root cause message |
| `stackPreview` | `String` | No | Truncated top frames of the stack trace |

---

## 2. Enums

### `AuditCategory`
- `LIFECYCLE`: Run boundary events (`STARTED`, `COMPLETED`, `FAILED`, `CANCELLED`).
- `TASK_PLANNING`: Generation of new actionable tasks from notes.
- `TASK_PROMOTION`: Promotion or schedule assignment of existing backlog tasks.
- `EVENT_PLANNING`: Derivation of rigid academic events and deadlines.
- `IMAGE_CONTEXT`: Image description previews extracted for note attachments.
- `UNRELATED_INFO`: Notes or statements filtered out as non-academic.
- `DATA_MUTATION`: State-modifying actions (`CREATE`, `UPDATE`, `DELETE`, `ARCHIVE`) on core records.

### `AuditSeverity`
- `INFO`: Normal operational, planning, and mutation steps.
- `WARN`: Filtered statements, missing references, or non-fatal anomalies.
- `ERROR`: Unhandled exceptions, LLM timeouts, and aborted runs.

### `MutationAction`
- `CREATE`: Entity created.
- `UPDATE`: Entity properties modified.
- `DELETE`: Entity removed.
- `ARCHIVE`: Course archived or unarchived.

### `TriggerSource`
- `WEB_SESSION`: Explicit user interaction authenticated via session.
- `SYSTEM_JOB`: Background scheduled task or automated execution.

### `LifecycleState`
- `STARTED`: Planning run initialized.
- `COMPLETED`: Planning run completed and transaction committed.
- `FAILED`: Planning run aborted due to an error.
- `CANCELLED`: Planning run cancelled due to client disconnect.

### `TraceKind`
- `course`, `note`, `task`, `event`, `image`, `schedule`, `context`, `lifecycle`.

---

## 3. Dev Query & View Models (`src/dev/java/group/four/nyare/nyare/dev/dto/`)

### `DevDashboardViewModel`
Model attributes bound to the Thymeleaf template (`dashboard.html`) for initial page render.

| Field | Type | Description |
|---|---|---|
| `events` | `List<AuditTraceEventDto>` | Initial snapshot of retained audit events |
| `courses` | `List<CourseTraceSummaryDto>` | Course list entry points |
| `categories` | `List<AuditCategory>` | Available categories for filtering (7 categories) |
| `severities` | `List<AuditSeverity>` | Available severities for filtering |
| `totalRetained` | `int` | Current count of events in buffer (max 500) |

### `TraceNodeDto`
Represents an inspected entity record and its surrounding relationship graph for the detail pane.

| Field | Type | Description |
|---|---|---|
| `kind` | `TraceKind` | Entity kind |
| `id` | `String` | Primary key or UUID string |
| `displayTitle` | `String` | Human-readable label (e.g. course code, task title) |
| `status` | `String` | Entity state (e.g. task status, plan category, note date) |
| `isDeleted` | `boolean` | `true` if this represents a tombstone for a deleted entity |
| `deletedAt` | `Instant` | Deletion timestamp if `isDeleted` is true |
| `attributes` | `Map<String, Object>` | Key-value dictionary of non-binary record fields |
| `relations` | `List<TraceRelationGroupDto>` | Outgoing relationships to neighbouring entities |

### `TraceRelationGroupDto`
A named collection of related entity records.

| Field | Type | Description |
|---|---|---|
| `groupName` | `String` | Label (e.g. "Child Tasks", "Referenced Images") |
| `targetKind` | `TraceKind` | Target entity kind |
| `totalCount` | `int` | Total count of associated records in DB |
| `items` | `List<TraceNodeStubDto>` | Truncated list of related nodes (max 50) |

### `TraceNodeStubDto`
Compact pointer card within a relation group.

| Field | Type | Description |
|---|---|---|
| `kind` | `TraceKind` | Target kind |
| `id` | `String` | Target identifier |
| `title` | `String` | Target title or summary |
| `subtitle` | `String` | Supporting info (e.g. scheduled date, duration) |
| `isExact` | `boolean` | `true` if exact ID match, `false` if matched by title |

---

## 4. Invariants & Storage Boundaries

1. **Buffer Limit**: The in-memory buffer in `DevAuditTraceSink` holds at most 500 events. Oldest events are dropped on overflow.
2. **Display Truncation**: `TraceRelationGroupDto.items` returns at most 50 items. `totalCount` exposes the true count.
3. **Binary Exclusion**: `Image` records expose metadata (`id`, `contentType`, `filename`, `size`, `description`) only. Binary byte arrays are never fetched or transferred.
4. **Read-Only Enforced**: All trace database queries run under `@Transactional(readOnly = true)`.
5. **Strictly Backend Dev Scoped**: All view models and DTOs exist only in `src/dev` and are never packaged in production builds.
