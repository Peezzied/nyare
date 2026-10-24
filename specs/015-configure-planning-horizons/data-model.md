# Data Model: Configurable Planning and Backdating Horizons

## Entity Extensions

### `User` Entity (`users` table)

The existing `User` entity is augmented with two integer preference fields:

| Field | Type | Nullable | Default | Validation Bounds | Description |
|:---|:---|:---|:---|:---|:---|
| `planningHorizonDays` | `Integer` | No | `14` | `1 <= value <= 60` | Number of days ahead the AI planner inspects upcoming events for study preparation tasks. |
| `backdatingHorizonDays` | `Integer` | No | `14` | `1 <= value <= 60` | Maximum number of days in the past a journal note entry date may be set. |

```java
// Schema representation on group.four.nyare.nyare.model.User
@NotNull
@Min(1)
@Max(60)
@Column(nullable = false)
private Integer planningHorizonDays = 14;

@NotNull
@Min(1)
@Max(60)
@Column(nullable = false)
private Integer backdatingHorizonDays = 14;
```

---

## Data Transfer Objects

### `UserSettingsRequest`
Payload sent from frontend to update user preferences.

```java
package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UserSettingsRequest(
    @NotNull(message = "Planning horizon is required")
    @Min(value = 1, message = "Planning horizon must be at least 1 day")
    @Max(value = 60, message = "Planning horizon cannot exceed 60 days")
    Integer planningHorizonDays,

    @NotNull(message = "Backdating horizon is required")
    @Min(value = 1, message = "Backdating horizon must be at least 1 day")
    @Max(value = 60, message = "Backdating horizon cannot exceed 60 days")
    Integer backdatingHorizonDays
) {}
```

### `UserSettingsResponse`
Payload returned to the frontend when reading or saving preferences.

```java
package group.four.nyare.nyare.dto;

public record UserSettingsResponse(
    Integer planningHorizonDays,
    Integer backdatingHorizonDays
) {}
```

---

## Frontend Types (`frontend/src/types/api.ts`)

```typescript
export interface UserSettings {
  planningHorizonDays: number
  backdatingHorizonDays: number
}
```

---

## State Transitions & Validation Rules

1. **Default Values**:
   - When a new `User` is created, `planningHorizonDays = 14` and `backdatingHorizonDays = 14`.
   - SQLite table schema applies default value `14` for both columns.
2. **Boundary Validation**:
   - `planningHorizonDays` must be between `1` and `60` inclusive.
   - `backdatingHorizonDays` must be between `1` and `60` inclusive.
   - Values outside this range return RFC 7807 `400 Bad Request`.
3. **Reset State**:
   - Invoking "Reset to Defaults" on the frontend resets both input values to `14`.
   - Saving after a reset persists `14` to the database.
4. **Historical Notes Immutability**:
   - Decreasing `backdatingHorizonDays` does NOT invalidate previously created notes.
   - It only restricts note creation and note entry date updates moving forward.
