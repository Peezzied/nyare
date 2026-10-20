---
name: opencode-handoff
description: Use when acting as lead architect and the user manually relays work to OpenCode. Produces copy-paste-ready implementation prompts with a model tier recommendation, then reviews the pasted-back results. Never runs OpenCode itself. Works alongside workflow skills such as speckit implement.
---

# OpenCode Handoff (Manual Proxy)

## Overview

Act as Lead Architect. Keep planning, architectural integrity, and verification in the primary agent. The user relays messages between you and OpenCode by hand. You write the prompts; the user runs them and pastes the output back.

**Never run `opencode` from the shell in this mode.** Your deliverable per turn is a handoff block, after which you stop and wait.

This skill defines HOW code gets written, not WHAT to build. Task lists, ordering, and gating come from the user or from any active workflow skill.

---

## When to Use

- The user says they will relay prompts to OpenCode manually.
- Features or bug fixes needing code changes where you want to control exactly what the worker sees.
- Together with a workflow skill (e.g. speckit implement): follow that skill for prerequisites, checklist gating, phase order, and completion validation, and replace only its "write the code" step with a handoff block.

### When NOT to Use

- Conversational questions, architectural advice, or requirements clarification.
- Planning and spec authoring (do directly in the primary agent).
- Reading files or surveying the workspace (use native agent tools).
- The user wants you to run OpenCode directly (use opencode-orchestrator instead).

---

## Model Tiers

| Tier | Model | Use for |
|------|-------|---------|
| 1 (default) | opencode/deepseek-v4.1-flash-free, variant high | Feature work, multi-file changes, logic, tests |
| 2 | opencode/glm-5.3-flash-free, variant high | Mechanical tasks: renames, boilerplate, config, docs |
| 3 | nvidia/nvidia/nemotron-3-ultra-550b-a55b, variant high | Escalation, or hard cross-cutting changes |

Replace IDs with exact strings from `opencode models`.

Selection:
1. Recommend Tier 1, or Tier 2 if the task is clearly mechanical.
2. Rate limit or quota errors in the pasted output: tell the user to retry once, then move to the next tier.
3. State the tier in every handoff so the user knows which model to select.

---

## Handoff Protocol

### 1. Plan
- Break broad requests into discrete, modular subtasks with clear boundaries and success criteria.
- With a workflow skill active, use its task list instead of re-planning.
- One task per handoff. `[P]` parallel tasks are still sent one at a time unless the user runs separate worktrees.

### 2. Emit the handoff block
Use exactly this layout so the user can copy quickly. Keep text outside the code block short.

**Handoff N: <task ID and title>**
Tier: <1/2/3> | Model: `<provider/model>` | Variant: `<high or none>`
Run in: <worktree or project path>

Then the prompt in a single fenced block (no nested fences inside it; indent code samples instead):

```text
Task: <ID and description>

Context:
- Read: <exact file paths>
- Follow: AGENTS.md and <constitution/spec paths>. Do not re-explain them here.

Requirements:
- <exact behavior, symbol names, signatures>
- <explicit constraints and out-of-scope items>

Done when:
- <testable success criteria>
- Relevant tests pass: <command>

Rules:
- Do not commit or push.
- Do not modify files outside the listed paths.
- Stop and report any ambiguity instead of guessing.

When finished, reply with ONLY this report:
1. Files changed (paths)
2. What was done, 3 bullets max
3. Commands run and their pass/fail result (last 20 lines of any failure)
4. Open questions or blockers
```

Optionally add the CLI form for the user:

    opencode run "<paste prompt>" --model <provider/model> --variant high

After the block, say what you will check when they return, then **stop**. Don't continue with other tasks.

### 3. Review the returned output
When the user pastes OpenCode's report:
- If you have shell access to the same working directory, verify it yourself: `git status -s`, `git diff`, and the project checks. Don't ask the user to paste diffs you can read.
- If you can't see the directory, ask for `git diff --stat` and only the specific files you need.
- Compare the diff to the task's success criteria, not just the worker's claim that it works.
- Run project verification:
  - Frontend: `npm run lint:oxlint`, `npm run type-check`, or targeted Vitest tests.
  - Backend: `./gradlew compileJava` or targeted unit tests.
- Treat the worker's report as a claim, not proof.

Outcome:
- Pass: summarize briefly, then emit the next handoff.
- Fail: emit a fix handoff (section 4).

### 4. Retry & Escalation (max 3 attempts per task)
Each retry is a new handoff block containing the exact failure output, not a vague "fix it".
1. Attempt 1: chosen tier.
2. Attempt 2: same tier, with the exact failure output.
3. Attempt 3: Tier 3 (`variant high`), with the failure output.
4. Still failing: stop, recommend rollback of uncommitted changes if needed, and report to the user. Don't loop.

### 5. Keep handoffs lean
- Don't paste whole specs or files into the prompt; reference paths so the worker reads them.
- If the user pastes a very long transcript, extract only the failures and the report, and ask for the rest only if needed.
- Number handoffs sequentially so pasted results can be matched to the right task.

---

## Constraints & Safety Rules

1. **No direct execution**: Don't run `opencode` yourself. Read-only inspection and verification commands are fine.
2. **Destructive operations**: Don't run bulk deletes or moves while the user may be running a handoff in the same directory.
3. **No concurrent edits**: Don't edit source files while a handoff is outstanding. If a tracking file (e.g. tasks.md) is updated by the worker, you only verify it.
4. **Git invariants**: Never commit or push without explicit user instruction (follow `git-safety`). If the user opts into per-task commits, change the Rules line in the prompt to "Commit once per task; do not push."
5. **Retry limit**: Maximum 3 attempts per task (see section 4).
6. **Milestone summary**: After each milestone, give the user an executive summary: tier used, files changed, verification results, and open issues.