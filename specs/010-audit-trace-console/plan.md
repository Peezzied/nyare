# Implementation Plan: Dev Audit Trace Console

**Branch**: `010-audit-trace-console` | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-audit-trace-console/spec.md` with backend-strictly Thymeleaf dashboard, request origin tracking, and CRUD mutation auditing.

## Summary

Build an in-service developer audit trace console for Nyare that lives strictly inside the backend using Thymeleaf. Rather than scraping terminal logs or intercepting console output, the system taps directly into `PlannerAuditAdvisor`, `StudyPlannerServiceImpl`, and core entity mutation services via Spring's `ApplicationEventPublisher`. The dev implementation resides in the `app/src/dev` sourceSet under package `group.four.nyare.nyare.dev` and templates in `src/dev/resources/templates/dev/`, with Thymeleaf added via `devImplementation`. The frontend remains 100% untouched. The console retains 500 in-memory events, tracks initiating user ID and trigger source (`WEB_SESSION`, `SYSTEM_JOB`), captures CRUD mutations and tombstones, streams live audits and lifecycle boundaries over SSE, captures unhandled exceptions with root-cause diagnostics, and walks database relations across Course, Note, Task, AcademicEvent, and Image records.

## Technical Context

**Language/Version**: Java 25 (toolchain)
**Primary Dependencies**: Spring Boot 4.1.1 (`webmvc`, `data-jpa`, `validation`), Spring AI 2.0.0, `devImplementation 'org.springframework.boot:spring-boot-starter-thymeleaf'`
**Storage**: SQLite with HikariCP (in-memory circular buffer for 500 audit events in dev sink; read-only JPA queries for entity walking)
**Testing**: JUnit 5, Mockito, AssertJ
**Target Platform**: Local developer workstation (browser visiting `http://localhost:8080/dev/audit-trace`)
**Project Type**: Server-rendered developer tooling (Spring Boot MVC + Thymeleaf)
**Performance Goals**: <1% planning duration overhead; audit feed interactive with 500 entries in <1s; trace record resolution <5s
**Constraints**: Strictly read-only on database; zero dev endpoints, templates, or Thymeleaf dependencies in production `bootJar`; zero frontend changes; mobile/desktop responsive UI
**Scale/Scope**: Dev-only single-user environment; 500 retained audit events; max 50 items per relation group

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Rule | Status | Validation Notes |
|---|---|---|
| **I. Virtual Study Plan** | **PASS** | `StudyPlan` remains virtual. Dev console inspects derived task categories and attributes; no study plan DB table created. |
| **II. Course Anchor** | **PASS** | Course remains the root anchor. Course list serves as primary root entry point for database navigation. |
| **III. Grounded Uncertainty** | **PASS** | Inferred matches (matched by title) are explicitly flagged as `isExact=false`. Missing dates/deadlines remain null. |
| **IV. Non-Destructive Additive Planning** | **PASS** | Console is strictly read-only (`@Transactional(readOnly = true)`). Zero create, update, or delete operations on student data. |
| **V. Architectural Layer Isolation** | **PASS** | Unidirectional flow: `DevAuditTraceController` delegates to `DevAuditTraceService`. Entities never escape service layer (mapped to `TraceNodeDto`). |
| **VI. Canonical Error Strategy** | **PASS** | Dev endpoints throw only canonical `ResourceNotFoundException` / `BadRequestException` translating to RFC 7807 problem details. |
| **VII. Ponytail Minimalism & Native Features** | **PASS** | No new production dependencies added. Thymeleaf scoped to `devImplementation`. Reuses Spring `ApplicationEventPublisher` and native SSE `SseEmitter`. |
| **VIII. Evidence-First Verification & Surgical Edits** | **PASS** | Production service modifications are surgical (event publishing hooks only). Dev code resides in `src/dev`. |
| **IX. Domain Rule Alignment** | **PASS** | Adheres to Nyare 24-color course palette and entity relationships. |
| **X. Dev Rules vs Presentation Separation** | **PASS** | **Exemplary compliance**: Frontend remains 100% clean and production-pure with zero dev views or route guards. The dev dashboard lives strictly inside `app/src/dev`. |

## Project Structure

### Documentation (this feature)

```text
specs/010-audit-trace-console/
├── plan.md              # Implementation plan
├── research.md          # Phase 0: Technical decisions & trade-offs
├── data-model.md        # Phase 1: Event records & DTO schemas
├── quickstart.md        # Phase 1: End-to-end validation scenarios
├── contracts/           # Phase 1: Thymeleaf view & SSE/REST contracts
│   └── audit-trace.contract.md
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code Layout

```text
app/
├── build.gradle                                     # Adds devImplementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
├── src/main/java/group/four/nyare/nyare/
│   ├── ai/
│   │   ├── advisor/
│   │   │   └── PlannerAuditAdvisor.java             # Publishes AuditTraceEvent for extracted audits
│   │   └── event/
│   │       ├── AuditTraceEvent.java                 # Structured domain event record with user origin
│   │       ├── AuditCategory.java                   # LIFECYCLE, TASK_PLANNING, DATA_MUTATION, etc.
│   │       ├── AuditSeverity.java                   # INFO, WARN, ERROR
│   │       ├── MutationAction.java                  # CREATE, UPDATE, DELETE, ARCHIVE
│   │       ├── TriggerSource.java                   # WEB_SESSION, SYSTEM_JOB
│   │       ├── LifecycleState.java                  # STARTED, COMPLETED, FAILED, CANCELLED
│   │       └── ErrorDiagnostic.java                 # Exception diagnostics record
│   └── service/impl/
│       ├── StudyPlannerServiceImpl.java             # Publishes LIFECYCLE start/end, error, and user origin
│       ├── CourseServiceImpl.java                   # Publishes DATA_MUTATION on create, update, delete, archive
│       ├── NoteServiceImpl.java                     # Publishes DATA_MUTATION on note save/delete
│       └── TaskServiceImpl.java                     # Publishes DATA_MUTATION on task create, update, delete
└── src/dev/                                         # DEV-ONLY SOURCE SET (Zero production leakage)
    ├── java/group/four/nyare/nyare/dev/
    │   ├── controller/
    │   │   └── DevAuditTraceController.java         # Serves /dev/audit-trace (Thymeleaf) & SSE / JSON APIs
    │   ├── service/
    │   │   ├── DevAuditTraceService.java            # Interface for audit feed & relation walking
    │   │   └── impl/
    │   │       ├── DevAuditTraceServiceImpl.java
    │   │       └── DevTraceWalker.java              # Resolves entity relations & tombstones via repositories
    │   ├── sink/
    │   │   └── DevAuditTraceSink.java               # @EventListener circular buffer (500 events)
    │   └── dto/
    │       ├── AuditTraceEventDto.java
    │       ├── TraceNodeDto.java
    │       ├── TraceRelationGroupDto.java
    │       ├── TraceNodeStubDto.java
    │       └── CourseTraceSummaryDto.java
    └── resources/
        ├── templates/dev/
        │   └── dashboard.html                       # Server-rendered Thymeleaf dashboard (Parchment theme)
        └── static/dev/
            ├── dashboard.css                        # Nyare warm aesthetic styling
            └── dashboard.js                         # Lightweight vanilla JS for SSE stream & DOM updates
```

## Complexity Tracking

*No constitution violations. Reuses existing sourceSet and native framework features. Zero frontend impact.*
