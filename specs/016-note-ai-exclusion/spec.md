# Feature Specification: Exclude Note From AI Processing

**Feature Branch**: `016-note-ai-exclusion`

**Created**: 2026-10-25

**Status**: Draft

**Input**: User description: "Add an option in the notes editor to disable a note from AI note processing. Disable only. Do not delete data the AI already extracted."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exclude a note from processing (Priority: P1)

A student writes a note that holds private or scratch content. The student turns on a "Skip AI processing" toggle in the notes editor. The next Process run ignores this note.

**Why this priority**: This is the core value. It gives the student control over which notes the AI reads. It also avoids wasted AI cost.

**Independent Test**: Create a note, turn the toggle on, run Process. Confirm the note creates no tasks, events, or context.

**Acceptance Scenarios**:

1. **Given** a new unprocessed note, **When** the student turns on the toggle and saves, **Then** the note does not count as pending in the planner status.
2. **Given** an excluded note and other pending notes, **When** the student runs Process, **Then** the AI reads only the other notes.
3. **Given** an excluded note, **When** the student edits its content and saves, **Then** the note stays excluded and does not become pending.

---

### User Story 2 - See the exclusion state (Priority: P2)

The student sees in the editor that the AI skips the note.

**Why this priority**: Without a visible state, the student may forget the toggle and wonder why a note produced nothing.

**Independent Test**: Exclude a note. Reopen the editor. Confirm the toggle is on and the status badge reads "Skipped by AI".

**Acceptance Scenarios**:

1. **Given** an excluded note, **When** the student opens it in the editor, **Then** the toggle shows the on state.
2. **Given** an excluded note, **When** the student views the editor status badge, **Then** the badge reads "Skipped by AI".

---

### User Story 3 - Re-enable processing (Priority: P2)

The student turns the toggle off. The note becomes pending again and the next Process run reads it.

**Why this priority**: The choice must be reversible.

**Independent Test**: Exclude a note, turn the toggle off, check planner status. Confirm the note counts as pending.

**Acceptance Scenarios**:

1. **Given** an excluded note that has new or never-processed content, **When** the student turns the toggle off, **Then** the note counts as pending.
2. **Given** an excluded note that the AI already processed before exclusion, **When** the student turns the toggle off, **Then** the note counts as pending once, because saving the toggle changes the note.

---

### Edge Cases

- A note was processed, then excluded. Tasks, events, and context from the earlier run stay unchanged. Exclusion does not delete them.
- A note is excluded during a Process run. The run finishes with the state it read at its start.
- All notes for a course are excluded. The run skips that course without error.
- All pending notes are excluded. The planner status shows zero pending notes. The student cannot start a run that has nothing to process.
- A student tries to change the flag on a note that belongs to another user. The system answers as if the note does not exist.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to turn "Skip AI processing" on or off for each note in the notes editor.
- **FR-002**: System MUST persist the exclusion state per note. A new note MUST default to not excluded.
- **FR-003**: System MUST NOT count an excluded note as pending in the planner status.
- **FR-004**: System MUST NOT send an excluded note to AI extraction during a Process run.
- **FR-005**: System MUST keep a note excluded when the student edits its content.
- **FR-006**: System MUST NOT delete or change tasks, events, or context that the AI extracted from a note before exclusion.
- **FR-007**: System MUST show the exclusion state in the notes editor as a toggle and a status badge.
- **FR-008**: System MUST treat a note as pending again after the student turns exclusion off, when the note changed since its last processing.
- **FR-009**: System MUST apply exclusion only to the note owner. Access to another user's note MUST fail as not found.
- **FR-010**: Existing notes MUST remain not excluded after the feature ships.

### Key Entities *(include if feature involves data)*

- **Note**: A course-linked journal entry. It gains one attribute: whether the AI skips it. All other attributes stay unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student excludes a note in 2 actions or fewer from the open editor.
- **SC-002**: 100% of excluded notes produce zero AI-created tasks, events, or context in new Process runs.
- **SC-003**: The planner status pending count never includes an excluded note.
- **SC-004**: 100% of existing notes behave the same as before the feature ships.
- **SC-005**: In a usability check, 9 of 10 students identify which notes the AI skips without help.

## Assumptions

- The scope is "disable" only. "Invalidate" (delete earlier extracted data) is out of scope.
- The setting applies per note. No course-level or global setting exists.
- The setting does not need a confirmation dialog because it is reversible and deletes nothing.
- Excluded notes stay in search, calendar, and journal views like any other note.
- Note lists and cards show no exclusion indicator in this release. Only the editor shows it.
- The existing dirty-note rule (never processed, or edited after last processing) stays unchanged for non-excluded notes.
- The feature reuses the existing notes editor and session-scoped note access.
