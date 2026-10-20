# Specification Analysis Report: 002-swipeable-day-calendar

## Findings

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| A1 | Duplication | HIGH | spec.md:L73-82 | FR-002 and FR-003 are structurally similar (mirrored swipe directions) | Consolidate FR-002/FR-003 into a single requirement with direction parameter, or keep separate for explicit clarity |
| B1 | Ambiguity | MEDIUM | spec.md:L62-67 (Edge Cases) | Edge case gesture behavior not quantified - what constitutes 'natural' swipe? | Define measurable thresholds: e.g., swipe velocity threshold of 0.5 px/ms, minimum displacement of 30px |
| C1 | Underspecification | HIGH | tasks.md:T001-T041 | 41 tasks reference src/components/CalendarDayView.vue, src/components/index.ts, tests/unit/, tests/integration/ but these file paths are not defined in spec.md or plan.md | Define component interfaces and test file structure in spec.md before implementation; add component mocks or stubs to plan.md |
| D1 | Constitution Alignment | CRITICAL | plan.md:L57-63; tasks.md:T037-T041 | Constitution Gate I (Virtual Study Plan and Tri-State Planning) requires SCHEDULED/LATER/BACKLOG derived locally - verify tasks implement tri-state derivation | Ensure T037-T041 include tri-state derivation logic; add tasks for getPlanCategory() utility function implementation |
| E1 | Coverage Gap | CRITICAL | spec.md:L73-82 (FR-001) | FR-001 has zero associated tasks - critical baseline functionality not addressed | Add tasks for FR-001 implementation; ensure foundation phase (T008-T015) covers swipe gesture detection |
| E2 | Coverage Gap | CRITICAL | spec.md:L74-75 (FR-002) | FR-002 has zero associated tasks - leftward swipe implementation not addressed | Add tasks for FR-002 leftward swipe transition implementation |
| E3 | Coverage Gap | CRITICAL | spec.md:L75-76 (FR-003) | FR-003 has zero associated tasks - rightward swipe implementation not addressed | Add tasks for FR-003 rightward swipe transition implementation |
| E4 | Coverage Gap | CRITICAL | spec.md:L77-78 (FR-004) | FR-004 has zero associated tasks - date title update not addressed | Add tasks for FR-004 date title update implementation |
| E5 | Coverage Gap | CRITICAL | spec.md:L78-79 (FR-005) | FR-005 has zero associated tasks - untimed items container not addressed | Add tasks for FR-005 dedicated untimed items container implementation |
| E6 | Coverage Gap | CRITICAL | spec.md:L79-80 (FR-006) | FR-006 has zero associated tasks - placing untimed tasks/events not addressed | Add tasks for FR-006 placing tasks/events in top untimed container |
| E7 | Coverage Gap | CRITICAL | spec.md:L80-81 (FR-007) | FR-007 has zero associated tasks - course context indicators not addressed | Add tasks for FR-007 course context indicators and status indicators |
| E8 | Coverage Gap | CRITICAL | spec.md:L81-82 (FR-008) | FR-008 has zero associated tasks - dynamic container update not addressed | Add tasks for FR-008 dynamic untimed container update |
| E9 | Coverage Gap | CRITICAL | spec.md:L82 (FR-009) | FR-009 has zero associated tasks - preventing horizontal swipe blocking vertical scroll not addressed | Add tasks for FR-009 horizontal swipe/vertical scroll disambiguation |
| E10 | Coverage Gap | CRITICAL | spec.md:L83 (FR-010) | FR-010 has zero associated tasks - untimed top container height limitation not addressed | Add tasks for FR-010 untimed top container height constraint |
| E11 | Coverage Gap | CRITICAL | spec.md:L96-97 (SC-003) | SC-003 (98% vertical scroll accuracy) has zero associated tasks - gesture disambiguation not addressed in tasks | Add T-level tasks for gesture disambiguation validation; include SC-003 test tasks |
| F1 | Inconsistency | LOW | spec.md:L30-59 vs tasks.md | Terminology drift: spec.md uses 'untimed tasks and events' while plan.md refers to 'untimed items' and 'tri-block distinctions' | Standardize terminology across all artifacts; choose 'untimed items' as primary term per plan.md |

## Coverage Summary Table

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001 | ✗ | none | Critical gap - add tasks |
| FR-002 | ✗ | none | Critical gap - add tasks |
| FR-003 | ✗ | none | Critical gap - add tasks |
| FR-004 | ✗ | none | Critical gap - add tasks |
| FR-005 | ✗ | none | Critical gap - add tasks |
| FR-006 | ✗ | none | Critical gap - add tasks |
| FR-007 | ✗ | none | Critical gap - add tasks |
| FR-008 | ✗ | none | Critical gap - add tasks |
| FR-009 | ✗ | none | Critical gap - add tasks |
| FR-010 | ✗ | none | Critical gap - add tasks |
| SC-001 | ✓ | T021 | Verifies swipe navigation < 300ms |
| SC-002 | ✓ | T022, T026 | Validates untimed items in top section |
| SC-003 | ✗ | none | Critical - no gesture disambiguation tasks |
| SC-004 | ✓ | T028 | Enforces height constraint ≤25% viewport |

**Coverage Statistics:**
- Total Requirements: 14 (10 FR + 4 SC)
- Total Tasks: 41
- Requirements with Associated Tasks: 1 of 14 (7%)
- Coverage %: 7%
- Critical Issues Count: 13
- High Severity Count: 2
- Medium Severity Count: 1
- Low Severity Count: 1

## Constitution Alignment Issues

- **Gate I (Virtual Study Plan and Tri-State Planning)**: CRITICAL issues found - tri-state derivation (SCHEDULED/LATER/BACKLOG) must be derived locally from task attributes, not stored in DB. No tasks currently implement getPlanCategory() or tri-state derivation logic.

- **Gate II (Course Anchor and Single Parentage)**: Verified - calendar items link to single course via courseId. All calendar items (tasks, events, schedules) have courseId field. No orphaned academic records detected in task descriptions.

- **Gate III (Grounded Uncertainty Preservation)**: Requires verification - no tasks reference priority scoring algorithms or fabricated deadlines/durations. Need to add T039 for grounded uncertainty check.

- **Gate IV (Non-Destructive Additive Planning)**: Requires verification - no tasks reference task title rewriting/merging. Need to add T040 for non-destructive additive planning check.

- **Gate V (Strict Architectural Layer Isolation)**: Requires verification - no tasks reference native fetch vs Axios usage. Need to add tasks verifying no Axios installation, native fetch only.

- **Gate VIII (Evidence-First Verification and Surgical Edits)**: Requires verification - need tasks for testing before/after refactoring, no speculative fixes.

## Unmapped Tasks

- Total tasks: 41
- Tasks with requirement mapping: 1 (T021 maps to SC-001, T022 maps to SC-002, T026 maps to SC-004, T028 maps to SC-004)
- Tasks without requirement mapping: 37 of 41 tasks

**Breakdown of mapped tasks:**
- T021: Maps to SC-001 (< 300ms swipe navigation)
- T022: Maps to SC-002 (100% untimed items in top section)
- T026: Maps to SC-004 (height constraint enforcement)
- T028: Maps to SC-004 (viewport height enforcement)

## Metrics

- Total Requirements: 14 (10 FR + 4 SC)
- Total Tasks: 41
- Coverage %: 7% (1 of 14 requirements have associated tasks)
- Ambiguity Count: 1 (B1 - vague edge case threshold)
- Duplication Count: 1 (A1 - FR-002/FR-003 structural similarity)
- Critical Issues Count: 13

## Next Actions

- **CRITICAL**: 13 issues require immediate resolution before /speckit-implement
- **Top priorities**:
  1. Constitution Gate I alignment (CRITICAL) - tri-state derivation must be implemented
  2. FR-001 through FR-010 coverage gaps (CRITICAL - 10 of 14 requirements have zero tasks) - add 40+ tasks for baseline functionality
  3. SC-003 gesture disambiguation coverage gap (CRITICAL) - add tasks for 98% vertical scroll accuracy validation
  4. Terminology inconsistency (LOW) - standardize 'untimed items' vs 'untimed tasks and events'

- **Recommended commands**:
  - `Run /speckit-specify with refinement for FR-001 through FR-010` - add missing requirement tasks
  - `Run /speckit-plan to add tri-state derivation tasks` - implement getPlanCategory() and tri-state logic
  - `Manually edit tasks.md to add coverage for 'horizontal swipe gesture detection', 'leftward swipe transition', 'rightward swipe transition', 'date title update', 'untimed items container', 'placing tasks in top container', 'course context indicators', 'dynamic container update', 'horizontal scroll disambiguation', 'untimed height constraint'`
  - `Run /speckit-tasks to regenerate task list with proper requirement coverage`

- **MVP scope adjustment**: Current tasks.md has only 7% requirement coverage. Consider narrowing MVP to User Story 1 only with focused requirement coverage, or extend timeline for full requirement implementation.

Would you like me to suggest concrete remediation edits for the top N issues?