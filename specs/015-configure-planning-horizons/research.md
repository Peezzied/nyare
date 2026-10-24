# Research: Configurable Planning and Backdating Horizons

## Technical Decisions

### 1. Persistence Model for Horizon Preferences

- **Decision**: Store `planningHorizonDays` and `backdatingHorizonDays` directly as columns on the existing `User` entity (`users` table).
- **Rationale**: In accordance with YAGNI and Ponytail minimalism, adding two nullable=false integer columns (with default 14) avoids creating a separate `user_preferences` table, avoids `@OneToOne` cascade complexity, and eliminates redundant database joins. Every authenticated request already resolves the session user ID.
- **Alternatives Considered**:
  - *Separate `user_preferences` table*: Rejected due to unnecessary schema bloat and join overhead for two simple scalar values.
  - *Application properties only (`application.properties`)*: Rejected because the user specifically requested connecting settings to the frontend for student configuration, which requires per-user persistence.
  - *Browser `localStorage`*: Rejected because backend services (`NoteServiceImpl` date validation and `StudyPlannerServiceImpl` background planning) must enforce horizons on the server side.

### 2. Backend API Endpoint Structure

- **Decision**: Introduce `/api/settings` managed by `SettingsController` and `UserSettingsService`.
- **Rationale**:
  - `WebConfig` already configures `SessionInterceptor` to protect all `/api/**` paths except `/api/users`. Therefore, `/api/settings` is automatically secured and enforces active session authentication (returning 401 Problem Details for unauthenticated requests).
  - Follows strict layer isolation: `SettingsController` delegates to `UserSettingsService` interface, which maps to/from DTOs (`UserSettingsRequest`, `UserSettingsResponse`).
- **Alternatives Considered**:
  - *Extending `/api/users/me`*: Rejected to avoid polluting the core user identity payload and to keep settings updates isolated to dedicated PUT/GET operations.

### 3. Study Planner Engine Prompt and Horizon Injection

- **Decision**: Update `StudyPlannerEngine` to accept a dynamic `planningScopeDays` parameter in `process(...)`, replacing the hardcoded `PLANNING_SCOPE_DAYS = 14`. Update `planner_sys-prompt.st` to template `{days}` inside the upcoming events inspection directive (`within {days} days in {events}`).
- **Rationale**: Enables the AI model to accurately discover and schedule preparation tasks matching the student's personal lookahead preference.
- **Alternatives Considered**:
  - *Rebuilding `ChatClient` per request*: Rejected because rebuilding `ChatClient` per request carries unnecessary overhead. Using per-prompt `.system(prompt -> ...)` or formatting the system template preserves the single injected client.

### 4. Note Backdating Validation Integration

- **Decision**: Update `NoteServiceImpl` to query the user's `backdatingHorizonDays` from `userRepository.findById(userId)` (falling back to the configured property default if absent).
- **Rationale**: Guarantees that note creation and update requests validate the entry date against the user's active configured horizon limit, throwing standard `BadRequestException` when exceeded.

### 5. Frontend Navigation & Form Architecture

- **Decision**:
  - Add a "Settings" link in `HamburgerMenu.vue` with a Lucide `Settings` icon, navigating to `/settings`.
  - Create `SettingsView.vue` using `AppShell`, `DetailTopBar`, and tactile inputs adhering to `DESIGN.md`.
  - Provide an explicit "Save" button and a "Reset to Defaults" button.
  - Use native `fetch` client via `frontend/src/api/settings.ts` and standard toast feedback (`useToasts`).
- **Rationale**:
  - Aligns with existing navigation routes (`/manage-courses`, `/archive`).
  - Matches the user's explicit clarification that settings is a page accessible from the hamburger drawer.
  - Provides a clean, responsive, ADHD-friendly interface with tactile feedback and recovery options.
- **Alternatives Considered**:
  - *Auto-saving on keystroke/blur*: Rejected per clarification selection Option C (explicit Save button + Reset to Defaults).
