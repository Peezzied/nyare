# Nyare System Workflows & Architecture Diagrams

This document formalizes the 9 architectural workflows of Nyare. These diagrams define information flow, operational boundaries, and UI navigation contracts across the application.

---

## Workflow Directory

| # | Workflow | Primary Purpose |
| :-: | :--- | :--- |
| 1 | [System Overview](#1-system-overview) | End-to-end component topology and primary cycles |
| 2 | [Core Academic Model](#2-core-academic-model) | Entity relationships and journal ingestion structure |
| 3 | [Journal Processing Workflow](#3-journal-processing-workflow) | Explicit AI extraction scoped to today's notes |
| 4 | [AI Planning Workflow](#4-ai-planning-workflow) | Multi-input synthesis into the tri-state Study Plan |
| 5 | [Study Plan & Calendar Relationship](#5-study-plan-and-calendar-relationship) | UI mapping to Calendar grid, Later area, and Backlog area |
| 6 | [Information & Planning Boundaries](#6-information-and-planning-boundaries) | Append-only materialization without automated entity mutation |
| 7 | [Handling Missing Information](#7-handling-missing-information) | Known, Inferred, and Unknown handling without data fabrication |
| 8 | [User Interface & Navigation](#8-user-interface-and-navigation) | Calendar View hub and read-only Notes View navigation |
| 9 | [Complete MVP Lifecycle](#9-complete-mvp-lifecycle) | Full user flow including student feedback and AI reconsideration |

---

### 1. System Overview

Shows what Nyare is and how its major runtime components connect. The Calendar View is the student's home cockpit. Journal entries are linked to courses, AI extracts structured academic knowledge, and the AI Planner synthesizes recommendations back into the Calendar.

```mermaid
flowchart TD
    Student[Student]
    Calendar[Calendar View]
    Notes[Notes View]
    Journal[Course-linked Journal Entries]
    Processing[AI Processing]
    AcademicInfo["Tasks / Academic Events / Academic Context"]
    Planner[AI Planner]
    Existing[Existing Academic Information]
    Schedule[Class Schedule]
    StudyPlan[Study Plan]

    Calendar ==> Journal
    Journal ==> Processing
    Processing ==> AcademicInfo
    AcademicInfo ==> Planner
    Planner ==> StudyPlan
    StudyPlan ==> Calendar

    Student -.-> Calendar
    Student -.-> Notes
    Notes -.-> Journal
    Existing -.-> Planner
    Schedule -.-> Planner
```

---

### 2. Core Academic Model

Shows how courses anchor academic entities, and how journal entries act as the primary ingestion engine for Tasks, Academic Events, and Academic Context.

```mermaid
flowchart LR
    Term[Academic Term]
    Course[Course]
    Classes[Class Schedule]
    Journal[Journal Entries]
    Tasks[Tasks]
    Events[Academic Events]
    Context[Academic Context]

    Term --> Course
    Course --> Classes
    Course ==> Journal
    Course --> Tasks
    Course --> Events
    Course --> Context

    Journal ==> Tasks
    Journal ==> Events
    Journal ==> Context
```

*Key principle*: Every journal entry belongs to exactly one course. All extracted academic entities inherit this course association.

---

### 3. Journal Processing Workflow

Details how student notes transition into structured database entities. Processing is **explicit** (triggered by the student clicking "Process") and scoped to **all pending dirty notes**, processed chronologically date by date.

```mermaid
flowchart TD
    Student[Student writes or edits a journal entry]
    Save[Save entry with entryDate]
    Stored[Stored course-linked journal entry]
    Status[Client checks dirty status]
    Process[Student clicks Process]
    Scope[Select all pending dirty notes]
    Order[Order chronologically by entryDate]
    Clean[Clean prior uncompleted entities for edited notes]
    AI[AI extracts academic information for date]
    Task[Task]
    Event[Academic Event]
    Context[Academic Context]
    Store[Save extracted information]

    Student --> Save
    Save --> Stored
    Stored -.-> Status
    Status -.-> Process
    Process ==> Scope
    Scope ==> Order
    Order ==> Clean
    Clean ==> AI
    AI ==> Task
    AI ==> Event
    AI ==> Context
    Task ==> Store
    Event ==> Store
    Context ==> Store
```

---

### 4. AI Planning Workflow

Shows how the AI Planner selects, generates, and orders tasks into a coherent Study Plan. The planner takes into account newly processed notes, existing tasks, academic events, class schedules, and course context.

```mermaid
flowchart TD
    Today["Today's processed notes"]
    Courses["Involved courses"]
    Events["Upcoming Academic Events (14-day window)"]
    Context["Academic Context facts"]
    Schedule["Class Schedule"]
    OpenTasks["Existing open tasks"]
    Planner[AI Planner]
    Guard{"Open tasks exist for course?"}
    GenTasks["Generate study tasks (origin = AI_GENERATED)"]
    UpdateDates["Update scheduledDate & duration on tasks"]
    Plan[Study Plan Presentation]

    Today ==> Courses
    Courses ==> Planner
    Events ==> Planner
    Context ==> Planner
    Schedule ==> Planner
    OpenTasks ==> Planner
    Planner ==> Guard
    Guard ==>|No open tasks| GenTasks
    Guard ==>|Open tasks exist| UpdateDates
    GenTasks ==> UpdateDates
    UpdateDates ==> Plan
```

- **Scope**: Scopes to courses with dirty notes processed in the current run.
- **Event Lookahead**: Inspects upcoming academic events within a 14-day window.
- **Task Generation**: Generates study tasks for events when no `SCHEDULED` or `LATER` tasks exist for that course.
- **Persistence**: Persists and updates `scheduledDate` and `duration` directly on `Task` records.
- **Backlog Promotion**: Assigns dates and durations to `BACKLOG` tasks when new context enables planning.

---

### 5. Study Plan and Calendar Relationship

Illustrates the tri-state routing of Study Plan recommendations onto the user interface.

```mermaid
flowchart LR
    Plan[Study Plan]
    Dated[Scheduled recommendations]
    Flexible["Later recommendations"]
    BacklogItems[Backlog recommendations]
    Calendar[Calendar dates]
    LaterArea["Later area"]
    BacklogArea[Backlog area]
    Events["Academic Events / Deadlines"]
    Classes[Class Schedule]

    Plan ==> Dated
    Plan ==> Flexible
    Plan ==> BacklogItems
    Dated ==> Calendar
    Flexible ==> LaterArea
    BacklogItems ==> BacklogArea

    Events -.-> Calendar
    Classes -.-> Calendar
```

- **Calendar Grid**: Displays class meeting times, rigid Academic Events / Deadlines, and **Scheduled** tasks with recommended dates (`scheduledDate != null`).
- **Later Area**: Displays actionable **Later** tasks without specific target dates (`scheduledDate == null && duration != null`).
- **Backlog Area**: Displays tasks requiring additional context or details before scheduling (`scheduledDate == null && duration == null`).

---

### 6. Information and Planning Boundaries
 
Defines how the system preserves integrity. Recommendations **do not rewrite student task text** or mutate events and context facts. The planner only generates event-anchored study tasks and updates task scheduling fields (`scheduledDate`, `duration`).
 
```mermaid
flowchart TD
    Journal[Journal Entry]
    Extract[AI extracts information]
    Task[Task]
    Event[Academic Event]
    Context[Academic Context]
    State[Current Academic Information]
    Planner[AI Planner]
    NewTasks["Event-anchored study tasks (origin = AI_GENERATED)"]
    ScheduleUpdates["Updates scheduledDate & duration"]

    Journal ==> Extract
    Extract ==> Task
    Extract ==> Event
    Extract ==> Context

    Task ==> State
    Event ==> State
    Context ==> State
    State ==> Planner

    Planner ==>|Creates| NewTasks
    Planner ==>|Persists| ScheduleUpdates
    NewTasks ==> Task
    ScheduleUpdates ==> Task

    Planner -.->|Does not rewrite title or description| Task
    Planner -.->|Does not mutate| Event
    Planner -.->|Does not mutate| Context
```

---

### 7. Handling Missing Information

Demonstrates how Nyare handles missing or incomplete information. The system preserves uncertainty rather than inventing facts.

```mermaid
flowchart TD
    Journal[Journal Entry]
    AI[AI interprets available information]
    Known[Known information]
    Inferred[Reasonably inferred information]
    Unknown[Unknown information]
    AcademicInfo[Structured academic information]
    Planner[AI Planner]
    Useful[Useful recommendation]
    Later[Later]
    Backlog[Backlog]

    Journal ==> AI
    AI ==> Known
    AI ==> Inferred
    AI ==> Unknown

    Known ==> AcademicInfo
    Inferred ==> AcademicInfo
    Unknown ==> AcademicInfo

    AcademicInfo ==> Planner
    Planner ==> Useful
    Planner ==> Later
    Planner ==> Backlog
```

- When deadline or duration is unknown, it remains empty.
- If plannability is low, the item is routed to **Backlog** or **Later**.

---

### 8. User Interface and Navigation

Defines the screen navigation model: Calendar View is the interactive home, while Notes View allows browsing and editing entries by course and date.

```mermaid
flowchart TD
    Student[Student]
    Calendar[Calendar View]
    Notes[Notes View]
    Course[Select course or class]
    Journal[Write or edit journal entry]
    Plan[View recommended tasks]
    Events[View academic events]
    Classes[View class schedule]
    Browse[Browse journal entries by course and date]
    Editor[Interactive journal editor]
    Stored[Course-linked journal entry]

    Calendar ==> Course
    Course ==> Journal
    Journal ==> Stored
    Stored ==> Notes

    Student -.-> Calendar
    Student -.-> Notes
    Calendar -.-> Plan
    Calendar -.-> Events
    Calendar -.-> Classes
    Notes -.-> Browse
    Browse -.-> Editor
```

---

### 9. Complete MVP Workflow

Shows the complete end-to-end user lifecycle from app startup to student feedback and AI reconsideration.

```mermaid
flowchart TD
    Start[Student opens Nyare]
    Calendar[Calendar View]
    StatusCheck[Check pending dirty notes status]
    Class[Student selects a course or class]
    Journal[Student writes or edits entry with entryDate]
    Save[Save entry]
    Process{Student clicks Process?}
    Stored[Entry remains saved]
    Scope[Select pending dirty notes]
    Extract["AI extracts Tasks / Events / Context chronologically"]
    AcademicInfo[Save academic information]
    Planner[AI plans study recommendations from today]
    StudyPlan[Generate Study Plan]
    Display[Display recommendations]
    Feedback[Student may provide feedback]
    Reconsider[AI reconsideration]

    Start ==> Calendar
    Calendar -.-> StatusCheck
    Calendar ==> Class
    Class ==> Journal
    Journal ==> Save
    Save ==> Process
    Process ==>|Yes| Scope
    Scope ==> Extract
    Extract ==> AcademicInfo
    AcademicInfo ==> Planner
    Planner ==> StudyPlan
    StudyPlan ==> Display
    Display ==> Calendar

    Process -.->|No| Stored
    Stored -.-> Planner
    Display -.-> Feedback
    Feedback -.-> Reconsider
    Reconsider -.-> StudyPlan
```

*Sequential Flow*: When the student clicks Process, the system retrieves all pending dirty notes and processes them chronologically date by date. It cleans prior uncompleted entities for edited notes, extracts fresh entities, and runs study planning anchored to `LocalDate.now()` to schedule tasks on upcoming dates.

*Feedback Loop*: When the student provides feedback (e.g. *"I have no time tonight"*), the feedback is incorporated into the planning context and the AI reconsiders task recommendations.
