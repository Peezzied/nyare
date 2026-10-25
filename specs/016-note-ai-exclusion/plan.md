# Implementation Plan: Exclude Note From AI Processing

**Branch**: `016-note-ai-exclusion` | **Date**: 2026-10-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/016-note-ai-exclusion/spec.md`

## Summary

Add a per-note boolean `excludedFromAi`. The two dirty-note queries skip excluded notes, so status and Process ignore them. The editor gets a shadcn-vue `Switch` row and a "Skipped by AI" status. "Disable" only. No extracted data is deleted.

## Technical Context

**Language/Version**: Java 25 (backend), TypeScript with Vue 3 `<script setup>` (frontend)

**Primary Dependencies**: Spring Boot 4.1.1, Spring Data JPA, shadcn-vue (`Switch`, built on installed `reka-ui`), Tailwind 4, lucide icons. No new runtime dependency.

**Storage**: SQLite. One new column `notes.excluded_from_ai` with a default. `ddl-auto=update` applies it.

**Testing**: JUnit 5 + Mockito + `@DataJpaTest` style repository test (existing `NoteRepositoryTest`). Vitest + jsdom for the frontend.

**Target Platform**: Single Spring Boot JAR serving the Vue SPA. Mobile-first 390 px.

**Project Type**: Web application (`app/` + `frontend/`)

**Performance Goals**: None added. The filter is one boolean predicate on an existing query.

**Constraints**: Day-level planning rules unchanged. Layer isolation. Only `ResourceNotFoundException` and `BadRequestException`. Views stay free of dev flags. 44 px touch targets.

**Scale/Scope**: 1 entity field, 2 queries, 3 DTO edits, 1 editor row, 1 status value.

## Constitution Check

| Principle | Result |
|-----------|--------|
| I. Virtual Study Plan | Pass. No study-plan table. Tri-state unchanged. |
| II. Course Anchor | Pass. The flag lives on `Note`, which keeps one course. |
| III. Grounded Uncertainty | Pass. No invented values. |
| IV. Non-Destructive Additive | Pass. Exclusion deletes nothing (FR-006). |
| V. Layer Isolation | Pass. Controller to service interface to repository. DTOs only leave the service. |
| VI. Canonical Errors | Pass. No new exception class. |
| VII. Ponytail Minimalism | Pass. No Pinia, no new endpoint, no list indicator. |
| VIII. Evidence-First | Pass. Quickstart lists commands. Tests precede the change. |
| IX. Frontend-Backend Alignment | Pass. Client reads the flag from the DTO. No local re-derivation of pending state. |
| X. No dev flags in views | Pass. The row has no environment branch. |

Re-check after design: no violation. Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/016-note-ai-exclusion/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── note-api.contract.md
└── tasks.md              # created by /speckit-tasks
```

### Source Code

```text
app/src/main/java/group/four/nyare/nyare/
├── model/Note.java                         # add excludedFromAi field, getter, setter
├── repository/NoteRepository.java          # add predicate to both findDirtyNotes queries
├── dto/NoteRequest.java                    # add Boolean excludedFromAi (nullable)
├── dto/NoteResponse.java                   # add boolean excludedFromAi
└── service/impl/NoteServiceImpl.java       # apply flag in create/update, map in toResponse

app/src/test/java/group/four/nyare/nyare/
├── repository/NoteRepositoryTest.java      # excluded notes absent from both dirty queries
└── service/NoteServiceImplTest.java        # flag applied, null keeps value, other user gets 404

frontend/src/
├── components/ui/switch/                   # added by shadcn-vue CLI
├── types/api.ts                            # NoteResponse / NoteRequest field
├── utils/noteStatus.ts                     # 'skipped' status and badge config
├── utils/__tests__/noteStatus.spec.ts      # skipped precedence
├── composables/useNotes.ts                 # no change expected: payload passes through
├── views/NoteEditor.vue                    # state ref, third Plan-zone row, payload field, dirty state
└── views/__tests__/NoteEditor.spec.ts      # toggle persists and shows badge
```

**Structure Decision**: Web application layout. Every change extends an existing file. The only new files are the generated `Switch` component and the specs.

## Design Notes

- **Backend flag**: `@Column(name = "excluded_from_ai", nullable = false, columnDefinition = "BOOLEAN NOT NULL DEFAULT 0")`. Follows the `title` column pattern.
- **Update semantics**: `if (request.getExcludedFromAi() != null) note.setExcludedFromAi(...)`. Create uses `Boolean.TRUE.equals(...)`.
- **Editor state**: add `excludedFromAi` to `getCurrentState()` and `initialState` so `isDirty` covers it. Load it in `loadNote`. Send it in the save payload.
- **UI row**: icon + `Label` + `Switch`, `min-h-11`, same divider as the other rows. Disabled for archived courses.
- **Impeccable pass (Operate mode)**: during implementation, run `impeccable` setup, read `craft-floor.md` before the UI edit, and verify once with a desktop and mobile screenshot. Keep brand detail in DESIGN.md tokens.
- **Skills at implementation**: `dr-jskill` and `model-craft` for the backend. `vue-best-practices` and `shadcn-vue` for the frontend.

## Complexity Tracking

No violations.
