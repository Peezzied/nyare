# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

University and college students juggling multiple course schedules, unstructured lecture notes, deadlines, and study commitments.

## Product Purpose

Nyare is a calendar-first academic planning assistant. It transforms course-linked student journal notes into structured tasks, academic events, and day-level study plans to keep students ahead of their coursework.

## Positioning

Unlike rigid productivity tools that require complex hourly time-blocking and availability matrices, Nyare extracts actionable tasks directly from unstructured daily notes and provides realistic day-level recommendations without taking away student autonomy.

## Operating Context

Mobile-first web application tailored for a 390px viewport width. Students capture journal notes immediately following class lectures and review their study schedule throughout the day on mobile devices.

## Capabilities and Constraints

- Day-level planning granularity: recommends calendar dates without hourly time-blocking or calendar slot manipulation.
- Virtual study plan: derives tri-state status (`SCHEDULED`, `LATER`, `BACKLOG`) dynamically without a dedicated database entity.
- Append-only extraction: extracts new tasks and events from dirty notes without rewriting or merging existing student text.
- No deterministic priority scoring: uses contextual reasoning instead of static weighted arithmetic formulas.
- Light mode only for the initial MVP.

## Brand Commitments

- Brand Name: Nyare (`'Nyare`)
- Tagline: `para di ma yare`
- Mascot: Duckota (coastal seagull wearing a student badge and carrying a pencil)
- Aesthetic: Coastal academic planner (warm parchment `#F6F7EE`, ocean cyan `#00A4C8`, and tactile 3D bevel buttons)
- Typography: DynaPuff (Brand), Quicksand (Primary UI / Headings), Inter (Secondary UI / Note text)

## Evidence on Hand

- Conceptual Model: `docs/conceptual-model.md`
- System Workflows: `docs/system-workflows.md`
- MVP Boundaries: `docs/mvp-boundaries.md`
- Design System Specification: `DESIGN.md`

## Product Principles

1. **Student Autonomy**: Provide day-level recommendations instead of rigid hourly time blocks.
2. **Append-Only Integrity**: Preserve student text and avoid destructive automated merges.
3. **Frictionless Capture**: Require no complex availability setups before delivering planning value.
4. **Calendar-First Orientation**: Anchor academic reality to fixed class times and hard event deadlines.

## Accessibility & Inclusion

- Target WCAG AA color contrast on all text against parchment backgrounds.
- Minimum 44x44px touch targets for all mobile interactive elements.
- Meaningful accessibility labels for tri-state task badges and calendar markers.
