# Quickstart Validation Guide

## Validation Steps

1. **Start Dev Server**:
   ```bash
   cd frontend && npm run dev
   ```

2. **Verify To-do List View (`/`)**:
   - Check segmented pills: "All", "Scheduled", "Later", "Backlog".
   - In "All", verify "Scheduled" accordion is open, "Later" and "Backlog" are closed.
   - Click accordion headers to expand/collapse.
   - Click "Later" filter pill: only Later tasks render flat without section headers.
   - Check calendar icon colors: overdue/today (red), 1-2 days (yellow), >=3 days (green), none (muted).

3. **Verify Task Row Checkbox**:
   - Tap checkbox: toggles completed style (strikethrough + opacity) without navigating.

4. **Verify Task Detail Route (`/tasks/:id`)**:
   - Tap a task row: navigates to `/tasks/:id`.
   - Verify 44px back button, centered title, empty body, and active To-do bottom tab.
   - Click back button: returns to `/`.
   - Navigate to `/tasks/99999`: redirects to `/`.

5. **Automated Verification**:
   ```bash
   npm run lint:oxlint
   npm run type-check
   npm run test:unit
   ```
