---
name: prompt-engineering
description: Use when writing, modifying, or evaluating prompts for Nyare AI services, including extraction prompts, system instructions, few-shot examples, and token optimization.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Prompt Engineering for Nyare

## Overview

This skill guides prompt design for Nyare AI services. Nyare uses Spring AI 2.0.0 and Google Gemini models.

**REQUIRED SUB-SKILL:** Consult `man-spring` for Spring AI configuration, Gemini chat options, and ChatClient setup. Consult `dr-jskill` for base Spring Boot architecture.

## When to Use

- Design or update system prompts for `StudyPlannerEngine`.
- Construct multi-message prompts with `TaggedPromptBuilder`.
- Add domain few-shot examples for journal note extraction.
- Optimize prompt token usage and extraction accuracy.

## When NOT to Use

- Configure chat models or API keys (use `man-spring`).
- Implement standard REST controllers or JPA entities (use `dr-jskill` and `model-craft`).
- Request step-by-step text reasoning that breaks JSON extraction.
- Run IntelliJ MCP diagnostics (`get_file_problems`) on template files like `system_prompt.st`.

## Nyare Prompt Architecture

Nyare uses a structured prompt format:

1. **System Prompt**: Set persona, extraction instructions, and domain invariants via `ChatClient.defaultSystem(...)`.
2. **XML Tags**: Enclose input sections in XML tags (`<temporal_anchor>`, `<journal_notes>`, `<existing_tasks>`, `<existing_events>`, `<existing_contexts>`, `<class_schedules>`).
3. **Tabular CSV**: Format data collections as CSV tables inside tags to minimize prompt tokens.
4. **Reference Identifiers**: Use `StubReferenceCodec` (`n1`, `i1`) to link extracted items to source notes.
5. **Structured Entity Extraction**: Spring AI deserializes output directly to Java records (`.entity(ExtractedData.class)`). Do not ask the model for conversational text.

## Domain Invariants

- **Preserve Uncertainty**: Never hallucinate deadlines or durations. If unstated, return null.
- **Date-Level Scheduling**: Recommend study dates (`scheduledDate`), never hourly time-blocks.
- **Holistic Reasoning**: Reason from academic context facts rather than computing priority formulas.

## Verification Guidelines

- Do not run IntelliJ MCP diagnostics (`get_file_problems`) on `system_prompt.st` or other StringTemplate files.
- Verify prompt templates manually against domain constraints, token limits, and ASD-STE100 rules.

## Related Skills & References

- **REQUIRED SUB-SKILL:** Consult `man-spring` for Spring AI model integration and chat options.
- **RELATED SKILL:** Consult `generating-test-notes` when authoring student journal note test fixtures.
- `references/system-prompt-design.md`: System prompt structure and domain constraints.
- `references/few-shot-patterns.md`: Note extraction and uncertainty preservation examples.
- `references/optimization-frameworks.md`: Token efficiency metrics and Spring AI prompt tests.
