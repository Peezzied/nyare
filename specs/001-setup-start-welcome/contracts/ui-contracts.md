# Interface & Component Contracts: Start, Welcome, and Schedule Header

**Feature**: [spec.md](../spec.md)  
**Date**: 2026-10-12  

## 1. Route Contracts

The Vue Router configuration defines three application routes:

| Route Path | Route Name | Component | Access Condition | Next Destination |
|---|---|---|---|---|
| `/` | `start` | `StartView.vue` | Public | `/welcome` on activating "GET STARTED" |
| `/welcome` | `welcome` | `WelcomeView.vue` | Public | `/schedule` on activating "CONTINUE" with valid name |
| `/schedule` | `schedule` | `ScheduleView.vue` | Public | `/welcome` on activating top header back button |

---

## 2. Component Contracts

### 2.1 `TactileButton`

Reusable 3D tactile button honoring `frontend/DESIGN.md` Section 3.

- **Props**:
  - `disabled` (`boolean`, optional, default: `false`): Disables pointer events and renders a muted style.
  - `type` (`'button' | 'submit' | 'reset'`, optional, default: `'button'`): Native button type.
  - `ariaLabel` (`string`, optional): Accessible label override if text content is insufficient.
- **Slots**:
  - `default`: Text or icon content inside the button face.
- **Events**:
  - `click(event: MouseEvent)`: Emitted when the user activates the enabled button.

### 2.2 `StepProgress`

Progress dots indicator for onboarding multi-step flows.

- **Props**:
  - `activeStep` (`number`, required): 1-based index of the currently active dot (e.g., `2` for Welcome, `3` for Schedule).
  - `totalSteps` (`number`, optional, default: `3`): Total number of dots to render.
- **Accessibility**:
  - Container element includes `role="status"` and `aria-label="Step [activeStep] of [totalSteps]"`.

---

## 3. Composable Contract: `useOnboarding`

Encapsulates reactive client-side onboarding state without external stores.

```typescript
export interface UseOnboardingReturn {
  studentName: Ref<string>
  isNameValid: ComputedRef<boolean>
  setStudentName: (name: string) => void
  resetOnboarding: () => void
}
```

- `isNameValid`: Computed boolean returning `true` when `studentName.value.trim().length > 0`.
- `setStudentName`: Updates the `studentName` reactive reference.
- `resetOnboarding`: Clears `studentName` back to empty string.
