# Research & Technical Decisions: Desktop Swing Launcher and Pre-release JAR Distribution

## 1. Spring Boot & Swing Lifecycle Integration

### Decision
Control Spring Boot context lifecycle programmatically from Swing via `SpringApplicationBuilder` executed on a background `SwingWorker` thread.

```java
SpringApplication app = new SpringApplicationBuilder(NyareApplication.class)
        .headless(false)
        .build();
ConfigurableApplicationContext context = app.run(args);
```

### Rationale
- **Thread Safety**: Starting or stopping Spring Boot on the Swing Event Dispatch Thread (EDT) freezes the UI for several seconds. `SwingWorker` runs lifecycle methods on worker threads and schedules UI updates safely on the EDT via `SwingUtilities.invokeLater`.
- **Headless Override**: Spring Boot defaults `java.awt.headless` to `true`. Calling `.headless(false)` explicitly preserves Swing rendering, system look and feel, and desktop browser hooks.
- **Graceful Shutdown**: Calling `context.close()` triggers Spring bean destruction (`@PreDestroy`), closes HikariCP database connections cleanly, releases SQLite lock files (`nyare.db-wal`, `nyare.db-shm`), and releases network ports.

### Alternatives Considered
- **Subprocess Execution (`ProcessBuilder`)**: Spawning a child `java -jar` process. Rejected because it requires managing cross-process communication, monitoring PIDs, handling orphan processes if the launcher crashes, and doubling JVM memory overhead.
- **Embedded Webview (JCEF / JavaFX)**: Rejected under YAGNI and Ponytail rules. Standard desktop browser launch (`Desktop.getDesktop().browse()`) provides modern browser rendering with zero added dependencies.

---

## 2. Configuration Persistence (`nyare.properties`)

### Decision
Store all runtime configurations in a Minecraft server-style `nyare.properties` file located in the same directory as the executable JAR. Auto-generate the file with descriptive comments if missing on startup.

```properties
# Nyare Server Configuration
# Generated automatically on launch. Edit here or via the launcher GUI.

# AI Provider: 'google' or 'groq'
ai.provider=google

# API Keys
google.api.key=
groq.api.key=

# Server Network Port
server.port=8080

# Automatically open default browser when server starts
browser.auto-open=true
```

### Rationale
- **Portability & Non-Invasiveness**: Avoids touching the Windows Registry (`java.util.prefs.Preferences`) or hidden OS directories (`~/.config`). Moving or deleting the folder deletes all credentials and data completely.
- **Bi-directional Editing**: Users can edit values in the GUI or directly in text editors like Notepad before launching.
- **Spring Integration**: Launcher passes parsed properties as dynamic defaults to `SpringApplicationBuilder.properties(...)`.

### Alternatives Considered
- **`java.util.prefs.Preferences`**: Rejected as invasive. Modifies Windows Registry under `HKEY_CURRENT_USER\Software\JavaSoft\Prefs` and leaves credentials behind after folder deletion.
- **`.env` File**: Rejected because user explicitly requested standard `.properties` syntax following the Minecraft server model.

---

## 3. Real-Time Console Streaming

### Decision
Intercept `System.out` and `System.err` with a custom `ConsoleOutputStream` forwarding log lines to the Swing `JTextArea` while preserving original console output.

### Rationale
- **Simplicity (YAGNI / Ponytail)**: Requires no Logback XML configuration, custom appender classes, or SLF4J binding acrobatics. It captures all standard output, including the Spring Boot ASCII banner, Tomcat port binding, third-party library output, and unexpected stack traces.
- **Memory Bounding**: Automatically trims text buffer when lines exceed 2,000 to prevent unbounded memory growth.

### Alternatives Considered
- **Custom Logback Appender (`ch.qos.logback.core.AppenderBase`)**: Rejected because it only captures Logback logger calls and misses direct standard output/error, JVM messages, or pre-Spring initialization output.

---

## 4. Headless CLI Detection

### Decision
Inspect `GraphicsEnvironment.isHeadless()` and command-line arguments (`--headless`, `--no-gui`). If true, skip `LauncherFrame` initialization and execute `SpringApplication.run(NyareApplication.class, args)` directly.

### Rationale
- Guarantees backward compatibility with automated server deployments, Docker containers, and CI test harnesses.
- Prevents `HeadlessException` crashes in headless Linux server environments.

---

## 5. GitHub Actions Fullstack Release Pipeline

### Decision
A single GitHub Actions workflow (`.github/workflows/prerelease.yml`) that executes:
1. `npm ci && npm run build` in `frontend/` (outputs to `app/src/main/resources/static/`).
2. Template properties setup (`application*.properties.example` -> `application*.properties`).
3. `./gradlew test --tests "*Test" --tests "!*IntegrationTest"` in `app/`.
4. `./gradlew bootJar -x test` in `app/`.
5. Renames artifact to `nyare-<tag>.jar` and uploads via GitHub CLI (`gh release upload`).

### Rationale
- Produces a single, self-contained executable JAR containing frontend assets, backend API, and desktop GUI.
- Uses native GitHub CLI (`gh`) to upload release assets without untrusted third-party GitHub actions.

---

## 6. Incremental Backend Frontend Build Integration

### Decision
Apply `com.github.node-gradle.node` (v7.1.0) in `app/build.gradle` with `download = false` to leverage the host Node.js runtime (`frontend` project directory). Register an incremental `buildFrontend` NpmTask wired into `processResources`.

### Rationale
- **Automatic Incremental Packaging**: Whenever frontend files change in `frontend/src`, `frontend/public`, `frontend/package.json`, or config files, running `./gradlew bootRun`, `./gradlew devRun`, or `./gradlew bootJar` automatically triggers `npm run build` and places the compiled SPA bundle into `app/src/main/resources/static`.
- **Skip Unchanged Builds (`UP-TO-DATE`)**: When no frontend source files change, Gradle skips the task immediately, keeping development iteration fast.
- **Fail Fast on Missing Node.js**: Conforming to Option A of the clarification decision, `download = false` avoids downloading multi-megabyte external node binaries into Gradle caches and fails with a clear, descriptive message if Node.js/npm is missing on the host.
- **CI Workflow Synergy**: In CI environments where `npm ci && npm run build` runs beforehand, Gradle detects that `buildFrontend` is `UP-TO-DATE` and proceeds without redundant work.

### Alternatives Considered
- **Direct Gradle `Exec` Task with OS-Specific shell wrappers**: Rejected due to Windows `cmd /c npm` vs Unix `npm` command discrepancy and manual task wiring boilerplate. The Node Gradle plugin is the established standard Gradle solution.
- **Automated Node Download (`download = true`)**: Rejected per Ponytail minimalism and Option A clarification to avoid unexpected network downloads on developer machines.
