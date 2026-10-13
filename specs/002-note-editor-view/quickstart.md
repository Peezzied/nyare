# Quickstart & Verification Guide: Note Editor View

**Branch**: `002-note-editor-view` | **Feature**: Note Editor View

This guide documents validation scenarios to prove that the Note Editor View works end-to-end.

## Prerequisites

1. Frontend development dependencies installed in `frontend/`.
2. Backend API running on `http://localhost:8080` (or mocked with test fixtures).

## Validation Scenarios

### Scenario 1: Course Gating Verification
1. Navigate to `http://localhost:5173/notes/new`.
2. Verify editor body is locked with prompt "Select a course first to start typing".
3. Verify the Save button is disabled.
4. Select a course from the Course dropdown pill.
5. Verify editor body becomes immediately editable and focused.
6. Verify Save button becomes active when title or content is entered.

### Scenario 2: One-Liner Scrollable Toolbar & Standout Undo/Redo
1. Open mobile responsive view in browser dev tools (e.g. 375px or 390px iPhone viewport).
2. Look at the bottom rich text toolbar.
3. Confirm that all buttons are placed on a single horizontal row with zero vertical wrapping.
4. Swipe or scroll horizontally across the toolbar; confirm all tools (Image, Bold, Italic, Strike, Headings, Lists, Quotes) are accessible.
5. Verify Undo and Redo buttons are visually prominent with custom high-contrast cyan accents and separated or emphasized styling.

### Scenario 3: Markdown Conversion & End-to-End Note Persistence
1. In the note editor, type `# Lecture 1 Notes`, a bullet list, and some bold text.
2. Select today's date or a past date within 14 days.
3. Tap **Save**.
4. Confirm network payload sends Markdown formatted text to `POST /api/notes`.
5. Reopen the note via `http://localhost:5173/notes/:id`.
6. Confirm all formatting renders properly and identically in the rich text editor.

### Scenario 4: Embedded Image Database Validation
1. Tap the image upload icon in the bottom toolbar.
2. Select a local image file.
3. Confirm upload completes via `POST /api/images` and embeds `/api/images/{uuid}` into the note content.
4. Save the note.
5. Verify the image appears in the saved note with proper layout and styling.

## Unit & Type-Check Verification

Run from `frontend/`:
```bash
npm run type-check
npm run test:unit
npm run lint:oxlint
```
