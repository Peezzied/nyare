# Graph Report - nyare  (2026-09-13)

## Corpus Check
- 150 files · ~156,581 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 874 nodes · 1048 edges · 110 communities (57 shown, 50 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ae047c2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- versions.mjs
- compress.py
- config.js
- Azure Deployment Guide
- validate.py
- jakarta.persistence.Entity
- frontend/package.json
- Dr JSkill Specification
- client.js
- Cavecrew Skill
- graphify Extraction Pipeline
- caveman-explore/package.json
- IntelliJ MCP Backend Workflow & Static Analysis Rule
- sync-versions-in-docs.mjs
- Lean Build Skill
- normalize-vue-frontend.mjs
- sync-workshop-docs.mjs
- Dr JSkill
- AI Processing
- Docker Compose JVM Full Stack
- Appendix B — Troubleshooting
- 08 — Deployment
- 03 — Anatomy of the generated application
- Angular Frontend Integration Guide
- Spring Boot Layered Architecture
- Docker Guide for Spring Boot
- 02 — Getting started
- Spring Security Best Practices Guide
- Diff Review Workflow
- graphify Incremental Update (--update)
- NyareApplicationTests.java
- Social Icon
- Appendix A — Prompt cheat sheet
- Spring Boot Testing Best Practices Guide
- 01 — Setup
- caveman-explore/tests/skill-file.test.mjs
- Migration Skill
- gradlew
- NyareApplication
- App.vue
- 07 — Performance
- Docker Compose JVM NoDB Service
- 04 — Adding users
- 09 — Going further
- Testcontainers Integration Testing
- Azure Container Apps Deployment Recipe
- Study Plan
- Dr JSkill Agent Guidelines
- create-project
- Verify and Stop Skill
- Frontend HTML Entrypoint
- opencode.json
- Caveman Manage Skill
- Model Craft
- 06 — Testing
- 00 — Introduction
- GitHub Copilot CLI + Java workshop, using Dr JSkill
- Course
- Override
- Override
- GitHub Copilot CLI
- Nyare MVP Boundaries
- __init__.py
- checkpoint-and-run.sh
- Graphify Knowledge Graph Rule
- FastContext Explorer
- Dr-JSkill Favicon
- Override
- Override
- Override
- 05 — A more professional front-end
- 4. Endpoints Specification
- Entity
- Docker Prerequisite
- Java 25 Prerequisite
- Node.js 24 & npm 11 Prerequisite
- Spring Boot Actuator & Micrometer Metrics
- Static Asset Caching Configuration
- Virtual Threads Performance Recipe
- Keyset Pagination Pattern
- Skill Customization and Forking
- graphify URL Ingestion
- Dr. JSkill Doctor Duke Mascot
- Graphify Workflow
- Nyare Favicon Icon
- Documentation Icon
- Hero Graphic
- Vite Logo Asset
- Vue Logo
- Backend Agent Guide (Nyare)
- Entity
- Entity
- Entity
- 4. Endpoints Specification
- Task Manager Service Implementation Plan
- Nyare Backend Conventions and Standards
- ponytail.md
- Override
- group.four.nyare.nyare.Models.Course
- group.four.nyare.nyare.Models.Enums.TaskStatus
- jakarta.persistence.EntityListeners
- jakarta.persistence.Table
- Note
- org.springframework.data.jpa.domain.support.AuditingEntityListener
- org.springframework.data.jpa.repository.JpaRepository
- org.springframework.data.jpa.repository.Query
- Override

## God Nodes (most connected - your core abstractions)
1. `Dr JSkill Specification` - 24 edges
2. `getVersionValue()` - 23 edges
3. `applyDotfiles()` - 18 edges
4. `_compress_file_locked()` - 18 edges
5. `validate()` - 14 edges
6. `Appendix A — Prompt cheat sheet` - 12 edges
7. `Docker Guide for Spring Boot` - 12 edges
8. `02 — Getting started` - 11 edges
9. `07 — Performance` - 11 edges
10. `downloadAndExtractProject()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Lean Build Skill` --semantically_similar_to--> `Surgical Patch Skill`  [INFERRED] [semantically similar]
  .agents/skills/lean-build/SKILL.md → .agents/skills/surgical-patch/SKILL.md
- `Safe Refactor Skill` --semantically_similar_to--> `Surgical Patch Skill`  [INFERRED] [semantically similar]
  .agents/skills/safe-refactor/SKILL.md → .agents/skills/surgical-patch/SKILL.md
- `find-skills Agent Skill` --semantically_similar_to--> `Agent Skill`  [INFERRED] [semantically similar]
  .agents/skills/find-skills/SKILL.md → .agents/skills/dr-jskill/workshop/00-introduction.md
- `Docker Compose JVM AOT Full Stack` --semantically_similar_to--> `Docker Compose JVM Full Stack`  [INFERRED] [semantically similar]
  .agents/skills/dr-jskill/assets/docker-compose-aot.yml → .agents/skills/dr-jskill/assets/docker-compose.yml
- `Docker Compose Native GraalVM Full Stack` --semantically_similar_to--> `Docker Compose JVM Full Stack`  [INFERRED] [semantically similar]
  .agents/skills/dr-jskill/assets/docker-compose-native.yml → .agents/skills/dr-jskill/assets/docker-compose.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **BootUI Tool Ecosystem: Dr JSkill, BootUI, Coffilot** — _agents_skills_dr_jskill_docs_works_with_bootui_family, _agents_skills_dr_jskill_docs_works_with_circle_of_color, _agents_skills_dr_jskill_docs_readme_documentation_home [EXTRACTED 1.00]
- **Cavecrew Subagents Trio** — _agents_skills_cavecrew_skill_cavecrew_investigator, _agents_skills_cavecrew_skill_cavecrew_builder, _agents_skills_cavecrew_skill_cavecrew_reviewer [EXTRACTED 1.00]
- **Spring Boot 4 Container Image Variants** — _agents_skills_dr_jskill_references_docker_jvm_distroless_image, _agents_skills_dr_jskill_references_docker_spring_aot_image, _agents_skills_dr_jskill_references_docker_crac_image, _agents_skills_dr_jskill_references_docker_graalvm_native_image [EXTRACTED 1.00]
- **Dr JSkill Docker Deployment Configurations** — _agents_skills_dr_jskill_assets_docker_compose_stack, _agents_skills_dr_jskill_assets_docker_compose_aot_stack, _agents_skills_dr_jskill_assets_docker_compose_native_stack, _agents_skills_dr_jskill_assets_docker_compose_crac_service [EXTRACTED 1.00]
- **SVG Icon Sprite** — frontend_public_icons_bluesky_icon, frontend_public_icons_discord_icon, frontend_public_icons_documentation_icon, frontend_public_icons_github_icon, frontend_public_icons_social_icon, frontend_public_icons_x_icon [EXTRACTED 1.00]
- **Nyare Core Pipeline Flow** — agents_course_schedule, agents_course_linked_journal, agents_ai_processing, agents_ai_planning, agents_study_plan, agents_calendar_view [EXTRACTED 1.00]
- **Agent Execution & Governance Skills** — agents_skills_lean_build_skill_lean_build, agents_skills_migration_skill_migration, agents_skills_safe_refactor_skill_safe_refactor, agents_skills_surgical_patch_skill_surgical_patch, agents_skills_verify_and_stop_skill_verify_and_stop [INFERRED 0.85]
- **Dr JSkill Workshop Core Lifecycle** — _agents_skills_dr_jskill_workshop_00_introduction_dr_jskill, _agents_skills_dr_jskill_workshop_02_getting_started_generation_workflow, _agents_skills_dr_jskill_workshop_06_testing_webmvctest_unit_testing, _agents_skills_dr_jskill_workshop_08_deployment_dockerfile_multistage [INFERRED 0.85]
- **Front-end Integration Flavors for Spring Boot** — _agents_skills_dr_jskill_references_angular_angular_guide, _agents_skills_dr_jskill_references_react_react_guide, _agents_skills_dr_jskill_references_vue_vue_guide, _agents_skills_dr_jskill_references_vanilla_js_vanilla_js_guide [INFERRED 0.95]
- **Graphify Automation & Incremental Updates** — _agents_skills_graphify_references_hooks_post_commit_hook, _agents_skills_graphify_references_add_watch_watch_mode, _agents_skills_graphify_references_update_incremental_update [INFERRED 0.95]
- **Graphify Query & Knowledge Retrieval Flow** — _agents_skills_graphify_skill_fast_path_query, _agents_skills_graphify_references_query_query_expansion, _agents_skills_graphify_references_query_traversal_modes, _agents_skills_graphify_references_query_work_memory_reflections [INFERRED 0.95]
- **Spring Boot 4 Testing Ecosystem Modernization** — _agents_skills_dr_jskill_references_spring_boot_4_mockito_bean, _agents_skills_dr_jskill_references_spring_boot_4_webmvc_test_starter, _agents_skills_dr_jskill_references_test_testcontainers_service_connection, _agents_skills_dr_jskill_references_test_rest_test_client [INFERRED 0.95]

## Communities (110 total, 50 thin omitted)

### Community 0 - "versions.mjs"
Cohesion: 0.06
Nodes (63): { flags, positional }, outputDir, { flags, positional }, outputDir, DEFAULT_BOOT_FALLBACK, { flags, positional }, JAVA_VERSION_DEFAULT, outputDir (+55 more)

### Community 1 - "compress.py"
Cohesion: 0.06
Nodes (61): main(), print_usage(), Caveman Compress CLI Usage: caveman <filepath>, backup_dir_for(), build_compress_prompt(), build_fix_prompt(), call_claude(), compress_file() (+53 more)

### Community 2 - "config.js"
Cohesion: 0.06
Nodes (35): cleanDocsPermalinksPlugin(), createCleanRouteByInferredRoute(), listMarkdownFiles(), rewriteMarkdownDocLink(), siteBase, toCleanMarkdownDocRoute(), toDocLink(), createDocsSidebar() (+27 more)

### Community 3 - "Azure Deployment Guide"
Cohesion: 0.14
Nodes (20): AI Assistant Integration Setup, Dr JSkill Overview, Dr JSkill vs JHipster Comparison, Azure Container Apps, Azure Deployment Guide, GitHub Actions Azure OIDC Deployment, Azure Database for PostgreSQL Flexible Server, Spring Boot Configuration Guide (+12 more)

### Community 4 - "validate.py"
Cohesion: 0.10
Nodes (28): benchmark_pair(), count_tokens(), main(), print_table(), Path, count_bullets(), extract_code_blocks(), extract_fenced_spans() (+20 more)

### Community 6 - "frontend/package.json"
Cohesion: 0.10
Nodes (20): dependencies, tailwindcss, @tailwindcss/vite, vue, devDependencies, vite, @vitejs/plugin-vue, vue (+12 more)

### Community 7 - "Dr JSkill Specification"
Cohesion: 0.12
Nodes (17): Docker Compose CRaC Fast-Restore Service, Frontend Development Placeholder Page, Dr JSkill Documentation Home, The BootUI Tool Family, Circle of Color Design System, Async Logback Appenders, Logging Best Practices Guide, SLF4J with Logback Integration (+9 more)

### Community 8 - "client.js"
Cohesion: 0.23
Nodes (18): decodeHash(), findActiveHeading(), findCurrentSidebarLink(), getScrollTopOffset(), getToggleChildren(), isCurrentSidebarLink(), isElementVisible(), isPlainLeftClick() (+10 more)

### Community 9 - "Cavecrew Skill"
Cohesion: 0.13
Nodes (18): Cavecrew Overview, Cavecrew Skill, Cavecrew Builder Subagent, Cavecrew Investigator Subagent, Cavecrew Reviewer Subagent, Caveman Commit Overview, Caveman Commit Skill, Caveman Compress Overview (+10 more)

### Community 10 - "graphify Extraction Pipeline"
Cohesion: 0.14
Nodes (14): graphify Neo4j & FalkorDB Export, graphify MCP Server, graphify Wiki Export, graphify Confidence Rubric, graphify Extraction Specification, graphify Cross-Repo Merge, graphify Native CLAUDE.md Integration, graphify Constrained Query Expansion (+6 more)

### Community 11 - "caveman-explore/package.json"
Cohesion: 0.20
Nodes (9): description, files, license, name, private, scripts, test, type (+1 more)

### Community 12 - "IntelliJ MCP Backend Workflow & Static Analysis Rule"
Cohesion: 0.29
Nodes (6): 1. Tool Discovery & Dynamic Capability Inspection, 2. Pre-Build Verification (Immediate Post-Edit Validation), 3. Token-Efficient Code Navigation, 4. Build Tiering & Execution Hierarchy, 5. Unavailability & Fallback Handling, IntelliJ MCP Backend Workflow & Static Analysis Rule

### Community 13 - "sync-versions-in-docs.mjs"
Cohesion: 0.20
Nodes (7): assetRewrites, checkMode, __dirname, docRewrites, docs, ROOT, versions

### Community 14 - "Lean Build Skill"
Cohesion: 0.20
Nodes (10): Lean Build Agent Config, Architecture-First Simplicity, Lean Build Skill, Narrow Feature Slice, Safe Refactor Agent Config, Behavior Preservation, Safe Refactor Skill, Surgical Patch Agent Config (+2 more)

### Community 15 - "normalize-vue-frontend.mjs"
Cohesion: 0.36
Nodes (8): CANONICAL_SCRIPTS, main(), normalizeEslintConfig(), normalizeEslintConfigFile(), normalizePackageJson(), normalizeVueFrontend(), OXLINT_PACKAGES, removeOxlintConfig()

### Community 16 - "sync-workshop-docs.mjs"
Cohesion: 0.31
Nodes (8): findBrokenLinks(), isPublishedInDocs(), main(), PUBLISHED_IN_DOCS, repoRoot, rewriteLinks(), sourceDir, targetDir

### Community 17 - "Dr JSkill"
Cohesion: 0.15
Nodes (14): Eclipse JDT Language Server Guide, JDTLS Agent LSP Configuration, Agent Skill, Dr JSkill, AI Coding Mindset Shift, Dr JSkill Tested Models, Dr JSkill Generation Workflow, normalize-vue-frontend Script (+6 more)

### Community 19 - "AI Processing"
Cohesion: 0.29
Nodes (7): Academic Context, Academic Event / Deadline, AI Processing, Course-Linked Journal, Course Schedule, Notes View UI, Task Entity

### Community 20 - "Docker Compose JVM Full Stack"
Cohesion: 0.33
Nodes (6): CI Build & Test Job, GitHub Actions Build & Test Workflow, CI Docker Build Job, Docker Compose JVM AOT Full Stack, Docker Compose Native GraalVM Full Stack, Docker Compose JVM Full Stack

### Community 21 - "Appendix B — Troubleshooting"
Cohesion: 0.06
Nodes (34): A POST returns 400 and the log says "Cannot map `null` into type `boolean`", Agent behavior, Appendix B — Troubleshooting, Copilot CLI doesn't see the Dr JSkill skill, `copilot` command not found, Docker build fails downloading Node/npm: "SSL peer shut down incorrectly", Docker: `Cannot connect to the Docker daemon`, `docker compose up` builds slowly every time (+26 more)

### Community 22 - "08 — Deployment"
Cohesion: 0.11
Nodes (18): 08 — Deployment, 1. Build a production JAR, 2. Run the whole stack in Docker, 3. GraalVM native image, 4. Production config — the one property you must change, 5. A word on secrets, 6. (Optional) Deploy to Azure Container Apps, Add a PostgreSQL database (+10 more)

### Community 23 - "03 — Anatomy of the generated application"
Cohesion: 0.14
Nodes (14): 03 — Anatomy of the generated application, 1. Where things live, 2.1 The entity — `Todo.java`, 2.2 The repository — `TodoRepository.java`, 2.3 The service — `TodoService.java` (often absent), 2.4 The controller — `TodoController.java`, 2. The backend, layer by layer, 3. Configuration — `application.properties` (+6 more)

### Community 24 - "Angular Frontend Integration Guide"
Cohesion: 0.33
Nodes (6): Angular Frontend Integration Guide, Frontend Maven Plugin Configuration, Angular Dev Proxy Configuration, React 19 Frontend Integration Guide, React API Service Layer Pattern, Vite React Proxy Configuration

### Community 25 - "Spring Boot Layered Architecture"
Cohesion: 0.33
Nodes (6): Spring Boot Layered Architecture, Frontend Maven Plugin Vite Integration, Hibernate ddl-auto, Spring Boot Docker Compose Dev Services, Bootstrap UI Polish Patterns, Read-Only Transactions Optimization

### Community 26 - "Docker Guide for Spring Boot"
Cohesion: 0.18
Nodes (12): CRaC Checkpoint Restore Container Image, Docker Guide for Spring Boot, GraalVM Native Container Image, JVM Distroless Image, Spring AOT Container Image, Spring Boot Docker Compose Dev Integration, GraalVM Native Image Guide, Native Maven Plugin Configuration (+4 more)

### Community 27 - "02 — Getting started"
Cohesion: 0.17
Nodes (12): 02 — Getting started, 10. (Optional) Publish to GitHub, 1. Pick a working directory, 2. Start Copilot CLI, 3. Your first prompt, 4. What the agent is doing, 5. Tour the generated project, 6. Run the application (+4 more)

### Community 28 - "Spring Security Best Practices Guide"
Cohesion: 0.40
Nodes (5): Stateless JWT Authentication, Method-Level Authorization, OAuth2 Resource Server Integration, Problem Details RFC 7807 Exception Handling, Spring Security Best Practices Guide

### Community 29 - "Diff Review Workflow"
Cohesion: 0.40
Nodes (5): Diff Review Workflow, Hardcoded User Management Pattern, OAuth2 Security Extension, Investigate First OpenAI Interface Config, investigate-first Agent Skill

### Community 30 - "graphify Incremental Update (--update)"
Cohesion: 0.40
Nodes (5): graphify Watch Mode, graphify Git Post-Commit Hook, graphify Whisper Audio/Video Transcription, graphify Cluster-Only Mode, graphify Incremental Update (--update)

### Community 31 - "NyareApplicationTests.java"
Cohesion: 0.60
Nodes (3): NyareApplicationTests, org.junit.jupiter.api.Test, org.springframework.boot.test.context.SpringBootTest

### Community 32 - "Social Icon"
Cohesion: 0.40
Nodes (5): Bluesky Icon, Discord Icon, GitHub Icon, Social Icon, X Icon

### Community 33 - "Appendix A — Prompt cheat sheet"
Cohesion: 0.17
Nodes (12): Appendix A — Prompt cheat sheet, Controlling the agent, Debugging & diagnostics, Docs & commits, Dr JSkill meta-prompts, Feature additions, Performance, Project creation (+4 more)

### Community 34 - "Spring Boot Testing Best Practices Guide"
Cohesion: 0.20
Nodes (11): Testcontainers PostgreSQL Integration, Jackson 3 Package & Compatibility Rules, Spring Boot 4 Migration Guide, MockitoBean Override Migration, No-Lombok Maven Enforcer & ArchUnit Rule, Startup Info Banner Component, WebMvc Test Modular Starter, Maven Failsafe Integration Test Pipeline (+3 more)

### Community 35 - "01 — Setup"
Cohesion: 0.18
Nodes (11): 01 — Setup, 1.1 Node.js 24 and npm 11, 1.2 Java 25, 1.3 Docker, 1. Install the prerequisites, 2. Install GitHub Copilot CLI, 3. Install the Dr JSkill skill, 4. Install JDTLS (Java code intelligence) (+3 more)

### Community 37 - "Migration Skill"
Cohesion: 0.50
Nodes (4): Migration Agent Config, Expand-Migrate-Contract Pattern, Migration Skill, Reversible Compatibility and Rollback

### Community 38 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 39 - "NyareApplication"
Cohesion: 0.60
Nodes (3): NyareApplication, org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.data.jpa.repository.config.EnableJpaAuditing

### Community 41 - "07 — Performance"
Cohesion: 0.18
Nodes (11): 07 — Performance, 1. The rule: measure first, 2. Enable Actuator, 3. Virtual threads, 4. HTTP compression, 5. Read-only transactions, 6. Lazy-loaded routes (front-end), 7. Static asset caching (+3 more)

### Community 42 - "Docker Compose JVM NoDB Service"
Cohesion: 0.67
Nodes (3): Docker Compose JVM AOT NoDB Service, Docker Compose Native GraalVM NoDB Service, Docker Compose JVM NoDB Service

### Community 43 - "04 — Adding users"
Cohesion: 0.20
Nodes (10): 04 — Adding users, 1. Setup the session, 2. The prompt, 3. What you'll (probably) see, 4. Review the diff, 5. Iterate with follow-up prompts, 6. Run the app, 7. Peek at the database (optional) (+2 more)

### Community 44 - "09 — Going further"
Cohesion: 0.22
Nodes (9): 09 — Going further, 1. Real authentication, 2. Observability with Prometheus + Grafana, 3. Keyset (seek) pagination, 4. Try a different front-end, 5. Replay on another domain, 6. Turn the skill into yours, 7. Teach the workshop (+1 more)

### Community 45 - "Testcontainers Integration Testing"
Cohesion: 0.67
Nodes (3): Testcontainers Integration Testing, Mockito & WebMvcTest Unit Testing, N+1 Query Detection IT

### Community 46 - "Azure Container Apps Deployment Recipe"
Cohesion: 0.67
Nodes (3): Azure Container Apps Deployment Recipe, Production Multi-Stage Distroless Dockerfile, GraalVM Native Image Deployment

### Community 47 - "Study Plan"
Cohesion: 0.67
Nodes (3): AI Planning, Calendar View UI, Study Plan

### Community 48 - "Dr JSkill Agent Guidelines"
Cohesion: 0.25
Nodes (8): Dr JSkill Agent Guidelines, JDTLS Java Intelligence Recommendation, Canonical .env Secret Policy, Dr JSkill Version Management Workflow, Development PostgreSQL Docker Compose, VS Code Devcontainer Compose Setup, Spring Boot Architecture Best Practices, Eclipse JDTLS Code Intelligence

### Community 50 - "Verify and Stop Skill"
Cohesion: 0.67
Nodes (3): Verify and Stop Agent Config, Acceptance Proof and Gate Verification, Verify and Stop Skill

### Community 51 - "Frontend HTML Entrypoint"
Cohesion: 0.67
Nodes (3): Vue App Mount Element, Frontend HTML Entrypoint, Vue 3 + Vite Template Guide

### Community 54 - "Model Craft"
Cohesion: 0.13
Nodes (14): 1. JPA & Persistence Annotations, 2. Bean Validation Constraints, 3. Constructors & Accessors, 4. YAGNI Identity (No `equals()` / `hashCode()` Bloat), 5. Domain Javadoc, 6. Canonical Reference Example, Auditing & Temporal Fields, Entity & Table Declarations (+6 more)

### Community 55 - "06 — Testing"
Cohesion: 0.20
Nodes (10): 06 — Testing, 1. Why test AI-generated code?, 2. The two test styles, 3. Add unit tests for the controller, 4. Add an integration test with Testcontainers, 5. Run the full suite, 6. Speed up the feedback loop, 7. Run a single test (+2 more)

### Community 56 - "00 — Introduction"
Cohesion: 0.29
Nodes (7): 00 — Introduction, 1. What is an Agent Skill?, 2. What Dr JSkill is, 3. How this differs from Spring Initializr, 4. The mindset shift, 5. What you'll learn, 6. Tested models

### Community 57 - "GitHub Copilot CLI + Java workshop, using Dr JSkill"
Cohesion: 0.33
Nodes (6): Chapters, GitHub Copilot CLI + Java workshop, using Dr JSkill, How to use this workshop, Prerequisites, Reference material, What you'll build

### Community 71 - "05 — A more professional front-end"
Cohesion: 0.22
Nodes (9): 05 — A more professional front-end, 1. What "professional-looking" means here, 2. Add Bootstrap structure, 3. Empty states, 4. Toasts for feedback, 5. Loading spinners, 6. Inline form validation, 7. Review what the agent produced (+1 more)

### Community 72 - "4. Endpoints Specification"
Cohesion: 0.05
Nodes (38): 1. Overview & Domain Architecture, 2.1 TaskStatus Enum, 2.2 Task Schema Overview, 2. Data Models & Enums, 3.1 400 Bad Request Example (Validation Failure), 3.2 404 Not Found Example, 3. Error Handling (RFC 7807 Problem Details), 4.1 Create Task (+30 more)

### Community 92 - "Backend Agent Guide (Nyare)"
Cohesion: 0.29
Nodes (6): Backend Agent Guide (Nyare), Core Architecture & Guidelines, Domain Model (`group.four.nyare.nyare.model`), Knowledge Graph Workflows (`graphify`), Tech Stack, Verification & Build Tiering

### Community 96 - "4. Endpoints Specification"
Cohesion: 0.05
Nodes (38): 1. Overview & Domain Architecture, 2.1 TaskStatus Enum, 2.2 Task Schema Overview, 2. Data Models & Enums, 3.1 400 Bad Request Example (Validation Failure), 3.2 404 Not Found Example, 3. Error Handling (RFC 7807 Problem Details), 4.1 Create Task (+30 more)

### Community 97 - "Task Manager Service Implementation Plan"
Cohesion: 0.14
Nodes (13): File Map, Global Constraints, Placeholder Scan, Self-Review Checklist, Spec Coverage, Task 1: DTOs — Request and Response Records, Task 2: Repositories — TaskRepository and CourseRepository, Task 3: Service Layer — TaskService (+5 more)

### Community 98 - "Nyare Backend Conventions and Standards"
Cohesion: 0.18
Nodes (10): 1. Architecture Overview, 2. Package Structure & Naming, 3. Domain Entity Guidelines, 4. DTO & Validation Guidelines, 5. Service & Transaction Guidelines, 6. REST API & Controller Guidelines, 7. Persistence & SQLite Guidelines, 8. Verification & Testing Standards (+2 more)

## Knowledge Gaps
- **428 isolated node(s):** `Overview`, `Entity & Table Declarations`, `Primary Key Mappings`, `Naming Strategy (No Manual Column Names)`, `Relationships & Foreign Keys` (+423 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 521 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dr JSkill Specification` connect `Dr JSkill Specification` to `Spring Boot Testing Best Practices Guide`, `Azure Deployment Guide`, `Dr JSkill Agent Guidelines`, `Dr JSkill`, `Angular Frontend Integration Guide`, `Docker Guide for Spring Boot`, `Spring Security Best Practices Guide`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `Dr JSkill Documentation Home` connect `Dr JSkill Specification` to `README.md`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `Appendix B — Troubleshooting` connect `Appendix B — Troubleshooting` to `README.md`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `Overview`, `Entity & Table Declarations`, `Primary Key Mappings` to the rest of the system?**
  _428 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `versions.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05707762557077625 - nodes in this community are weakly interconnected._
- **Should `compress.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05673076923076923 - nodes in this community are weakly interconnected._
- **Should `config.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06423034330011074 - nodes in this community are weakly interconnected._