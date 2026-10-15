# Implementation Plan: To-do Screen, Burger Panel, and Item Modal

Implement 3 mobile frames per approved spec `specs/001-todo-frames/spec.md`.

## User Review Required
> [!IMPORTANT]
> Shared `TaskResponse` stays untouched. Display-only `time` is provided via a separate fixture map or local extended type.

## Proposed Changes

### Dependencies & Primitives
- Install `lucide-vue-next` and shadcn-vue primitives (`reka-ui` for Checkbox, Dialog, Popover).
- Add `ui/checkbox`, `ui/dialog`, and `ui/popover`.

### Data Layer
- `[MODIFY] frontend/src/api/mocks/fixtures.ts`: Add separate display `time` map or local extended type. Correct course title spelling. Preserve `TaskResponse`.

### Components & Views
- `[NEW] frontend/src/components/TodoHeader.vue`: Fixed header with Menu button, centered title, divider, empty mascot circle.
- `[NEW] frontend/src/components/BottomNav.vue`: Fixed 64px bar with ClipboardList (active), Calendar, PenSquare stubs.
- `[NEW] frontend/src/components/TodoBurgerPanel.vue`: Empty popover under hamburger button without scrim.
- `[NEW] frontend/src/components/TodoItemModal.vue`: Empty centered modal (~60% height, ~45px margins) with scrim and SR title.
- `[NEW] frontend/src/views/TodoView.vue`: Flat list sorted by date ascending with date column, course color, title, time, dot divider, and Checkbox.
- `[MODIFY] frontend/src/router/index.ts`: Map `/` to `TodoView`, add stub routes for `/calendar` and `/notes`.
- `[MODIFY] frontend/src/App.vue`: Render router view inside baseline mobile shell.

## Verification Plan
### Automated Tests
- `npm run type-check`: Type validation.
- `npm run lint:oxlint`: Lint validation.
- `npx vitest run src/api`: Confirm existing fixture and adapter tests pass. No new unit tests.
### Manual Verification
- Verify layout against `todo-main.png`, `todo-burger.png`, `todo-item-modal.png` at 390px.
- Verify outside-click and Escape key close both burger popover and item modal.
