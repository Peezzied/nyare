---
name: histoire
description: Use when creating, generating, or updating Histoire stories (.story.vue) for Vue components, or running Histoire component previews.
---

# Histoire Component Stories

Use this skill to create and maintain Histoire stories for Vue components.
Histoire provides interactive visual documentation and component state exploration.

## Core Rule: No Test Files

Stories document component states visually. Stories do not execute unit tests.

Follow these prohibitions without exception:
1. **No embedded test code**: Do not import `onTest` from `histoire/client`. Do not use Vitest helpers (`describe`, `it`, `expect`, `vi`).
2. **No test file creation**: Do not generate `.spec.ts` or `.test.ts` files when you create stories.
3. **No test file targeting**: Never scan or target files in `__tests__/` for story creation. Target only `.vue` component source files.
4. **No test utilities**: Do not import `@vue/test-utils` inside story files.

## Story File Placement

Place story files directly next to their target component.

```
src/components/
  HelloWorld.vue
  HelloWorld.story.vue
```

Name story files with the `.story.vue` suffix.

## Story Structure

Use `<script setup lang="ts">`, `<Story>`, and `<Variant>`.
Do not write semicolons. Use single quotes.

### 1. Basic Component Story

```vue
<script setup lang="ts">
import HelloWorld from './HelloWorld.vue'
</script>

<template>
  <Story title="components/HelloWorld">
    <Variant title="Default">
      <HelloWorld msg="Welcome to Nyare" />
    </Variant>
  </Story>
</template>
```

### 2. Interactive Story with Controls

Use `:init-state` and the `#controls` slot to expose interactive controls.

```vue
<script setup lang="ts">
import HelloWorld from './HelloWorld.vue'

function initState() {
  return {
    msg: 'Dynamic Message',
  }
}
</script>

<template>
  <Story title="components/HelloWorld">
    <Variant title="Interactive" :init-state="initState">
      <template #default="{ state }">
        <HelloWorld :msg="state.msg" />
      </template>

      <template #controls="{ state }">
        <HstText v-model="state.msg" title="Message" />
      </template>
    </Variant>
  </Story>
</template>
```

### 3. Multiple Variants Story

Define distinct visual states as separate variants.

```vue
<script setup lang="ts">
import MyButton from './MyButton.vue'
</script>

<template>
  <Story title="components/MyButton">
    <Variant title="Primary">
      <MyButton variant="primary">Submit</MyButton>
    </Variant>

    <Variant title="Secondary">
      <MyButton variant="secondary">Cancel</MyButton>
    </Variant>

    <Variant title="Disabled">
      <MyButton disabled>Unavailable</MyButton>
    </Variant>
  </Story>
</template>
```

## Step-by-Step Generation Workflow

Follow these steps to generate a story for a component:

1. **Read component code**: Inspect props, emits, and slots in the `.vue` file.
2. **Identify visual states**: Plan variants for default, alternative props, and edge states.
3. **Draft the `.story.vue` file**:
   - Set the `title` attribute using the component path (e.g. `components/ComponentName`).
   - Add a `<Variant>` for each identified visual state.
   - Add Histoire controls (`HstText`, `HstCheckbox`, `HstSelect`) if props change interactively.
4. **Verify exclusions**: Confirm the file contains no test runner logic and no companion test file was created.
5. **Check code style**: Confirm single quotes, two-space indentation, and no semicolons.

## Prohibited Patterns

| Prohibited Pattern | Reason | Correct Action |
| --- | --- | --- |
| Importing `onTest` from `histoire/client` | Violates isolation rule | Omit test runner logic from stories |
| Importing `expect`, `it`, `describe` from `vitest` | Stories are not test runners | Keep tests in `__tests__/*.spec.ts` only |
| Creating `[Component].spec.ts` during story task | Out of scope for story creation | Create only `[Component].story.vue` |
| Importing `@vue/test-utils` | Stories run in browser sandbox | Mount components via template syntax |
| Adding semicolons `;` | Violates project code style | Remove semicolons |
