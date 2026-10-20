# Data Model: Manage Courses Page

No new tables and no new columns.

## Backend

| Entity | Change |
|--------|--------|
| Course | `name` and `description` become updatable through `PUT /api/courses/{id}`. Ownership and id never change. |
| Schedule | None. Existing `PUT /api/schedules/{id}` is used. |

Validation (existing `CourseRequest`): `name` not blank and at most 128 characters. `description` at most 1024 characters.

## Frontend (client-only)

| Type | Source | Use |
|------|--------|-----|
| `CourseEditor` | `useCourseEditor.ts` | Drawer state. `persistedId` holds the backend course id. Blank editor means add. |
| `DraftCourse` | `useCourseDrafts.ts` | Input to `createCourseEditor()` and `loadDraftIntoEditor()`. Built from a catalog course and its schedules. |
| `ScheduleDiff` | new, `utils/scheduleDiff.ts` | `{ keep, update: [{ id, next }], create, remove: id[] }`. |

Mapping: catalog course + its schedules -> `DraftCourse { tempId: 'course-<id>', name, colorId (stored slug or derived), schedules, courseId }`. The editor groups days with equal times into one block.

## State rules

- `useCatalog` stays the only cache. Apply every response locally.
- Edit never calls `flush()` and never deletes a course to rename it.
- Color is `getCourseColor(course.id)`. It is not stored.
