# Quickstart Validation Guide: Course Block Expansion & Detail View

**Feature**: Course Block Expansion & Detail View  
**Target View**: `/schedule`  
**Date**: 2026-10-16  

---

## Prerequisites

1. Start the Vite development server:
   ```bash
   cd frontend
   npm run dev
   ```
2. Navigate to `http://localhost:5173/schedule` in a browser or mobile device emulation (viewport width 390px).

---

## Validation Scenarios

### Scenario 1: Course Block Container Transform (Priority P1)

1. Open the Day Calendar view on a day with scheduled classes.
2. Tap on any course block (e.g., "Web Development").
3. **Verify**:
   - The card animates outward from the exact position where you tapped using Material 3 decelerate easing.
   - Staggered entrance: text and time pill fade in smoothly at ~100ms without text distortion during expansion.
   - The view shows:
     - 10px course color dot beside the course name.
     - Full course title in `Quicksand` 700 bold font.
     - Meeting time window in a clean parchment pill badge (e.g. `08:00 AM - 10:00 AM`).
     - "Tasks" button and "Notes" button styled as 3D tactile buttons (Ocean cyan `#00A4C8` with `4px solid #007B99` bevel).
     - Active tap on buttons translates `translate-y-1` and depresses the bevel.
   - Background calendar is frosted with `backdrop-blur-[3px] bg-slate-900/40`.
   - No instructor, location, or room is displayed.

---

### Scenario 2: Close and Calendar State Preservation (Priority P1)

1. With the course detail view open, tap the Close button (or hit the browser back button).
2. **Verify**:
   - The detail view contracts back into the original calendar slot coordinates.
   - The calendar grid maintains its exact scroll position.
   - The current day and time indicator remain unchanged.
   - The browser URL remains `/schedule`.

---

### Scenario 3: Untimed Task or Event Block (Priority P2)

1. Tap an untimed task or academic event in the top strip (`AllDayStrip`).
2. **Verify**:
   - The block expands into the detail view.
   - The view displays strictly the item's title and its singular linked note.
   - No shortcut buttons or course color dots are rendered.

---

### Scenario 4: Shortcut Navigation (Priority P2)

1. Open a course detail view.
2. Tap the "Tasks" button.
3. **Verify**:
   - The app navigates to `/tasks`.
4. Return to `/schedule`, reopen the course, and tap the "Notes" button.
5. **Verify**:
   - The app navigates to `/notes`.

---

## Code Quality Verification Commands

Run from `frontend/`:

```bash
npm run lint:oxlint
npm run type-check
npx vitest run src/components/day-view/__tests__/
```
