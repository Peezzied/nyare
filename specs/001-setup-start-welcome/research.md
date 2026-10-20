# Technical Research: Start, Welcome, and Schedule Header Flow

**Feature**: [spec.md](spec.md)  
**Date**: 2026-10-12  

## Overview

This document resolves technical choices, patterns, and component structure for the three onboarding screens in the Nyare frontend: Start screen, Welcome screen, and Schedule header screen.

## Decisions and Rationale

### 1. Routing Architecture

- **Decision**: Define three explicit routes in `frontend/src/router/index.ts`:
  - `/` (Name: `start`): Renders `StartView.vue` (the brand landing screen).
  - `/welcome` (Name: `welcome`): Renders `WelcomeView.vue` (the student name onboarding step).
  - `/schedule` (Name: `schedule`): Renders `ScheduleView.vue` (the schedule creation step with header only).
- **Rationale**: Vue Router is already configured in `frontend/`. Distinct paths allow direct URL navigation, browser history management, and clean view isolation.
- **Alternatives Considered**:
  - *Single-route wizard with step switching via local component state*: Rejected because it breaks browser back button behavior and deep linking.

### 2. State Management for Student Name

- **Decision**: Use a lightweight Vue 3 Composable (`useOnboarding.ts`) using standard Vue `ref` reactive state in memory.
- **Rationale**: Constitution Principle VII strictly prohibits Pinia and unnecessary third-party libraries. A simple composable provides shared reactive state between the Welcome view and downstream views without external store dependencies.
- **Alternatives Considered**:
  - *Pinia store*: Explicitly forbidden by Constitution Principle VII.
  - *`localStorage` persistence*: Excluded per the updated specification scope (no reload persistence requirement).

### 3. Tactile 3D Button Styling

- **Decision**: Implement a reusable `TactileButton.vue` component or styling standard matching `frontend/DESIGN.md` Section 3:
  - Background face: `#00A4C8` (`bg-[#00A4C8]`)
  - Typography: `Quicksand` 700, white text
  - 3D bottom bevel: `4px solid #007B99` (`border-b-4 border-[#007B99]`)
  - Active state: removes bottom border and translates `translate-y-1`
  - Disabled state: muted face (`bg-slate-300`), muted border (`border-slate-400`), cursor `not-allowed`, no translate
- **Rationale**: Reusing a consistent tactile button component prevents styling duplication between "GET STARTED" and "CONTINUE".
- **Alternatives Considered**:
  - *Repeating raw Tailwind utility classes on every button*: Increases maintenance cost and risks visual inconsistency.

### 4. Progress Dots Indicator

- **Decision**: Create a focused `StepProgress.vue` component taking `currentStep` (number) and `totalSteps` (number, default 3).
  - Dot 1: represents Start (not shown on Start view per FR-009).
  - Dot 2: active on Welcome view (`currentStep = 2`).
  - Dot 3: active on Schedule view (`currentStep = 3`).
  - Active dot style: dark ocean cyan (`#007B99` or `#00A4C8`).
  - Inactive dot style: soft cyan tint (`#B3E5FC` / `rgba(0, 164, 200, 0.25)`).
- **Rationale**: Centralizes dot layout, spacing, and styling in one accessible component.

### 5. Asset Integration and Background Props

- **Decision**: Reference existing SVG and PNG assets directly from `@/assets/`:
  - Mascot: `@/assets/mascot/duckota_in_stone.png`, `@/assets/mascot/duckuta_greet.png`.
  - Props: `@/assets/props/sun.svg`, `@/assets/props/double_cloud.svg`, `@/assets/props/plant.png`, `@/assets/props/star_fish.png`, `@/assets/props/shell.png`, `@/assets/props/wave_1.svg`.
- **Rationale**: The assets are already present in the repository and match the mockups pixel-for-pixel. No new asset creation is necessary.

### 6. Accessibility & Layout Constraints

- **Decision**:
  - Container: Centered max-width mobile wrapper (`max-w-[420px] mx-auto min-h-screen`) on warm parchment background `#F6F7EE`.
  - Semantic HTML: Use `<main>`, `<header>`, `<h1/h2>`, and `<button>`.
  - Input accessible label: Hidden accessible label `<label for="student-name" class="sr-only">What is your name?</label>` with input `id="student-name"`, `aria-label="What is your name?"`.
  - Focus indicators: Visible focus rings on all interactive buttons and inputs (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2`).
