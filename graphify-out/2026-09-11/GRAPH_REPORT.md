# Graph Report - nyare  (2026-09-11)

## Corpus Check
- 170 files · ~145,158 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 636 nodes · 768 edges · 92 communities (47 shown, 43 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Project Scaffolding Scripts
- Caveman Compression CLI
- Documentation Route Plugins
- Azure and PostgreSQL Deployment
- Token Reduction Benchmarks
- Nyare Academic Domain Models
- Frontend Dependencies
- Dr JSkill Guidelines and Mindset
- Documentation Client Navigation
- Cavecrew Subagents Workflow
- Graphify Exports and Specification
- Package Configuration
- Package Configuration
- Sync Versions In Docs Module
- Agent Workflow Skills
- Frontend Normalization Tooling
- Workshop Documentation Sync
- Dr JSkill Guidelines and Mindset
- Spring Boot Architecture Patterns
- Nyare Architecture and Planning
- CI/CD and Docker Deployment
- Dr JSkill Guidelines and Mindset
- IDE Tools and Code Intelligence
- CI/CD and Docker Deployment
- Frontend Integration Guides
- Spring Boot Architecture Patterns
- CI/CD and Docker Deployment
- Spring Boot Architecture Patterns
- Security Module
- 04 Adding Users Module
- Graphify Exports and Specification
- Nyareapplicationtests Module
- Icons Module
- Skill Module
- Configuration Module
- Frontend Normalization Tooling
- Skill File.Test Module
- Skill Module
- Gradlew Module
- Nyareapplication Module
- Helloworld Module
- Skill Module
- CI/CD and Docker Deployment
- Logging Module
- Frontend Integration Guides
- 06 Testing Module
- CI/CD and Docker Deployment
- Agents Module
- Skill File.Test Module
- Create Project Module
- Skill Module
- Frontend Integration Guides
- Opencode Module
- Skill Module
- Readme Module
- Frontend Integration Guides
- 07 Performance Module
- Appendix A Prompts Module
- IDE Tools and Code Intelligence
- IDE Tools and Code Intelligence
- Frontend Integration Guides
- IDE Tools and Code Intelligence
- Agents Module
- Compress Init Services
- Checkpoint And Run Module
- Graphify Module
- Skill Module
- Favicon Module
- 01 Setup Module
- 03 Generated Application Module
- 07 Performance Module
- 07 Performance Module
- 09 Going Further Module
- Appendix B Troubleshooting Module
- CI/CD and Docker Deployment
- 01 Setup Module
- 01 Setup Module
- 07 Performance Module
- 07 Performance Module
- 07 Performance Module
- 09 Going Further Module
- 09 Going Further Module
- Graphify Exports and Specification
- Dr Jskill Module
- Graphify Module
- Favicon Module
- Icons Module
- Hero Module
- Vite Module
- Vue Module

## God Nodes (most connected - your core abstractions)
1. `getVersionValue()` - 23 edges
2. `_compress_file_locked()` - 18 edges
3. `applyDotfiles()` - 18 edges
4. `validate()` - 14 edges
5. `downloadAndExtractProject()` - 10 edges
6. `detect_file_type()` - 9 edges
7. `resolveBootVersion()` - 9 edges
8. `backup_dir_for()` - 8 edges
9. `file_lock()` - 8 edges
10. `should_compress()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Cavecrew Investigator Subagent` --semantically_similar_to--> `Caveman Explore Skill`  [INFERRED] [semantically similar]
  .agents/skills/cavecrew/SKILL.md → .agents/skills/caveman-explore/SKILL.md
- `Cavecrew Reviewer Subagent` --semantically_similar_to--> `Caveman Review Skill`  [INFERRED] [semantically similar]
  .agents/skills/cavecrew/SKILL.md → .agents/skills/caveman-review/SKILL.md
- `Docker Compose JVM AOT NoDB Service` --semantically_similar_to--> `Docker Compose JVM NoDB Service`  [INFERRED] [semantically similar]
  .agents/skills/dr-jskill/assets/docker-compose-aot-nodb.yml → .agents/skills/dr-jskill/assets/docker-compose-nodb.yml
- `Docker Compose JVM AOT Full Stack` --semantically_similar_to--> `Docker Compose JVM Full Stack`  [INFERRED] [semantically similar]
  .agents/skills/dr-jskill/assets/docker-compose-aot.yml → .agents/skills/dr-jskill/assets/docker-compose.yml
- `Docker Compose Native GraalVM NoDB Service` --semantically_similar_to--> `Docker Compose JVM NoDB Service`  [INFERRED] [semantically similar]
  .agents/skills/dr-jskill/assets/docker-compose-native-nodb.yml → .agents/skills/dr-jskill/assets/docker-compose-nodb.yml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Caveman Agent Skills Suite** — _agents_skills_caveman_skill_caveman, _agents_skills_caveman_commit_skill_caveman_commit, _agents_skills_caveman_review_skill_caveman_review, _agents_skills_caveman_compress_skill_caveman_compress, _agents_skills_caveman_help_skill_caveman_help, _agents_skills_caveman_stats_skill_caveman_stats [EXTRACTED 1.00]
- **Caveman Cloud Lifecycle and Telemetry Skills** — _agents_skills_caveman_discover_skill_caveman_discover, _agents_skills_caveman_setup_skill_caveman_setup, _agents_skills_caveman_evidence_review_skill_caveman_evidence_review, _agents_skills_caveman_manage_skill_caveman_manage, _agents_skills_caveman_optimize_skill_caveman_optimize [INFERRED 0.95]
- **Cavecrew Subagents Trio** — _agents_skills_cavecrew_skill_cavecrew_investigator, _agents_skills_cavecrew_skill_cavecrew_builder, _agents_skills_cavecrew_skill_cavecrew_reviewer [EXTRACTED 1.00]
- **Dr JSkill Docker Deployment Configurations** — _agents_skills_dr_jskill_assets_docker_compose_stack, _agents_skills_dr_jskill_assets_docker_compose_aot_stack, _agents_skills_dr_jskill_assets_docker_compose_native_stack, _agents_skills_dr_jskill_assets_docker_compose_crac_service [EXTRACTED 1.00]
- **BootUI Tool Ecosystem: Dr JSkill, BootUI, Coffilot** — _agents_skills_dr_jskill_docs_works_with_bootui_family, _agents_skills_dr_jskill_docs_works_with_circle_of_color, _agents_skills_dr_jskill_docs_readme_documentation_home [EXTRACTED 1.00]
- **Workshop Progressive Architecture and Skill Flow** — _agents_skills_dr_jskill_docs_workshop_00_introduction_dr_jskill_overview, _agents_skills_dr_jskill_docs_workshop_02_getting_started_todo_scaffolding, _agents_skills_dr_jskill_docs_workshop_03_generated_application_layered_architecture, _agents_skills_dr_jskill_docs_workshop_04_adding_users_hardcoded_user_system, _agents_skills_dr_jskill_docs_workshop_05_professional_frontend_bootstrap_ui, _agents_skills_dr_jskill_docs_workshop_06_testing_two_tier_testing, _agents_skills_dr_jskill_docs_workshop_07_performance_measure_first, _agents_skills_dr_jskill_docs_workshop_08_deployment_multistage_distroless_docker [EXTRACTED 1.00]
- **Performance Tuning and Verification Pipeline** — _agents_skills_dr_jskill_docs_workshop_07_performance_measure_first, _agents_skills_dr_jskill_docs_workshop_07_performance_actuator_micrometer, _agents_skills_dr_jskill_docs_workshop_07_performance_virtual_threads, _agents_skills_dr_jskill_docs_workshop_07_performance_read_only_transactions, _agents_skills_dr_jskill_docs_workshop_07_performance_static_asset_caching, _agents_skills_dr_jskill_docs_workshop_07_performance_n_plus_one_detection [EXTRACTED 1.00]
- **Containerization and Cloud Deployment Suite** — _agents_skills_dr_jskill_docs_workshop_08_deployment_multistage_distroless_docker, _agents_skills_dr_jskill_docs_workshop_08_deployment_graalvm_native_image, _agents_skills_dr_jskill_docs_workshop_08_deployment_production_configuration, _agents_skills_dr_jskill_docs_workshop_08_deployment_azure_container_apps [EXTRACTED 1.00]
- **Front-end Integration Flavors for Spring Boot** — _agents_skills_dr_jskill_references_angular_angular_guide, _agents_skills_dr_jskill_references_react_react_guide, _agents_skills_dr_jskill_references_vue_vue_guide, _agents_skills_dr_jskill_references_vanilla_js_vanilla_js_guide [INFERRED 0.95]
- **Spring Boot 4 Container Image Variants** — _agents_skills_dr_jskill_references_docker_jvm_distroless_image, _agents_skills_dr_jskill_references_docker_spring_aot_image, _agents_skills_dr_jskill_references_docker_crac_image, _agents_skills_dr_jskill_references_docker_graalvm_native_image [EXTRACTED 1.00]
- **Spring Boot 4 Testing Ecosystem Modernization** — _agents_skills_dr_jskill_references_spring_boot_4_mockito_bean, _agents_skills_dr_jskill_references_spring_boot_4_webmvc_test_starter, _agents_skills_dr_jskill_references_test_testcontainers_service_connection, _agents_skills_dr_jskill_references_test_rest_test_client [INFERRED 0.95]
- **Dr JSkill Workshop Core Lifecycle** — _agents_skills_dr_jskill_workshop_00_introduction_dr_jskill, _agents_skills_dr_jskill_workshop_02_getting_started_generation_workflow, _agents_skills_dr_jskill_workshop_06_testing_webmvctest_unit_testing, _agents_skills_dr_jskill_workshop_08_deployment_dockerfile_multistage [INFERRED 0.85]
- **Graphify Query & Knowledge Retrieval Flow** — _agents_skills_graphify_skill_fast_path_query, _agents_skills_graphify_references_query_query_expansion, _agents_skills_graphify_references_query_traversal_modes, _agents_skills_graphify_references_query_work_memory_reflections [INFERRED 0.95]
- **Graphify Automation & Incremental Updates** — _agents_skills_graphify_references_hooks_post_commit_hook, _agents_skills_graphify_references_add_watch_watch_mode, _agents_skills_graphify_references_update_incremental_update [INFERRED 0.95]
- **Nyare Core Pipeline Flow** — agents_course_schedule, agents_course_linked_journal, agents_ai_processing, agents_ai_planning, agents_study_plan, agents_calendar_view [EXTRACTED 1.00]
- **Agent Execution & Governance Skills** — agents_skills_lean_build_skill_lean_build, agents_skills_migration_skill_migration, agents_skills_safe_refactor_skill_safe_refactor, agents_skills_surgical_patch_skill_surgical_patch, agents_skills_verify_and_stop_skill_verify_and_stop [INFERRED 0.85]
- **SVG Icon Sprite** — frontend_public_icons_bluesky_icon, frontend_public_icons_discord_icon, frontend_public_icons_documentation_icon, frontend_public_icons_github_icon, frontend_public_icons_social_icon, frontend_public_icons_x_icon [EXTRACTED 1.00]

## Communities (92 total, 43 thin omitted)

### Community 0 - "Project Scaffolding Scripts"
Cohesion: 0.06
Nodes (63): { flags, positional }, outputDir, { flags, positional }, outputDir, DEFAULT_BOOT_FALLBACK, { flags, positional }, JAVA_VERSION_DEFAULT, outputDir (+55 more)

### Community 1 - "Caveman Compression CLI"
Cohesion: 0.06
Nodes (61): main(), print_usage(), Caveman Compress CLI Usage: caveman <filepath>, backup_dir_for(), build_compress_prompt(), build_fix_prompt(), call_claude(), compress_file() (+53 more)

### Community 2 - "Documentation Route Plugins"
Cohesion: 0.06
Nodes (35): cleanDocsPermalinksPlugin(), createCleanRouteByInferredRoute(), listMarkdownFiles(), rewriteMarkdownDocLink(), siteBase, toCleanMarkdownDocRoute(), toDocLink(), createDocsSidebar() (+27 more)

### Community 3 - "Azure and PostgreSQL Deployment"
Cohesion: 0.06
Nodes (36): Azure Container Apps, Azure Deployment Guide, GitHub Actions Azure OIDC Deployment, Azure Database for PostgreSQL Flexible Server, PostgreSQL Database Best Practices, Hibernate DDL-Auto Schema Management, JPA N+1 Query Optimization, Testcontainers PostgreSQL Integration (+28 more)

### Community 4 - "Token Reduction Benchmarks"
Cohesion: 0.10
Nodes (28): benchmark_pair(), count_tokens(), main(), print_table(), Path, count_bullets(), extract_code_blocks(), extract_fenced_spans() (+20 more)

### Community 5 - "Nyare Academic Domain Models"
Cohesion: 0.12
Nodes (15): AcademicContext, Entity, AcademicEvent, Entity, Course, TaskStatus, COMPLETED, IN_PROGRESS (+7 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.10
Nodes (20): dependencies, tailwindcss, @tailwindcss/vite, vue, devDependencies, vite, @vitejs/plugin-vue, vue (+12 more)

### Community 7 - "Dr JSkill Guidelines and Mindset"
Cohesion: 0.11
Nodes (20): Dr JSkill Agent Guidelines, JDTLS Java Intelligence Recommendation, Canonical .env Secret Policy, Dr JSkill Version Management Workflow, Development PostgreSQL Docker Compose, VS Code Devcontainer Compose Setup, Docker Compose CRaC Fast-Restore Service, Frontend Development Placeholder Page (+12 more)

### Community 8 - "Documentation Client Navigation"
Cohesion: 0.23
Nodes (18): decodeHash(), findActiveHeading(), findCurrentSidebarLink(), getScrollTopOffset(), getToggleChildren(), isCurrentSidebarLink(), isElementVisible(), isPlainLeftClick() (+10 more)

### Community 9 - "Cavecrew Subagents Workflow"
Cohesion: 0.13
Nodes (18): Cavecrew Overview, Cavecrew Skill, Cavecrew Builder Subagent, Cavecrew Investigator Subagent, Cavecrew Reviewer Subagent, Caveman Commit Overview, Caveman Commit Skill, Caveman Compress Overview (+10 more)

### Community 10 - "Graphify Exports and Specification"
Cohesion: 0.14
Nodes (14): graphify Neo4j & FalkorDB Export, graphify MCP Server, graphify Wiki Export, graphify Confidence Rubric, graphify Extraction Specification, graphify Cross-Repo Merge, graphify Native CLAUDE.md Integration, graphify Constrained Query Expansion (+6 more)

### Community 11 - "Package Configuration"
Cohesion: 0.20
Nodes (9): description, files, license, name, private, scripts, test, type (+1 more)

### Community 12 - "Package Configuration"
Cohesion: 0.20
Nodes (9): description, files, license, name, private, scripts, test, type (+1 more)

### Community 13 - "Sync Versions In Docs Module"
Cohesion: 0.20
Nodes (7): assetRewrites, checkMode, __dirname, docRewrites, docs, ROOT, versions

### Community 14 - "Agent Workflow Skills"
Cohesion: 0.20
Nodes (10): Lean Build Agent Config, Architecture-First Simplicity, Lean Build Skill, Narrow Feature Slice, Safe Refactor Agent Config, Behavior Preservation, Safe Refactor Skill, Surgical Patch Agent Config (+2 more)

### Community 15 - "Frontend Normalization Tooling"
Cohesion: 0.36
Nodes (8): CANONICAL_SCRIPTS, main(), normalizeEslintConfig(), normalizeEslintConfigFile(), normalizePackageJson(), normalizeVueFrontend(), OXLINT_PACKAGES, removeOxlintConfig()

### Community 16 - "Workshop Documentation Sync"
Cohesion: 0.31
Nodes (8): findBrokenLinks(), isPublishedInDocs(), main(), PUBLISHED_IN_DOCS, repoRoot, rewriteLinks(), sourceDir, targetDir

### Community 17 - "Dr JSkill Guidelines and Mindset"
Cohesion: 0.25
Nodes (8): Agent Skill, Dr JSkill, AI Coding Mindset Shift, Dr JSkill Tested Models, Dr JSkill Prompt Patterns Cheat Sheet, Dr JSkill Workshop Curriculum, find-skills Agent Skill, Skills CLI (npx skills)

### Community 18 - "Spring Boot Architecture Patterns"
Cohesion: 0.29
Nodes (7): Hibernate DDL Auto Strategy, Layered Spring Boot Architecture, CRUD Service Layer Omission Rationale, Database Seeding and Schema Evolution, Hardcoded User Management, Read-Only Transactions Optimization, OAuth 2.0 GitHub Authentication

### Community 19 - "Nyare Architecture and Planning"
Cohesion: 0.29
Nodes (7): Academic Context, Academic Event / Deadline, AI Processing, Course-Linked Journal, Course Schedule, Notes View UI, Task Entity

### Community 20 - "CI/CD and Docker Deployment"
Cohesion: 0.33
Nodes (6): CI Build & Test Job, GitHub Actions Build & Test Workflow, CI Docker Build Job, Docker Compose JVM AOT Full Stack, Docker Compose Native GraalVM Full Stack, Docker Compose JVM Full Stack

### Community 21 - "Dr JSkill Guidelines and Mindset"
Cohesion: 0.33
Nodes (6): Agent Skill Specification, AI Coding Mindset Shift, Dr JSkill Overview, Spring Initializr Differences, Diff Review and Iteration Loop, Dr JSkill Skill Customization and Forking

### Community 22 - "IDE Tools and Code Intelligence"
Cohesion: 0.33
Nodes (6): Dr JSkill Skill Installation, GitHub Copilot CLI Environment, JDTLS Java Code Intelligence, Copilot CLI Model Comparison, Todo Application Scaffolding, Vue Oxlint ERESOLVE Dependency Resolution

### Community 23 - "CI/CD and Docker Deployment"
Cohesion: 0.33
Nodes (6): Project Publishing to GitHub, Azure Container Apps Deployment, GraalVM Native Image Tradeoffs, Multi-Stage Distroless Docker Architecture, Production Schema Validation and Secrets, Distroless Sidecar Debugging Pattern

### Community 24 - "Frontend Integration Guides"
Cohesion: 0.33
Nodes (6): Angular Frontend Integration Guide, Frontend Maven Plugin Configuration, Angular Dev Proxy Configuration, React 19 Frontend Integration Guide, React API Service Layer Pattern, Vite React Proxy Configuration

### Community 25 - "Spring Boot Architecture Patterns"
Cohesion: 0.33
Nodes (6): Spring Boot Layered Architecture, Frontend Maven Plugin Vite Integration, Hibernate ddl-auto, Spring Boot Docker Compose Dev Services, Bootstrap UI Polish Patterns, Read-Only Transactions Optimization

### Community 26 - "CI/CD and Docker Deployment"
Cohesion: 0.40
Nodes (5): Spring Boot Dev Run Workflow, Spring Boot Docker Compose Integration, Frontend Maven Plugin Build Wiring, Bootstrap 5 UI Shell, Multi-Frontend Framework Flexibility

### Community 27 - "Spring Boot Architecture Patterns"
Cohesion: 0.40
Nodes (5): Testcontainers Container Reuse, Testcontainers Integration Testing, Two-Tier Testing Strategy, WebMvcTest Unit Tests with Mockito, N+1 Query Detection with Hibernate Statistics

### Community 28 - "Security Module"
Cohesion: 0.40
Nodes (5): Stateless JWT Authentication, Method-Level Authorization, OAuth2 Resource Server Integration, Problem Details RFC 7807 Exception Handling, Spring Security Best Practices Guide

### Community 29 - "04 Adding Users Module"
Cohesion: 0.40
Nodes (5): Diff Review Workflow, Hardcoded User Management Pattern, OAuth2 Security Extension, Investigate First OpenAI Interface Config, investigate-first Agent Skill

### Community 30 - "Graphify Exports and Specification"
Cohesion: 0.40
Nodes (5): graphify Watch Mode, graphify Git Post-Commit Hook, graphify Whisper Audio/Video Transcription, graphify Cluster-Only Mode, graphify Incremental Update (--update)

### Community 31 - "Nyareapplicationtests Module"
Cohesion: 0.60
Nodes (3): NyareApplicationTests, org.junit.jupiter.api.Test, org.springframework.boot.test.context.SpringBootTest

### Community 32 - "Icons Module"
Cohesion: 0.40
Nodes (5): Bluesky Icon, Discord Icon, GitHub Icon, Social Icon, X Icon

### Community 33 - "Skill Module"
Cohesion: 0.50
Nodes (4): Caveman Learn Developer Guide, Caveman Learn Overview, Caveman Learn Skill, Cavemem Offload Mechanism

### Community 34 - "Configuration Module"
Cohesion: 0.50
Nodes (4): Spring Boot Configuration Guide, Type-Safe Configuration Properties, Spring Environment Profiles, Secrets Management Best Practices

### Community 35 - "Frontend Normalization Tooling"
Cohesion: 0.50
Nodes (4): Dr JSkill Generation Workflow, normalize-vue-frontend Script, Publish to GitHub Workflow, Dr JSkill Troubleshooting Guide

### Community 37 - "Skill Module"
Cohesion: 0.50
Nodes (4): Migration Agent Config, Expand-Migrate-Contract Pattern, Migration Skill, Reversible Compatibility and Rollback

### Community 38 - "Gradlew Module"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 41 - "Skill Module"
Cohesion: 0.67
Nodes (3): Caveman Discover Skill, Caveman Optimize Skill, Caveman Setup Skill

### Community 42 - "CI/CD and Docker Deployment"
Cohesion: 0.67
Nodes (3): Docker Compose JVM AOT NoDB Service, Docker Compose Native GraalVM NoDB Service, Docker Compose JVM NoDB Service

### Community 43 - "Logging Module"
Cohesion: 0.67
Nodes (3): Async Logback Appenders, Logging Best Practices Guide, SLF4J with Logback Integration

### Community 44 - "Frontend Integration Guides"
Cohesion: 0.67
Nodes (3): Vue Frontend Oxlint Normalizer, Pinia State Management Store, Vue 3 Frontend Integration Guide

### Community 45 - "06 Testing Module"
Cohesion: 0.67
Nodes (3): Testcontainers Integration Testing, Mockito & WebMvcTest Unit Testing, N+1 Query Detection IT

### Community 46 - "CI/CD and Docker Deployment"
Cohesion: 0.67
Nodes (3): Azure Container Apps Deployment Recipe, Production Multi-Stage Distroless Dockerfile, GraalVM Native Image Deployment

### Community 47 - "Agents Module"
Cohesion: 0.67
Nodes (3): AI Planning, Calendar View UI, Study Plan

### Community 50 - "Skill Module"
Cohesion: 0.67
Nodes (3): Verify and Stop Agent Config, Acceptance Proof and Gate Verification, Verify and Stop Skill

### Community 51 - "Frontend Integration Guides"
Cohesion: 0.67
Nodes (3): Vue App Mount Element, Frontend HTML Entrypoint, Vue 3 + Vite Template Guide

## Knowledge Gaps
- **245 isolated node(s):** `name`, `version`, `license`, `private`, `type` (+240 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 326 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `validate()` connect `Token Reduction Benchmarks` to `Caveman Compression CLI`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `_compress_file_locked()` connect `Caveman Compression CLI` to `Token Reduction Benchmarks`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `name`, `version`, `license` to the rest of the system?**
  _245 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Project Scaffolding Scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.05707762557077625 - nodes in this community are weakly interconnected._
- **Should `Caveman Compression CLI` be split into smaller, more focused modules?**
  _Cohesion score 0.05673076923076923 - nodes in this community are weakly interconnected._
- **Should `Documentation Route Plugins` be split into smaller, more focused modules?**
  _Cohesion score 0.06423034330011074 - nodes in this community are weakly interconnected._
- **Should `Azure and PostgreSQL Deployment` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._