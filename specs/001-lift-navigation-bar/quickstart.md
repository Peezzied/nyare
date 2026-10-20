# Quickstart & Verification Guide: Navigation Bar Component

## 1. Prerequisites

- Node.js `^22.18.0 || >=24.12.0`
- Current working directory: `frontend/`

---

## 2. Validation Scenarios

### Scenario A: Unit Test Execution
Execute component unit tests to verify selection, lift classes, and event emissions:

```bash
npx vitest run src/components/__tests__/NavigationBar.spec.ts
```

**Expected Result**:
- Tests mount `NavigationBar.vue` with 3 tabs.
- Default active tab has `-translate-y-1` lift styling and Ocean Cyan accent class.
- Clicking an inactive tab emits `update:modelValue` and triggers active state shift.

### Scenario B: Histoire Visual Story Preview
Launch the Histoire development preview server:

```bash
npm run story
```

**Expected Result**:
- Histoire server starts on local port.
- `components/NavigationBar` appears in story list.
- Toggling tabs displays tactile lift animation and accent color shift.
- Mobile frame variant accurately displays safe-area clearance.

### Scenario C: Static Lint & Type Check
Verify compliance with TypeScript compiler and ESLint / Oxlint rules:

```bash
npm run lint:oxlint
npm run type-check
```

**Expected Result**: Zero lint errors and zero type errors.
