# Nyare

Nyare is a **calendar-first academic planning assistant**. Students use their class schedule to navigate courses, write course-linked journal entries, and receive AI-generated study recommendations.

## Core Concept

```text
Course Schedule
      ↓
Course-linked Journal
      ↓
AI Processing
      ↓
Tasks / Academic Events / Academic Context
      ↓
AI Planning
      ↓
Study Plan
      ↓
Calendar View
```

## Core Model

- **Course** contains class schedules, journal entries, tasks, academic events, and academic context.
- **Journal Entry** is always associated with a course.
- **Task** represents something the student needs to do.
- **Academic Event** represents something happening at a specific time. A **Deadline** is a type of Academic Event.
- **Academic Context** is information about the student's academic situation that helps AI understand and plan.
- **Study Plan** is a group of recommended tasks displayed in the UI, not a separate entity.

## AI Behavior

- AI processing is explicitly triggered by the user.
- Processing applies only to the **current day's journal entries**.
- AI may extract Tasks, Academic Events, and Academic Context.
- The AI Planner considers existing academic information when generating recommendations.
- AI reasons from available information rather than relying on a deterministic priority-scoring system.
- Missing information must remain uncertain. Do not invent deadlines, dates, or other facts.
- Academic Context is time-aware. Older context may become less relevant as new information is absent or emerges.

## UI

- **Calendar View** is the main view. It displays class schedules, Academic Events, and recommended tasks.
- **Notes View** is read-only and lets users browse their course-linked journal entries.
- Tasks in the Study Plan may appear as:
    - **Scheduled**: recommended for a specific date.
    - **Later**: recommended without a specific date.
    - **Needs Context**: actionable but lacking enough information for confident planning.

Deadlines are rigid academic constraints. Recommended task dates are flexible recommendations.

## Planning

Study Plan recommendations may be:

- **Scheduled**: recommended for a specific date.
- **Flexible / Later**: recommended without a specific date.
- **Needs Context**: actionable information exists, but insufficient context prevents confident planning.

Deadlines are rigid academic constraints. Recommended dates are flexible planning recommendations.

Nyare performs **high-level planning**, not automatic time-blocking.

## MVP Boundaries

- Do not automatically update, merge, split, or reconcile existing tasks from new information.
- Do not build a deterministic task-priority scoring system.
- Do not require detailed recurring availability schedules.
- Do not treat the Study Plan as a separate persistence model.
- Keep the system simple for both users and developers.