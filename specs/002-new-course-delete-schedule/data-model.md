# Data Model: New Course Interface

## Frontend-Only Phase Scope

No backend entity, DTO, database, validation, API contract, or migration changes are included in this phase. Selected color and room are frontend-only values and are not represented in persisted data.

## Existing Backend Entity: Course

Fields used:
- `id: Long`
- `user: User`
- `name: String` (`@NotBlank`, max 128)
- `description: String` (max 1024)
- child schedules

No new course fields are implemented in this phase.

## Existing Backend Entity: Schedule

Fields used:
- `id: Long`
- `course: Course`
- `day: DayOfWeek`
- `startTime: LocalTime`
- `endTime: LocalTime`

No new schedule fields are implemented in this phase.

## Existing Backend DTOs

### CourseRequest
- `name: String` (required, max 128)
- `description: String` (optional, max 1024)
- `userId: Long` (optional)

### CourseResponse
- `id: Long`
- `name: String`
- `description: String`
- `userId: Long`

### ScheduleRequest
- `courseId: Long` (required)
- `day: DayOfWeek` (required)
- `startTime: LocalTime` (required, before `endTime`)
- `endTime: LocalTime` (required)

### ScheduleResponse
- `id: Long`
- `courseId: Long`
- `day: DayOfWeek`
- `startTime: LocalTime`
- `endTime: LocalTime`

## Frontend Types

No changes to `frontend/src/types/api.ts` are required in this phase. The existing `CourseRequest`, `CourseResponse`, `ScheduleRequest`, and `ScheduleResponse` contracts remain unchanged.

## Frontend UI Models

### TimeBlockDraft
- `weekday: DayOfWeek | ''`
- `startTime: string`
- `endTime: string`
- `room: string`
- `localId: string`
- `status: 'idle' | 'saving' | 'saved' | 'failed'`
- `savedScheduleResponse: ScheduleResponse | null`

`TimeBlockDraft` is UI-only. Each draft maps to one `ScheduleRequest`.

### NewCourseFormState
- `name: string`
- `colorId: string`
- `blocks: TimeBlockDraft[]`
- `isSaving: boolean`
- `submitError: string | null`

`colorId` and each block's `room` are component-state values only. They are not sent to the backend.

## Relationships and Rules

- A Course owns many Schedule records.
- A saved Schedule has an independent `weekday`, time range, and server-generated `id`.
- Creating a Course does not persist selected color.
- Creating a Schedule does not persist room.
- The selected Schedule ID returned by the backend is retained for each successfully saved block.
- Failed block drafts remain editable and retryable without duplicating successfully saved Schedule records.