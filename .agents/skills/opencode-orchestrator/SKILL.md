---
name: opencode-orchestrator
description: Use when acting as lead architect to delegate implementation, code changes, or shell execution to OpenCode CLI, with model tiering. Works alongside workflow skills such as speckit implement, which decide what to build while this skill decides how the code gets written.
---

# OpenCode Orchestrator

## Overview

Act as Lead Architect. Keep planning, architectural integrity, and verification in the primary agent. Delegate code generation and shell execution to OpenCode CLI, choosing a model tier by task difficulty.

This skill defines HOW code gets written, not WHAT to build. Task lists, ordering, and gating come from the user or from any active workflow skill.

---

## When to Use

- Features or bug fixes requiring code changes across the codebase.
- Executing terminal commands or scripts via an external worker model.
- Routine coding tasks where architectural review and verification gates are kept.
- Together with a workflow skill (e.g. speckit implement): follow that skill for prerequisites, checklist gating, phase order, and completion validation, and replace only its "write the code" step with an OpenCode call.

### When NOT to Use

- Conversational questions, architectural advice, or requirements clarification.
- Planning and specification authoring (do directly in the primary agent).
- Reading files or surveying the workspace (use native agent tools).

---

## Model Tiers

| Tier | Model | Use for |
|------|-------|---------|
| 1 (default) | opencode/deepseek-v4.1-free, variant high | Feature work, multi-file changes, logic, tests |
| 2 | opencode/glm-5.3-flash-free | Mechanical tasks: renames, boilerplate, config, docs |
| 3 | nvidia/nemotron-3-ultra-550b-a55b, variant high | Escalation, or hard cross-cutting changes |

Replace IDs with exact strings from `opencode models`. If you still want your paid `deepseek/deepseek-v4.1-flash` as a stable fallback for free-tier rate limits, add it as Tier 1b.

Selection:
1. Start at Tier 1, or Tier 2 if the task is clearly mechanical.
2. On rate limit or quota errors, retry once, then fall to the next tier.
3. Always report which tier was used.

---

## Delegation Protocol

### 1. Architectural Planning
- Break broad requests into discrete, modular subtasks with clear boundaries and success criteria.
- With a workflow skill active, use its task list instead of re-planning.
- Prepare self-contained instructions: exact file paths, symbol names, expected behavior, and explicit constraints. Point to AGENTS.md and the constitution rather than pasting them.

### 2. Subagent Execution
Run from the active project directory. If a feature worktree exists, run from the worktree, never the main checkout.

Use a here-string so quotes and newlines survive PowerShell:

```powershell
$prompt = @'
Task: <ID and description>
Files: <paths>
Constraints: <explicit constraints>
Follow AGENTS.md. Run the relevant tests.
Do not commit or push.
Stop and report any ambiguity instead of guessing.
'@

# Tier 1
opencode run $prompt --model opencode/deepseek-v4.1-flash-free --variant high

# Tier 2
opencode run $prompt --model opencode/glm-5.3-flash-free

# Tier 3
opencode run $prompt --model  nvidia/nvidia/nemotron-3-ultra-550b-a55b --variant high
```

Tiers 1 and 3 use `--variant high`; Tier 2 runs without it. If a model rejects `--variant`, rerun without the flag and report that.

Rules:
- One task per call. Run `[P]` parallel tasks sequentially unless each has its own worktree.
- Don't edit source files yourself while OpenCode is running.
- With a tracking file (e.g. tasks.md), OpenCode may check off the task. The primary agent only verifies and never edits it concurrently.

### 3. Review & Verification
- `git status -s` for modified and untracked files, `git diff` to review changes.
- Compare the diff to the task's success criteria, not just "does it run".
- Run project verification:
  - Frontend: `npm run lint:oxlint`, `npm run type-check`, or targeted Vitest tests.
  - Backend: `./gradlew compileJava` or targeted unit tests.
- Pass: proceed to the next subtask.
- Fail: send OpenCode the exact error output, or roll back uncommitted changes.

### 4. Retry & Escalation (max 3 attempts per task)
1. Attempt 1: chosen tier.
2. Attempt 2: same tier, with the exact failure output.
3. Attempt 3: Tier 3 (`--variant high`), with the failure output.
4. Still failing: stop, roll back uncommitted changes if needed, and report to the user. Don't loop.

---

## Constraints & Safety Rules

1. **Destructive operations**: Never run bulk file deletes or moves in the workspace while a delegated task is running.
2. **Git invariants**: Never commit or push without explicit user instruction (follow `git-safety`). If the user opts into per-task commits (e.g. for a Spec Kit run), OpenCode commits once per task and nothing is pushed.
3. **Retry limit**: Maximum 3 attempts per task (see section 4).
4. **Milestone summary**: After each milestone, give the user an executive summary: tier used, files changed, verification results, and open issues.