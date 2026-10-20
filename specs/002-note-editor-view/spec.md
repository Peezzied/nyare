# Feature Specification: Note Editor View

**Feature Branch**: `002-note-editor-view`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "a new view for notes named NoteEditor. i attached the reference ui prototype for this. also use this stitch design https://stitch.withgoogle.com/projects/15167535063944108841?node-id=1c9d1d9c2d0a4947914959a7075876f8 wire the tiptapeditor into this. the toolbar in the tiptapeditor must be one liner and scrollable horizontally. apply the same styling as the reference prototype. the undo/redo button must standout"

## Clarifications

### Session 2026-10-13

- Q: What content format does the backend expect for note content? → A: Markdown content format. The frontend editor converts rich text to Markdown before submitting via `POST` or `PUT /api/notes`, and parses Markdown when loading existing notes.
- Q: How does the backend validate images embedded in note content? → A: Embedded images must reference valid persisted image endpoints (e.g. `/api/images/{uuid}`) matching records existing in the `images` database table; unpersisted or invalid references fail validation with a user-facing error notice.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Edit Course Journal Note (Priority: P1)

Students recording lecture insights or academic reflections need to create and edit course-linked journal notes with a title, course association, entry date, and rich text body.

**Why this priority**: Core academic journaling value proposition. Students must associate thoughts and tasks with a course and date anchor before planning can process dirty notes.

**Independent Test**: Can be tested by navigating to the NoteEditor view, selecting an enrolled course, setting the entry date, typing a note title and rich text body, and saving to persist the note record.

**Acceptance Scenarios**:

1. **Given** an empty or new note session, **When** the student enters a title, selects a required course, chooses an entry date, and inputs text, **Then** activating the Save action saves the note and returns a success confirmation.
2. **Given** a note without a selected course, **When** the student attempts to enter content into the note body, **Then** the editor is disabled with instructional helper text until a course is chosen.
3. **Given** an existing saved note, **When** the student navigates to the NoteEditor view for that note ID, **Then** the view loads with the note's existing title, course badge/selector, entry date, and rich text content.
4. **Given** unsaved edits on an active note, **When** the student selects the Back action, **Then** the interface warns the user about unsaved modifications before navigating away.

---

### User Story 2 - Integrated Single-Line Scrollable Rich Text Toolbar (Priority: P1)

Students taking notes on mobile devices need a streamlined, non-intrusive rich text toolbar at the bottom of the editor that stays on a single line and scrolls horizontally so all tools remain accessible without vertical screen clutter.

**Why this priority**: Essential mobile ergonomics. Mobile viewports have constrained vertical height; wrapping toolbars push content off screen.

**Independent Test**: Can be tested on a mobile viewport (360px-390px) by verifying all formatting buttons, image upload, and history actions fit on a single horizontal row that scrolls smoothly with touch or scroll input.

**Acceptance Scenarios**:

1. **Given** a mobile screen width, **When** viewing the bottom toolbar, **Then** all formatting controls are displayed in a single horizontal row without wrapping onto secondary lines.
2. **Given** multiple formatting controls exceeding the viewport width, **When** the student swipes horizontally along the toolbar, **Then** all controls scroll smoothly into view.
3. **Given** the bottom toolbar layout, **When** the student views the undo and redo buttons, **Then** the undo and redo controls are visually distinct and prominent compared to standard inline style toggles.
4. **Given** an active document selection, **When** the student applies text formatting or uploads an image from the bottom toolbar, **Then** the editor updates instantly and maintains cursor focus.

---

### User Story 3 - Visual Styling and Course Anchor Fidelity (Priority: P2)

Students need visual consistency adhering to Nyare's coastal academic design system and the reference prototype layout, including header navigation, course pill picker, date picker, and divider lines.

**Why this priority**: Visual hierarchy guides user attention, reduces friction, and reinforces course parentage required by domain invariants.

**Independent Test**: Can be tested by verifying header typography, tactile buttons, course tag styling matching course catalog colors, and turquoise divider rules matching the prototype design.

**Acceptance Scenarios**:

1. **Given** the NoteEditor header, **When** rendered, **Then** it presents a Back navigation link, an Untitled/Editable Note title field in Quicksand bold, and a tactile primary Save button.
2. **Given** the metadata section below the title, **When** rendered, **Then** Course and Date dropdown pills display side-by-side with chevron indicators and validation indicators.
3. **Given** a selected course, **When** rendered, **Then** the course badge reflects the assigned color token from the 24-color course palette.

---

### Edge Cases

- What happens if the user leaves the course selection unassigned?
  The note editor body remains locked and displays an informative prompt ("Select a course first to start typing"), and the Save button remains disabled.
- What happens when a user attempts to select a future date for `entryDate`?
  The date selector restricts future date selection because domain invariant and backend validation enforce past or present dates only (`@PastOrPresent`).
- What happens when a network error occurs during note save?
  The interface alerts the user with an error notice and retains all written title, metadata, and rich text content without loss.
- What happens on narrow viewports (e.g. 320px) with long course titles?
  The course selection pill truncates long names with an ellipsis while maintaining tap targets and dropdown functionality.
- What happens when undo/redo is triggered on an empty history stack?
  The prominent undo/redo buttons enter a disabled visual state while preserving their prominent layout position.
- What happens when note content contains an invalid or deleted image reference?
  The backend or client validation flags the missing image reference and displays a user-facing error notice, preventing corrupted notes from being persisted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated `NoteEditor` view route in the frontend router supporting both create mode (`/notes/new`) and edit mode (`/notes/:id`).
- **FR-002**: NoteEditor MUST include a top header bar with a Back navigation control, editable Note Title input, and a prominent tactile Save button.
- **FR-003**: NoteEditor MUST provide a Course selector pill control displaying the currently selected course or a required indicator when unselected.
- **FR-004**: NoteEditor MUST provide an Entry Date selector pill defaulting to today's date and restricting selection to dates within the allowed horizon (today and up to 14 days in the past).
- **FR-005**: NoteEditor MUST disable rich text typing in the editor body until a course is selected by the user.
- **FR-006**: NoteEditor MUST wire the existing Tiptap editor component into the content area, preserving rich text capabilities (headings, bold, italic, underline/strikethrough, lists, blockquotes, horizontal dividers, and images).
- **FR-007**: Tiptap editor toolbar MUST be positioned in a single horizontal row that is scrollable horizontally with no wrapping.
- **FR-008**: The undo and redo controls in the toolbar MUST be visually prominent and stand out from ordinary formatting buttons (using high-contrast accenting, size emphasis, or dedicated group styling).
- **FR-009**: NoteEditor MUST apply visual styling matching the reference prototype, including warm parchment background (`#F6F7EE` / `--color-bg-app`), teal accent horizontal divider rules, and clean typography.
- **FR-010**: System MUST persist notes via the backend REST API (`POST /api/notes` for new notes, `PUT /api/notes/:id` for existing notes) using Markdown content payload format, and navigate back or update local cache upon success.
- **FR-011**: System MUST support local image attachments through the image upload pipeline (`POST /api/images`), embedding valid persisted image endpoints (`/api/images/{uuid}`) into the Markdown content that match persisted records in the image repository.
- **FR-012**: System MUST validate that all image URLs embedded in the note content resolve to existing images in the images database prior to or during note persistence, displaying a clear validation error if an image reference is invalid.

### Key Entities

- **Note**: The student-authored journal document with `id` (UUID), `courseId` (Long, mandatory), `title` (String), `content` (Markdown formatted string), and `entryDate` (LocalDate, past or present up to 14 days).
- **Course**: The academic course container anchoring the note, providing course name, code, and deterministic palette color.
- **Image**: Binary image asset stored in the database with `id` (UUID), `contentType`, `filename`, and binary payload, referenced in notes via `/api/images/{id}`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Students can navigate to the NoteEditor, choose a course, and begin typing in under 3 seconds.
- **SC-002**: 100% of toolbar controls are accessible via horizontal swipe or scroll without vertical layout expansion or line wrapping on screens between 320px and 768px width.
- **SC-003**: Note saves complete and return feedback within 500ms on local network connections.
- **SC-004**: 100% of rich text formats, embedded images, and titles persist and reload identically via Markdown conversion upon re-opening saved notes.
- **SC-005**: Visual prominence of undo/redo controls allows immediate visual identification within 1 second of opening the editor.

## Assumptions

- Note content is authored via Tiptap rich text and converted to standard Markdown for backend transmission and persistence.
- Image uploads are handled prior to note saving via `POST /api/images`, returning an `/api/images/{uuid}` URI that is verified against the database.
- Available courses and schedules are fetched from `useCatalog()` cache.
- The user operates on a mobile-first viewport (390px baseline) but the layout scales cleanly to desktop widths.
- Real-time collaborative multi-user editing is out of scope.
