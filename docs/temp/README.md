# Temporary Architectural Notes (Backend & AI Architecture Drafts)

This directory contains exploratory, uncommitted architectural drafts for **Backend Service Architecture & AI Workflows**. 

These documents are **not yet finalized** and serve as a working reference until design decisions are confirmed.

---

## Contents

1. [`backend-domain-model-draft.md`](backend-domain-model-draft.md)
   - JPA entity mappings for `Course`, `Schedule`, `Note`, `Task`, `AcademicEvent`, and `AcademicContext`.
   - Structural design for `AcademicEvent` taxonomy (`Deadline`, `Exam`, `Quiz`, etc.).
   - Specification of `StudyPlan` as a non-persisted virtual DTO.

2. [`ai-workflows-draft.md`](ai-workflows-draft.md)
   - Proposed REST API contracts for AI extraction (`/api/ai/process-today`) and planning (`/api/ai/plan`).
   - Input payload and response structures for the tri-state study plan (`scheduled`, `flexible`, `needsContext`).
   - Ingestion contract for student feedback loops.

3. [`backend-agents-guide-draft.md`](backend-agents-guide-draft.md)
   - Proposed updates to `backend/AGENTS.md` aligning backend development agents with the conceptual model and MVP boundaries.
