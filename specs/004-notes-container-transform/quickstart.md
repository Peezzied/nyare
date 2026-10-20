# Quickstart Validation Guide: Notes Container Transform Animation

**Feature**: Notes View Container Transform Animation  
**Target View**: `/notes`  
**Date**: 2026-10-17  

---

## Prerequisites

1. Start the Vite development server:
   ```bash
   cd frontend
   npm run dev
   ```
2. Navigate to `http://localhost:5173/notes` in a mobile browser or responsive device emulation (viewport width 390px).

---

## Validation Scenarios

### Scenario 1: Existing Note Card Container Transform (Priority P1)

1. Open `/notes` with existing note cards displayed in the masonry grid.
2. Tap on any note card.
3. **Verify**:
   - The card container animates smoothly outward from the exact tapped card boundary using Material 3 decelerate easing (`cubic-bezier(0.05, 0.7, 0.1, 1.0)` over 320ms).
   - Semi-transparent scrim (`bg-black/20`) fades in behind the expanding card.
   - Staggered entrance:
     - Note title, date badge, and body text fade in smoothly at ~100ms offset (`translate-y-2` → `translate-y-0`) without font stretching.
     - Formatting toolbar and action controls appear at ~180ms offset.
   - Background page scroll is locked (`document.body.style.overflow = 'hidden'`).
   - The editor is fully interactive at 320ms.

---

### Scenario 2: Floating Action Button (FAB) Expansion (Priority P1)

1. In `/notes`, tap the circular create note floating action button (`notes-fab`) in the bottom-right corner.
2. **Verify**:
   - The container expands smoothly from the circular FAB button's exact coordinates and rounded radius into a full-screen blank note editor.
   - The new note editor initializes ready for input with empty title and body.
   - The back button appears in the top navigation bar.

---

### Scenario 3: Note Editor Dismissal & Scroll Preservation (Priority P1)

1. Open an existing note or new note via container transform.
2. Scroll the editor content slightly, then tap the top-left Back button.
3. **Verify**:
   - Editor content fades out quickly in the first 80ms.
   - The container frame contracts smoothly back into the origin coordinates (tapped card or FAB) using accelerate easing (`cubic-bezier(0.3, 0.0, 0.8, 0.15)` over 240ms).
   - Upon completion, the notes grid retains 100% of its scroll position.
   - The page scroll is restored.

---

### Scenario 4: Device & Browser Back Gesture Interception (Priority P1)

1. In `/notes`, tap a note card to expand the editor.
2. Press the browser Back button or perform a mobile swipe-back gesture.
3. **Verify**:
   - The note editor collapses cleanly back to the origin card coordinates.
   - The application remains on `/notes` and does not navigate away.

---

### Scenario 5: Accessible Motion Verification (Priority P2)

1. In your operating system or browser devtools, enable "Emulate CSS prefers-reduced-motion: reduce".
2. Tap any note card or the FAB button in `/notes`.
3. **Verify**:
   - The container does not scale spatially.
   - The editor appears smoothly via a subtle 150ms opacity crossfade.
   - Dismissing the editor fades out via a subtle 150ms opacity crossfade.

---

## Code Quality Verification Commands

Run from `frontend/`:

```bash
npm run lint
npm run type-check
npm run test:unit -- src/views/__tests__/NotesView.spec.ts
```
