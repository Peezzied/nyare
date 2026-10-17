---
name: opencode-orchestrator
description: Use when acting as lead architect to delegate implementation, code changes, or shell execution to OpenCode CLI using DeepSeek models.
---

# OpenCode Orchestrator

## Overview

Manage the development lifecycle as Lead Architect. Keep high-level technical planning, architectural integrity, and verification in the primary agent. Delegate low-level implementation, code generation, and shell execution to OpenCode CLI using DeepSeek models.

---

## When to Use

- When implementing features or bug fixes requiring code changes across the codebase.
- When executing terminal commands or scripts via an external worker model.
- When delegating routine coding tasks while maintaining architectural review and verification gates.

### When NOT to Use

- Pure conversational questions, architectural advice, or requirements clarification.
- Direct high-level planning and specification authoring (perform directly in the primary agent).
- Reading files or surveying the workspace (perform directly using native agent tools).

---

## Delegation Protocol

### 1. Architectural Planning
- Break down broad user requests into discrete, modular subtasks.
- Ensure each subtask has clear boundaries and success criteria.
- Prepare concise, specific, and self-contained instructions for OpenCode.

### 2. Subagent Execution
Execute OpenCode directly in the active project directory using the terminal:

```powershell
opencode run "<subtask instructions>" --model deepseek/deepseek-v4.1-flash
```

Guidelines:
- Provide exact file paths, symbol names, and expected behavior in `<subtask instructions>`.
- State constraints explicitly in the command prompt.

### 3. Review & Verification
- Inspect repository state immediately after OpenCode completes:
  - Run `git status -s` to inspect modified and untracked files.
  - Run `git diff` to review code modifications.
- Run project-specific verification tests or build commands:
  - Frontend: `npm run lint:oxlint`, `npm run type-check`, or targeted Vitest tests.
  - Backend: `./gradlew compileJava` or targeted unit tests.
- If verification passes: proceed to the next subtask.
- If verification fails: instruct OpenCode with the exact error output to resolve the failure, or roll back uncommitted changes.

---

## Constraints & Safety Rules

1. **Destructive Operations**: Never execute destructive bulk file operations directly in the workspace directory while an execution task is delegated.
2. **Retry Limit**: Limit subagent retry attempts to a maximum of 3 iterations per task to avoid infinite loops and rate-limit exhaustion.
3. **Git Invariants**: Never commit or push without explicit user instruction (follow `git-safety`).
4. **Milestone Summary**: Return a high-level executive summary of completed changes to the user after each milestone.
