# Implementation Plan: AI Extraction Deduplication Guard

**Branch**: `012-ai-extraction-dedup` | **Date**: 2026-10-22 | **Spec**: [spec.md](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/specs/012-ai-extraction-dedup/spec.md)

**Input**: Feature specification from `/specs/012-ai-extraction-dedup/spec.md`

## Summary

Prevent duplicate task, event, and academic context creation when student journal notes repeat already-recorded items. Implement a dual-layer deduplication guard:
1. **System Prompt Layer**: Refine `planner_sys-prompt.st` using the `prompt-engineering` skill to instruct the model to compare notes against `{tasks}`, `{events}`, and `{contexts}` within the same course, omitting duplicates and promoting/updating tasks without rewriting titles or clearing existing dates.
2. **Application Logic Layer**: Implement deterministic deduplication in `StudyPlannerServiceImpl.java` and `StudyPlannerEngine.java` to enforce FR-001 through FR-012, guaranteeing zero duplicates for restated items, safe updates when new dates/durations are provided, and proper intra-batch deduplication.

## Technical Context

**Language/Version**: Java 25 (toolchain)  
**Primary Dependencies**: Spring Boot 4.1.1, Spring AI 2.0.0, Spring Data JPA, SQLite  
**Storage**: SQLite (`nyare.db` via JPA/Hibernate; shared in-memory SQLite for tests)  
**Testing**: JUnit 5, Mockito, AssertJ (`./gradlew test --tests ...`)  
**Target Platform**: JVM (Windows / Linux)  
**Project Type**: Web service / REST API  
**Performance Goals**: Sub-second deterministic deduplication overhead per extraction batch  
**Constraints**: Zero data loss, never clear existing task dates/durations on empty restatements, never modify student titles/descriptions, RFC 7807 error responses  
**Scale/Scope**: Scope bounded to `planner_sys-prompt.st`, `StudyPlannerEngine.java`, `StudyPlannerServiceImpl.java`, and corresponding unit tests  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I (Virtual Study Plan & Tri-State Planning)**: Tri-state (`SCHEDULED`, `LATER`, `BACKLOG`) derived from `scheduledDate` and `duration`. No database table added.
- [x] **Principle II (Course Anchor & Single Parentage)**: Deduplication is strictly scoped per `Course`. No orphaned records.
- [x] **Principle III (Grounded Uncertainty Preservation)**: Missing dates or durations remain null. Never fabricate values.
- [x] **Principle IV (Non-Destructive Additive Planning)**: Preserves existing task titles and descriptions. Never mutates student text. Modifies only `scheduledDate` and `duration` when new info arrives. Never clears existing values on restatement.
- [x] **Principle V (Strict Architectural Layer Isolation)**: Controller touches only service interface. Entities do not leave service layer. DTOs and internal records only.
- [x] **Principle VI (Canonical Error Strategy)**: Uses standard exceptions (`BadRequestException`, `ResourceNotFoundException`).
- [x] **Principle VII (Ponytail Minimalism & Native Features)**: Shortest working solution using Java standard string normalization and streams. No unnecessary libraries or vector embeddings.
- [x] **Principle VIII (Evidence-First Verification & Surgical Edits)**: Edits strictly focused on deduplication logic. Tests run and verified with gradle commands.

## Project Structure

### Documentation (this feature)

```text
specs/012-ai-extraction-dedup/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── planner-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app/
├── src/main/resources/
│   └── planner_sys-prompt.st                       # Updated system prompt with deduplication rules
├── src/main/java/group/four/nyare/nyare/
│   ├── ai/
│   │   ├── StudyPlannerEngine.java                 # Decoding, reference mapping, and deduplication helpers
│   │   └── PlannerAuditRecords.java                # LLM payload records
│   └── service/impl/
│       └── StudyPlannerServiceImpl.java            # Deterministic dedup & update enforcement during note processing
└── src/test/java/group/four/nyare/nyare/
    ├── ai/
    │   └── StudyPlannerEngineTest.java             # Unit tests for prompt building & decoding
    └── service/
        └── StudyPlannerServiceImplTest.java        # Comprehensive unit tests for deduplication scenarios
```

## Implementation Phases

### Phase 0: Research & Architecture (Complete)
- Evaluated dual-layer approach: Prompt instructions + deterministic Java logic (FR-012).
- Grounded prompt changes in `prompt-engineering` and `asd-ste100` guidelines.
- Grounded code changes in Spring layer isolation and Ponytail minimalism (YAGNI).
- Produced `research.md`.

### Phase 1: Design & Contracts (Complete)
- Defined data model and matching transitions in `data-model.md`.
- Specified contract details in `contracts/planner-contract.md`.
- Created end-to-end verification plan in `quickstart.md`.

### Phase 2: Implementation (To be generated by /speckit-tasks)
1. **System Prompt Refinement**: Update `planner_sys-prompt.st` to instruct the model on deduplicating tasks, events, and contexts against `{tasks}`, `{events}`, and `{contexts}`.
2. **Deterministic Deduplication Logic**:
   - Update `StudyPlannerServiceImpl.java` to match candidate tasks against existing open tasks in the same course, ensuring titles/descriptions are untouched, existing dates/durations are preserved, and new info updates fields properly.
   - Add deterministic deduplication for `AcademicEvent` (drop duplicates or update changed deadline per FR-010) and `AcademicContext` (drop duplicates).
   - Implement intra-batch deduplication for all entity types across multiple dirty notes.
3. **Automated Testing & Verification**:
   - Add unit tests to `StudyPlannerServiceImplTest.java` verifying all acceptance scenarios (SC-001 through SC-005).
   - Verify prompt parsing and entity decoding in `StudyPlannerEngineTest.java`.
