# Data Model: Note Editor View

**Branch**: `002-note-editor-view` | **Feature**: Note Editor View

## 1. Client-Side Note Form State

```typescript
interface NoteFormState {
  id?: string                    // UUID, present in edit mode, absent in create mode
  courseId: number | null        // Mandatory anchor before saving or typing
  title: string                  // Defaults to "Untitled Note", editable
  contentMarkdown: string        // Raw Markdown string persisted to backend
  entryDate: string              // YYYY-MM-DD, defaults to today, max 14 days back
  isDirty: boolean               // Tracks unsaved changes for back navigation warning
  isSaving: boolean              // Guard against double submission
  errorMessage: string | null    // Top-level or field-specific validation notice
}
```

## 2. API Contract Alignments

### `NoteRequest` Payload
```typescript
interface NoteRequest {
  courseId: number               // @NotNull, must exist in DB
  title?: string | null          // @Size(max = 255), defaults to fallback title if empty
  content: string                // @NotBlank Markdown text
  entryDate?: string | null      // @PastOrPresent, max 14 days back
}
```

### `NoteResponse` Payload
```typescript
interface NoteResponse {
  id: string                     // UUID
  courseId: number               // Parent course ID
  title: string                  // Note title
  content: string                // Markdown content
  entryDate: string              // YYYY-MM-DD
  createdAt: string              // ISO-8601
  updatedAt: string              // ISO-8601
  lastProcessedAt?: string | null // ISO-8601
}
```

## 3. Validation Rules

1. **Course Selection**:
   - `courseId` must not be null.
   - Editor content is locked (`editable = false`) when `courseId` is null.
   - Save button is disabled when `courseId` is null.

2. **Entry Date Constraints**:
   - `entryDate <= today`.
   - `entryDate >= today - 14 days`.
   - Future dates are prevented in the date picker.

3. **Content & Image Validation**:
   - `content` must not be blank after trimming.
   - Embedded image URLs matching pattern `/api/images/([0-9a-fA-F-]{36})` must be valid UUIDs matching images in the repository.
   - If unverified/deleted images are detected, prevent save and notify user.

4. **Title**:
   - A blank or omitted `title` stores "Untitled Note". It stays until the user or the AI (Process) edits it.
   - No derived fallback: no first-line title is stored or displayed.

## 4. UI State Transitions

```
[New Note Initial] 
    │ (courseId == null)
    ▼
[Editor Locked State] ──(Select Course)──► [Editor Unlocked & Focused]
                                                   │
                                                   ├──(Type / Format)──► [Dirty State]
                                                   ├──(Upload Image)────► [Uploading State] ──► [Dirty State]
                                                   │
                                                   └──(Click Save)──────► [Saving State] 
                                                                               │
                                                                   ┌───────────┴───────────┐
                                                                   ▼                       ▼
                                                              [Success]                [Error]
                                                              (Navigate back)     (Show error banner)
```
