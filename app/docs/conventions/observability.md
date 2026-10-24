# Observability & Audit Trace Guidelines

## 1. Architecture

Nyare provides a developer observability tap that records state-modifying actions and AI planning lifecycles:

- **Events (`group.four.nyare.nyare.ai.observability.event`)**:
  - `AuditTraceEvent`: immutable record carrying category, severity, timestamp, trace kind, entity IDs, run IDs, mutation actions, and diagnostics.
  - Core categories include `LIFECYCLE`, `TASK_PLANNING`, `TASK_PROMOTION`, `EVENT_PLANNING`, `IMAGE_CONTEXT`, `UNRELATED_INFO`, and `DATA_MUTATION`.
- **Advisor Tap**:
  - `PlannerAuditAdvisor` intercepts Spring AI chat responses during study planning to record planning decisions.
- **Service Tap**:
  - Domain service implementations publish `AuditTraceEvent` records on mutations via Spring `ApplicationEventPublisher`.

## 2. Dev Console & Sink (`src/dev`)

Observability tooling lives strictly in the `dev` sourceSet and does not affect production builds:

- `DevAuditTraceSink`: In-memory ring buffer holding recent audit events (default 500 events).
- `DevTraceWalker`: Traverses entity relationship graphs and tombstone references.
- `DevAuditTraceController`: Serves Thymeleaf dashboard and JSON inspection endpoints at `/dev/observability`.
- `DevAuditTraceStream`: Broadcasts live audit updates via Server-Sent Events (SSE).

## 3. Running the Console

Start the backend with the dev fixtures and console:

```bash
cd app
./gradlew devRun
```

Console URL: `http://localhost:8080/dev/observability`
