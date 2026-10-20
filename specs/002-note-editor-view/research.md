# Research & Architecture Decisions: Note Editor View

**Branch**: `002-note-editor-view` | **Feature**: Note Editor View

## 1. Markdown Parsing & Serialization Strategy

### Decision
Implement lightweight markdown-HTML bidirectional conversion directly in frontend utility code or standard serialization using native DOM and regular expression parsing, preserving standard Markdown headers (`#`, `##`, `###`), bold (`**`), italic (`*`), strikethrough (`~~`), code (`` ` ``), bullet lists (`- `), ordered lists (`1. `), blockquotes (`> `), horizontal rules (`---`), and image syntax (`![alt](/api/images/uuid)`).

### Rationale
- **Ponytail Minimalism & No Bloat**: The requirements involve standard formatting supported by Tiptap StarterKit. Writing minimal bidirectional converters or reusing lightweight serialization ensures zero extraneous package dependencies.
- **Backend Parity**: Backend expects raw Markdown string content in `NoteRequest.content`.
- **Preserved Invariant**: Notes remain clean Markdown plain-text sources of truth for the AI planner engine and database storage.

### Alternatives Considered
- **Heavy third-party markdown parser packages** (e.g. `marked`, `markdown-it`, `turndown`): Rejected to avoid adding external dependencies when simple clean serializers satisfy the requirements.

---

## 2. Horizontal Scrollable Toolbar Architecture

### Decision
Support bottom-aligned placement and horizontal single-line scrolling mode on `TiptapToolbar` via a configuration prop (`placement="bottom"` / `scrollable=true` or dedicated classes: `flex flex-nowrap overflow-x-auto no-scrollbar items-center py-2 px-3`). Separate tools into visual clusters:
1. Left/Center formatting tools (Image upload, Bold, Underline/Strike, Italic, Headings, Lists).
2. Prominent Standout Undo/Redo buttons on the right or distinctly highlighted with high-contrast coastal theme styling (`text-primary`, prominent border or background indicator, larger target size).

### Rationale
- Matches user reference prototype:
  - Bottom bar with teal underline/border.
  - Image icon, Bold, Underline, Italic on the left.
  - Undo and Redo arrows on the right standing out.
  - One-liner layout that scrolls horizontally without vertical line wrap.
- Guarantees touch ergonomics on mobile devices without layout shift.

### Alternatives Considered
- **Multiline wrapping toolbar**: Rejected because it pushes note content off mobile viewports and violates the user's explicit requirement ("toolbar in the tiptapeditor must be one liner and scrollable horizontally").

---

## 3. Image DB Validation Strategy

### Decision
Implement pre-save client validation that verifies every `/api/images/{uuid}` present in markdown content matches an image uploaded during this session or existing on the note. Upon submission, the backend also enforces that images exist in the database (or HTTP 400 `BadRequestException` is returned).

### Rationale
- Protects database referential integrity.
- Prevents broken image links from entering the note content or AI processing pipeline.
- Conforms to Constitution Principle VI (Canonical Error Strategy).

### Alternatives Considered
- **Permit unverified arbitrary image URLs**: Rejected per explicit user requirement ("backend also validates this content when there's a image therein, it must match what's in the images db").

---

## 4. Course Gating & State Management

### Decision
The note editor body is conditionally editable based on whether `courseId` is selected:
- If `courseId` is null/empty: Tiptap editor is set to `editable: false`, displaying a helper prompt ("Select a course first to start typing"), and Save button is disabled.
- Once a course is selected from the catalog (`useCatalog()` cache), editor becomes `editable: true` and focused.

### Rationale
- Respects Constitution Principle II (Course Anchor and Single Parentage): No orphaned academic records can be created.
- Fulfills user scenario: "can't type kapag hindi pa naglalagay course".

---

## 5. Course Color System Integration

### Decision
Create a reusable utility `src/utils/courseColors.ts` implementing the Google Calendar parity 24-color palette from `DESIGN.md`. Compute deterministic background, text, and border classes using `course.id % 24`.

### Rationale
- Satisfies design specification section 4 ("24-Color Course Palette").
- Provides consistent course visual indicators across NoteEditor, task lists, and calendar views.

---

## 6. Stitch Design & UI Prototype Visual Alignment

### Decision
Align NoteEditor's visual implementation with the user reference prototype and Stitch project design tokens (`projects/15984991256602094572`, `colorMode: LIGHT`, `overridePrimaryColor: #00A4C8`, `overrideSecondaryColor: #007B99`, `overrideNeutralColor: #F6F7EE`):
1. **Header Layout**:
   - Left: `Back` text action in `text-muted-foreground` (`#7B8B97`) with medium font weight.
   - Right: Tactile 3D `Save` button in `#00A4C8` with 4px `#007B99` bottom bevel and white text.
2. **Note Title Field**:
   - Large borderless editable input in `font-sans` (Quicksand 700), placeholder `Untitled Note...`, text color `#334155`.
3. **Course & Date Pills**:
   - `Course:` label followed by rounded pill button with dropdown chevron (`required` placeholder with chevron icon).
   - `Date:` label followed by rounded pill button with dropdown chevron (`Today` default with chevron icon).
   - Border radius: `rounded-full` or `rounded-xl` with `#CBD5E1` border stroke and clean muted text.
4. **Divider Accents**:
   - Prominent horizontal teal rule (`h-[2px] bg-[#00A4C8]`) separating metadata header from editor body.
   - Matching teal horizontal rule (`h-[2px] bg-[#00A4C8]`) anchoring the top of the bottom toolbar.
5. **Locked Editor Placeholder**:
   - Ghosted placeholder prompt: `type here...` and `can't type kapag hindi pa naglalagay course` when unassigned.
6. **One-Liner Bottom Toolbar**:
   - Left tools: Image upload icon, Bold (`B`), Underline (`U` with underline mark), Italic (`/`).
   - Right tools: Undo curved arrow and Redo curved arrow, styled in standout teal (`#00A4C8`), larger scale, and prominent active touch states.
   - Overflow container: `flex flex-nowrap items-center overflow-x-auto no-scrollbar` to prevent line wrapping on 360px-390px mobile screens.

