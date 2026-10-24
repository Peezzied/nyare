# Feature Specification: Unified Search and Filter

**Feature Branch**: `013-unified-search-filter`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: "Extract the search bar component from PR #45 (task and note views) into the current branch. Make search functional using the backend. Add filter support to notes, tasks, and events in the backend and reconcile it with the frontend. Add a filter button beside the search bar for filtering items by date, course, and similar criteria. Also add the search bar and function to the events (deadlines) view."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search tasks and notes by text (Priority: P1)

A student types a word or phrase into the search bar on the To-do or Notes view. The list updates shortly after they pause typing and shows only items whose title or body text matches the query. Clearing the search restores the full list.

**Why this priority**: Search is the core request. It delivers immediate value on its own and requires no other story to work.

**Independent Test**: Open the To-do view, type a known task title fragment, confirm only matching tasks appear, then clear the field and confirm the full list returns. Repeat on Notes. Search must find items not currently rendered on screen.

**Acceptance Scenarios**:

1. **Given** tasks exist with "review" in the title, **When** the student types "review" into the task search bar and pauses, **Then** only tasks matching "review" in title or description appear.
2. **Given** a search query is active, **When** the student clears the field, **Then** the original unfiltered list is restored without losing existing state.
3. **Given** no items match the query, **When** the search completes, **Then** an empty-state message appears instead of a broken or blank list.
4. **Given** the student types continuously, **When** they pause briefly, **Then** the system issues one search rather than one per keystroke.

---

### User Story 2 - Filter lists by course and date range (Priority: P2)

A student taps a filter button beside the search bar. A sheet opens with a course selector and a date-range picker. Applying the filters narrows the list; clearing them restores it. The filter button shows a visible indicator while filters are active.

**Why this priority**: Filters multiply the value of search and large lists, but the feature still delivers value with search alone (P1).

**Independent Test**: Open the filter sheet on the To-do view, pick a course and a date range, apply, and confirm only matching tasks appear. Clear filters and confirm the full list returns.

**Acceptance Scenarios**:

1. **Given** the filter sheet is open, **When** the student selects a course and applies, **Then** only items belonging to that course appear.
2. **Given** a start and end date are set, **When** the student applies, **Then** only items whose relevant date falls inside the range appear (scheduled date for tasks, entry date for notes, deadline for events).
3. **Given** filters are active, **When** the student views the filter button, **Then** an active-state indicator is visible.
4. **Given** filters and a search query are both set, **When** both apply, **Then** the list shows items satisfying every criterion at once.
5. **Given** filters are active, **When** the student clears them, **Then** the full unfiltered list returns and the indicator disappears.

---

### User Story 3 - Search and filter academic events on the deadlines view (Priority: P2)

A student opens the calendar's deadlines mode and uses the same search bar and filter button to find events by title/description, course, or deadline range.

**Why this priority**: Parity across the three item surfaces. It shares the same mechanism as P1/P2 but on event data.

**Independent Test**: Switch the calendar to deadlines mode, type an event title fragment, and confirm matching deadlines appear. Apply a course or deadline-range filter and confirm the list narrows accordingly.

**Acceptance Scenarios**:

1. **Given** the calendar is in deadlines mode, **When** the student types in the search bar, **Then** only matching events appear in the deadline sections.
2. **Given** a deadline-range filter is applied, **When** the list renders, **Then** only events with deadlines inside the range appear.
3. **Given** the calendar is in day or week mode, **When** the student views the screen, **Then** no search bar is shown (search lives only in deadlines mode).

---

### Edge Cases

- A query with only whitespace behaves as no search (full list shown).
- Search matches are case-insensitive; partial words match.
- If the backend search fails, the student sees an error state with a retry path and the previously loaded list is not silently replaced by nothing.
- A date range with only a start or only an end filters by the bound that exists.
- An invalid range (end before start) is rejected with a visible message and the list is unchanged.
- Rapid toggling of search/filters never leaves a stale result set displayed.
- Searching while offline or unauthenticated follows the app's existing error/session handling.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a text search field on the To-do view, Notes view, and the calendar's deadlines mode.
- **FR-002**: The system MUST match the search query case-insensitively against item title and body text (task description, note content, event description).
- **FR-003**: Search MUST cover all stored items for the signed-in user, not only items currently rendered.
- **FR-004**: The system MUST debounce live search so a burst of typing produces at most one lookup per pause.
- **FR-005**: Clearing the search field MUST restore the previously displayed list without a full reload of unaffected data.
- **FR-006**: The system MUST provide a filter button beside each search field that opens a filter sheet.
- **FR-007**: The filter sheet MUST offer a course selector and a date-range picker (start and/or end) on all three surfaces.
- **FR-008**: The task filter sheet MUST additionally offer a status choice (open vs completed).
- **FR-009**: Applying filters MUST narrow the list to items satisfying all active criteria, combined with any active search query.
- **FR-010**: The filter button MUST display a persistent active indicator while any filter is applied.
- **FR-011**: The student MUST be able to clear all filters with a single action inside the sheet.
- **FR-012**: Search and filtering MUST NOT mutate or remove the cached unfiltered lists; the original views return intact when search/filters are cleared.
- **FR-013**: The task category tabs (All / Overdue / Scheduled / Later / Backlog) remain unchanged for the unfiltered list; while a search or filter is active the view shows a single flat result list.
- **FR-014**: The search bar MUST NOT appear in calendar day or week modes.
- **FR-015**: The visual-only search icon previously present in the Notes header MUST be removed once the functional search bar exists.
- **FR-016**: Empty results MUST show a clear empty-state message per surface ("no matching tasks", etc.).

### Key Entities *(include if feature involves data)*

- **Task**: user-owned actionable item; searchable on title and description; filterable on course, status, and scheduled date.
- **Note**: course-linked journal entry; searchable on title and content; filterable on course and entry date.
- **Academic Event**: course-linked deadline; searchable on title and description; filterable on course and deadline date.
- **Course**: the filter dimension shared by all three item types.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student finds a known task, note, or event by typing 3+ characters and pausing, in under 2 seconds per lookup on typical datasets (hundreds of items).
- **SC-002**: 100% of items matching the query text are returned, including items not visible on screen before searching.
- **SC-003**: Applying a course + date-range filter reduces the visible list to exactly the matching subset in one action; clearing restores 100% of prior items.
- **SC-004**: All three surfaces share the same search bar and filter interaction pattern — a student learns it once.
- **SC-005**: No regression: unfiltered lists, task category tabs, and calendar day/week modes behave exactly as before.

## Assumptions

- Search applies to active (non-archived) items by default; archived-course items follow each view's existing archived behavior.
- Date range filters map to each item's natural date: scheduled date for tasks, entry date for notes, deadline for events.
- One course can be selected at a time in the filter sheet (single-select), consistent with existing list parameters.
- The filter sheet presents as a bottom sheet on the mobile-first layout.
- Results while searching are not written into the shared list caches.
- Backend query parameters are the delivery mechanism, per the project's filter-on-server convention.
