# UI Contract: Notes Container Transform Animation (Impeccable Edition)

**Feature**: Notes View Container Transform Animation  
**Target Files**:
- `frontend/src/views/NotesView.vue`
- `frontend/src/components/notes/NoteEditorModal.vue` (or inline container overlay)
- `frontend/src/views/NoteEditor.vue`
- `frontend/src/composables/useNoteTransition.ts`  
**Date**: 2026-10-17  
**Status**: Complete  

---

## 1. Component Interfaces

### `NoteCard.vue` & `PictureNoteCard.vue`
Emits the open event passing the DOM event with target coordinates:

```typescript
const emit = defineEmits<{
  (e: 'open', event: MouseEvent): void
}>()
```

### Notes FAB (`NotesView.vue`)
The floating action button captures its own DOM bounding rectangle on click:

```typescript
function onNewNoteClick(event: MouseEvent): void {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  openModal({
    originRect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      borderRadius: '16px',
    },
    noteId: null,
    triggerKind: 'fab',
  })
}
```

### `NoteEditorModal.vue` Interface

```typescript
interface TapOriginRect {
  top: number
  left: number
  width: number
  height: number
  borderRadius?: string
}

interface Props {
  isOpen: boolean
  noteId: string | null
  originRect: TapOriginRect | null
}

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', noteId: string): void
}>()
```

---

## 2. Motion Choreography & Physics Curves

Following the Material 3 Container Transform pattern established in `EventDetailModal.vue`:

### A. Expansion Sequence (0ms - 320ms)

```text
[Tap] ── 0ms ──► [Container Bounds Transition: 320ms] ───────────────► [Target Viewport]
          └──── 100ms ──► [Title, Date & Body Text Fade/Slide: 200ms] ──► [100% Opacity]
                  └──── 180ms ──► [Toolbar & Action Buttons Spring: 140ms] ──► [Interactive]
```

- **Outer Container Motion**:
  - Duration: `320ms`
  - Timing Function: `cubic-bezier(0.05, 0.7, 0.1, 1.0)` (Emphasized Decelerate)
  - Animates: `top`, `left`, `width`, `height`, and `borderRadius` from trigger rect to viewport (`0px 0px 100vw 100vh`, `0px` radius).
- **Backdrop Scrim**:
  - `bg-black/20` fading in over `300ms` with `transition-opacity`.
- **Inner Content Entrance (Staggered)**:
  - Triggered at `100ms` offset.
  - Class transition: `opacity-0 translate-y-2` → `opacity-100 translate-y-0`.
  - Prevents typography distortion while the container frame scales.
- **Controls & Toolbar Entrance**:
  - Triggered at `180ms` offset.
  - Class transition: `opacity-0 translate-y-2` → `opacity-100 translate-y-0`.
- **Settled State**:
  - Triggered at `320ms` offset (`phase = 'settled'`).

### B. Collapse Sequence (0ms - 240ms)

```text
[Dismiss] ── 0ms ──► Fast Content Exit (80ms: showContent = false, showControls = false)
             0ms ──► Container Bounds Contraction: 240ms Accelerate ──► [Origin Bounds]
             240ms ─► Modal Unmounts (phase = 'idle', isOpen = false)
```

- **Outer Container Motion**:
  - Duration: `240ms`
  - Timing Function: `cubic-bezier(0.3, 0.0, 0.8, 0.15)` (Emphasized Accelerate)
  - Animates back to `originRect` (`top`, `left`, `width`, `height`, `borderRadius: '16px'`).
- **Immediate Content Hide**:
  - Inner content and buttons hide instantly (`80ms`) so only the clean container card frame collapses back into place.
- **Backdrop Scrim**:
  - Fades out over `240ms`.

---

## 3. History Navigation & Device Back Contract

- **Push State on Open**:
  When `isOpen` switches to `true`:
  ```typescript
  if (typeof window !== 'undefined' && !pushedHistory) {
    window.history.pushState({ nyareNoteModal: true }, '')
    pushedHistory = true
  }
  ```
- **Popstate Interception**:
  When the user triggers browser back or Android system back gesture:
  ```typescript
  function onPopState(): void {
    if (props.isOpen) {
      pushedHistory = false
      requestClose(false)
    }
  }
  ```
- **Close Button / Escape Key**:
  When dismissing via UI button or Escape:
  ```typescript
  if (triggerHistoryBack && pushedHistory && typeof window !== 'undefined') {
    pushedHistory = false
    if (window.history.state?.nyareNoteModal) {
      window.history.back()
    }
  }
  ```

---

## 4. Scroll Lock & Viewport Continuity Contract

1. **Body Scroll Lock**:
   - While modal is open: `document.body.style.overflow = 'hidden'`.
   - On collapse settle or unmount: `document.body.style.overflow = ''`.
2. **List Scroll Preservation**:
   - `NotesView.vue` remains mounted throughout the entire modal lifecycle.
   - 100% of the masonry grid scroll offset is preserved upon editor dismissal.

---

## 5. Reduced Motion Accessibility Contract

When `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true:
- Spatial transitions (`top`, `left`, `width`, `height`, `borderRadius`) are bypassed.
- Target dimensions (`0px 0px 100vw 100vh`) apply immediately.
- Modal enters with a simple `150ms` opacity fade (`opacity-0` → `opacity-100`).
- Modal dismisses with a simple `150ms` opacity fade (`opacity-100` → `opacity-0`).
