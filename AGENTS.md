# Nyare

Nyare is a **calendar-first academic planning assistant**. Students use their class schedule to navigate courses, write course-linked journal entries, and receive AI-generated study recommendations.

---

## Documentation Directory

For in-depth architectural and technical guidelines, consult the global documentation:
- [Conceptual Model & Domain Dictionary](docs/conceptual-model.md): Ubiquitous language, entity hierarchy, Academic Event taxonomy, and key distinctions.
- [System Workflows & Diagrams](docs/system-workflows.md): Complete set of 9 Mermaid flowcharts covering processing, planning, navigation, and feedback.
- [MVP Boundaries & Non-Goals](docs/mvp-boundaries.md): Explicit architectural limits (no time-blocking, no automatic reconciliation, no scoring formula, virtual study plan).

---

## Core Concept

```text
Course Schedule
      ↓
Course-linked Journal
      ↓
AI Processing (explicit trigger, today's notes only)
      ↓
Tasks / Academic Events / Academic Context
      ↓
AI Planning (synthesizing academic state + feedback)
      ↓
Study Plan (tri-state recommendations)
      ↓
Calendar View
```

---

## Core Model

- **Course**: Academic subject organizing schedules, journal entries, tasks, academic events, and academic context. All student data belongs to exactly one course.
- **Class Schedule**: Recurring weekly class meeting times (`dayOfWeek`, `startTime`, `endTime`) anchoring calendar navigation.
- **Journal Entry (`Note`)**: Raw student-written notes in JSON format; the immutable source of truth.
- **Task**: Actionable work item the student needs to do (`TODO`, `IN_PROGRESS`, `COMPLETED`), with optional estimated duration and flexible recommended date.
- **Academic Event**: Rigid time constraint or occurrence at a specific date/time.
  - Subtypes include: `Exam`, `Quiz`, `Presentation`, `Class Activity`, and `Deadline` (latest required submission time).
- **Academic Context**: Temporal descriptive facts about the student's academic situation (syllabus coverage, progress, prerequisites, difficulty) aiding AI reasoning.
- **Study Plan**: Virtual presentation construct grouping recommended tasks; **never persisted as a separate database entity**.

---

## AI Behavior & Planning

- **Explicit Trigger**: Processing applies only to the **current day's journal entries** upon explicit user request.
- **Append-Only Materialization**: AI extracts Tasks, Academic Events, and Academic Context as fresh records without rewriting or mutating past entities.
- **Preserve Uncertainty**: Missing information must remain uncertain. Never hallucinate deadlines, durations, or priority metrics.
- **Dynamic Reasoning**: AI reasons from the holistic academic context rather than computing deterministic priority scores.
- **Tri-State Study Plan Recommendations**:
  - **Scheduled**: Recommended for a specific calendar date.
  - **Flexible / Later**: Recommended for action without a specific target date.
  - **Needs Context**: Actionable, but lacking sufficient details for confident scheduling.
- **Student Feedback & Reconsideration Loop**: When students provide feedback on recommendations (e.g., *"I have no time today"*), AI reconsiders the Study Plan without mutating underlying Task or Event records.
- **High-Level Planning**: Nyare recommends what day to work on tasks, not granular hourly time-blocks.

---

## User Interface & Navigation

- **Calendar View**: Primary interactive hub. Displays class schedules, rigid Academic Events / Deadlines, and recommended tasks. Clicking a class navigates to writing course-linked journal notes.
- **Tri-Area Layout**:
  - *Calendar Grid*: Displays scheduled items, classes, and deadlines.
  - *Later Area*: Backlog of flexible, undated recommendations.
  - *Needs Context Area*: Tasks requiring additional information before confident planning.
- **Notes View**: Purely read-only browser allowing students to inspect their course-linked journal entries by course.

---

## MVP Boundaries

- Do not automatically update, merge, split, or reconcile existing tasks from new information.
- Do not build a deterministic task-priority scoring system.
- Do not require detailed recurring availability schedules.
- Do not treat the Study Plan as a separate persistence model.
- Do not enforce automatic calendar time-blocking.
- Keep the system simple for both users and developers.