# Quickstart & Verification Guide: Schedule X Day View Migration

## Prerequisites
- Node >= 22.18.0
- Working directory: `frontend/`

## 1. Install Dependencies
```bash
npm install @schedule-x/calendar @schedule-x/vue @schedule-x/theme-default temporal-polyfill preact @preact/signals @schedule-x/date-picker
```

## 2. Type-Checking & Linting
```bash
npm run type-check
npm run lint:oxlint
```

## 3. Visual & Functional Scenarios

### Scenario A: Course Card Pill Rendering
1. Open Day View at `http://localhost:5173`.
2. Inspect cards for OOP (8:30 - 10:30 AM) and CALC 2 (11:30 AM - 1:30 PM).
3. Verify cards retain rounded corners, thick borders, white title text, detail badges, and courseId-based palette colors (green/blue).

### Scenario B: Time Grid Axis & Boundaries
1. Verify time axis labels are displayed in 12-hour format ("8 AM", "9 AM", ..., "5 PM").
2. Verify each hour height is exactly 80px.
3. Verify grid lines use thin light blue color (`#E0F2FE` / `border-sky-100`).
4. Verify calendar background is `#F5F6EE`.

### Scenario C: Custom Time Indicator & Overlay
1. Check that the dark teal line with circle dot and text badge ("Next: ..." or active class name) appears at the current time.
2. Scroll the grid. Verify the time indicator moves with the grid and never drifts from the correct hour mark.

### Scenario D: "Now" Jump Button Repositioning
1. Scroll away from the time indicator.
2. Verify the "Now" jump button appears at the **bottom-left** (`bottom-4 left-4`).
3. Verify the bottom-right area remains clear of buttons.
4. Click "Now" and confirm it smoothly scrolls to the indicator line.
