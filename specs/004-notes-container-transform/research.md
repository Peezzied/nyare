# Research: Notes View Container Transform Animation

**Feature**: Notes View Container Transform Animation  
**Branch**: `004-notes-container-transform`  
**Date**: 2026-10-17  
**Status**: Completed  

---

## Decision 1: Mobile Container Transform Animation Engine

### Decision
Implement the container transform animation using native Vue 3 reactivity and CSS transition geometry (FLIP pattern) reading the origin target's `getBoundingClientRect()`, matching the exact technique established in `feat/calendar-improvements` (`EventDetailModal.vue`).

### Rationale
- **Zero New Dependencies**: Complies strictly with Constitution Principle VII (Ponytail Minimalism). No external animation libraries (such as GSAP, Framer Motion, or Motion One) are added to the frontend bundle.
- **Exact Spatial Continuity**: Standard dialog or route transitions only pop or zoom from the screen center (`zoom-in-95`). By measuring the tapped DOM rectangle, the container expands outward from the exact tapped element:
  - For existing notes: expands from the 2-column masonry `NoteCard` or `PictureNoteCard`.
  - For adding notes: expands from the bottom-right floating action button (`notes-fab`).
- **Smooth 60fps Mobile Performance**: Using CSS transitions on GPU-composited and accelerated properties (`top`, `left`, `width`, `height`, `border-radius`, `transform`, `opacity`) with `will-change` hints prevents layout thrashing during the 320ms expansion.

### Alternatives Considered
1. **Native Browser View Transitions API (`document.startViewTransition`)**:
   - *Rejected*: Inconsistent behavior across mobile browser engines. Complex masonry grid layouts and nested editor containers suffer from clipping defects, snapshot stretching, and lack of fine-grained control over staggered inner content delays (100ms / 180ms).
2. **GSAP / Framer Motion Vue**:
   - *Rejected*: Adds 30KB-60KB of bundle weight for a single transition, violating Ponytail rules.
3. **Centered Modal Zoom**:
   - *Rejected*: Fails to deliver spatial continuity between the tapped card or button and the resulting editor surface.

---

## Decision 2: Navigation & Browser History Handling

### Decision
Render the note editor inside an in-page expandable container overlay within `NotesView.vue`, managing device and browser back dismissal with ephemeral `window.history.pushState` and a `popstate` event listener.

### Rationale
- **Notes List Scroll & State Preservation**: Expanding within the page avoids unmounting `NotesView.vue`. The masonry grid retains 100% of its scroll offset, catalog cache, and loaded notes list when returning from the editor.
- **Natural Mobile Ergonomics**: Android system back gestures, iOS swipe gestures, and browser back buttons smoothly collapse the editor back into the origin card or button rather than navigating away from the notes tab.
- **Dual Support for Direct URLs**: Direct hits to `/notes/:id` and `/notes/new` (e.g. bookmarks or reloads) continue to render `NoteEditor.vue` as a standalone full-page view, while in-app clicks from `/notes` leverage the container transform overlay.

### Alternatives Considered
1. **Standard Router Navigation (`router.push` with route destruction)**:
   - *Rejected*: Destroys `NotesView` component state and loses scroll position unless complex scroll-restoration cache layers are introduced.
2. **URL Query Param Sync (`/notes?noteId=123`)**:
   - *Deferred*: Adds URL sync overhead without direct user benefit for in-page creation and editing.

---

## Decision 3: Staggered Content Orchestration & Motion Curves

### Decision
Apply the exact 3-stage staggered sequence and physics curves from `feat/calendar-improvements`:

```text
[Tap] ── 0ms ──► [Container Expansion: 320ms Decelerate] ────────────► [Full Viewport]
          └──── 100ms ──► [Header, Title & Body Fade/Slide: 200ms] ────► [100% Opacity]
                  └──── 180ms ──► [Toolbar & Action Buttons Spring: 140ms] ──► [Settled]
```

### Motion Specifications
- **Expansion Physics**:
  - Duration: `320ms`.
  - Curve: `cubic-bezier(0.05, 0.7, 0.1, 1.0)` (Material 3 Emphasized Decelerate).
  - Geometry: Animates `top`, `left`, `width`, `height`, and `borderRadius` from origin card/button rect to viewport dimensions (`0px 0px 100vw 100vh`).
- **Inner Content Entrance (Staggered)**:
  - Delay: `100ms` offset.
  - Transforms: `translate-y-2` → `translate-y-0`, `opacity-0` → `opacity-100` over `200ms`.
  - Prevents font stretching, layout jumping, and line wrapping distortion during rapid container expansion.
- **Toolbar & Action Buttons Entrance**:
  - Delay: `180ms` offset.
  - Transforms: `translate-y-2` → `translate-y-0`, `opacity-0` → `opacity-100`.
- **Collapse Reverse Physics**:
  - Duration: `240ms` total.
  - Curve: `cubic-bezier(0.3, 0.0, 0.8, 0.15)` (Material 3 Emphasized Accelerate).
  - Fast Content Exit: Content and controls fade out instantly in the first `80ms` (`opacity-0`), allowing only the clean container frame to contract back into origin coordinates.

### Alternatives Considered
1. **Simultaneous Content Scaling**:
   - *Rejected*: Scaling full editor text and formatting buttons while the container scales causes visual jitter and layout re-flow.
2. **Delayed Content Until Expansion Finishes (320ms)**:
   - *Rejected*: Feels sluggish and causes a visible blank flash after the container finishes expanding.

---

## Decision 4: Accessible Motion for Reduced Motion Preferences

### Decision
Detect `prefers-reduced-motion: reduce` via `window.matchMedia`. When active, disable all spatial bounding transformations (`top`, `left`, `width`, `height`, `borderRadius`) and replace the animation with a subtle `150ms` opacity crossfade.

### Rationale
- **Compliance**: Satisfies WCAG 2.3.3 (Animation from Interactions) and Constitution Principle VIII.
- **Comfort**: Prevents vestibular discomfort for motion-sensitive students while preserving identical functional behavior and history handling.

### Alternatives Considered
1. **Disabling transitions completely (0ms cut)**:
   - *Rejected*: Abrupt instant cuts look broken. A gentle 150ms crossfade provides comfortable feedback without spatial movement.
