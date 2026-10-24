# Tasks: Desktop Swing Launcher, Pre-release JAR Distribution, and Incremental Frontend Build

**Input**: Design documents from `specs/014-launcher-prerelease-jar/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Exact file paths are specified for every task.

---

## Phase 1: Setup (Build Automation & Tooling)

**Purpose**: Setup Gradle Node plugin and automated incremental frontend compilation wired to backend run tasks.

- [ ] T001 Apply `com.github.node-gradle.node` (v7.1.0) plugin with `download = false` and `nodeProjectDir = file("${projectDir}/../frontend")` In app/build.gradle
- [ ] T002 Register `buildFrontend` NpmTask with incremental inputs (`../frontend/src`, `../frontend/public`, `../frontend/package.json`, `../frontend/vite.config.ts`, `../frontend/tsconfig*.json`) and output `src/main/resources/static` In app/build.gradle
- [ ] T003 Wire `processResources.dependsOn buildFrontend` and verify `bootRun` and `devRun` trigger incremental compilation In app/build.gradle

---

## Phase 2: Foundational (Core Configuration & Headless Routing)

**Purpose**: Core configuration model and routing logic required across all launcher and CLI operations.

- [ ] T004 Implement `LauncherConfig` in app/src/main/java/group/four/nyare/nyare/launcher/LauncherConfig.java to read/write `nyare.properties` with defaults: `ai.provider=google`, `google.api.key=`, `groq.api.key=`, `server.port=8080`, `browser.auto-open=true`
- [ ] T005 [P] Unit test `LauncherConfigTest` in app/src/test/java/group/four/nyare/nyare/launcher/LauncherConfigTest.java verifying default generation, round-trip read/write, and fallback on corrupted files
- [ ] T006 Implement CLI/headless detection and command-line argument parsing (`--headless`, `--no-gui`) in app/src/main/java/group/four/nyare/nyare/NyareApplication.java

**Checkpoint**: Foundational configuration and execution routing ready.

---

## Phase 3: User Story 1 - Desktop Launcher Execution and Server Control (Priority: P1) 🎯 MVP

**Goal**: Students or users launch Nyare via a graphical desktop window, configure port/AI credentials, start the server asynchronously, automatically open the web browser, and cleanly shut down.

**Independent Test**: Execute `NyareApplication` in desktop mode, click "Start Server", verify browser opens to `http://localhost:<port>`, and click "Stop Server" to verify clean shutdown.

### Implementation for User Story 1
- [ ] T007 [US1] Create `LauncherFrame` Swing GUI with status bar, port and API key fields, and Start/Stop toggle button in app/src/main/java/group/four/nyare/nyare/launcher/LauncherFrame.java
- [ ] T008 [US1] Implement asynchronous Spring Boot lifecycle management using `SwingWorker` and `SpringApplicationBuilder` in app/src/main/java/group/four/nyare/nyare/launcher/LauncherFrame.java
- [ ] T009 [US1] Implement default browser auto-launch via `Desktop.getDesktop().browse(URI)` upon successful server startup in app/src/main/java/group/four/nyare/nyare/launcher/LauncherFrame.java
- [ ] T010 [US1] Implement clean shutdown hook on window closing (`WindowAdapter.windowClosing`) in app/src/main/java/group/four/nyare/nyare/launcher/LauncherFrame.java

**Checkpoint**: User Story 1 complete and independently testable in desktop environments.

---

## Phase 4: User Story 2 - Portable Configuration via `nyare.properties` (Priority: P2)

**Goal**: Automatically persist launcher UI settings to `nyare.properties` next to the JAR file and load existing values on startup without OS registry footprint.

**Independent Test**: Modify server port and AI provider in `LauncherFrame`, restart the application, and verify persisted values reload accurately.

### Implementation for User Story 2
- [ ] T011 [US2] Bind `LauncherFrame` form fields (AI provider selection, Google key, Groq key, port, browser toggle) to `LauncherConfig` in app/src/main/java/group/four/nyare/nyare/launcher/LauncherFrame.java
- [ ] T012 [US2] Save modified properties on "Start Server" and auto-reload on initialization in app/src/main/java/group/four/nyare/nyare/launcher/LauncherFrame.java
- [ ] T013 [US2] Pass parsed `LauncherConfig` properties dynamically to Spring Boot environment during context creation in app/src/main/java/group/four/nyare/nyare/launcher/LauncherFrame.java

**Checkpoint**: User Stories 1 and 2 operate seamlessly together.

---

## Phase 5: User Story 3 - Live Server Log Visibility (Priority: P3)

**Goal**: Display live standard output and error log streams directly inside the launcher window with a bounded memory buffer and a "Clear Logs" button.

**Independent Test**: Start the server and confirm Spring Boot ASCII banner and startup logs appear in real time; verify the clear button clears the view.

### Implementation for User Story 3
- [ ] T014 [P] [US3] Create `ConsoleOutputStream` extending `OutputStream` with thread-safe line buffering and 2,000-line memory capping in app/src/main/java/group/four/nyare/nyare/launcher/ConsoleOutputStream.java
- [ ] T015 [P] [US3] Unit test `ConsoleOutputStreamTest` in app/src/test/java/group/four/nyare/nyare/launcher/ConsoleOutputStreamTest.java
- [ ] T016 [US3] Embed log viewer `JTextArea` with `JScrollPane` and "Clear Logs" action button in app/src/main/java/group/four/nyare/nyare/launcher/LauncherFrame.java
- [ ] T017 [US3] Redirect `System.out` and `System.err` through `ConsoleOutputStream` to the log viewer on launcher startup in app/src/main/java/group/four/nyare/nyare/launcher/LauncherFrame.java

**Checkpoint**: Live embedded log streaming operational and bounded.

---

## Phase 6: User Story 4 - Automated Pre-release Build Pipeline (Priority: P4)

**Goal**: Automatically package a single, portable standalone JAR bundling frontend assets, backend APIs, and desktop launcher on GitHub pre-releases.

**Independent Test**: Trigger workflow via manual dispatch or pre-release publish and confirm `nyare-<tag>.jar` attaches to release assets.

### Implementation for User Story 4
- [ ] T018 [US4] Configure executable JAR packaging (`bootJar`) with main class `NyareApplication` In app/build.gradle
- [ ] T019 [US4] Create GitHub Actions workflow in .github/workflows/prerelease.yml implementing the contract from specs/014-launcher-prerelease-jar/contracts/ci-workflow.md
- [ ] T020 [US4] Add CI steps for properties template copying, unit testing (`*Test`), incremental `bootJar` packaging, and release artifact upload via `gh release upload` in .github/workflows/prerelease.yml

**Checkpoint**: Automated end-to-end fullstack release pipeline ready.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification, documentation, and cleanup across launcher and build workflows.

- [ ] T021 [P] Verify `./gradlew devRun` and `./gradlew bootRun` incrementally build frontend only when `frontend/` files change
- [ ] T022 [P] Verify `./gradlew test --tests "*Test" --tests "!*IntegrationTest"` passes cleanly in backend
- [ ] T023 Run verification checklist in specs/014-launcher-prerelease-jar/quickstart.md for desktop launcher and headless modes

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: No dependencies — integrates Gradle Node plugin and incremental frontend build.
- **Phase 2 (Foundational)**: Depends on Phase 1 — implements configuration model and CLI/GUI routing.
- **Phase 3 (US1)**: Depends on Phase 2 — MVP Desktop Launcher.
- **Phase 4 (US2)**: Depends on Phase 3 — Configuration persistence and form binding.
- **Phase 5 (US3)**: Depends on Phase 3 — Live embedded console streaming.
- **Phase 6 (US4)**: Depends on Phases 1–5 — CI workflow and bootJar distribution packaging.
- **Phase 7 (Polish)**: Depends on all stories — Quickstart and build verification.

### Parallel Opportunities
- T005 (`LauncherConfigTest`) can run in parallel with T006.
- T014 (`ConsoleOutputStream`) and T015 (`ConsoleOutputStreamTest`) can be built in parallel.
- T021 and T022 verification tasks can run independently.
