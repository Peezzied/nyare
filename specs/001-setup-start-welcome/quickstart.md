# Quickstart Validation Guide: Start, Welcome, and Schedule Header Flow

**Feature**: [spec.md](spec.md)  
**Date**: 2026-10-12  

## Overview

This guide provides step-by-step procedures to validate the onboarding screens locally using automated tests and manual verification.

## Prerequisites

- Node.js LTS (version 22.18+ or 24.12+) installed.
- Repository dependencies installed (`npm install` inside `frontend/`).

## Automated Verification Commands

Run all checks from the `frontend/` directory:

1. **Type Check**:
   ```bash
   npm run type-check
   ```
   *Expected outcome*: Zero TypeScript compilation errors.

2. **Linting Check**:
   ```bash
   npm run lint
   ```
   *Expected outcome*: Zero ESLint/Oxlint errors or warnings.

3. **Unit & Component Tests**:
   ```bash
   npm run test:unit
   ```
   *Expected outcome*: All Vitest specs pass (including new specs for `StartView`, `WelcomeView`, `ScheduleView`, and `StepProgress`).

## Manual End-to-End Walkthrough

Start the development server from `frontend/`:
```bash
npm run dev
```
Open `http://localhost:5173/` in a mobile viewport emulator (390px width):

### Scenario 1: Start Screen
1. Navigate to `/`.
2. Confirm the page displays `'Nyare` in DynaPuff, `para di ma yare` in Quicksand, Duckota sitting on a stone, and the "GET STARTED" button.
3. Verify that zero progress indicator dots appear on this screen.
4. Click "GET STARTED".
5. Confirm the browser navigates to `/welcome`.

### Scenario 2: Welcome Screen
1. Confirm the page displays 3 progress dots with the middle dot active (step 2 of 3).
2. Confirm the heading "Welcome,", subtitle "let's get to know you!", input field, waving Duckota with speech bubble "my name is duckota!", and "CONTINUE" button.
3. Confirm the "CONTINUE" button is disabled initially.
4. Enter spaces only; confirm the "CONTINUE" button remains disabled.
5. Enter a valid name (e.g. "Maya"); confirm the "CONTINUE" button becomes enabled.
6. Click "CONTINUE".
7. Confirm the browser navigates to `/schedule`.

### Scenario 3: Schedule Screen Top Section
1. Confirm the page displays 3 progress dots with the third dot active (step 3 of 3).
2. Confirm the header contains the back button, the title "Create a Schedule", and the checkmark button.
3. Confirm that the calendar grid, course blocks, and bottom toolbar do NOT render.
4. Click the back button in the header.
5. Confirm the browser navigates back to `/welcome`.
