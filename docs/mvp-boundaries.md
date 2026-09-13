# Nyare MVP Boundaries & Non-Goals

To maintain simplicity, predictability, and development velocity, Nyare enforces strict architectural boundaries for its MVP. These boundaries define what the system **deliberately does not do**.

---

## 1. No Micro-Scheduling / Time-Blocking

* **Boundary**: Nyare performs **high-level planning**, not automated calendar time-blocking.
* **What We Do**: Suggest a recommended calendar date (`Task.scheduledDate`) for working on a task, or categorize it as **Flexible / Later** or **Needs Context**.
* **What We Do NOT Do**:
  - Do NOT allocate specific hourly start and end times (e.g., *"Study calculus from 7:00 PM to 8:30 PM"*).
  - Do NOT automatically manipulate calendar blocks or rearrange open hour slots.
* **Rationale**: Students rarely adhere to rigid time blocks. Day-level recommendation provides actionable guidance while respecting the student's personal autonomy.

---

## 2. No Automated Task Reconciliation, Merging, or Splitting

* **Boundary**: Information extraction is **append-only** and additive.
* **What We Do**: Extract newly mentioned tasks, academic events, and academic context from current notes and persist them as fresh records.
* **What We Do NOT Do**:
  - Do NOT build an autonomous deduplication or merge engine that attempts to detect if a new note refers to an existing task.
  - Do NOT automatically mutate or overwrite previously saved tasks when new information arrives.
  - Do NOT split large tasks into subtasks automatically.
* **Rationale**: General-purpose automated task reconciliation is error-prone and causes unexpected data mutations. Existing academic information is used as **context for planning**, not as targets for automated rewriting.

---

## 3. No Deterministic Priority Scoring Engine

* **Boundary**: The AI Planner reasons directly from available academic facts; it does not compute a static priority score.
* **What We Do**: Allow the LLM planner to reason holistically using imminent deadlines, course syllabus context, current progress, and student feedback.
* **What We Do NOT Do**:
  - Do NOT implement a rigid weighted arithmetic formula (e.g., `Priority = (Weight * 0.4) + (DaysRemaining * 0.3) - (Duration * 0.1)`).
  - Do NOT store or expose a static numerical priority field in the database.
* **Rationale**: Academic priorities are contextual and dynamic. A rigid formula struggles with nuanced situations (such as dependencies, prerequisite topics, or sudden student exhaustion) that LLM reasoning handles naturally.

---

## 4. No Mandatory Recurring Availability Calendars

* **Boundary**: The MVP does not demand complex availability scheduling from the student.
* **What We Do**: Plan around fixed class schedules and rigid academic events (deadlines, exams). Incorporate student feedback (e.g., *"I have no time today"*) on the fly.
* **What We Do NOT Do**:
  - Do NOT require students to configure recurring hourly availability matrices (e.g., Monday 6-9 PM available, Tuesday busy).
* **Rationale**: Requiring extensive availability setup creates excessive friction for students before they receive any value from the application.

---

## 5. No Study Plan Persistence Entity

* **Boundary**: The **Study Plan is NOT a separate database entity**.
* **What We Do**: Dynamically generate the Study Plan as a virtual response DTO that groups tasks into **Scheduled**, **Flexible / Later**, and **Needs Context**.
* **What We Do NOT Do**:
  - Do NOT create a `study_plans` table or database entity.
  - Do NOT persist historical snapshots of generated plans in the database.
* **Rationale**: Persisting a separate StudyPlan entity creates redundant state and synchronization headaches whenever tasks are completed, edited, or re-planned.

---

## 6. Strict Uncertainty Preservation (Zero Hallucination)

* **Boundary**: Incomplete information must remain uncertain.
* **What We Do**: Retain `null` or unassigned fields when deadlines, durations, or details are absent. Place ambiguous tasks in **Needs Context** or **Flexible / Later**.
* **What We Do NOT Do**:
  - Do NOT hallucinate or guess a deadline if one was not stated or reasonably inferred.
  - Do NOT invent estimated durations or priorities just to fit a task into a calendar slot.
* **Rationale**: Trust in an academic planner is broken immediately if it presents fabricated deadlines or false constraints.

---

## 7. Strict Processing Scope (Today's Notes Only)

* **Boundary**: AI extraction is user-initiated and bounded to the current day.
* **What We Do**: When the student clicks "Process", only notes with `createdAt` matching the current day are submitted for entity extraction.
* **What We Do NOT Do**:
  - Do NOT run continuous background scraping of all historical journal notes.
  - Do NOT re-process past weeks' entries on every execution.
* **Rationale**: Scoping processing to the current day provides predictable operational boundaries, minimizes token costs, and keeps the student in explicit control of what the AI processes.
