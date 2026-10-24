# Interface & API Contract: Dev Audit Trace Console

**Feature**: `010-audit-trace-console` | **Date**: 2026-10-24

These endpoints and server-rendered views exist exclusively in the development environment (`backend/src/dev`) and are mounted under `/dev/audit-trace/**`.

---

## 1. Web Dashboard View (Thymeleaf)

### `GET /dev/audit-trace`
Renders the complete Nyare-themed developer audit trace dashboard using Thymeleaf.

#### Response `200 OK` (`text/html`)
- **Template**: `templates/dev/dashboard.html`
- **Model Attributes**:
  - `events`: Initial snapshot of `List<AuditTraceEventDto>` (up to 500, newest first)
  - `courses`: `List<CourseTraceSummaryDto>` for top-level database browsing
  - `categories`: Available `AuditCategory` values for filter pills (7 categories including `DATA_MUTATION`)
  - `severities`: Available `AuditSeverity` values for filter pills (`INFO`, `WARN`, `ERROR`)
  - `totalRetained`: Current integer count of buffered events
- **Visual Presentation**:
  - Split-pane layout: scrollable audit feed on left/main panel, detail trace inspector on right panel
  - Warm parchment surfaces (`#FAF8F5`, `#F3EFEA`), ocean cyan accent (`#0EA5E9`), slate typography (`#334155`)
  - Actor badge on each card displaying `originUsername` (`userId`) and trigger badge (`WEB_SESSION` / `SYSTEM_JOB`)
  - Pause/Resume button with visible live/paused status indicator
  - Filter chips for all 7 categories and `ERROR` severity
  - Collapsible error diagnostic drawer displaying exception class, root cause, and stack preview

---

## 2. Real-Time Audit Stream (SSE)

### `GET /dev/audit-trace/stream`
Server-Sent Events endpoint streaming new audit events as they occur in real time. Connected by client-side script in `dashboard.html`.

#### Response `200 OK` (`text/event-stream`)
```text
event: audit
data: {"id":"f8e12...","timestamp":"2026-10-24T10:15:31.000Z","category":"LIFECYCLE","severity":"INFO","lifecycleState":"STARTED","runId":"a1b2c3d4...","originUserId":1,"originUsername":"student_jane","triggerSource":"WEB_SESSION","message":"Planning run started for 2 notes"}

event: audit
data: {"id":"3d1a5...","timestamp":"2026-10-24T10:15:32.100Z","category":"TASK_PLANNING","severity":"INFO","originUserId":1,"originUsername":"student_jane","triggerSource":"WEB_SESSION","message":"[AI AUDIT - TASK PLANNING] NoteId: 3d1a... | Title: \"Read Chapter 3\" | Scheduled: 2026-10-25 | Duration: 45 | Rationale: Quiz on Monday","noteId":"3d1a52f4-82a1-4322-bfa1-e633d9405230","rationale":"Quiz on Monday"}

event: audit
data: {"id":"7e9f1...","timestamp":"2026-10-24T10:15:35.200Z","category":"DATA_MUTATION","severity":"INFO","originUserId":1,"originUsername":"student_jane","triggerSource":"WEB_SESSION","mutationAction":"CREATE","entityKind":"task","entityId":"89ab12cd...","changeSummary":"Created task 'Read Chapter 3' in Course CS101","message":"Task created: 'Read Chapter 3'"}

event: audit
data: {"id":"9c2a1...","timestamp":"2026-10-24T10:15:38.450Z","category":"LIFECYCLE","severity":"ERROR","lifecycleState":"FAILED","runId":"a1b2c3d4...","originUserId":1,"originUsername":"student_jane","triggerSource":"WEB_SESSION","message":"Planning run failed: Connection timed out","errorDiagnostic":{"exceptionClass":"org.springframework.web.client.ResourceAccessException","message":"Connection timed out","rootCause":"java.net.SocketTimeoutException","stackPreview":"at group.four.nyare.nyare.ai..."}}
```

---

## 3. Node Relationship Inspection

### `GET /dev/audit-trace/node/{kind}/{id}`
Resolves an inspected database entity and its direct neighbouring relations for the detail pane.

#### Path Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `kind` | String | Yes | `course`, `note`, `task`, `event`, `image`, `schedule`, `context`, `lifecycle` |
| `id` | String | Yes | Primary key or UUID string |

#### Response `200 OK` (Standard Active Record)
```json
{
  "kind": "note",
  "id": "3d1a52f4-82a1-4322-bfa1-e633d9405230",
  "displayTitle": "Lecture 4 Notes",
  "status": "PROCESSED",
  "isDeleted": false,
  "deletedAt": null,
  "attributes": {
    "entryDate": "2026-10-24",
    "createdAt": "2026-10-24T09:00:00Z",
    "courseCode": "CS101",
    "courseTitle": "Introduction to Computer Science"
  },
  "relations": [
    {
      "groupName": "Owning Course",
      "targetKind": "course",
      "totalCount": 1,
      "items": [
        {
          "kind": "course",
          "id": "1",
          "title": "CS101 - Introduction to Computer Science",
          "subtitle": "3 credits",
          "isExact": true
        }
      ]
    },
    {
      "groupName": "Child Tasks",
      "targetKind": "task",
      "totalCount": 2,
      "items": [
        {
          "kind": "task",
          "id": "89ab12cd-ef34-5678-90ab-cdef12345678",
          "title": "Read Chapter 3",
          "subtitle": "Scheduled: 2026-10-25 | 45m",
          "isExact": false
        }
      ]
    }
  ]
}
```

#### Response `200 OK` (Tombstone Record for Deleted Entity)
```json
{
  "kind": "task",
  "id": "89ab12cd-ef34-5678-90ab-cdef12345678",
  "displayTitle": "[Deleted] Read Chapter 3",
  "status": "DELETED",
  "isDeleted": true,
  "deletedAt": "2026-10-24T10:16:00Z",
  "attributes": {
    "tombstoneNote": "Record was deleted during session",
    "deletedBy": "student_jane (ID: 1)"
  },
  "relations": []
}
```

#### Response `404 Not Found` (Problem Detail RFC 7807)
```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Record of kind 'note' with id 'unknown-id' not found"
}
```

---

## 4. Filtered Audit Feed API

### `GET /dev/audit-trace/feed`
Returns filtered audit events as JSON when switching category or severity filters without full page reload.

#### Query Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | String | No | Filter by category (`LIFECYCLE`, `TASK_PLANNING`, `DATA_MUTATION`, etc.) |
| `severity` | String | No | Filter by severity (`INFO`, `WARN`, `ERROR`) |
| `limit` | Integer | No | Max events to return (default: `500`, max: `500`) |

#### Response `200 OK` (`application/json`)
Returns `List<AuditTraceEventDto>`.

---

## 5. Course Trace Summaries

### `GET /dev/audit-trace/courses`
Returns every stored course as a trace summary. The client refreshes top-level database browsing without a full page reload.

#### Response `200 OK` (`application/json`)
Returns `List<CourseTraceSummaryDto>` (`id`, `name`, `color`).

---

## 6. Audit Event Reference Resolution

### `GET /dev/audit-trace/refs/{eventId}`
Resolves the record stubs a retained audit event cites. The inspector pane renders each stub as a clickable reference for the selected feed card.

#### Path Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `eventId` | UUID | Yes | Retained audit event identifier |

#### Response `200 OK` (`application/json`)
Returns `List<TraceNodeStubDto>` in citation order (`kind`, `id`, `title`, `subtitle`, `isExact`).

#### Response `404 Not Found` (Problem Detail RFC 7807)
Returned when `eventId` is absent from the retained event buffer.
