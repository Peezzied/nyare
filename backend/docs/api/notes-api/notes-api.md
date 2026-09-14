# Nyare Notes Management Service API Specification

**Version:** `1.0.0`  
**Base URL:** `/api/notes`  
**Content-Type:** `application/json`  
**Error Format:** RFC 7807 Problem Details (`application/problem+json`)

---

## 1. Overview & Domain Architecture

Nyare is a calendar-first academic planning assistant. In the Nyare domain model:
- **`Note`** represents a student's course-linked journal entry and serves as the immutable source of truth for study context, progress, and AI extraction.
- **Course Anchor:** Every note belongs to exactly one **`Course`** offering. Notes cannot exist detached from a course.
- **Structured Content (`NoteContent`):**
  - **`markdown`**: Rich note text formatted as Markdown. Embedded images use Markdown Reference-Style links (e.g., `![System Diagram][fig-1]`).
  - **`imageMetadata`**: Map of image descriptors keyed by the reference label used in the markdown body (e.g., `"fig-1"`). Contains base64 image data and AI-extracted descriptive summaries.
- **Validation Invariant (`@ValidImageReferences`):**
  - All reference labels present in the markdown body must match keys in `imageMetadata` bijectively.
  - Dangling markdown image tags (missing metadata) and orphaned metadata keys (unreferenced images) are rejected with an RFC 7807 validation error.
- **AI Modification Boundary:**
  - Students author and update the complete note (markdown body + attachments).
  - The AI planning pipeline is strictly restricted to updating the `imageMetadata` map (via `PATCH /api/notes/{id}/image-metadata`) to attach OCR text or visual descriptions without modifying student-authored text.
- **Non-Cascading Lifecycle:**
  - Deleting a note never cascades to derived `Task`, `AcademicEvent`, or `AcademicContext` records. Dependent records retain orphaned references to maintain planning history.

---

## 2. Data Models & Schemas

### 2.1 Note Schema Overview

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` (string) | Read-only | Unique identifier for the note (UUID v4). |
| `courseId` | `Long` (int64) | **Required** | The ID of the associated Course offering. |
| `content` | `NoteContent` (object) | **Required** | Structured note content (markdown + image metadata). |
| `createdAt` | `Instant` (string) | Read-only | UTC timestamp of note creation (`YYYY-MM-DDTHH:mm:ssZ`). |
| `updatedAt` | `Instant` (string) | Read-only | UTC timestamp of the last modification (`YYYY-MM-DDTHH:mm:ssZ`). |

---

### 2.2 NoteContent Object

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `markdown` | `String` | **Required** | Markdown text body. Must not be blank. Image references use `![alt][ref-label]` syntax. |
| `imageMetadata` | `Map<String, ImageMetadata>` | **Required** | Map where each key matches an image reference label defined in `markdown`. Defaults to empty map `{}` if no images are attached. |

---

### 2.3 ImageMetadata Object

| Field | Type | Required | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `base64` | `String` | **Required** | Base64-encoded image data or data URI scheme (`data:image/png;base64,...`). |
| `description` | `String` | Optional | Visual context, OCR extraction, or AI-generated summary of the image. |

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

### 3.1 400 Bad Request Example (Reference Mismatch)
```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Validation Failed",
  "status": 400,
  "detail": "content.imageMetadata: Image reference 'fig-2' in markdown does not have corresponding entry in imageMetadata",
  "instance": "/api/notes"
}
```

### 3.2 400 Bad Request Example (Missing Required Fields)
```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Validation Failed",
  "status": 400,
  "detail": "courseId: Course ID is required; content: Note content is required",
  "instance": "/api/notes"
}
```

### 3.3 404 Not Found Example
```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "about:blank",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Note not found: 123e4567-e89b-12d3-a456-426614174000",
  "instance": "/api/notes/123e4567-e89b-12d3-a456-426614174000"
}
```

---

## 4. Endpoints Specification

### Summary Table

| Method | Path | Summary | Success Status | Error Statuses |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/notes` | Create a new journal note | `201 Created` | `400 Bad Request`, `404 Not Found` |
| `GET` | `/api/notes` | List notes for a course | `200 OK` | `400 Bad Request`, `404 Not Found` |
| `GET` | `/api/notes/{id}` | Retrieve note by UUID | `200 OK` | `404 Not Found` |
| `PUT` | `/api/notes/{id}` | Full update of note | `200 OK` | `400 Bad Request`, `404 Not Found` |
| `PATCH` | `/api/notes/{id}/image-metadata` | AI update of image metadata | `200 OK` | `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/notes/{id}` | Delete note | `204 No Content` | `404 Not Found` |

---

### 4.1 Create Note
`POST /api/notes`

Creates a new journal entry linked to a course.

#### Request Headers
- `Content-Type: application/json`
- `Accept: application/json`

#### Request Body (`NoteRequest`)
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `courseId` | `Long` | Yes | Must reference an existing Course. |
| `content` | `NoteContent` | Yes | Validated by `@ValidImageReferences`. |

#### Example Request
```http
POST /api/notes HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "courseId": 101,
  "content": {
    "markdown": "# Lecture 4: Binary Search Trees\n\nToday we covered self-balancing trees.\n\n![AVL Tree Rotation][fig-avl]\n\nComplexity is guaranteed O(log n).",
    "imageMetadata": {
      "fig-avl": {
        "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "description": null
      }
    }
  }
}
```

#### Responses

##### `201 Created`
Header: `Location: /api/notes/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`

```json
{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "courseId": 101,
  "content": {
    "markdown": "# Lecture 4: Binary Search Trees\n\nToday we covered self-balancing trees.\n\n![AVL Tree Rotation][fig-avl]\n\nComplexity is guaranteed O(log n).",
    "imageMetadata": {
      "fig-avl": {
        "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "description": null
      }
    }
  },
  "createdAt": "2026-09-14T10:15:30Z",
  "updatedAt": "2026-09-14T10:15:30Z"
}
```

##### `400 Bad Request`
Validation failed (e.g. courseId is null, markdown is blank, or image references mismatch).

##### `404 Not Found`
Specified `courseId` does not exist.

---

### 4.2 List Notes by Course
`GET /api/notes?courseId={courseId}`

Retrieves all notes for a specific course ordered chronologically newest first (`createdAt DESC`).

#### Request Parameters
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `courseId` | `query` | `Long` | Yes | Course offering ID to filter by. |

#### Example Request
```http
GET /api/notes?courseId=101 HTTP/1.1
Host: localhost:8080
Accept: application/json
```

#### Responses

##### `200 OK`
```json
[
  {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "courseId": 101,
    "content": {
      "markdown": "# Lecture 4: Binary Search Trees\n\n![AVL Tree Rotation][fig-avl]",
      "imageMetadata": {
        "fig-avl": {
          "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "description": "Diagram demonstrating single right rotation in an AVL tree."
        }
      }
    },
    "createdAt": "2026-09-14T10:15:30Z",
    "updatedAt": "2026-09-14T10:20:00Z"
  },
  {
    "id": "2d8ceb3a-8f7b-4a5e-9e1c-7a9b0c1d2e3f",
    "courseId": 101,
    "content": {
      "markdown": "# Lecture 3: Intro to Trees\n\nBasic definitions of root, height, and depth.",
      "imageMetadata": {}
    },
    "createdAt": "2026-09-12T09:00:00Z",
    "updatedAt": "2026-09-12T09:00:00Z"
  }
]
```

##### `400 Bad Request`
Missing required `courseId` query parameter.

##### `404 Not Found`
Specified `courseId` does not exist.

---

### 4.3 Retrieve Note by ID
`GET /api/notes/{id}`

Retrieves a single note by its UUID.

#### Path Parameters
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `path` | `UUID` | Yes | Unique identifier of the note. |

#### Example Request
```http
GET /api/notes/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d HTTP/1.1
Host: localhost:8080
Accept: application/json
```

#### Responses

##### `200 OK`
```json
{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "courseId": 101,
  "content": {
    "markdown": "# Lecture 4: Binary Search Trees\n\n![AVL Tree Rotation][fig-avl]",
    "imageMetadata": {
      "fig-avl": {
        "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "description": "Diagram demonstrating single right rotation in an AVL tree."
      }
    }
  },
  "createdAt": "2026-09-14T10:15:30Z",
  "updatedAt": "2026-09-14T10:20:00Z"
}
```

##### `404 Not Found`
Note with specified ID does not exist.

---

### 4.4 Full Update of Note
`PUT /api/notes/{id}`

Replaces the full content and/or course association of an existing note. Used by the student when editing journal text or adding/removing attached images.

#### Path Parameters
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `path` | `UUID` | Yes | Unique identifier of the note. |

#### Request Body (`NoteRequest`)
```json
{
  "courseId": 101,
  "content": {
    "markdown": "# Lecture 4: Binary Search Trees (Updated)\n\nAdded notes on Red-Black Trees.",
    "imageMetadata": {}
  }
}
```

#### Responses

##### `200 OK`
Returns the updated `NoteResponse`.

##### `400 Bad Request`
Validation failed on the replacement content.

##### `404 Not Found`
Note or target Course does not exist.

---

### 4.5 AI Image Metadata Update
`PATCH /api/notes/{id}/image-metadata`

Targeted patch endpoint used by AI analysis pipelines. Updates image descriptions and OCR annotations without mutating student-authored markdown text.

#### Path Parameters
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `path` | `UUID` | Yes | Unique identifier of the note. |

#### Request Body (`ImageMetadataUpdateRequest`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `imageMetadata` | `Map<String, ImageMetadata>` | Yes | Map of updated image metadata. Keys must match existing markdown reference labels in the note. |

#### Example Request
```http
PATCH /api/notes/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/image-metadata HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "imageMetadata": {
    "fig-avl": {
      "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "description": "Visual diagram depicting AVL tree right rotation to restore balance factor."
    }
  }
}
```

#### Responses

##### `200 OK`
Returns the updated `NoteResponse` with updated `imageMetadata` and refreshed `updatedAt` timestamp.

##### `400 Bad Request`
Incoming metadata keys do not match existing image reference labels in the note's markdown.

##### `404 Not Found`
Note does not exist.

---

### 4.6 Delete Note
`DELETE /api/notes/{id}`

Deletes a journal note. Does not cascade-delete downstream tasks or academic events.

#### Path Parameters
| Parameter | In | Type | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `path` | `UUID` | Yes | Unique identifier of the note. |

#### Example Request
```http
DELETE /api/notes/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d HTTP/1.1
Host: localhost:8080
```

#### Responses

##### `204 No Content`
Note successfully deleted.

##### `404 Not Found`
Note does not exist.
