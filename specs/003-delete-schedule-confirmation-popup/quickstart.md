# Quickstart: Reusable Delete Schedule Confirmation Popup

## Prerequisites

- Existing frontend dependencies are installed.
- Running backend on port 8080 or the configured schedule mock.

## Validation

1. Run Oxlint after component edits:

   ```bash
   npm run lint:oxlint
   ```

2. Run TypeScript checks:

   ```bash
   npm run type-check
   ```

3. Run targeted unit tests:

   ```bash
   npx vitest run src/components/__tests__/DeleteScheduleConfirmDialog.spec.ts
   ```

4. Manual checks:
   - Open the popup with a supplied schedule target and verify the title, message, selected name, color dot, red CONFIRM button, gray Back action, and overlay.
   - Confirm a successful deletion calls `DELETE /api/schedules/{id}` once and emits `deleted`.
   - Dismiss with Back and verify no deletion call and no success event.
   - Verify repeated CONFIRM presses do not send repeated requests.
   - Verify a failed deletion keeps the popup retryable.