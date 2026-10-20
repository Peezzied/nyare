# Data Model: Lift Navigation Bar Component

## 1. Core Entities

### NavigationItem
Represents an individual navigation destination rendered in the bar.

| Field | Type | Description | Required | Constraints |
| :--- | :--- | :--- | :---: | :--- |
| `id` | `string` | Unique identifier for destination | Yes | Non-empty (`tasks`, `calendar`, `notes`) |
| `label` | `string` | Human-readable accessible label | Yes | Non-empty text |
| `icon` | `Component` | Vector icon component (`LucideIcon`) | Yes | Valid Vue component |
| `route` | `string` | Router destination path | Yes | Starts with `/` (e.g., `/tasks`, `/calendar`, `/notes`) |
| `badgeCount` | `number` | Optional pending item count badge | No | Non-negative integer |

### NavigationState
Represents the local or routed navigation status.

| Field | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| `activeId` | `string` | Identifier of currently active destination | Must match one item in items array |
| `isPressed` | `string \| null` | Identifier of destination actively pressed | `null` when no touch down active |

---

## 2. Interaction State Transitions

```text
[ Resting Inactive ]
       │
       ▼ (Touch Down / Mouse Down)
[ Pressed / Compressed ] (+2px Y-translation, 100ms)
       │
       ▼ (Release / View Navigation)
[ Lifted Active ] (-4px Y-translation, Ocean Cyan #00A4C8, +4px bottom bevel)
       │
       ▼ (New Tab Selected)
[ Transition to Resting Inactive ] (Return to baseline, 150ms ease-out)
```

---

## 3. Component Interface Model

### Props
```typescript
interface NavigationBarProps {
  /**
   * Currently active destination identifier.
   * If omitted, falls back to router route matching.
   */
  modelValue?: string

  /**
   * Custom navigation items override.
   * Defaults to the standard 3 Nyare academic destinations.
   */
  items?: NavigationItem[]
}
```

### Emits
```typescript
interface NavigationBarEmits {
  (e: 'update:modelValue', id: string): void
  (e: 'navigate', item: NavigationItem): void
}
```
