<!--
SYNC IMPACT REPORT
==================
- Version: 1.1.0 → 1.2.0 (Separation of Development Environment Rules from Presentation Components)
- Version: 1.2.0 → 1.3.0 (Courses now expose create, update, and delete endpoints)
- Version: 1.3.0 → 1.4.0 (Course archive state and archive endpoints)
- Status: Amended
- Principles Ratified / Modified:
  * I. Virtual Study Plan and Tri-State Planning (Preserved)
  * II. Course Anchor and Single Parentage (Modified)
  * III. Grounded Uncertainty Preservation (Preserved)
  * IV. Non-Destructive Additive Planning (Preserved)
  * V. Strict Architectural Layer Isolation (Preserved)
  * VI. Canonical Error Strategy (Preserved)
  * VII. Ponytail Minimalism and Native Features (Preserved)
  * VIII. Evidence-First Verification and Surgical Edits (Preserved)
  * IX. Frontend-Backend Domain Rule Alignment (Preserved)
  * X. Separation of Development Environment Rules from Presentation Components (Added)
- Sections Modified:
  * Core Principles: Added Principle X
  * Frontend Architecture and State Management: Added pure untainted view standards
- Follow-up TODOs:
  * None
-->

# Nyare Constitution

## Core Principles

### I. Virtual Study Plan and Tri-State Planning
The system does not persist a study plan table in the database.
The application computes the study plan dynamically at the presentation layer.
Developers must derive the planning state for each task from task attributes:
- `SCHEDULED`: The task has a scheduled date.
- `LATER`: The task has a duration and no scheduled date.
- `BACKLOG`: The task lacks both a scheduled date and a duration.
The planner recommends tasks with day-level granularity.
Developers must not build hourly time-blocking or micro-scheduling features.
Rationale: Day-level suggestions give actionable guidance and protect student autonomy.

### II. Course Anchor and Single Parentage
The `Course` entity serves as the root container for all academic items.
Every journal note, schedule, task, academic event, and context fact links to exactly one course.
Developers must not create orphaned academic records.
Deleting a course removes all associated records through cascade rules.
A course also holds a non-destructive archived state.
Archiving hides the course and its records from active views without deleting them.
Rationale: Single-course parentage simplifies data flow and prevents cross-course synchronization defects.

### III. Grounded Uncertainty Preservation
The system must never invent or fabricate deadlines, durations, or priority ratings.
The AI engine preserves missing information as unknown state.
When notes do not state a deadline, the deadline remains empty.
Developers must not introduce static numerical priority scoring algorithms.
The planner routes uncertain items into `BACKLOG` or `LATER` categories.
The system estimates durations only when notes provide context or when standard setup baselines apply.
Rationale: Fabricated constraints destroy student trust in the academic planner.

### IV. Non-Destructive Additive Planning
The AI planner extracts new entities without mutating existing student text.
The planner must never rewrite, merge, or divide student task titles or descriptions.
The planner modifies only `scheduledDate` and `duration` fields on open tasks.
The planner generates preparation tasks for upcoming academic events within a 14-day window.
The planner generates preparation tasks only when no open tasks exist for that course.
Rationale: Automated task reconciliation creates unexpected data corruption and confuses users.

### V. Strict Architectural Layer Isolation
The backend follows four isolated architectural layers with unidirectional dependencies.
Controllers accept HTTP requests and delegate work to service interfaces.
Controllers must never inject repositories or interact with JPA entities.
Services map between internal JPA entities and public transfer objects.
Entities must never leave the service layer.
Repositories encapsulate database queries and return JPA entities.
Rationale: Layer isolation prevents tight coupling and protects persistence contracts.

### VI. Canonical Error Strategy
Developers must not create custom exception classes for individual entities or features.
The service layer throws only `ResourceNotFoundException` or `BadRequestException`.
The `GlobalExceptionHandler` formats all errors into RFC 7807 problem detail responses.
Controllers must not catch domain runtime exceptions.
Rationale: Centralized exception translation avoids exception explosion and standardizes API error contracts.

### VII. Ponytail Minimalism and Native Features
Developers must write minimal code that satisfies requirements.
Developers must select standard library features and platform APIs before introducing external dependencies.
The frontend must not install Pinia or Axios.
The frontend uses native `fetch` and Vue composables with reactive references.
The client derives task categories locally without calling redundant backend endpoints.
Developers must eliminate dead code that current edits create.
Rationale: Unneeded abstractions increase maintenance costs and decrease team velocity.

### VIII. Evidence-First Verification and Surgical Edits
Developers and agents must produce command execution evidence before claiming task completion.
Developers must isolate the root cause before editing code.
Edits must touch only the lines required to satisfy the task.
Developers must not reformat adjacent unaffected code or comments.
Developers must verify tests before and after structural refactoring to prove behavior preservation.
Rationale: Speculative edits and unverified claims introduce software defects and waste engineering effort.

### IX. Frontend-Backend Domain Rule Alignment
Frontend components and composables must follow all backend domain rules without exception.
Developers must not bypass backend business logic or build conflicting client behaviors.
The client derives planning categories (`SCHEDULED`, `LATER`, `BACKLOG`) locally from task fields.
The client must never persist virtual entities or request backend endpoints for derived study plans.
The user interface must not offer hourly time-blocking or numerical priority scores.
The frontend displays tasks with day-level granularity only.
The client preserves missing dates as blank values without default dates.
Frontend views must link all academic items to a parent course.
Rationale: Client domain deviations corrupt data contracts and break planner behavior.

### X. Separation of Development Environment Rules from Presentation Components
Views and components must remain pure, production-grade representations of domain interactions.
Developers must never embed development-specific branching, environment variables (`import.meta.env.DEV`, `VITE_DEV_USER`), or development-mode conditional markup directly into views or presentation components.
Development-mode rules, account protections, and mock constraints must reside exclusively at the service boundary, API layer, composables, or dedicated developer tooling.
Components must rely on standard domain responses, error states, and contracts.
Rationale: Leaking development flags and mock conditionals into UI components degrades maintainability, breaks UI test fidelity, and pollutes production view code.

## Architectural Standards and System Boundaries

### Backend Architecture
The backend runs on Java 25 and Spring Boot 4.1.1.
All subpackages use lowercase names exclusively.
Services declare class-level `@Transactional(readOnly = true)` annotations.
Mutating service methods declare explicit `@Transactional` annotations.
Services use constructor injection with private final fields.
SQLite uses HikariCP with a maximum pool size of 1.
Hibernate disables open-in-view to restrict database sessions to service transactions.
Developers must use batch queries and in-memory maps to prevent N+1 query loops.
All entity associations must declare lazy fetching.

### Frontend Architecture and State Management
The frontend runs on Vue 3, Vite, TypeScript, and Tailwind CSS 4.
The user interface targets a mobile-first viewport of 390 pixels width.
Components use `<script setup lang="ts">` and the Composition API.
Composables manage application state using `ref` and `reactive` primitives.
The client proxies `/api` endpoints to port 8080 during development.
The client streams planning events from `POST /api/study-planner/process` using native fetch.
The application assigns course colors deterministically using a 24-color palette modulo course identifier.
The frontend derives all study plan presentations dynamically from cached tasks.
Components calculate task planning categories using `getPlanCategory()`.
The client must not create time-blocking grids or numerical priority calculations.

### Frontend Data Flow and Cache Conventions
The client loads entity lists once per user intent.
Mutation handlers update local reactive state directly from saved response transfer objects.
Components must not refetch complete lists after create, update, or delete mutations.
Courses provide create, update, delete, archive, and unarchive endpoints.
The client caches courses and schedules inside `useCatalog`.
The client refetches courses or schedules only after catalogue mutations.
Developers must filter collections on the server with backend query parameters.
The client must not request full entity collections when server query parameters exist.
The backend exposes date range query parameters (from, to) on task, note, and event list endpoints.
The client filters calendar dates and deadline windows in memory from cached collections.
After planner execution, the client refetches tasks and academic events only for courses in `affectedCourseIds`.
If the planner summary shows positive item counts without course identifiers, the client queries all tasks and events.
Components must not call single-item retrieval endpoints inside collection loops.

### Mobile Design System and Touch Standards
All interactive buttons and icon elements must provide a minimum 44-pixel touch target.
The layout enforces an 8-pixel spacing rhythm across all containers.
Tactile buttons use a 4-pixel solid bevel border with active downward translation.
The application enforces DynaPuff for brand marks, Quicksand for user controls, and Inter for notes.
The calendar displays course schedules in tinted backgrounds, events in solid fills, and tasks in cards.
Mobile rich text editing uses a toolbar docked above the software keyboard.

### System Processing Boundaries
The user initiates processing explicitly through the user interface.
The system processes dirty notes within a 14-day backdating horizon.
The AI pipeline processes dirty notes in chronological order date by date.
The planner anchors final study recommendations to the current calendar date.
The system cleans prior uncompleted entities before saving new extractions for edited notes.

## Verification, Tooling, and Quality Gates

### Three-Tier Verification Hierarchy
Developers and agents must validate code changes through a three-tier execution hierarchy:
1. **Tier 1 (IntelliJ MCP)**: Execute static analysis, symbol navigation, and in-memory compilation.
2. **Tier 2 (Targeted CLI)**: Execute single test methods or targeted Java compilation tasks.
3. **Tier 3 (Full Build)**: Execute full Gradle builds only as a strict last resort.

### Testing Standards
Service unit tests use JUnit 5 and Mockito with zero Spring context overhead.
Controller tests use `@WebMvcTest` and mock service interfaces with `@MockitoBean`.
Controller tests must never mock concrete service implementation classes.
Developers and agents must execute integration tests one at a time.
The agent must ask the user before running additional integration tests.
Frontend unit tests execute inside Vitest using the jsdom environment.
Frontend code enforces Prettier formatting without semicolons, using single quotes and two-space indents.
Developers must execute Oxlint and TypeScript compiler checks during component edits.

### Investigation and Systematic Debugging
Developers and agents must identify the failure mechanism before proposing code fixes.
The developer must formulate testable hypotheses and inspect failure traces.
The developer must create a reproducing test case for reported defects.
Agents must not propose speculative fixes without root cause proof.

### Surgical Edits and Safe Refactoring
Developers must constrain code edits to the narrowest responsible layer.
Developers must remove unused imports and variables that current edits create.
Developers must not delete unrelated legacy code without an explicit user instruction.
Developers must execute tests before and after refactoring to ensure functional parity.

### Mandatory Verification Before Completion
Developers and agents must execute verification commands before declaring success.
Assertions require fresh terminal output from automated test runners or compilers.
Agents must never state that tasks pass without observing successful execution results.
Verification must cover both positive and boundary conditions for altered logic.

### Specialized Skill Protocols and Debt Tracking
Backend implementations must apply Spring Boot patterns from `dr-jskill`.
Spring AI configurations must keep model temperature at 0.1 and store prompts in template files.
Frontend developers must consult specialized Vue skills before creating or altering components.
Developers must mark intentional simplifications with a `ponytail:` comment to track technical debt.
Agents must query the `graphify` knowledge graph for cross-file architecture questions before broad searches.

### Agent Tooling and Context Efficiency
Agents must prioritize native tools for file inspection and edits.
Agents must specify line ranges when reading files.
Agents must filter out build directories, binaries, and virtual environments from searches.
Agents must not execute shell commands to read files when native tools exist.
Agents must preserve working tree changes and never commit without explicit user approval.

## Governance

This constitution supersedes all other documentation and ad-hoc practices across the repository.
All pull requests and code modifications must comply with these principles.
Amendments require documented justification, team approval, and semantic version updates.
The version follows semantic versioning rules:
- **MAJOR**: Incompatible governance removals or fundamental principle redefinitions.
- **MINOR**: New principles or material expansions of operational guidance.
- **PATCH**: Wording improvements, non-semantic clarifications, and typo corrections.
Developers must review constitution compliance during all code reviews.

**Version**: 1.4.0 | **Ratified**: 2026-10-12 | **Last Amended**: 2026-10-21
