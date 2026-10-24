# Feature Specification: Desktop Swing Launcher and Pre-release JAR Distribution

**Feature Branch**: `014-launcher-prerelease-jar`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "setup an action in github that generates a jar file for this project as part of pre-releases with unit tests and bundled frontend; create a simple java swing gui with startup configurations for api keys and ai providers, start/stop button, embedded console logs, auto-browser launch, and Minecraft server-style nyare.properties file"

## User Scenarios & Testing *(mandatory)*

## Clarifications

### Session 2026-10-24
- Q: How should Gradle handle building the frontend when running tasks like `bootRun`, `devRun`, or `bootJar` if Node.js or npm is not installed on the host system? → A: Option A: Require host Node.js/npm; fail the build fast with a descriptive error if missing.

### User Story 1 - Desktop Launcher Execution and Server Control (Priority: P1)

A student or non-technical user downloads the standalone application archive and double-clicks it to start the server. A desktop window appears displaying status, port, and AI credentials. The user clicks "Start Server", the application launches the local web service, and the default web browser opens automatically to the application interface. When the user finishes, clicking "Stop Server" or closing the window shuts down the server cleanly.

**Why this priority**: Users need an intuitive, zero-terminal way to launch and operate the local planner without installing Node.js or running command-line scripts.

**Independent Test**: Double-click the application archive on a desktop machine, click "Start Server", confirm the browser opens to the dashboard, and click "Stop Server" to shut down.

**Acceptance Scenarios**:

1. **Given** a desktop environment, **When** the user launches the application, **Then** a graphical launcher window opens showing current status as "Stopped".
2. **Given** the launcher window is open with valid settings, **When** the user clicks "Start Server", **Then** the server starts in the background, status transitions to "Running", and the default browser opens to the local web application.
3. **Given** the server is running, **When** the user clicks "Stop Server", **Then** the local server stops cleanly and status returns to "Stopped".
4. **Given** the server is running, **When** the user closes the launcher window, **Then** the application triggers a clean shutdown before terminating the process.

---

### User Story 2 - Portable Configuration via `nyare.properties` (Priority: P2)

A user configures the application either through the graphical launcher or by editing a text file directly. On first launch, the application creates a commented `nyare.properties` file next to the application archive if none exists, mirroring the Minecraft `server.properties` workflow. Settings changed in the window persist to this file. No settings persist in the operating system registry.

**Why this priority**: Portability and transparency ensure privacy and ease of configuration. Deleting the application folder removes all credentials and settings without leaving residual machine state.

**Independent Test**: Launch the application archive in a clean directory, verify `nyare.properties` generates automatically with template comments, update an API key in the launcher, restart, and confirm the updated key persists from the file.

**Acceptance Scenarios**:

1. **Given** an application archive launched in a directory without `nyare.properties`, **When** the launcher initializes, **Then** it generates `nyare.properties` containing default keys and instructional comments.
2. **Given** existing values in `nyare.properties`, **When** the launcher opens, **Then** the input fields display the saved values.
3. **Given** modified values in the launcher window, **When** the user starts the server, **Then** the application writes the changes back to `nyare.properties`.
4. **Given** an environment without desktop capabilities (or `--headless` argument), **When** launched, **Then** the application reads `nyare.properties` directly and starts the server in command-line mode without opening a window.

---

### User Story 3 - Live Server Log Visibility (Priority: P3)

A user or developer troubleshoots startup problems (e.g. invalid API key, port conflict) directly within the launcher. The graphical window includes a live terminal console showing server log events, startup progress, and error traces.

**Why this priority**: Non-technical users need visibility into why a server fails to start without accessing terminal logs or separate log files.

**Independent Test**: Start the server with an invalid configuration, verify error messages stream into the embedded console text area in real time, and verify the "Clear Logs" button clears the text area.

**Acceptance Scenarios**:

1. **Given** the launcher window is open, **When** the server starts, **Then** server initialization logs and status messages stream live into the embedded console viewer.
2. **Given** log messages present in the console, **When** the user clicks "Clear Logs", **Then** the console viewer empties while continuing to receive new events.
3. **Given** extensive server activity, **When** log lines exceed 2,000 lines, **Then** the console trims older lines to bound memory consumption.

---

### User Story 4 - Automated Pre-release Build Pipeline (Priority: P4)

A developer publishes a pre-release on the source repository. An automated continuous integration pipeline compiles the frontend single-page application, bundles the static assets into the backend, runs automated unit tests, packages the standalone executable archive, and attaches it as a downloadable release asset.

**Why this priority**: Automating end-to-end builds eliminates manual compilation errors and guarantees every pre-release provides a fully functional, self-contained executable.

**Independent Test**: Trigger the automated pre-release workflow on repository publication or manual dispatch, verify frontend builds, unit tests execute successfully, and the resulting archive attaches to the release assets.

**Acceptance Scenarios**:

1. **Given** a newly published pre-release or manual trigger, **When** the workflow runs, **Then** it compiles the frontend SPA bundle and places assets into the server resource directory.
2. **Given** assembled code, **When** the pipeline runs unit tests, **Then** it executes isolated unit tests while skipping external AI integration tests.
3. **Given** passed unit tests, **When** the pipeline packages the executable archive, **Then** the artifact bundles the full frontend SPA, server logic, and desktop launcher.
4. **Given** a successful build, **When** the job finishes, **Then** the pipeline attaches `nyare-<tag>.jar` to the release.

---

### Edge Cases

- **Port in use**: If the configured network port (e.g., 8080) is occupied, the application displays a clear error in the status indicator and embedded console without crashing.
- **Headless server deployment**: When executed on a headless virtual machine or container lacking a graphical display, the application automatically bypasses the Swing GUI and boots the server directly.
- **Missing API keys**: If no AI credentials exist, the application boots the local web interface and records a prompt in the console noting that study planning requires configured API keys.
- **Corrupted properties file**: If `nyare.properties` contains invalid syntax, the application falls back to safe defaults, logs a warning in the console, and regenerates missing keys.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a graphical desktop launcher that opens when executed on systems with a graphical display.
- **FR-002**: System MUST automatically generate a commented `nyare.properties` configuration file in the application directory if one does not exist.
- **FR-003**: System MUST load configuration values from `nyare.properties` and populate the launcher inputs on startup.
- **FR-004**: System MUST allow users to select between supported AI providers (Google Gemini and Groq Cloud).
- **FR-005**: System MUST provide input fields for provider API credentials with visibility toggles.
- **FR-006**: System MUST allow users to configure the HTTP listening port.
- **FR-007**: System MUST provide an asynchronous Start/Stop server control that prevents freezing the user interface.
- **FR-008**: System MUST display an embedded live console streaming standard output and error logs.
- **FR-009**: System MUST automatically launch the user's default web browser to the server address upon successful startup when enabled.
- **FR-010**: System MUST execute a graceful server context shutdown when the user clicks Stop or closes the launcher window.
- **FR-011**: System MUST bypass the graphical launcher and execute in command-line mode when a headless environment is detected or `--headless` is provided.
- **FR-012**: System MUST provide a GitHub Actions workflow that executes frontend compilation, backend unit testing, standalone packaging, and release asset attachment on pre-releases.
- **FR-013**: Backend build system MUST automatically invoke an incremental frontend package build prior to running or packaging (`bootRun`, `devRun`, `bootJar`) whenever frontend files change, requiring a host Node.js runtime and failing fast with a descriptive error if missing.

### Key Entities

- **LauncherConfiguration**: Represents stored runtime properties (`ai.provider`, `google.api.key`, `groq.api.key`, `server.port`, `browser.auto-open`, `observability.enabled`).
- **ServerInstance**: Represents the active lifecycle state of the embedded web application context (STOPPED, STARTING, RUNNING).
- **ConsoleStream**: Represents the intercepted log buffer streamed to the visual log component.
- **ReleaseArtifact**: The standalone, cross-platform executable file bundling the user interface, server runtime, and static assets.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can start the full application from a fresh download in under 15 seconds without terminal commands.
- **SC-002**: Deleting the application folder removes 100% of stored configuration and data with zero leftover registry entries or user profile files.
- **SC-003**: The embedded console viewer updates with zero noticeable delay (sub-200ms latency) during server initialization.
- **SC-004**: The automated release workflow completes the entire frontend build, test suite, and archive packaging in under 5 minutes on standard GitHub runners.
- **SC-005**: All unit tests run cleanly in headless CI environments without requiring live external AI service keys.

## Assumptions

- Users have a compatible Java 25 runtime installed on their desktop environment.
- The default browser supports modern web standards for the single-page application.
- Automated CI builds run on GitHub Actions standard `ubuntu-latest` runners.
- The local SQLite database continues to persist data to `nyare.db` in the same directory as the executable archive.
