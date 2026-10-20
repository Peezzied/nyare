# Contract: Note Editor View & Component Interfaces

## 1. Route Contract

| Route Path | View Component | Props / Route Params | Description |
|---|---|---|---|
| `/notes/new` | `NoteEditor.vue` | Query: `?courseId=123&entryDate=YYYY-MM-DD` (optional) | Create a new course journal note |
| `/notes/:id` | `NoteEditor.vue` | Param: `id` (UUID) | View and edit an existing course journal note |

---

## 2. Component Contract: `NoteEditor.vue`

### Emits / Navigation
- On successful save: navigates to `/` or previous route using `router.back()`.
- On back button tap: prompts user if unsaved changes exist (`isDirty`), then navigates back.

### Dependencies
- Composable: `useCatalog()` to fetch courses and schedules.
- API Clients: `notesApi` (`create`, `update`, `get`), `imagesApi` (`upload`).
- Component: `TiptapEditor.vue` with bottom toolbar configuration.

---

## 3. Component Contract: `TiptapToolbar.vue` Enhancements

### Props
```typescript
interface Props {
  editor?: Editor
  disabled?: boolean
  layout?: 'top' | 'bottom'        // Defaults to 'bottom'
  variant?: 'wrap' | 'scrollable'   // Defaults to 'scrollable'
}
```

### Slots & Styling
- When `variant="scrollable"`, toolbar container applies:
  `flex flex-nowrap items-center justify-between overflow-x-auto no-scrollbar gap-2 p-2 border-t-2 border-[#00A4C8] bg-card`
- **Left Cluster (Formatting)**:
  - Image upload (`ImageUp` or photo icon), Bold (`Bold` / `B`), Underline (`Underline` / `U`), Italic (`Italic` / `/`).
- **Right Cluster (Standout Undo / Redo)**:
  - History buttons grouped together with distinct high-contrast styling:
    `text-[#00A4C8] hover:bg-[#00A4C8]/10 active:scale-95 text-lg font-bold p-2`
  - Disabled state: `opacity-30 pointer-events-none`
- **Touch Target**:
  - Minimum 36x36px touch target for all toolbar actions.
