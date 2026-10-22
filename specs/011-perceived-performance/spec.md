# Feature Specification: Perceived Performance

**Feature Branch**: `[011-perceived-performance]`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "Apply all diagnosed perceived-performance findings: faster page navigation (concurrent data loading, deferred heavy modules, preserved view state, no redundant list reloads) and instant mascot imagery in dialogs."

## Clarifications

### Session 2026-10-22

- Q: Should this spec patch all loading problems of the app? → A: Yes — every screen and every loading stall, including secondary and drawer surfaces, not only the three primary sections
- Q: Which images must this feature make load instantly? → A: All bundled app imagery plus user-attached note images
- Q: Where should the timing targets in the success criteria be measured? → A: Production build only

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Return to a Section (Priority: P1)

A student switches between the Tasks, Calendar, and Notes sections throughout the day. Each return visit to a section already opened in the session shows its content immediately, without a loading wait or a fresh data request for information the app already holds.

**Why this priority**: Tab switching is the most frequent navigation in a mobile-first planner. A visible wait on every switch is the reported pain point and degrades the core daily loop.

**Independent Test**: Open each primary section once, then switch between them repeatedly. Every return visit presents usable content without a loading indicator for previously loaded data, and no duplicate data requests occur.

**Acceptance Scenarios**:

1. **Given** the Notes section loaded its list earlier in the session, **When** the student returns to Notes, **Then** the list displays at once without a new list request.
2. **Given** the Calendar section rendered earlier in the session, **When** the student returns to Calendar, **Then** the calendar view appears without rebuilding delay.
3. **Given** any section already visited, **When** the student navigates away and back, **Then** scroll and view state the section keeps in memory are preserved.

---

### User Story 2 - Prompt First Visit to a Section (Priority: P2)

A student opens a section for the first time in a session. The screen becomes usable promptly because the app requests everything that section needs at once instead of one request after another.

**Why this priority**: First impressions and cold starts still happen every session. Stacked sequential waits make a local backend feel like a slow remote one.

**Independent Test**: Start a fresh session and open each primary section and a detail surface (a note, a task). Measure that each becomes usable promptly and that its data requests overlap rather than queue serially.

**Acceptance Scenarios**:

1. **Given** a fresh session, **When** the student opens the Calendar for the first time, **Then** all data the view needs is requested concurrently and the calendar becomes usable within the target time.
2. **Given** a fresh session, **When** the student opens an existing note, **Then** the editor becomes usable within the target time without visible staged waits.
3. **Given** a fresh session, **When** the student opens an existing task, **Then** the task detail becomes usable within the target time.

---

### User Story 3 - Instant Mascot Imagery in Dialogs (Priority: P2)

A student triggers any confirmation dialog that shows the Duckota mascot (submit, discard, delete, archive). The mascot artwork is visible at the same moment the dialog appears — no empty corner that fills in a beat later.

**Why this priority**: The mascot is the product's signature character. A delayed pop-in reads as a defect and undermines the tactile, crafted feel the design system specifies.

**Independent Test**: From a fresh session, open any mascot-bearing dialog for the first time and observe the artwork present at the moment the dialog renders.

**Acceptance Scenarios**:

1. **Given** a fresh session where no dialog has opened yet, **When** the student opens a delete or discard confirmation, **Then** the mascot image is fully visible in the same instant as the dialog card.
2. **Given** the dialog was opened once before, **When** the student opens it again, **Then** the mascot remains instant.

---

### Edge Cases

- **Backend unreachable**: Navigation still resolves promptly to the target section's error or empty state; route changes never block on failing requests.
- **Slow or absent network**: Loading indicators appear only for data genuinely missing; previously loaded content still displays immediately on return visits.
- **First-ever launch with cold caches**: Independent data requests still run concurrently; total wait stays within the first-visit target.
- **Account switch**: Per-user cached data resets so a different account never sees another user's content, even though sections remain instant afterward.
- **Reduced-motion or low-end devices**: Speed improvements come from loading behavior, not animations, so they apply identically when motion is reduced.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the student revisits any screen within the same session, the system MUST display that screen's last-loaded content immediately without re-requesting data already held in memory.
- **FR-002**: When the student navigates to any screen for the first time in a session, the system MUST request all independent data that screen requires concurrently, not in a serial sequence.
- **FR-003**: A route change to a gated section MUST NOT wait behind more than one dependent data round-trip when the target section performs the same request itself.
- **FR-004**: The system MUST defer loading of capabilities that only specific surfaces require — the schedule onboarding preview, the rich-text note editor, the week calendar engine, and any comparable heavy capability — until the student reaches a surface that needs them. The initial screen MUST NOT pay their load cost.
- **FR-005**: Before any surface that displays bundled artwork can first present — mascot-bearing dialogs, onboarding, decorative art — the system MUST have that artwork already fetched so it renders in the same instant as its host.
- **FR-006**: Saving an existing entity MUST NOT trigger a reload of its collection when the save response already describes the stored record.
- **FR-007**: Screens MUST preserve their rendered state across in-app navigation so visually expensive surfaces do not reconstruct on every visit.
- **FR-008**: When a data request fails or the backend is unreachable, navigation MUST still resolve promptly to the screen's error or empty state.
- **FR-009**: All caching and concurrency changes MUST preserve the existing freshness contract: mutation responses update local state, and planner runs invalidate affected course data exactly as they do today.
- **FR-010**: Images attached to notes MUST render without visible pop-in or layout shift when their containing card or editor presents; images not yet fetched MUST occupy reserved space until ready.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Navigating to any previously visited screen presents usable content in under 0.5 seconds on the target mobile viewport, 95% of the time, measured on a production build.
- **SC-002**: First visit to any screen, including secondary and detail surfaces, presents usable content in under 2 seconds on a production build served locally against a local backend on a standard development machine.
- **SC-003**: All bundled imagery is visible at the moment its host surface presents — 100% of first opens after initial load, zero observed pop-ins — and note-attached images never cause a visible layout shift or late flicker.
- **SC-004**: The start screen becomes interactive without fetching any resources exclusive to the note editor, schedule preview, or calendar engine surfaces.
- **SC-005**: All existing user flows (tri-state planner, notes, tasks, events, Process runs) behave identically to before; the existing acceptance suite passes unchanged.

## Assumptions

- The backend runs on the same machine or a low-latency network; the targets assume local-development latency, not remote hosting.
- Timing targets are measured against a production build served locally, not the development server; dev-mode compilation overhead is out of scope.
- The existing cache invalidation contract stays authoritative: mutation responses update local state, and Process runs refetch only affected courses.
- Session-scoped caches still reset on account switch and sign-out.
- Bundled artwork stays in its current formats for this feature; shrinking or re-encoding image files is optional polish and not required to meet the instant-display criterion.
- Explicit long-running operations the student starts deliberately — the Process planner run and image uploads — are not "loading stalls"; they keep their existing progress feedback and are out of scope.
- No new user-facing functionality ships in this feature; it only removes waits the current implementation introduces.
- The feature is frontend-only; no backend or API contract changes are expected.
