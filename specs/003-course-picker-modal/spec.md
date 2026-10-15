# Feature Specification: Course Picker Modal in Note Editor

**Feature Branch**: `003-course-picker-modal`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "when the course input field in the noteeditor, it should show like this in the image. basically, it shows a modal with options of courses with colors, title, and schedule (like Mo, We, Th). the option must suffice [course color, dot] [title] [schedule]"

## Clarifications

### Session 2026-10-13

- Q: What fields are required before enabling the Save action in NoteEditor? → A: Both Course (`selectedCourseId`) and Entry Date (`entryDate`), in addition to non-empty note content. The Save action remains disabled until a course and entry date are selected.

## User Scenarios & Testing

### User Story 1 - Select Course via Modal Dialog (Priority: P1)

Students creating or editing a journal note in NoteEditor need to tap the Course input field to open a focused modal dialog that displays available enrolled courses with distinct visual dots, full course titles, and schedule days. Selecting an option immediately links the note to that course and closes the modal.

**Why this priority**: Associating a note with a course is a required domain invariant. Selecting a course with visual schedule and color confirmation eliminates ambiguity when students choose their course.

**Independent Test**: Can be tested by opening NoteEditor, tapping the Course selector trigger, verifying the modal dialog opens, tapping a course item, and verifying the course pill updates with the selected course name and palette color while the modal dismisses.

**Acceptance Scenarios**:

1. **Given** the NoteEditor view, **When** the student taps the Course input/trigger, **Then** a modal dialog opens centered or as a bottom sheet with a darkened overlay scrim.
2. **Given** the open course picker modal, **When** viewing each course option, **Then** each item displays:
   - A circular color dot matching the course catalog color palette.
   - The course title/name in legible typography.
   - The weekly schedule summary (e.g., "Mo, We, Th" or "Tue, Thu") formatted on a secondary line below the title.
3. **Given** a course without scheduled class times, **When** viewing that course option in the modal, **Then** the secondary line displays a clear placeholder such as "No set schedule" or "Online / Asynchronous".
4. **Given** the open course picker modal, **When** the student taps an option, **Then** the modal closes, the course input in NoteEditor updates to reflect the chosen course, and unsaved changes tracking marks the note as modified.
5. **Given** the open course picker modal, **When** the student taps the backdrop scrim or presses the Escape key, **Then** the modal closes without altering the previously selected course.

---

### User Story 2 - Course Option Layout and Visual Hierarchy (Priority: P2)

Students need clear visual separation between courses in the modal list with adequate touch target height (minimum 44pt / 48px) and accessible color contrast.

**Why this priority**: Mobile-first touch ergonomics prevent mis-taps between adjacent courses. Distinct color dots and schedule days help students quickly distinguish courses with similar course codes or titles.

**Independent Test**: Can be tested on mobile viewport (360px-390px) by verifying item padding, dot sizing (8-10px diameter), distinct active/hover/pressed states, and readable schedule tags.

**Acceptance Scenarios**:

1. **Given** an open course picker modal, **When** inspecting list items on a mobile viewport, **Then** each course row has a minimum hit target height of 48px.
2. **Given** a course currently assigned to the active note, **When** the student opens the modal, **Then** the currently selected course is visibly indicated (such as with a subtle highlight or check indicator).
3. **Given** a long list of courses exceeding the modal viewport height, **When** the student scrolls the modal, **Then** the list scrolls vertically within the dialog container without shifting the underlying NoteEditor page.

---

### User Story 3 - Graceful Handling of Empty Course Catalog (Priority: P3)

Students who open the course picker modal before adding any courses to their account need clear guidance on what to do next.

**Why this priority**: Avoids dead-end interactions when a user starts note taking on a fresh account.

**Independent Test**: Can be tested with an empty catalog by tapping the course trigger and verifying an informative empty state appears in the modal dialog with an invitation to create courses.

**Acceptance Scenarios**:

1. **Given** no courses exist in the user's catalog, **When** the student opens the course picker modal, **Then** the modal presents a helpful empty state message stating that no courses are available.
2. **Given** the empty state in the modal, **When** the student dismisses the modal, **Then** the note editor remains usable and the course field continues indicating that a course is required before saving.

---

### User Story 4 - Strict Save Validation for Course and Date (Priority: P1)

Students preparing a journal note must select both a course and an entry date before they can save the note.

**Why this priority**: Course parentage and entry date anchoring are fundamental system invariants for dirty note processing and virtual study planning.

**Independent Test**: Can be tested by entering note content without selecting a course or with an empty date, verifying the Save button is disabled, then selecting both a course and date and verifying the Save button becomes enabled.

**Acceptance Scenarios**:

1. **Given** a note with content but no course selected, **When** the student views the Save button, **Then** the Save button is disabled.
2. **Given** a note with content and a selected course but no entry date, **When** the student views the Save button, **Then** the Save button is disabled.
3. **Given** a note with content, a selected course, and a valid entry date, **When** the student views the Save button, **Then** the Save button is enabled.

---

## Edge Cases

1. **Course with multiple schedules on different days**: If a course has schedules on Monday (09:00 - 10:00) and Wednesday (09:00 - 10:00), the schedule line aggregates unique days in calendar order (e.g., "Mo, We").
2. **Long course title overflow**: Course titles that exceed the dialog width truncate cleanly with ellipsis rather than breaking the horizontal layout or pushing the schedule text off screen.
3. **Screen reader and accessibility navigation**: The modal dialog implements dialog role semantics (`role="dialog"` or `role="listbox"`), manages focus trap when open, and restores focus to the course trigger upon closing.
4. **Rapid double taps**: Selecting an option is debounced so multiple rapid taps register only once and do not trigger duplicate state transitions.
5. **Cleared date or missing initial course**: If the entry date is unset or cleared, the Save button immediately disables until a date within the allowed window is chosen.

---

## Functional Requirements

- **FR-001**: The NoteEditor must replace the native `<select>` dropdown with a tactile course trigger that opens a dedicated course selection modal dialog.
- **FR-002**: The course picker modal must present each course with:
  1. A color dot derived deterministically from the course identifier using the established palette.
  2. The course title/name as primary text.
  3. The course weekly schedule days formatted as an abbreviated day list (e.g., "Mo, We, Th" or "Mon, Wed, Fri") as secondary text.
- **FR-003**: Schedule information must be derived from the cached schedules in `useCatalog` matching `courseId`.
- **FR-004**: Selecting an item from the modal must update `selectedCourseId` in NoteEditor, trigger `isDirty`, and dismiss the modal.
- **FR-005**: Tapping outside the modal dialog or pressing the Escape key must dismiss the modal without altering `selectedCourseId`.
- **FR-006**: The modal dialog must support vertical scrolling when the course catalog exceeds the viewport height.
- **FR-007**: Each course row in the modal must satisfy a minimum touch target height of 48px for mobile usability.
- **FR-008**: The modal must display an informative empty state when no courses exist in the catalog.
- **FR-009**: The Save button in NoteEditor must be disabled unless:
  1. `selectedCourseId` is not null.
  2. `entryDate` is not null, empty, or whitespace.
  3. Note body content (`contentMarkdown`) contains non-empty text.
  4. Note is not currently in a saving state (`isSaving` is false).

---

## Success Criteria

1. **Task completion time**: Students can select a course in 2 taps (1 tap to open modal, 1 tap to select) in under 2 seconds.
2. **Visual alignment**: 100% of course options display the required triple-spec elements: [color dot] [title] on the primary line, and [schedule days] on the secondary line.
3. **Mobile ergonomics**: All course selection rows maintain at least 48px vertical touch target height with no mis-taps on 375px mobile viewports.
4. **Zero unwanted mutations**: Dismissing the modal via backdrop or escape key preserves the pre-existing course selection with 100% fidelity.
5. **Zero unanchored saves**: 100% of persisted notes possess both a valid course identifier and an entry date. The Save action cannot be activated when either attribute is missing.

---

## Assumptions

1. Schedules are retrieved from the shared catalog cache (`useCatalog().schedules`) and do not require additional network requests.
2. Abbreviated day names will follow standard academic shorthand (e.g., "Mo, We, Fr" or "Mon, Wed, Fri") ordered from Monday to Sunday.
3. The modal design takes inspiration from Google Calendar's account/calendar picker popup shown in the reference image (rounded container, soft pastel background surface, avatar/dot indicator, primary text, secondary subtitle).
