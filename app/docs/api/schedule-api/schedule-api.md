# Nyare Schedule Service API Specification

**Version:** `1.0.0`  
**Base URL:** `/api/schedules`  
**Content-Type:** `application/json`  
**Error Format:** RFC 7807 Problem Details (`application/problem+json`)

---

## 1. Overview & Domain Architecture

Nyare is a **calendar-first academic planning assistant**. In the Nyare domain model:
- **`Schedule`** represents a recurring weekly class meeting time (`day`, `startTime`, `endTime`) associated with an academic **`Course`**.
- **Calendar Anchor Role:**
  - Schedules serve as the foundational structural anchor for the weekly calendar view, displaying recurring class blocks across Monday through Sunday.
  - Clicking on a recurring class meeting in the calendar view acts as a primary navigation conduit, enabling students to quickly jump to writing course-linked journal entries (`Note`).
- **Non-Time-Blocking Boundary (MVP Limit):**
  - Nyare is a high-level academic planning assistant, **not** an automated calendar micro-scheduler or hourly time-blocking system.
  - Schedules delineate fixed class commitments for contextual orientation, but Nyare does not micro-schedule hourly study slots or automatically manipulate calendar blocks.
- **Strict Time Integrity:**
  - Within any schedule entry, `startTime` must be strictly earlier than `endTime` (`startTime < endTime`).
  - Zero-duration (`startTime == endTime`) and inverted (`startTime > endTime`) intervals are strictly rejected with an RFC 7807 `400 Bad Request`.
- **Deferred Overlap Detection (MVP Boundary):**
  - Algorithmic conflict detection and validation across multiple overlapping schedule intervals are deferred for future iterations. Concurrent or overlapping schedules (e.g., dual lab/lecture sections) are permitted by the API in the MVP.
- **Course-Bound Relationship:**
  - Every schedule belongs to exactly one Course (`courseId`). Schedules cannot exist detached from a course.
  - Querying schedules requires a course context (`courseId`), and attempting to link a schedule to a non-existent Course returns `404 Not Found`.
- **Non-Cascading Deletion:**
  - Deleting a schedule removes only that specific recurring class meeting occurrence; it never mutates or deletes the parent Course, linked notes, or tasks.

---

## 2. Data Models & Schemas

### 2.1 DayOfWeek Enum

Standard ISO-8601 day of the week enum representation:

| Value | Description |
| :--- | :--- |
| `MONDAY` | Monday class meeting |
| `TUESDAY` | Tuesday class meeting |
| `WEDNESDAY` | Wednesday class meeting |
| `THURSDAY` | Thursday class meeting |
| `FRIDAY` | Friday class meeting |
| `SATURDAY` | Saturday class meeting |
| `SUNDAY` | Sunday class meeting |

---

### 2.2 Schedule Schema Overview

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `Long` (int64) | Read-only | Unique auto-generated identifier for the schedule. |
| `courseId` | `Long` (int64) | **Required** | The ID of the associated Course offering. Must reference an existing Course. |
| `day` | `DayOfWeek` (string) | **Required** | Recurring day of the week (`MONDAY` through `SUNDAY`). |
| `startTime` | `LocalTime` (string) | **Required** | Class start time in ISO-8601 local time format (`HH:mm:ss` or `HH:mm`, e.g., `09:00:00` or `09:00`). Must be strictly before `endTime`. |
| `endTime` | `LocalTime` (string) | **Required** | Class end time in ISO-8601 local time format (`HH:mm:ss` or `HH:mm`, e.g., `10:30:00` or `10:30`). Must be strictly after `startTime`. |

---

## 3. Error Handling (RFC 7807 Problem Details)

All client (`4xx`) and server (`5xx`) error responses conform to the **RFC 7807 Problem Details** specification using the `application/problem+json` media type.

### Problem Details Schema
```json
{
  "type": "string (URI reference)",
  "title": "string (Short summary of the error)",
  "status": "integer (HTTP status code)",
  "detail": "string (Human-readable explanation specific to this occurrence)",
  "instance": "string (URI identifying the specific request/resource)"
}
```

### 3.1 400 Bad Request Example (Validation Failure)
Returned when required request body fields are missing, blank, or invalid.

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Validation Failed",
  "status": 400,
  "detail": "courseId: Course ID is required; day: Day of week is required; startTime: Start time is required; endTime: End time is required",
  "instance": "/api/schedules"
}
```

### 3.2 400 Bad Request Example (Time Integrity Violation)
Returned when `startTime` is not strictly before `endTime`.

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Start time (11:00:00) must be strictly before end time (10:00:00)",
  "instance": "/api/schedules"
}
```

### 3.3 404 Not Found Example (Course Not Found)
Returned when referencing a course ID that does not exist in the database.

```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Course not found with ID: 99",
  "instance": "/api/schedules"
}
```

### 3.4 404 Not Found Example (Schedule Not Found)
Returned when attempting to retrieve, update, or delete a schedule ID that does not exist.

```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Schedule not found with ID: 42",
  "instance": "/api/schedules/42"
}
```

---

## 4. Endpoints Specification

### Summary Table

| Method | Path | Summary | Success Status | Error Statuses |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/schedules` | Create a new schedule | `201 Created` | `400 Bad Request`, `404 Not Found` (Course) |
| `GET` | `/api/schedules` | List schedules for a course | `200 OK` | `400 Bad Request`, `404 Not Found` (Course) |
| `GET` | `/api/schedules/{id}` | Retrieve schedule by ID | `200 OK` | `404 Not Found` |
| `PUT` | `/api/schedules/{id}` | Full update of schedule | `200 OK` | `400 Bad Request`, `404 Not Found` (Schedule or Course) |
| `DELETE` | `/api/schedules/{id}` | Delete schedule by ID | `204 No Content` | `404 Not Found` |

---

### 4.1 Create Schedule
`POST /api/schedules`

Creates a new recurring class schedule associated with a course offering.

#### Request Headers
- `Content-Type: application/json`
- `Accept: application/json`

#### Request Body (`ScheduleRequest`)
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `courseId` | `Long` | Yes | Must reference an existing Course. |
| `day` | `DayOfWeek` | Yes | One of `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`. |
| `startTime` | `LocalTime` | Yes | ISO-8601 time format (`HH:mm:ss` or `HH:mm`). Must be strictly before `endTime`. |
| `endTime` | `LocalTime` | Yes | ISO-8601 time format (`HH:mm:ss` or `HH:mm`). Must be strictly after `startTime`. |

#### Example Request
```http
POST /api/schedules HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "courseId": 101,
  "day": "MONDAY",
  "startTime": "09:00:00",
  "endTime": "10:30:00"
}
```

#### Responses
- **`201 Created`**: Schedule successfully created.
  - Headers: `Location: /api/schedules/1`
  - Body: `ScheduleResponse`

```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/schedules/1

{
  "id": 1,
  "courseId": 101,
  "day": "MONDAY",
  "startTime": "09:00:00",
  "endTime": "10:30:00"
}
```

- **`400 Bad Request`**: Validation failure or `startTime` is not strictly before `endTime`.
```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Start time (11:00:00) must be strictly before end time (10:00:00)",
  "instance": "/api/schedules"
}
```

- **`404 Not Found`**: Referenced Course does not exist.
```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Course not found with ID: 99",
  "instance": "/api/schedules"
}
```

---

### 4.2 List Schedules for a Course
`GET /api/schedules?courseId={courseId}&day={day}`

Retrieves all recurring schedules for a specific course. Results are ordered chronologically by day of week ascending (`MONDAY` through `SUNDAY`), then by `startTime` ascending. Supports optional filtering by `day`.

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `courseId` | `Long` | **Yes** | Course offering ID to filter schedules by. Returns `404 Not Found` if the course does not exist. |
| `day` | `DayOfWeek` | No | Optional day filter (`MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`). |

#### Example Request
```http
GET /api/schedules?courseId=101&day=MONDAY HTTP/1.1
Host: localhost:8080
Accept: application/json
```

#### Responses
- **`200 OK`**: List of schedules matching the criteria, ordered by `day ASC` then `startTime ASC`.
  - Body: `List<ScheduleResponse>`

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "courseId": 101,
    "day": "MONDAY",
    "startTime": "09:00:00",
    "endTime": "10:30:00"
  },
  {
    "id": 2,
    "courseId": 101,
    "day": "MONDAY",
    "startTime": "13:00:00",
    "endTime": "14:30:00"
  }
]
```

- **`400 Bad Request`**: Missing required `courseId` query parameter or invalid `day` enum value.
```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Required query parameter 'courseId' is missing",
  "instance": "/api/schedules"
}
```

- **`404 Not Found`**: Referenced Course does not exist.
```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Course not found with ID: 99",
  "instance": "/api/schedules"
}
```

---

### 4.3 Get Schedule by ID
`GET /api/schedules/{id}`

Retrieves details of a single recurring schedule by its unique ID.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Long` | Yes | Unique identifier of the schedule. |

#### Example Request
```http
GET /api/schedules/1 HTTP/1.1
Host: localhost:8080
Accept: application/json
```

#### Responses
- **`200 OK`**: Schedule found and returned.
  - Body: `ScheduleResponse`

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 1,
  "courseId": 101,
  "day": "MONDAY",
  "startTime": "09:00:00",
  "endTime": "10:30:00"
}
```

- **`404 Not Found`**: Schedule with specified ID does not exist.
```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Schedule not found with ID: 1",
  "instance": "/api/schedules/1"
}
```

---

### 4.4 Full Update of Schedule
`PUT /api/schedules/{id}`

Performs a full replacement of an existing schedule with updated meeting details.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Long` | Yes | Unique identifier of the schedule to update. |

#### Request Body (`ScheduleRequest`)
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `courseId` | `Long` | Yes | Target course offering ID. |
| `day` | `DayOfWeek` | Yes | One of `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`. |
| `startTime` | `LocalTime` | Yes | ISO-8601 time format (`HH:mm:ss` or `HH:mm`). Must be strictly before `endTime`. |
| `endTime` | `LocalTime` | Yes | ISO-8601 time format (`HH:mm:ss` or `HH:mm`). Must be strictly after `startTime`. |

#### Example Request
```http
PUT /api/schedules/1 HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "courseId": 101,
  "day": "WEDNESDAY",
  "startTime": "10:00:00",
  "endTime": "11:30:00"
}
```

#### Responses
- **`200 OK`**: Schedule successfully updated.
  - Body: `ScheduleResponse`

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 1,
  "courseId": 101,
  "day": "WEDNESDAY",
  "startTime": "10:00:00",
  "endTime": "11:30:00"
}
```

- **`400 Bad Request`**: Validation failure or `startTime` is not strictly before `endTime`.
```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Start time (11:30:00) must be strictly before end time (10:00:00)",
  "instance": "/api/schedules/1"
}
```

- **`404 Not Found`**: Schedule or target Course does not exist.
```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Schedule not found with ID: 1",
  "instance": "/api/schedules/1"
}
```

---

### 4.5 Delete Schedule
`DELETE /api/schedules/{id}`

Permanently deletes a recurring schedule by its ID.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `Long` | Yes | Unique identifier of the schedule to delete. |

#### Example Request
```http
DELETE /api/schedules/1 HTTP/1.1
Host: localhost:8080
```

#### Responses
- **`204 No Content`**: Schedule successfully deleted. No response body.
```http
HTTP/1.1 204 No Content
```

- **`404 Not Found`**: Schedule with specified ID does not exist.
```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Schedule not found with ID: 1",
  "instance": "/api/schedules/1"
}
```

---

## 5. Domain Invariants & Rules

1. **Strict Time Integrity**: `startTime` must be strictly earlier than `endTime` on the given day. Zero-duration (`startTime == endTime`) or overnight/negative intervals (`startTime > endTime`) are invalid and rejected with `400 Bad Request`.
2. **Calendar Anchor Role**: Schedules represent recurring weekly class commitments. They anchor the weekly calendar grid and provide quick navigation for journal entries (`Note`).
3. **Non-Time-Blocking Boundary**: Schedules define class meeting times, not hourly study blocks or automated time-blocking slots.
4. **Deferred Overlap Detection**: The MVP allows overlapping schedules; conflict detection across different schedules is explicitly deferred.
5. **Course Boundary**: Every schedule belongs to exactly one `Course`. Listing requires a valid `courseId` and returns `404 Not Found` if the course does not exist.
6. **Deterministic Chronological Ordering**: Schedules are ordered chronologically by day of the week (`MONDAY` through `SUNDAY`) then ascending start time.
