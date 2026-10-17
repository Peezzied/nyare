# Data Model: Notes View Container Transform Animation

**Feature**: Notes View Container Transform Animation  
**Branch**: `004-notes-container-transform`  
**Date**: 2026-10-17  
**Status**: Complete  

---

## Entities

### 1. `TapOriginRect`

Represents the physical viewport coordinates and geometry of the tapped note card or action button.

| Field | Type | Description |
| :--- | :--- | :--- |
| `top` | `number` | Distance in pixels from the top edge of the viewport |
| `left` | `number` | Distance in pixels from the left edge of the viewport |
| `width` | `number` | Bounding width in pixels |
| `height` | `number` | Bounding height in pixels |
| `borderRadius` | `string` | Initial corner radius (e.g. `'16px'` for cards, `'16px'` for FAB) |

---

### 2. `NoteModalTriggerKind`

Distinguishes the source element initiating the expansion.

```typescript
type NoteModalTriggerKind = 'card' | 'fab'
```

- `'card'`: Tapped an existing note card (`NoteCard` or `PictureNoteCard`) in the notes grid.
- `'fab'`: Tapped the floating action button (`notes-fab`) to create a blank note.

---

### 3. `AnimationPhase`

Tracks the lifecycle phase of the container motion sequence.

```typescript
type AnimationPhase = 'idle' | 'expanding' | 'settled' | 'collapsing'
```

- `'idle'`: Modal is unmounted or completely closed.
- `'expanding'`: Container is currently transitioning from origin geometry to full viewport.
- `'settled'`: Full viewport expansion and staggered content entrances have settled.
- `'collapsing'`: Container is actively contracting from full viewport back to origin coordinates.

---

### 4. `ActiveNoteModalState`

Encapsulates all reactive state governing the container transform overlay inside `NotesView.vue`.

| Field | Type | Description |
| :--- | :--- | :--- |
| `isOpen` | `boolean` | Whether the overlay container is currently active or dismissing |
| `noteId` | `string \| null` | UUID of the selected note, or `null` when creating a new note |
| `triggerKind` | `NoteModalTriggerKind \| null` | The trigger element category |
| `originRect` | `TapOriginRect \| null` | Origin coordinates captured before expansion |
| `phase` | `AnimationPhase` | The active animation phase |
| `isTransitioning` | `boolean` | Flag enabling CSS transition classes on the container |
| `isExpanded` | `boolean` | Target state driving geometry styles (full screen vs origin) |
| `showContent` | `boolean` | Controls delayed entrance of note header, title, and body text |
| `showControls` | `boolean` | Controls delayed entrance of formatting toolbar and action buttons |

---

## State Transition Lifecycle

```text
[Idle] (phase: 'idle', isOpen: false)
  │
  ├─ User taps Card or FAB ──► Capture TapOriginRect
  │                            isOpen = true, phase = 'expanding'
  │                            Position container fixed at TapOriginRect
  │                            Force reflow + requestAnimationFrame
  │                            │
  │                            ▼
  │                   [Stage 1: 0ms - 320ms]
  │                   Container expands to full viewport dimensions
  │                   Backdrop scrim fades in (bg-black/20)
  │                   Body scroll locked (overflow: hidden)
  │                   History state pushed ({ nyareNoteModal: true })
  │                            │
  │                            ├─ [Stage 2: +100ms]
  │                            │  showContent = true (Header, title, body fade/slide in)
  │                            │
  │                            ├─ [Stage 3: +180ms]
  │                            │  showControls = true (Toolbar & action buttons appear)
  │                            │
  │                            ▼
  │                   [Stage 4: +320ms]
  │                   phase = 'settled' (Editor fully interactive)
  │                            │
  ├─ User taps Back / Popstate / Escape ──► phase = 'collapsing'
  │                                         showContent = false, showControls = false (fast exit)
  │                                         Container contracts to TapOriginRect (240ms)
  │                                         Backdrop scrim fades out
  │                                         │
  ▼                                         ▼
[Idle] <───────────────────────────── phase = 'idle', isOpen = false
                                      Body scroll restored
                                      Notes list scroll position preserved 100%
```
