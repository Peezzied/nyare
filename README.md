# Nyare

Nyare is a calendar-first academic planning assistant designed for students. It helps students organize course notes, track academic responsibilities, and generate dynamic study schedules in one interface.

---

## 1. Introduction

Students face shifting deadlines, heavy course loads, and fragmented lecture notes. Traditional planners demand constant manual realignment when schedules change.

Nyare simplifies academic planning through a calendar-anchored workflow:

- Students record course-linked journal notes and recurring class schedules.
- AI-assisted processing extracts tasks, academic events, and relevant context from unstructured notes.
- The planner organizes tasks and schedules study sessions anchored to upcoming deadlines.

---

## 2. Core Information

### 2.1 Implemented Features

- **Class Schedule Management:** Visual weekly schedule grid supporting recurring class meetings and course colors.
- **Course-Linked Notes:** Rich text editor with markdown formatting, date association, and course tagging.
- **Image Attachments:** Inline image embedding for whiteboard captures and assignment handouts.
- **AI-Assisted Study Planner:** Two-phase note processing that extracts tasks, academic events, and academic context.
- **Streaming Process Progress:** Real-time progress updates streamed through Server-Sent Events (SSE) with heartbeat cancellation.
- **Dual AI Provider Integration:** Support for Google GenAI and Groq Cloud.
- **Desktop Launcher GUI:** Swing configuration window for port selection, API key persistence, and server monitoring.
- **Dev Observability Console:** Interactive event sink and entity trace inspector at `/dev/observability`.
- **Frontend Mock Mode:** Isolated offline simulation mode for UI testing.

### 2.2 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Java 25, Spring Boot 4.1.1, Spring AI 2.0.0, Hibernate Community Dialects, SQLite JDBC |
| **Frontend** | Vue 3.5, Vite 8.2, TypeScript, Tailwind CSS 4.3, TipTap, Schedule-X, Reka UI |
| **Database** | SQLite 3 (`nyare.db`) with HikariCP (pool size 4, WAL mode) |
| **Packaging** | Gradle 9.7.1, com.github.node-gradle.node (bundles Vue SPA into backend JAR) |
| **Environment** | Scoop package manager (`setup-env.bat`), Java 25 toolchain |

---

## 3. Getting Started

### 3.1 Prerequisites

Nyare requires the following tools:

- **Java Development Kit:** JDK 25 (Eclipse Temurin 25 recommended).
- **Node.js and npm:** Node.js version 22.18.0+ or 24.12.0+ with npm 10+.
---

### 3.2 Standalone User Launch (Recommended)

Gradle compiles the frontend assets and packages the complete application into a single executable JAR file.

1. **Build the Application JAR:**
   Open a terminal in the [`app`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/app) directory and run:
   ```bash
   cd app
   .\gradlew.bat bootJar
   ```
   Gradle compiles the Vue frontend and bundles static assets into `app/build/libs/nyare-0.0.1-SNAPSHOT.jar`.

2. **Launch the Application:**
   Users can double-click `nyare-0.0.1-SNAPSHOT.jar` directly in their file manager. Alternatively, execute:
```bash
java --enable-native-access=ALL-UNNAMED -jar nyare-0.0.1-SNAPSHOT.jar
```
   This command opens the desktop launcher window ([`LauncherFrame`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/app/src/main/java/group/four/nyare/nyare/launcher/LauncherFrame.java#L41-L95)).

3. **Configure Settings:**
   - Select your AI provider (**Google** or **Groq**).
   - Enter your API key. The launcher stores credentials in `nyare.properties`.
   - Select **Enable observability console** if you want to inspect live domain traces.
   - Click **Start Server**.
   - The launcher starts Spring Boot and opens your browser at `http://localhost:8080`.

*Note: For headless environments, pass the `--headless` flag:*
```bash
java --enable-native-access=ALL-UNNAMED -jar nyare-0.0.1-SNAPSHOT.jar --headless
```

---

### 3.3 Developer Setup

Developers can run the backend and frontend separately during active development.

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Peezzied/nyare.git
   cd nyare
   ```

2. **Configure Backend Settings:**
   Open a terminal in the [`app`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/app) directory:
   ```powershell
   Copy-Item src\main\resources\application.properties.example src\main\resources\application.properties
   Copy-Item src\main\resources\application-google.properties.example src\main\resources\application-google.properties
   Copy-Item src\main\resources\application-groq.properties.example src\main\resources\application-groq.properties
   Copy-Item .env.example .env
   ```
   Open `app/.env` and insert your AI provider keys. Check the supported provider documentation and console to verify that the configured model is active.
```dotenv
GOOGLE_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key
```

4. **Run the Backend Server:**
   From the `app` directory, run:
   ```bash
   .\gradlew.bat bootRun
   ```
   Alternatively, select the preconfigured `appDev [google]` run configuration in IntelliJ IDEA. The backend starts at `http://localhost:8080`.

5. **Run the Frontend Server:**
   Open a second terminal in the [`frontend`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/frontend) directory:
   ```bash
   cd frontend
   npm ci
   npm run dev
   ```
   Open `http://localhost:5173` in your browser. Vite proxies `/api` calls to `http://localhost:8080`.

6. **(Optional) Run Mock Mode:**
   To test frontend components without starting the backend:
   ```bash
   npm run dev:mocks
   ```

---

## 4. Initial Data and Authentication

- **Development Profile (`dev`):** The application loads [`dev.sql`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/app/src/dev/resources/dev.sql) on startup. This script seeds user `dev_student` (ID: 1), eight courses, and seventeen class schedule slots. The command `npm run dev` logs in as `dev_student` automatically.
- **Production Storage:** Production builds initialize blank SQLite tables in `nyare.db`. Users register new accounts through the web interface. Nyare uses username-based authentication and does not require passwords.

---

## 5. Application Architecture

Nyare uses a layered Spring Boot architecture paired with a Vue single-page application:

```
[ Desktop Launcher / Browser ]
           │
           ▼
   [ Vue 3 Frontend ] ──( Vite / Static Resource )──┐
           │                                        │
      HTTP / SSE                                    │
           ▼                                        │
 [ Spring Boot Controllers ] ◄──────────────────────┘
           │
     Service Layer ◄──► [ Spring AI Engine ] ──► [ Google / Groq ]
           │
    Repository Layer
           │
    [ SQLite DB (WAL) ]
```

- **Controller Layer:** Exposes REST endpoints and Server-Sent Event streams.
- **Service Layer:** Enforces domain invariants, transaction boundaries, and user session scopes.
- **AI Processing Pipeline:** Coordinates multi-day note parsing, entity extraction, and duplicate detection.
- **Observability Sink:** Records domain audit events and streams traces to `/dev/observability`.

---

## 6. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Java Version Mismatch** | Java version is older than JDK 25. | Run `java -version`. Set JDK 25 in your environment. Supply `--enable-native-access=ALL-UNNAMED`. |
| **Missing AI Credentials** | Provider API keys are missing. | Enter your API key in the launcher GUI, or configure `app/.env`. |
| **Model Inaccessibility** | Provider retired the configured model. | Check model availability in your provider console. Update the model name in `application-[provider].properties`. |
| **Port Conflict (8080)** | Another program occupies port 8080. | Adjust the port number in the launcher GUI or set `server.port` in `application.properties`. |
| **Database Locked (`SQLITE_BUSY`)** | External program locks `nyare.db`. | Close third-party SQLite browsers. Maintain `journal_mode=WAL` and `busy_timeout=30000` in HikariCP. |
