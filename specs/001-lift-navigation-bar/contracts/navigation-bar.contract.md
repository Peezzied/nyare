# Component Contract: NavigationBar.vue

## 1. UI Component Contract

### Component Tag
`<NavigationBar />`

### Import Path
`@/components/NavigationBar.vue`

### Default Navigation Destinations
When no `items` prop is provided, the component defaults to:
1. **Tasks / To-Do**:
   - `id`: `'tasks'`
   - `label`: `'Tasks'`
   - `route`: `'/tasks'`
   - `icon`: `ClipboardList` (`@lucide/vue`)
2. **Calendar**:
   - `id`: `'calendar'`
   - `label`: `'Calendar'`
   - `route`: `'/calendar'`
   - `icon`: `Calendar` (`@lucide/vue`)
3. **Notes**:
   - `id`: `'notes'`
   - `label`: `'Notes'`
   - `route`: `'/notes'`
   - `icon`: `SquarePen` (`@lucide/vue`)

---

## 2. Accessibility Contract (ARIA / Semantics)

| Element | Attribute | Value | Behavior |
| :--- | :--- | :--- | :--- |
| Container | `role` | `'navigation'` | Declares landmark region |
| Container | `aria-label` | `'Main navigation'` | Accessible container label |
| Button List | `role` | `'tablist'` | Groups interactive destinations |
| Button | `role` | `'tab'` | Marks interactive destination |
| Button | `aria-selected` | `'true'` / `'false'` | Dynamically reflects active state |
| Button | `aria-label` | Destination label | Screen reader announcement |
| Active Button | `aria-current` | `'page'` (when routed) | Indicates current page |

---

## 3. Histoire Story Contract

### File Location
`src/components/NavigationBar.story.vue`

### Story Title
`<Story title="components/NavigationBar">`

### Required Variants
1. `<Variant title="Default">`: Renders interactive navigation bar with live tab selection.
2. `<Variant title="Active States">`: Shows individual tabs in Resting, Pressed, and Lifted Active states side by side.
3. `<Variant title="Mobile Frame">`: Embeds navigation bar within a 390px mobile mockup shell.
