# Implementation Plan: Desktop Swing Launcher and Pre-release JAR Distribution

**Branch**: `014-launcher-prerelease-jar` | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/014-launcher-prerelease-jar/spec.md`

## Summary
Build a standalone executable JAR distribution for Nyare. On desktop environments, executing the JAR opens a Java Swing launcher GUI that manages server startup/shutdown, streams live console output, automatically opens the default web browser, and persists settings into a local, non-invasive `nyare.properties` file modeled after Minecraft's `server.properties`. In headless environments or with `--headless`, the application executes directly in CLI mode. A GitHub Actions CI workflow compiles the Vue 3 frontend, executes backend unit tests, packages the bootJar, and uploads the executable asset to GitHub pre-releases.

## Technical Context

**Language/Version**: Java 25 (Temurin), TypeScript / JavaScript (Node.js 22 LTS)

**Primary Dependencies**:
- Spring Boot 4.1.1 (`org.springframework.boot:spring-boot-starter-webmvc`)
- Java SE Swing (`javax.swing.*`, `java.awt.*`) - Standard JDK Library (no external dependencies)
- Gradle Node Plugin (`com.github.node-gradle.node:7.1.0`)
- Vue 3 + Vite 6 (`frontend/`)

**Storage**:
- Configuration: `nyare.properties` (standard `java.util.Properties` format in JAR directory)
- Database: SQLite (`nyare.db` in JAR directory)

**Testing**: JUnit 5 + Mockito (backend unit tests via Gradle), Vitest (frontend unit tests)

**Target Platform**: Desktop (Windows, macOS, Linux) and Headless Linux server/CI

**Project Type**: Fullstack web application with desktop launcher wrapper and CI automation

**Performance Goals**:
- Launcher GUI startup in < 1 second
- Live console log stream latency < 200ms
- Fullstack CI pre-release build in < 5 minutes

**Constraints**:
- Zero OS registry keys or hidden directory writes (strictly portable)
- Standard Java libraries only for GUI and configuration (YAGNI / Ponytail)
- Single self-contained JAR executable containing frontend, backend, and launcher

## Constitution Check

| Principle | Status | Evaluation |
| :--- | :--- | :--- |
| **I. Virtual Study Plan** | PASS | Launcher does not alter study plan domain rules or introduce persistent schedule tables. |
| **II. Course Anchor** | PASS | Preserved. Server domain models remain unchanged. |
| **V. Layer Isolation** | PASS | Launcher lives in isolated `group.four.nyare.nyare.launcher` package, cleanly decoupled from domain services and controllers. |
| **VII. Ponytail Minimalism** | PASS | Uses standard Java SE (`javax.swing`, `java.awt`, `java.util.Properties`). Zero new third-party dependencies added to `build.gradle`. |
| **VIII. Evidence-First Verification** | PASS | Direct verification via `./gradlew compileJava`, unit tests, and quickstart run scenarios. |
| **X. Dev vs Presentation Separation** | PASS | Production `bootJar` packages only `sourceSets.main` and static frontend assets; dev audit tools remain excluded. |

## Project Structure

### Documentation (this feature)

```text
specs/014-launcher-prerelease-jar/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Technical decisions and rationale
├── data-model.md        # Entities, properties schema, and UI states
├── quickstart.md        # Local build and verification run guide
├── contracts/           # Interface and CI pipeline contracts
│   ├── nyare-properties.md
│   └── ci-workflow.md
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code Layout

```text
app/
├── src/main/java/group/four/nyare/nyare/
│   ├── NyareApplication.java                   # [MODIFY] Route desktop Swing vs headless CLI
│   └── launcher/
│       ├── LauncherConfig.java                 # [NEW] Reads/writes nyare.properties
│       ├── ConsoleOutputStream.java            # [NEW] Streams stdout/stderr to GUI
│       └── LauncherFrame.java                  # [NEW] Swing launcher window & server controls
└── build.gradle                                # [MODIFY] Add gradle-node-plugin & buildFrontend task wired to processResources/devRun/bootRun

frontend/
├── package.json                                # Frontend build scripts
└── vite.config.ts                              # Configured to output to app static/

.github/
└── workflows/
    └── prerelease.yml                          # [NEW] Pre-release CI/CD workflow
```

**Structure Decision**: Web application with backend launcher extension and root `.github` automation. Adheres strictly to existing package conventions and Dr JSkill guidelines.

## Complexity Tracking

*No violations. All components utilize existing tooling or Java standard library features.*
