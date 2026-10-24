# Quickstart & Verification Guide: Desktop Launcher and Pre-release Packaging

## Prerequisites
- Java 25 (`java --version`)
- Node.js 22+ (`node --version`)
- Gradle Wrapper (bundled in `app/`)

---

## 1. Local Fullstack Build Verification

Verify that building the frontend places static assets into the backend, and the backend packages everything into an executable JAR.

### Automated Incremental Build via Gradle:
```bash
cd app
# Compiles frontend automatically if changes are detected, then builds bootJar
./gradlew bootJar -x test
cd ..
```

### Or Manual Two-Stage Build:
```bash
# 1. Build Vue 3 Frontend
cd frontend
npm ci
npm run build
cd ..

# 2. Package Spring Boot Standalone JAR
cd app
./gradlew bootJar -x test
cd ..
```

**Expected Result**:
- `app/src/main/resources/static/index.html` exists.
- `app/build/libs/nyare-0.0.1-SNAPSHOT.jar` exists (size ~150-160 MB).

---

## 2. Test Desktop Launcher GUI

Run the packaged JAR in desktop mode:

```bash
java --enable-native-access=ALL-UNNAMED -jar app/build/libs/nyare-0.0.1-SNAPSHOT.jar
```

**Verification Checklist**:
- [ ] A graphical window titled "Nyare Server Launcher" appears.
- [ ] `nyare.properties` is generated in the working directory.
- [ ] Changing the port or AI provider and clicking "Start Server" streams live Spring Boot console logs into the text area.
- [ ] The default browser opens `http://localhost:<port>` automatically.
- [ ] Clicking "Stop Server" shuts down the server cleanly without hanging.
- [ ] Closing the window terminates the process.

---

## 3. Test Headless CLI Execution

Verify that headless servers can run without opening a window:

```bash
java --enable-native-access=ALL-UNNAMED -Djava.awt.headless=true -jar app/build/libs/nyare-0.0.1-SNAPSHOT.jar --headless
```

**Expected Result**:
- Spring Boot starts directly in the console without opening a Swing window.

---

## 4. Run Automated Backend Unit Tests

Run isolated unit tests to ensure no regressions:

```bash
cd app
./gradlew test -PexcludeIntegrationTests
```

**Expected Result**:
- Tests execute and pass without contacting external AI endpoints.
