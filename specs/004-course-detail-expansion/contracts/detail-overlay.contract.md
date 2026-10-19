# UI Contract: Calendar Block Detail Overlay (Impeccable Edition)

**Feature**: Course Block Expansion & Detail View  
**Target File**: `frontend/src/components/day-view/EventDetailModal.vue`  
**Date**: 2026-10-16  
**Status**: Complete  

---

## 1. Component Interfaces

### `CourseCard.vue`
Emits the click event along with the bounding rectangle of the card element:

```typescript
const emit = defineEmits<{
  (e: 'select', event: DayEvent, originRect: DOMRect): void
}>()
```

### `AllDayStrip.vue`
Emits the click event along with the bounding rectangle of the untimed pill:

```typescript
const emit = defineEmits<{
  (e: 'selectUntimed', item: UntimedDayItem, originRect: DOMRect): void
}>()
```

### `EventDetailModal.vue`
Overlay component controlling container transform and content rendering:

```typescript
interface Props {
  isOpen: boolean
  originRect: {
    top: number
    left: number
    width: number
    height: number
  } | null
  kind: 'course' | 'other'
  data: CourseBlockDetailState | NonCourseBlockDetailState | null
}

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'navigate', routePath: string): void
}>()
```

---

## 2. Information Display Contract

### For `kind === 'course'`
The view MUST render strictly:
1. **Course Color Dot**: An 8px-10px circular bead with subtle ring border matching the course theme (`green`, `blue`, `purple`, `orange`).
2. **Course Name**: Headlined with `Quicksand` weight 700 font (`text-2xl font-bold text-[#334155]`).
3. **Time Window**: Styled as a clean nautical pill badge (`bg-[#F6F7EE] border border-[#CBD5E1] text-[#334155] font-quicksand font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 text-sm`).
4. **Action Buttons**:
   - `Tasks`: Tactile 3D button navigating to `/tasks`.
   - `Notes`: Tactile 3D button navigating to `/notes`.

*Prohibited fields*: No room, no instructor, no description.

### For `kind === 'other'` (Task / Academic Event)
The view MUST render strictly:
1. **Title**: Headlined with `Quicksand` weight 700 font (`text-xl font-bold text-[#334155]`).
2. **Linked Note**: A singular pill or parchment card with a note icon showing the preparation note title (hidden if null).

*Prohibited fields*: No course color dot, no shortcut buttons.

---

## 3. Impeccable Motion Choreography

The container transform uses a **3-stage staggered sequence** to prevent font stretching or visual distortion during the expansion:

```
[Tap] ── 0ms ──► [Container Expansion: 320ms Decelerate] ────────────► [Full Bounds]
          └──── 100ms ──► [Header & Content Fade/Slide: 180ms] ──────► [100% Opacity]
                  └──── 180ms ──► [3D Tactile Buttons Spring: 160ms] ──► [Settled]
```

### Expansion Curves
- **Outer Container Motion**:
  - Duration: `320ms`
  - Timing Function: `cubic-bezier(0.05, 0.7, 0.1, 1.0)` (Emphasized Decelerate)
  - Animates: `top`, `left`, `width`, `height`, `borderRadius` from origin card to full viewport card.
- **Inner Content Entrance (Staggered)**:
  - Starts at `100ms` offset.
  - Transforms: `translate-y-2` → `translate-y-0`, `opacity-0` → `opacity-100`.
  - Prevents text scaling artifacts while the container frame is expanding.
- **Tactile Button Entrance**:
  - Starts at `180ms` offset.
  - Timing: `cubic-bezier(0.34, 1.56, 0.64, 1.0)` (Overshoot spring).
- **Backdrop Overlay**:
  - `bg-slate-900/40 backdrop-blur-[3px]` fading in over `300ms`.

### Collapse Reverse Curves
- **Duration**: `240ms` total.
- **Timing Function**: `cubic-bezier(0.3, 0.0, 0.8, 0.15)` (Emphasized Accelerate).
- **Content Exit**: Inner details fade out in the first `80ms` so only the smooth card boundary collapses back into the calendar slot coordinates.

---

## 4. Visual Tokens & Craft Standards (from `DESIGN.md`)

- **Card Shell**: White `#FFFFFF` surface with warm parchment `#F6F7EE` background accents and `#CBD5E1` subtle borders.
- **Close Button**: Tactile rounded icon button (`rounded-full p-2 bg-[#F6F7EE] hover:bg-[#E2E8F0] active:scale-95 text-[#334155] transition-all`).
- **3D Tactile Buttons**:
  - Face: Ocean Cyan `#00A4C8`
  - Bottom Bevel: `4px solid #007B99`
  - Text: White `Quicksand` 700
  - Active Tap State: `active:translate-y-1 active:border-b-0`

---

## 5. Accessibility & Mobile Ergonomics

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby="detail-modal-title"`.
- Focus is trapped inside the modal container when open.
- Pressing `Escape` triggers close.
- Background body scroll is locked while the overlay is mounted (`overflow-hidden` on app container).
- Ephemeral `history.pushState` intercepts device back buttons/gestures.
