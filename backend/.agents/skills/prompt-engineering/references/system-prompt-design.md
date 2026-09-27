# System Prompt Design for Nyare

This guide provides rules to design system prompts for Nyare AI engines using Spring AI and Google Gemini.

## Core Structure

Set the system prompt on `ChatClient.Builder` using `defaultSystem(...)`.

A Nyare system prompt contains four sections:

1. **Role Definition**: Define the agent as an academic planning assistant for Nyare.
2. **Input Specification**: Describe input data (journal notes, class schedules, tasks, events, contexts).
3. **Extraction Responsibilities**: Extract tasks, rigid academic events, and temporal context facts.
4. **Domain Invariants**: Enforce uncertainty preservation and null defaults.

The production system prompt lives in `src/main/resources/system_prompt.st`.

## Prompt Guidelines

### 1. Relative Date Resolution
Supply a `<temporal_anchor>` with the reference date and day of week:
`Current Reference Date: 2026-09-26 (SATURDAY)`
The model resolves relative expressions ("tomorrow", "next Monday") against this anchor.

### 2. Preserve Uncertainty
Instruct the model to emit null for missing dates or durations.
Never instruct the model to guess or assign default deadlines.

### 3. High-Level Planning
Nyare schedules tasks to calendar dates.
Do not ask the model to generate start times or hourly time-blocks.

### 4. Schedule-Anchored Event Resolution
When notes describe in-class academic events with relative expressions (such as "quiz next week" or "activity next meeting"):
- Anchor the event deadline to the recurring class schedule slot in `{schedules}`.
- Derive task preparation dates to precede the anchored event.