# Feature Specification: Course Archive

**Feature Branch**: `005-course-archive`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "in archive feture, the user a choose to archive a course. it can be accessible in manage course page with an action button. archived courses can be view from archive page. archived courses can be unarchived as well"

## Clarifications

### Session 2026-10-17

- Q: What should the student see after tapping an archived course on the Archive page? → A: Option B. Read-only notes, tasks, and events of the course.
- Q: Should the Archive page also have an "Unarchive all" button that restores every archived course in one action? → A: Option B. No permanent button. After "Archive all", the system shows an "Undo" message for a short time that reverses the whole action.

### Session 2026-10-21

- Q: Where does the student open the Archive page? → A: Archive is a menu item in the hamburger panel, like Manage Courses. The Manage Courses page has no Archive link.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Archive a Course (Priority: P1)

A student finishes a course at the end of a term. On the Manage Courses page, the student selects the archive action on that course. The course leaves the active views but the system keeps all of its data.

**Why this priority**: Archive is the core value. It clears finished courses from daily views without data loss. Delete removes data permanently, so students need a safe option.

**Independent Test**: Archive one course that has class times, notes, and open tasks. Verify that the course is gone from the calendar, the Tasks view, the Notes view, the course picker, and the Manage Courses list. Verify that no data of the course is deleted.

**Acceptance Scenarios**:

1. **Given** an active course on the Manage Courses page, **When** the student selects the archive action and confirms, **Then** the course leaves the Manage Courses list.
2. **Given** an archived course, **When** the student opens the calendar, **Then** the calendar shows no class times, events, or tasks of that course.
3. **Given** an archived course, **When** the student opens the Tasks view or the Notes view, **Then** those views show no items of that course.
4. **Given** an archived course, **When** the student creates a new note, **Then** the course picker does not offer the archived course.
5. **Given** the archive confirmation, **When** the student cancels, **Then** the course stays active and unchanged.

---

### User Story 2 - View Archived Courses (Priority: P1)

A student opens the Archive page to see the courses that the student archived before.

**Why this priority**: Without a place to see archived courses, the student cannot trust that archive keeps data, and cannot unarchive.

**Independent Test**: Archive two courses. Open the Archive page from the Archive menu item in the hamburger panel. Verify that both courses appear with name, color, and archive date.

**Acceptance Scenarios**:

1. **Given** archived courses, **When** the student selects the Archive menu item in the hamburger panel, **Then** the Archive page opens and lists all archived courses of that student.
2. **Given** the Archive page, **When** it lists a course, **Then** the course shows its name, its color, and the date of archive.
3. **Given** no archived courses, **When** the Archive page opens, **Then** the page shows an empty state that explains how to archive a course.
4. **Given** the Archive page, **When** the student selects an archived course, **Then** the system shows the class times, notes, tasks, and events of that course in read-only form.
5. **Given** the read-only view of an archived course, **When** the student opens a note or a task, **Then** the system shows the full content and offers no edit, status change, or delete control.
6. **Given** the read-only view of an archived course, **When** the student looks at the page, **Then** the page shows an unarchive action so that the student can edit again.

---

### User Story 3 - Unarchive a Course (Priority: P1)

A student archived a course by mistake, or takes the course again. On the Archive page, the student selects the unarchive action. The course returns to all active views with its data.

**Why this priority**: Unarchive makes archive reversible and safe. Without it, archive is the same as hidden data loss.

**Independent Test**: Unarchive one archived course. Verify that the course, its class times, its notes, and its open tasks appear again in the calendar, Tasks, Notes, and Manage Courses views.

**Acceptance Scenarios**:

1. **Given** an archived course, **When** the student selects unarchive, **Then** the course leaves the Archive page and appears on the Manage Courses page.
2. **Given** an unarchived course, **When** the student opens the calendar, **Then** the calendar shows its class times, events, and scheduled tasks again.
3. **Given** an unarchived course, **When** the student opens a task of that course, **Then** the task has the same status, scheduled date, and duration as before archive.

---

### User Story 4 - Archive All Active Courses at Once (Priority: P2)

A student finishes a term. On the Manage Courses page, the student selects "Archive all". The system archives every active course in one action.

**Why this priority**: At the end of a term, a student archives all courses together. One action saves many repeated taps.

**Independent Test**: Sign in with an account that has four active courses. Select "Archive all" on the Manage Courses page and confirm. Verify that all four courses appear on the Archive page with the same archive date, and that the Manage Courses list is empty.

**Acceptance Scenarios**:

1. **Given** two or more active courses, **When** the student selects "Archive all", **Then** a confirmation dialog states the number of courses that the system will archive.
2. **Given** the confirmation dialog, **When** the student confirms, **Then** the system archives every active course and the Manage Courses page shows its empty state.
3. **Given** the confirmation dialog, **When** the student cancels, **Then** all courses stay active.
4. **Given** no active courses, **When** the Manage Courses page opens, **Then** the page does not offer "Archive all".
5. **Given** a bulk archive that fails, **When** the system receives the error, **Then** all courses stay active and the system shows an error message.
6. **Given** a bulk archive that succeeds, **When** the system finishes, **Then** the system shows an "Undo" message for 8 seconds.
7. **Given** the "Undo" message, **When** the student selects "Undo", **Then** the system unarchives exactly the courses that the bulk archive archived, and the Manage Courses page lists them again.
8. **Given** the "Undo" message, **When** 8 seconds pass or the student leaves the page, **Then** the message closes and the courses stay archived.

---

### User Story 5 - Delete an Archived Course (Priority: P3)

A student no longer needs an archived course. The student deletes it from the Archive page.

**Why this priority**: This is a cleanup action. Students can also unarchive and then delete from the Manage Courses page.

**Independent Test**: Delete one archived course from the Archive page, confirm the warning, and verify that the course is gone from the Archive page.

**Acceptance Scenarios**:

1. **Given** an archived course, **When** the student selects delete, **Then** a confirmation dialog states that all notes, tasks, events, and class times of the course will also be deleted.
2. **Given** the confirmation dialog, **When** the student confirms, **Then** the system deletes the course and all of its records.

---

### Edge Cases

- What happens when the student archives a course with notes that are not yet processed? The planner skips those notes while the course is archived. After unarchive, the planner processes them on the next run if they are still inside the 14-day horizon.
- What happens when the student archives a course with open tasks? The system keeps the tasks with their status, scheduled date, and duration. The tasks do not appear in active views.
- What happens when the student archives a course with upcoming events? The planner does not generate preparation tasks for those events while the course is archived.
- What happens when the student archives every course? The calendar shows no classes. The Manage Courses page shows an empty state with a link to add a course. The Archive menu item stays available in the hamburger panel.
- What happens when the student opens a direct link to a note or task of an archived course? The system shows the item in read-only form with a label that the course is archived.
- What happens when the student wants to restore many archived courses after the "Undo" message closes? The student unarchives each course on the Archive page. The system offers no "Unarchive all" action.
- What happens when "Undo" fails? The courses stay archived and the system shows an error message. The student can unarchive each course on the Archive page.
- What happens when an archive or unarchive request fails? The course stays in its previous state and the system shows an error message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Manage Courses page MUST show an archive action on each active course.
- **FR-002**: The system MUST ask the student to confirm before it archives a course.
- **FR-003**: Archive MUST NOT delete or change any notes, tasks, events, class times, or context facts of the course.
- **FR-004**: The system MUST hide archived courses and all of their items from the calendar, the Tasks view, the Notes view, the course picker, and the Manage Courses list.
- **FR-005**: The planner MUST NOT process notes of archived courses and MUST NOT schedule or generate tasks for archived courses.
- **FR-006**: The hamburger panel MUST contain an Archive menu item next to the Manage Courses menu item. The Archive menu item MUST open the Archive page.
- **FR-007**: The Archive page MUST list all archived courses of the signed-in student with name, color, and archive date.
- **FR-008**: The Archive page MUST show an unarchive action on each archived course.
- **FR-009**: Unarchive MUST return the course and all of its items to the active views with no data change.
- **FR-010**: The Archive page MUST show a delete action on each archived course, with a confirmation step that states the cascade.
- **FR-011**: The system MUST keep the archive state across sessions and devices.
- **FR-012**: Every interactive control on the Archive page MUST have a touch target of at least 44 by 44 pixels.
- **FR-013**: The Manage Courses page MUST show an "Archive all" action when one or more active courses exist.
- **FR-014**: "Archive all" MUST ask for confirmation and MUST state the number of courses that it archives.
- **FR-015**: "Archive all" MUST archive all active courses of the signed-in student as one operation. If the operation fails, no course changes state.
- **FR-016**: All courses that one "Archive all" operation archives MUST have the same archive date.
- **FR-017**: The Archive page MUST let the student open an archived course and view its class times, notes, tasks, and events in read-only form.
- **FR-018**: The system MUST reject any create, edit, status change, or delete of notes, tasks, events, or class times of an archived course. Course delete from the Archive page stays allowed (FR-010).
- **FR-019**: After a successful "Archive all", the system MUST show an "Undo" message for 8 seconds. "Undo" MUST unarchive exactly the courses of that operation as one operation.
- **FR-020**: The Archive page MUST NOT offer an "Unarchive all" action.

### Key Entities

- **Course**: An academic subject that the student takes. New attributes: archive state (active or archived) and archive date. Parent of class times, notes, tasks, events, and context facts.
- **Archived Course**: A course in the archived state. The system keeps all child records. Active views and the planner ignore it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can archive a course in 3 taps or fewer from the Manage Courses page.
- **SC-002**: A student can unarchive a course in 3 taps or fewer from the hamburger panel.
- **SC-003**: 100% of notes, tasks, events, and class times of a course are present after an archive and unarchive cycle.
- **SC-004**: 0 items of archived courses appear in the calendar, Tasks view, Notes view, or course picker.
- **SC-005**: 0 planner runs create or reschedule tasks for archived courses.
- **SC-006**: A student can archive all active courses in 2 taps or fewer from the Manage Courses page.

## Assumptions

- This feature depends on the Manage Courses page (`specs/004-manage-courses-page`).
- The student archives one course at a time, or all active courses at once. Term grouping and archive of a selected subset are out of scope.
- The student opens the Archive page from the Archive menu item in the hamburger panel, like the Manage Courses menu item. The bottom navigation bar does not change.
- Only the owner of a course can archive, unarchive, or delete it.
- Archive keeps task status, scheduled date, and duration unchanged. The planner may reschedule tasks on the first run after unarchive under normal planner rules.
- The constitution states that course deletion cascades. Archive adds a non-destructive state and needs a constitution amendment under Principle II and the Frontend Data Flow section.
