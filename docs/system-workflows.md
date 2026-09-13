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
| 5 | [Study Plan & Calendar Relationship](#5-study-plan-and-calendar-relationship) | UI mapping to Calendar grid, Later area, and Needs Context area |
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

Details how student notes transition into structured database entities. Processing is **explicit** (triggered by the student clicking "Process") and strictly scoped to **today's journal entries**.

```mermaid
flowchart TD
    Student[Student writes a journal entry]
    Save[Save entry]
    Stored[Stored course-linked journal entry]
    Process[Student clicks Process]
    Scope[Select today's journal entries]
    AI[AI extracts academic information]
    Task[Task]
    Event[Academic Event]
    Context[Academic Context]
    Store[Save extracted information]

    Student --> Save
    Save --> Stored
    Stored ==> Process
    Process ==> Scope
    Scope ==> AI
    AI ==> Task
    AI ==> Event
    AI ==> Context
    Task ==> Store
    Event ==> Store
    Context ==> Store
```

---

### 4. AI Planning Workflow

Shows how the AI Planner selects and orders tasks into a coherent Study Plan. The planner takes into account newly processed notes, existing tasks, academic events, class schedules, and course context.

```mermaid
flowchart TD
    Today["Today's processed information"]
    Planner[AI Planner]
    Existing["Existing Tasks / Events / Context"]
    Courses[Course relationships]
    Schedule[Class Schedule]
    Select[Select relevant tasks]
    Order[Order recommended tasks]
    Plan[Study Plan]
    Scheduled[Scheduled recommendations]
    Later[Flexible / Later]
    ContextNeeded[Needs Context]

    Today ==> Planner
    Existing -.-> Planner
    Courses -.-> Planner
    Schedule -.-> Planner

    Planner ==> Select
    Select ==> Order
    Order ==> Plan

    Plan ==> Scheduled
    Plan ==> Later
    Plan ==> ContextNeeded
```

---

### 5. Study Plan and Calendar Relationship

Illustrates the tri-state routing of Study Plan recommendations onto the user interface.

```mermaid
flowchart LR
    Plan[Study Plan]
    Dated[Dated recommendations]
    Flexible["Flexible / Later recommendations"]
    NeedsContext[Needs Context recommendations]
    Calendar[Calendar dates]
    LaterArea["Later / Undated area"]
    ContextArea[Needs Context area]
    Events["Academic Events / Deadlines"]
    Classes[Class Schedule]

    Plan ==> Dated
    Plan ==> Flexible
    Plan ==> NeedsContext
    Dated ==> Calendar
    Flexible ==> LaterArea
    NeedsContext ==> ContextArea

    Events -.-> Calendar
    Classes -.-> Calendar
```

- **Calendar Grid**: Displays class meeting times, rigid Academic Events / Deadlines, and **Scheduled** tasks with recommended dates.
- **Later Area**: Displays actionable **Flexible / Later** tasks without specific target dates.
- **Needs Context Area**: Displays actionable items that require additional information before confident planning can occur.

---

### 6. Information and Planning Boundaries

Defines how the system preserves integrity by treating materialization as append-only. Recommendations **do not automatically overwrite or reconcile** existing records.

```mermaid
flowchart TD
    Journal[Journal Entry]
    Extract[AI extracts information]
    Task[Task]
    Event[Academic Event]
    Context[Academic Context]
    State[Current Academic Information]
    Planner[AI Planner]
    Recommendations[Recommended Tasks]

    Journal ==> Extract
    Extract ==> Task
    Extract ==> Event
    Extract ==> Context

    Task ==> State
    Event ==> State
    Context ==> State
    State ==> Planner
    Planner ==> Recommendations

    Recommendations -.->|Does not automatically rewrite| Task
    Recommendations -.->|Does not automatically rewrite| Event
    Recommendations -.->|Does not automatically rewrite| Context
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
    Flexible[Flexible / Later]
    NeedsContext[Needs Context]

    Journal ==> AI
    AI ==> Known
    AI ==> Inferred
    AI ==> Unknown

    Known ==> AcademicInfo
    Inferred ==> AcademicInfo
    Unknown ==> AcademicInfo

    AcademicInfo ==> Planner
    Planner ==> Useful
    Planner ==> Flexible
    Planner ==> NeedsContext
```

- When deadline or duration is unknown, it remains empty.
- If plannability is low, the item is routed to **Needs Context** or **Flexible / Later**.

---

### 8. User Interface and Navigation

Defines the screen navigation model: Calendar View is the interactive home, while Notes View is a read-only browser.

```mermaid
flowchart TD
    Student[Student]
    Calendar[Calendar View]
    Notes[Notes View]
    Course[Select course or class]
    Journal[Write journal entry]
    Plan[View recommended tasks]
    Events[View academic events]
    Classes[View class schedule]
    Browse[Browse journal entries by course]
    Read[Read-only journal view]
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
    Browse -.-> Read
```

---

### 9. Complete MVP Workflow

Shows the complete end-to-end user lifecycle from app startup to student feedback and AI reconsideration.

```mermaid
flowchart TD
    Start[Student opens Nyare]
    Calendar[Calendar View]
    Class[Student selects a course or class]
    Journal[Student writes a journal entry]
    Save[Save entry]
    Process{Student clicks Process?}
    Stored[Entry remains saved]
    Scope[Process today's entries]
    Extract["AI extracts Tasks / Events / Context"]
    AcademicInfo[Save academic information]
    Planner[AI considers current academic situation]
    StudyPlan[Generate Study Plan]
    Display[Display recommendations]
    Feedback[Student may provide feedback]
    Reconsider[AI reconsideration]

    Start ==> Calendar
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

*Feedback Loop*: When the student provides feedback (e.g. *"I have no time tonight"*), the feedback is incorporated into the planning context and the AI reconsiders task recommendations without mutating underlying Task or Event records.
