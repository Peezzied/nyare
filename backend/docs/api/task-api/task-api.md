# Nyare Task Management Service API Specification

**Version:** `1.0.0`  
**Base URL:** `/api/tasks`  
**Content-Type:** `application/json`  
**Error Format:** RFC 7807 Problem Details (`application/problem+json`)

---

## 1. Overview & Domain Architecture

Nyare is a calendar-first academic planning assistant. In the Nyare domain model:
- **`Task`** represents an actionable study item or student to-do item associated with an academic **`Course`**.
- Tasks may optionally link back to a **`Note`** (course-linked journal entry) from which they were extracted by AI processing or manual student notes.
- **`scheduledDate`** is a flexible target study date (unlike rigid `AcademicEvent` deadlines).
- **`duration`** represents the estimated completion time formatted as an ISO-8601 duration (e.g., `PT1H30M`, `PT45M`).
- Tasks exist in three distinct planning states in the UI:
  - **Scheduled:** Tasks with a populated `scheduledDate`.
  - **Later / Flexible:** Tasks without a `scheduledDate` (i.e. `scheduledDate` is `null`).
  - **Needs Context:** Tasks requiring more details from journal notes or student input.

---

## 2. Data Models & Enums

### 2.1 TaskStatus Enum

| Value | Description |
| :--- | :--- |
| `TODO` | Task is pending and has not been started. |
| `IN_PROGRESS` | Task is currently being worked on. |
| `COMPLETED` | Task has been finished. |

---

### 2.2 Task Schema Overview

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` (string) | Read-only | Unique identifier for the task (UUID v4). |
| `courseId` | `Long` (int64) | **Required** | The ID of the associated Course offering. |
| `noteId` | `UUID` (string) | Optional | The ID of the originating Note (if extracted or linked). |
| `title` | `String` | **Required** | Actionable title of the task (1–255 characters). |
| `description` | `String` | Optional | Detailed instructions or notes (max 2048 characters). |
| `scheduledDate` | `LocalDate` (string) | Optional | Flexible target study date in ISO-8601 format (`YYYY-MM-DD`). |
| `duration` | `Duration` (string) | Optional | Estimated duration in ISO-8601 duration format (e.g., `PT1H30M`). |
| `status` | `TaskStatus` (string) | **Required**\* | Lifecycle status (`TODO`, `IN_PROGRESS`, `COMPLETED`). Defaults to `TODO` on creation if omitted. |
| `createdAt` | `Instant` (string) | Read-only | UTC timestamp of task creation (`YYYY-MM-DDTHH:mm:ssZ`). |
| `updatedAt` | `Instant` (string) | Read-only | UTC timestamp of the last update (`YYYY-MM-DDTHH:mm:ssZ`). |

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
```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "https://api.nyare.app/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed: 'title' must not be blank; 'courseId' is required",
  "instance": "/api/tasks"
}
```

### 3.2 404 Not Found Example
```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "https://api.nyare.app/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Task with ID '123e4567-e89b-12d3-a456-426614174000' not found",
  "instance": "/api/tasks/123e4567-e89b-12d3-a456-426614174000"
}
```

---

## 4. Endpoints Specification

### Summary Table

| Method | Path | Summary | Success Status | Error Statuses |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/tasks` | Create a new task | `201 Created` | `400 Bad Request` |
| `GET` | `/api/tasks` | List tasks with filters | `200 OK` | `400 Bad Request` |
| `GET` | `/api/tasks/{id}` | Retrieve task by UUID | `200 OK` | `404 Not Found` |
| `PUT` | `/api/tasks/{id}` | Full update of task | `200 OK` | `400 Bad Request`, `404 Not Found` |
| `PATCH` | `/api/tasks/{id}/status` | Update task status only | `200 OK` | `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/tasks/{id}` | Delete task | `204 No Content` | `404 Not Found` |

---

### 4.1 Create Task
`POST /api/tasks`

Creates a new study or academic task linked to a course.

#### Request Headers
- `Content-Type: application/json`
- `Accept: application/json`

#### Request Body (`TaskRequest`)
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `courseId` | `Long` | Yes | Must reference an existing Course. |
| `noteId` | `UUID` | No | Optional reference to a source Note. |
| `title` | `String` | Yes | 1 to 255 characters, non-blank. |
| `description` | `String` | No | Max 2048 characters. |
| `scheduledDate` | `LocalDate` | No | Format `YYYY-MM-DD`. |
| `duration` | `String` | No | ISO-8601 duration (e.g. `PT1H30M`, `PT45M`). |
| `status` | `TaskStatus` | No | Default: `TODO`. Values: `TODO`, `IN_PROGRESS`, `COMPLETED`. |

#### Example Request
```http
POST /api/tasks HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "courseId": 101,
  "noteId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "title": "Complete Chapter 4 Problem Set",
  "description": "Solve exercises 4.1 through 4.15 on linear regression.",
  "scheduledDate": "2026-09-18",
  "duration": "PT1H30M",
  "status": "TODO"
}
```

#### Responses
- **`201 Created`**: Task successfully created.
  - Headers: `Location: /api/tasks/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`
  - Body: `TaskResponse`

```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/tasks/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d

{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "courseId": 101,
  "noteId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "title": "Complete Chapter 4 Problem Set",
  "description": "Solve exercises 4.1 through 4.15 on linear regression.",
  "scheduledDate": "2026-09-18",
  "duration": "PT1H30M",
  "status": "TODO",
  "createdAt": "2026-09-13T10:15:30Z",
  "updatedAt": null
}
```

- **`400 Bad Request`**: Malformed payload or validation error.
```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "https://api.nyare.app/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Course ID is required and title must not be blank",
  "instance": "/api/tasks"
}
```

---

### 4.2 List Tasks
`GET /api/tasks`

Retrieves a list of tasks. Supports optional filtering by course, status, or scheduling state.

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `courseId` | `Long` | No | Filter tasks belonging to a specific course ID. |
| `status` | `String` | No | Filter by status (`TODO`, `IN_PROGRESS`, `COMPLETED`). |
| `scheduled` | `Boolean` | No | `true` for tasks with a `scheduledDate` != null; `false` for tasks where `scheduledDate` is null (flexible / later). |

#### Example Request
```http
GET /api/tasks?courseId=101&status=TODO&scheduled=true HTTP/1.1
Host: localhost:8080
Accept: application/json
```

#### Responses
- **`200 OK`**: Array of tasks matching the specified criteria.
```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "courseId": 101,
    "noteId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "title": "Complete Chapter 4 Problem Set",
    "description": "Solve exercises 4.1 through 4.15 on linear regression.",
    "scheduledDate": "2026-09-18",
    "duration": "PT1H30M",
    "status": "TODO",
    "createdAt": "2026-09-13T10:15:30Z",
    "updatedAt": null
  },
  {
    "id": "7c2eeb4a-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
    "courseId": 101,
    "noteId": null,
    "title": "Review Lecture Slides on Matrix Inversion",
    "description": null,
    "scheduledDate": "2026-09-19",
    "duration": "PT45M",
    "status": "TODO",
    "createdAt": "2026-09-13T11:00:00Z",
    "updatedAt": null
  }
]
```

- **`400 Bad Request`**: Invalid query parameter value (e.g. invalid status enum value or ill-formatted boolean).
```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "https://api.nyare.app/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid status parameter 'INVALID_STATUS'. Allowed values: TODO, IN_PROGRESS, COMPLETED",
  "instance": "/api/tasks"
}
```

---

### 4.3 Get Task by ID
`GET /api/tasks/{id}`

Retrieves details of a single task by its unique UUID.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Yes | The UUID of the task. |

#### Example Request
```http
GET /api/tasks/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d HTTP/1.1
Host: localhost:8080
Accept: application/json
```

#### Responses
- **`200 OK`**: Task found and returned.
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "courseId": 101,
  "noteId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "title": "Complete Chapter 4 Problem Set",
  "description": "Solve exercises 4.1 through 4.15 on linear regression.",
  "scheduledDate": "2026-09-18",
  "duration": "PT1H30M",
  "status": "TODO",
  "createdAt": "2026-09-13T10:15:30Z",
  "updatedAt": null
}
```

- **`404 Not Found`**: Task with specified ID does not exist.
```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "https://api.nyare.app/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Task with ID '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' not found",
  "instance": "/api/tasks/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

---

### 4.4 Full Update of Task
`PUT /api/tasks/{id}`

Performs a full replacement of task details.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Yes | The UUID of the task to update. |

#### Request Body (`TaskRequest`)
```json
{
  "courseId": 101,
  "noteId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "title": "Complete Chapter 4 & 5 Problem Sets",
  "description": "Solve exercises 4.1 to 5.10 with verified solutions.",
  "scheduledDate": "2026-09-20",
  "duration": "PT2H",
  "status": "IN_PROGRESS"
}
```

#### Example Request
```http
PUT /api/tasks/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "courseId": 101,
  "noteId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "title": "Complete Chapter 4 & 5 Problem Sets",
  "description": "Solve exercises 4.1 to 5.10 with verified solutions.",
  "scheduledDate": "2026-09-20",
  "duration": "PT2H",
  "status": "IN_PROGRESS"
}
```

#### Responses
- **`200 OK`**: Task successfully updated.
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "courseId": 101,
  "noteId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "title": "Complete Chapter 4 & 5 Problem Sets",
  "description": "Solve exercises 4.1 to 5.10 with verified solutions.",
  "scheduledDate": "2026-09-20",
  "duration": "PT2H",
  "status": "IN_PROGRESS",
  "createdAt": "2026-09-13T10:15:30Z",
  "updatedAt": "2026-09-13T14:30:00Z"
}
```

- **`400 Bad Request`**: Validation failure in payload.
```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "https://api.nyare.app/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Title cannot be blank and must be under 255 characters",
  "instance": "/api/tasks/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

- **`404 Not Found`**: Task with specified ID does not exist.
```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "https://api.nyare.app/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Task with ID '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' not found",
  "instance": "/api/tasks/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

---

### 4.5 Update Task Status Only
`PATCH /api/tasks/{id}/status`

Updates only the lifecycle status of a task without modifying other fields.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Yes | The UUID of the task. |

#### Request Body (`TaskStatusRequest`)
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `status` | `TaskStatus` | Yes | One of `TODO`, `IN_PROGRESS`, `COMPLETED`. |

#### Example Request
```http
PATCH /api/tasks/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/status HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

#### Responses
- **`200 OK`**: Status successfully updated.
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "courseId": 101,
  "noteId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "title": "Complete Chapter 4 & 5 Problem Sets",
  "description": "Solve exercises 4.1 to 5.10 with verified solutions.",
  "scheduledDate": "2026-09-20",
  "duration": "PT2H",
  "status": "COMPLETED",
  "createdAt": "2026-09-13T10:15:30Z",
  "updatedAt": "2026-09-13T16:45:00Z"
}
```

- **`400 Bad Request`**: Missing or invalid status value.
```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "https://api.nyare.app/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid status: 'DONE'. Allowed values are TODO, IN_PROGRESS, COMPLETED",
  "instance": "/api/tasks/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/status"
}
```

- **`404 Not Found`**: Task with specified ID does not exist.
```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "https://api.nyare.app/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Task with ID '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' not found",
  "instance": "/api/tasks/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/status"
}
```

---

### 4.6 Delete Task
`DELETE /api/tasks/{id}`

Permanently deletes a task by its UUID.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Yes | The UUID of the task to delete. |

#### Example Request
```http
DELETE /api/tasks/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d HTTP/1.1
Host: localhost:8080
```

#### Responses
- **`204 No Content`**: Task successfully deleted. No response body.
```http
HTTP/1.1 204 No Content
```

- **`404 Not Found`**: Task with specified ID does not exist.
```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "https://api.nyare.app/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Task with ID '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' not found",
  "instance": "/api/tasks/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```
