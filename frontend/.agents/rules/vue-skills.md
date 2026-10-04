---
trigger: always_on
description: Require Vue skills and Vue documentation lookups when writing, testing, or debugging Vue code.
---

# Vue Skills Rule

Read and apply the appropriate Vue skill before you write, edit, or test Vue code.

## Skill Selection

Select skills based on the task:

1. **General Vue 3 and TypeScript**:
   - Read `vue-best-practices` before you create or modify Vue components.
   - Use the Composition API and `<script setup lang="ts">`.

2. **Composables**:
   - Read `create-adaptable-composable` when you create reusable composables.
   - Accept flexible inputs with `MaybeRef` and `MaybeRefOrGetter`.

3. **Routing**:
   - Read `vue-router-best-practices` when you edit routes or navigation guards.

4. **Testing**:
   - Read `vue-testing-best-practices` when you write tests with Vitest and Vue Test Utils.

5. **Debugging**:
   - Read `vue-debug-guides` when you diagnose runtime errors or reactivity bugs.

6. **UI Components**:
   - Read `shadcn-vue` when you add, style, or compose shadcn-vue components.

7. **Rich Text Editing**:
   - Read `tiptap` when you integrate or configure Tiptap editor features.

8. **Options API**:
   - Read `vue-options-api-best-practices` only when the user explicitly requests Options API.

## Documentation Lookups

Use `vue-docs` tools to verify Vue APIs and patterns:

- Run `vue_docs_search` to find Vue concepts and examples.
- Run `vue_api_lookup` to check API signatures and reactivity behavior.
- Run `ecosystem_search` to find Vue Router or VueUse documentation.
