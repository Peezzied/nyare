# Feature Specification: Rich Text Toolbar and Editor

**Feature Branch**: `001-tiptap-toolbar`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "use what you think is the best premade component provider as long as it includes basic tools + image upload + undo/redo button"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core Text Formatting and Edit History (Priority: P1)

Students recording course material need to structure notes with headings, lists, and emphasis, and must be able to reverse mistakes without data loss.

**Why this priority**: Essential foundation for academic note taking. Without formatting and history controls, notes are plain text and error correction is tedious.

**Independent Test**: Can be tested by opening an empty note, entering text, applying bold and heading formatting, executing undo to revert, and executing redo to restore the change.

**Acceptance Scenarios**:

1. **Given** an open note, **When** the user selects text and activates bold, italic, or strikethrough, **Then** the selected text updates to reflect the chosen style and the corresponding toolbar control displays an active indicator.
2. **Given** an active paragraph, **When** the user selects a heading level or list format, **Then** the block converts to the selected structure.
3. **Given** prior document modifications, **When** the user activates undo, **Then** the editor restores the immediate prior document state.
4. **Given** a reverted edit action, **When** the user activates redo, **Then** the editor reapplies the reverted modification.
5. **Given** an unmodified or fully reverted note, **When** the user views the toolbar, **Then** the undo control is disabled.

---

### User Story 2 - Image Upload and Embedded Visuals (Priority: P1)

Students reviewing technical or scientific courses need to insert diagrams, formulas, and whiteboard captures directly into their notes.

**Why this priority**: Academic notes frequently rely on visual media. Students cannot summarize diagram-heavy lectures with text alone.

**Independent Test**: Can be tested by selecting an image file from local device storage, uploading it through the toolbar control, and confirming the image appears inline within the document.

**Acceptance Scenarios**:

1. **Given** an active document cursor, **When** the user selects an image file through the upload control, **Then** the system uploads the media and inserts the image at the cursor position.
2. **Given** an ongoing image upload, **When** the network transfer is in progress, **Then** the interface indicates uploading status and prevents duplicate submissions.
3. **Given** a note with embedded images, **When** the user saves and later reloads the note, **Then** all images remain visible in their original document positions.

---

### User Story 3 - Mobile-Responsive Toolbar Usability (Priority: P2)

Students taking notes on mobile phones and tablets need toolbar controls that remain accessible without breaking mobile viewport layouts.

**Why this priority**: Students take notes on varied devices including phones in lecture halls and laptops in study spaces.

**Independent Test**: Can be tested on a 360px mobile viewport by scrolling or accessing all toolbar controls without horizontal layout overflow.

**Acceptance Scenarios**:

1. **Given** a mobile viewport width of 360 pixels, **When** the user opens the editor, **Then** all toolbar controls fit within the screen bounds or wrap cleanly without clipping.
2. **Given** touch interactions, **When** the user taps a toolbar button, **Then** the button registers immediately with appropriate touch target sizing.

---

### Edge Cases

- What happens when a user attempts to upload a non-image file (e.g. PDF or executable)?
  The system rejects the file with a clear validation message and does not alter document content.
- What happens when an image upload fails due to network disconnection?
  The system alerts the user that the upload failed and retains the document text without inserting broken image blocks.
- What happens when a user uploads a very large file?
  The system enforces a maximum file size limit (e.g. 10 MB) and alerts the user prior to or upon transmission failure.
- What happens when undo is triggered repeatedly until reaching the initial state?
  The document returns to the starting state and the undo control becomes disabled without throwing errors.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide basic inline text formatting controls for bold, italic, strikethrough, and inline code.
- **FR-002**: System MUST provide block structuring controls for headings (levels 1, 2, and 3), bulleted lists, numbered lists, blockquotes, and horizontal dividers.
- **FR-003**: System MUST provide undo and redo controls to traverse the edit history stack.
- **FR-004**: System MUST disable undo and redo controls when no applicable history state exists.
- **FR-005**: System MUST visually indicate active formatting states on toolbar buttons based on current cursor selection.
- **FR-006**: System MUST allow users to select and upload image files from their local filesystem directly from the toolbar.
- **FR-007**: System MUST embed uploaded images inline at the current document selection position.
- **FR-008**: System MUST validate uploaded media formats and display user-facing error notices for unsupported formats or transfer errors.
- **FR-009**: System MUST preserve rich text formatting and embedded images across save, navigation, and retrieval operations.
- **FR-010**: System MUST maintain accessible touch targets of at least 32x32 pixels for all toolbar buttons.

### Key Entities

- **Note Document**: The rich text record containing styled paragraphs, headings, lists, block quotes, and embedded media tokens.
- **Image Media**: An uploaded image asset linked to the document, containing resource address, alternate description, and visual placement data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can apply text formatting and observe the visual change in under 100 milliseconds.
- **SC-002**: 100% of undo and redo invocations accurately restore or reapply document state without character corruption.
- **SC-003**: Users can upload and display an image under 5 MB in under 3 seconds over standard broadband connections.
- **SC-004**: 100% of toolbar controls remain accessible without horizontal page clipping across viewport widths from 360 pixels to 1920 pixels.
- **SC-005**: Users can complete a formatted note entry including one heading, one list, and one embedded image in under 60 seconds.

## Assumptions

- Single-user editing sessions (concurrent multi-user real-time collaborative editing is out of scope for initial release).
- Image uploads support standard web graphic types (PNG, JPEG, WebP, GIF).
- Server storage handles uploaded images and provides permanent accessible URLs for embedded rendering.
- Offline image uploads will store temporary data references until network restoration occurs.
