# Quickstart: Course Picker Modal Validation

## Test & Validation Scenarios

### 1. Unit Tests

Run Vitest unit tests covering:
1. `formatCourseSchedule` utility:
   - Multiple days formatting: Monday, Wednesday, Friday → "Mo, We, Fr".
   - Ordering check: Sunday + Monday → "Mo, Su".
   - Empty schedules check: returns "No set schedule".
2. `CoursePickerDialog.vue`:
   - Renders courses with color dot, title, and schedule string.
   - Shows empty state when `courses` prop is empty.
   - Emits `select` event with `courseId` when option clicked and closes dialog.
   - Highlights the currently active course.
3. `NoteEditor.vue` integration:
   - Tapping Course trigger opens dialog.
   - Selecting a course updates the course pill with badge style and name.
   - Save button disabled when `selectedCourseId` is null, or `entryDate` is empty, or `content` is empty.
   - Save button enabled only when all three are present.

```bash
npm run test:unit -- src/components/editor/__tests__/CoursePickerDialog.spec.ts
npm run test:unit -- src/views/__tests__/NoteEditor.spec.ts
```

### 2. Inner-Loop Lint & Type Check

```bash
npx oxlint src/ --fix
npm run type-check
```

### 3. Storybook / Histoire Preview

Run Histoire to visually verify the dialog across mobile viewports:
```bash
npm run story
```
