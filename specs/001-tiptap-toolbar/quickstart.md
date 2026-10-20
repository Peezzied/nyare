# Quickstart Validation Guide: Rich Text Toolbar and Editor

**Branch**: `001-tiptap-toolbar` | **Feature**: Rich Text Toolbar and Editor

This guide defines verification steps to prove the rich text toolbar and editor work as expected.

## Prerequisites

- Node.js `^22.18.0 || >=24.12.0`
- Dependencies installed (`npm install` inside `frontend/`)
- Package `@tiptap/extension-image` installed

---

## Automated Validation

Run the test suite and static analysis from `frontend/`:

```bash
# 1. Fast oxlint check
npm run lint:oxlint

# 2. TypeScript compilation check
npm run type-check

# 3. Vitest unit tests for the toolbar and editor
npm run test:unit
```

### Expected Automated Results
- Zero linter errors or warnings.
- `vue-tsc --build` passes with zero type errors.
- `TiptapToolbar.spec.ts` passes all test cases (render, button clicks, active states, history enablement, image upload trigger).

---

## Interactive Validation (Histoire)

Preview and test the component visually in Histoire:

```bash
npm run story
```

### Manual Test Scenarios

1. **Inline & Block Formatting**:
   - Open the `TiptapEditor` story.
   - Highlight text and click **Bold**, **Italic**, **Heading 1**, and **Bullet List**.
   - Verify text formatting updates immediately and toolbar buttons show active highlight.
2. **Undo & Redo Verification**:
   - Note that **Undo** and **Redo** buttons start disabled on an empty document.
   - Type text: observe **Undo** becomes enabled.
   - Click **Undo**: text is reverted; **Redo** becomes enabled.
   - Click **Redo**: text is restored; **Redo** becomes disabled.
3. **Image Upload Verification**:
   - Click the **Image** toolbar button.
   - Select a local image file.
   - Verify the image embeds directly into the editor body at the cursor position.
4. **Mobile Responsiveness**:
   - Resize viewport to 360px.
   - Verify toolbar buttons wrap cleanly without horizontal scrollbars or clipped icons.
