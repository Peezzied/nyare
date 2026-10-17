# Research: Course Block Expansion & Detail View

**Feature**: Course Block Expansion & Detail View  
**Date**: 2026-10-16  
**Status**: Completed  

---

## Decision 1: Mobile Container Transform Animation

### Decision
Implement the expanding container transition using native Vue 3 reactivity and CSS transition geometry (FLIP pattern) reading the origin target's `getBoundingClientRect()`.

### Rationale
- **Zero New Dependencies**: Complies strictly with Constitution Principle VII (Ponytail Minimalism). No heavy animation library is added.
- **Exact Spatial Continuity**: Standard modal libraries (e.g. shadcn-vue `Dialog`) only zoom from the screen center (`zoom-in-95`). By measuring the tapped DOM rectangle, the detail card physically expands outward from the calendar slot directly to full mobile viewport dimensions (`top: 0`, `left: 0`, `width: 100%`, `height: 100%`).
- **Smooth 60fps Mobile Performance**: Using CSS transitions or the Web Animations API on GPU-composited transform properties (`transform: translate(...) scale(...)`) avoids layout thrashing during the 300ms expansion.

### Alternatives Considered
1. **shadcn-vue `Dialog` or `Popover`**:
   - *Rejected*: Standard shadcn components lack spatial origin coordinates. They can only pop or scale from the screen center or anchor edges.
2. **Native Browser View Transitions API (`document.startViewTransition`)**:
   - *Rejected*: View transitions inside complex nested scrolling elements (Schedule-X grid) can cause clipping issues across diverse mobile WebKit and Chromium engines.
3. **GSAP / Framer Motion Vue**:
   - *Rejected*: Adds tens of kilobytes of bundle bloat for a single transition, violating Ponytail rules.

---

## Decision 2: Navigation & Browser History Handling

### Decision
Keep the active detail state in an in-page overlay reference (`activeEvent`) and manage mobile back dismissal using ephemeral `history.pushState` and a `popstate` event listener.

### Rationale
- **Calendar State Preservation**: Does not trigger Vue Router page component unmounting or remounting. The calendar grid retains 100% of its scroll position and current day view.
- **Natural Mobile Ergonomics**: Android system back swipes or browser back buttons cleanly close the open detail card instead of navigating the student away from the calendar.
- **Lean Scaffold for Route Actions**: Tapping shortcut buttons (`/tasks`, `/notes`) uses Vue Router's `router.push()` with clear comments for upcoming course filter query binding.

### Alternatives Considered
1. **Dedicated Route (`/schedule/course/:id`)**:
   - *Rejected*: Incurs route teardown, re-fetching, and calendar scroll reset.
2. **Query Parameter Sync (`/schedule?modal=course-123`)**:
   - *Deferred*: Unnecessary complexity for MVP since no deep-linking was requested for transient schedule previews.

---

## Decision 3: Component Architecture & Modularity

### Decision
Create a dedicated `EventDetailModal.vue` container that manages the expanding backdrop and container transform, delegating the inner body to `CourseBlockDetail.vue` and `UntimedBlockDetail.vue`.

### Rationale
- **Single Responsibility**: Animation and overlay dismissal logic are encapsulated in one container.
- **Clean Information Separation**:
  - Course block detail strictly displays: course color dot, course name, time window, and navigation action buttons (`/tasks`, `/notes`).
  - Task and event blocks strictly display: title and singular linked note.
- **Reuse**: Mounts cleanly within `ScheduleCalendar.vue` and responds to clicks from both `CourseCard.vue` and `AllDayStrip.vue`.

### Alternatives Considered
1. **Inlining everything into `CourseCard.vue`**:
   - *Rejected*: CourseCard is embedded inside Schedule-X slots and gets clipped by `overflow: hidden` containers. The detail view must be portaled or rendered at the root overlay level.
