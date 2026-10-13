# Research: Course Picker Modal in Note Editor

## 1. UI Component Primitives & Dialog Mechanics

### Decision
Use the shadcn-vue `Dialog` component family (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger`, `DialogClose`) built on `reka-ui`.

### Rationale
- **Accessibility & Focus Management**: Built-in WAI-ARIA `dialog` role, focus trap, Escape key dismiss, and aria-describedby bindings.
- **Backdrop Scrim**: Seamless modal overlay with smooth transitions (`fade-in-0`, `zoom-in-95`).
- **Clean Structure**: Allows decoupling the course trigger (a tactile pill matching NoteEditor styling) from the modal body.
- **Lightweight**: Zero external state management required; controls open state through Vue standard `v-model:open`.

### Alternatives Considered
- `reka-ui` raw `Dialog`: Requires rewriting shadcn class scaffolding. Using shadcn-vue components directly preserves consistency with Button and Popover.
- Native `<dialog>` HTML element: Harder to achieve uniform animations and backdrop styling cross-browser without polyfills.
- Bottom sheet drawer: The mobile reference prototype shows a centered, rounded floating card modal rather than a full slide-from-bottom drawer.

---

## 2. Visual Styling Attuned to DESIGN.md

### Decision
Tailor the Dialog container and course option items to Nyare's design system:
- **Dialog Surface**: Warm parchment card (`bg-[#FDFEF7]` / `bg-[#FFFFFF]`), border `border-[#00A4C8]/30`, rounded container (`rounded-2xl` / 16px).
- **Course Color Dot**: Circular marker (`size-3` or `size-3.5` rounded-full) colored by `courseColors` utility (`getCourseBadgeStyle(course.id).backgroundColor` or solid color).
- **Course Title**: Primary label (`font-bold text-slate-800 text-sm font-sans truncate`).
- **Schedule Subtitle**: Secondary line (`text-xs text-[#7B8B97] font-medium`).
- **Touch Target**: Row padding `py-3 px-3.5` (min-height 48px), `rounded-xl`, with subtle hover/press state (`hover:bg-[#00A4C8]/10 active:bg-[#00A4C8]/20 transition-colors`).
- **Selected State**: Subtle indicator or highlight (`bg-[#00A4C8]/10 text-[#007B99]`) for the currently active course.

### Rationale
Maintains 100% fidelity to the visual reference image while upholding `DESIGN.md` tokens (coastal parchment `#F6F7EE`, ocean cyan `#00A4C8`, slate text `#334155`, rounded scales).

---

## 3. Schedule Aggregation & Formatting

### Decision
Create a lightweight formatting helper: `formatCourseSchedule(schedules: ScheduleResponse[])`:
- Filters schedules by `courseId`.
- Maps days into standard shorthand:
  - `MONDAY` → `Mo`
  - `TUESDAY` → `Tu`
  - `WEDNESDAY` → `We`
  - `THURSDAY` → `Th`
  - `FRIDAY` → `Fr`
  - `SATURDAY` → `Sa`
  - `SUNDAY` → `Su`
- Deduplicates days in week order (Mo → Su).
- Formats as comma-separated string (e.g., `"Mo, We, Th"`).
- Fallback when no schedules exist: `"No set schedule"`.

### Rationale
- Completely client-side and derived from existing `useCatalog().schedules` cache.
- Adheres to Ponytail minimalism without requiring additional backend API fields.

---

## 4. Strict Save Validation Preconditions

### Decision
In `NoteEditor.vue`, enforce the clarified requirements on `isSaveDisabled`:
```typescript
const isSaveDisabled = computed(() => {
  if (selectedCourseId.value === null) return true
  if (!entryDate.value || !entryDate.value.trim()) return true
  if (!contentMarkdown.value || !contentMarkdown.value.trim()) return true
  if (isSaving.value) return true
  return false
})
```

### Rationale
Protects domain invariants: every note must have a course parent (`Course Anchor`) and a valid entry date for chronological virtual study plan processing.
