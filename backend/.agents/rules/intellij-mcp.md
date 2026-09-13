---
trigger: always_on
description: Prioritize the configured IntelliJ MCP server for static semantic analysis, compile-time validation, and code navigation over full CLI builds and verbose terminal searches.
---

# IntelliJ MCP Backend Workflow & Static Analysis Rule

This rule governs backend workflows (Java/Spring Boot/Kotlin/JVM). It establishes the **IntelliJ MCP Server** as the primary engine for code intelligence, semantic navigation, and fast compile-time validation, minimizing costly full CLI builds and verbose terminal searches.

---

## 1. Tool Discovery & Dynamic Capability Inspection

When interacting with the backend codebase, dynamically query and adapt to the tools exposed by the active IntelliJ MCP server:

* **Inspect Active Tools**: Discover available MCP tool endpoints at session startup (e.g., diagnostics, inspections, symbol search, reference finding, call hierarchies, project make/compile).
* **Adaptive Tool Selection**: Map IDE capabilities dynamically to workflow needs:
  * *Diagnostics / Inspections* $\rightarrow$ Static analysis, linting, error detection.
  * *Symbol Resolution / Usages* $\rightarrow$ Go-to-definition, find usages, find implementations.
  * *Hierarchy Navigation* $\rightarrow$ Super/subclasses, call graphs, interface implementations.
  * *In-Memory Compilation* $\rightarrow$ Fast compile checks, error surfacing.

---

## 2. Pre-Build Verification (Immediate Post-Edit Validation)

After creating or modifying backend source files, **never** trigger a heavy CLI build (`./gradlew build` / `mvn package`) for basic validation.

* **Primary Validation Layer**: Immediately call IntelliJ MCP inspection and in-memory compilation/make capabilities.
* **Targeted Error Detection**: Rely on MCP diagnostics to catch:
  * Type mismatches and broken references.
  * Missing imports, unresolved annotations, or syntax errors.
  * Unhandled exceptions and visibility/access violations.
* **Iterative Fix Loop**: Resolve all diagnostics and compiler issues reported by the IntelliJ MCP server before running runtime tests or finishing edits.

---

## 3. Token-Efficient Code Navigation

Conserve context window tokens and avoid noisy searches by leveraging IntelliJ's index-backed semantic graph:

* **Prefer Semantic MCP Over Broad Grep/Cat**:
  * Use **Symbol Resolution / Find References** instead of `grep_search` across entire directories.
  * Use **Call & Type Hierarchies** instead of manually reading multiple files to trace method callers or implementations.
  * Retrieve precise definitions and targeted code slices instead of reading whole source files.
* **Knowledge Graph Synergy**: Combine IntelliJ MCP (precise local symbols/types) with `graphify` (architectural relationships and module dependencies) before falling back to raw file scans.

---

## 4. Build Tiering & Execution Hierarchy

Enforce a strict 3-tier validation hierarchy to minimize build latency and compute overhead:

| Tier | Mechanism | Purpose & Trigger Condition |
| :--- | :--- | :--- |
| **Tier 1 (Primary)** | **IntelliJ MCP Server** | Immediate post-edit validation, static semantic checks, in-memory compilation, diagnostics, and navigation. |
| **Tier 2 (Targeted)** | **Focused CLI Commands** | Specific unit/integration tests (`./gradlew test --tests <TestName>`), targeted single-task compile (`./gradlew compileJava`). |
| **Tier 3 (Strict Last Resort)** | **Full CLI Builds** | Monolithic builds (`./gradlew build`, `mvn clean verify`). **Restricted strictly to:**<br>1. Final end-to-end task verification before task completion.<br>2. Build-time artifact generation or packaging.<br>3. Total unavailability of the IntelliJ MCP server. |

---

## 5. Unavailability & Fallback Handling

When the IntelliJ MCP server is unavailable or degraded, execute the following fallback protocol:

1. **State Detection**:
   * **IDE Closed / Server Offline**: Connection refused or MCP endpoint timeout.
   * **Re-indexing / Busy**: IDE returns busy/indexing status.
2. **Transient Issues (Indexing / Warmup)**:
   * Pause briefly or proceed with non-blocking reads; retry once indexing completes.
3. **Complete Offline Fallback**:
   * **Navigation**: Fall back to `graphify` query/path tools and targeted `grep_search` / `find_by_name`.
   * **Compilation & Errors**: Use narrow compiler commands (e.g., `./gradlew compileJava -q` or `./gradlew testClasses`) rather than full assemble/build.
   * **Logging**: Note in output that fallback CLI tools were utilized due to IntelliJ MCP unavailability.
