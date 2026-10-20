# Implementation Plan: Schedule X v4 Refactor for Day View Time Grid

**Branch**: `001-day-view` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: User request to refactor the Day View time grid in `frontend/src/components/day-view/ScheduleCalendar.vue` to render with Schedule X v4 (`@schedule-x/calendar`, `@schedule-x/vue`, `@schedule-x/theme-default`), with `temporal-polyfill`, timezone `Asia/Manila`, exact visual/behavioral preservation, and repositioning the "Now" jump button to bottom-left.

---

## Summary

Refactor the custom SVG/HTML grid rendering in `frontend/src/components/day-view/ScheduleCalendar.vue` to use Schedule X v4 (`@schedule-x/calendar` + `@schedule-x/vue`). Keep every custom style: 80px hour height, 12-hour labels ("8 AM"), thin light-blue grid lines (`border-sky-100`), background `#F5F6EE`, CourseCard pill styling with courseId-based palette, header/burger menu/bottom nav structure, single-scroll container with thin scrollbar and `overscroll-contain`, existing custom `TimeIndicator.vue` overlay tracking `useNow()`, and move the "Now" jump button to the bottom-left (`left-4`).

---

## Technical Context

**Language/Version**: TypeScript 5+ / Vue 3.5+ (Composition API, `<script setup>`)  
**Primary Dependencies**: 
- `@schedule-x/calendar` (^4.9.1)
- `@schedule-x/vue` (^4.1.0)
- `@schedule-x/theme-default` (^4.9.1)
- `@schedule-x/scroll-controller` (^4.9.1, optional/fallback for programmatic grid scrolling)
- `temporal-polyfill` (0.3.2)
- `preact` (^10.19.2) & `@preact/signals` (^2.0.2) (Schedule X peer dependencies)
- `@schedule-x/date-picker` (4.2.0, peer dependency of `@schedule-x/vue`)

**Target Platform**: Mobile web viewport (375px to 430px width)  
**Timezone**: `Asia/Manila`  
**Hour Granularity**: 80px per hour (`gridHeight = 80 * totalHours`)  
**Scope Boundary**: Only files under `frontend/src` (plus `frontend/package.json` for dependencies). Zero edits to backend, docs, or `.agents`.

---

## Constitution & Core Principles Check

- **I. Virtual Study Plan and Tri-State Planning**: Pass. Day view only renders class schedules from courses; does not introduce time-blocking or persist DB study plans.
- **II. Course Anchor and Single Parentage**: Pass. `CourseCard` items remain anchored to `courseId`.
- **VII. Ponytail Minimalism and Native Features**: Pass. Only install required dependencies for Schedule X v4 and its declared peer dependencies (`temporal-polyfill`, `preact`, `@preact/signals`). Reuses existing `CourseCard.vue` and `TimeIndicator.vue` without redundant wrappers.
- **VIII. Evidence-First Verification and Surgical Edits**: Pass. Keep custom grid code clean/isolated during migration; verify with `npm run type-check` and `npm run lint:oxlint`.

---

## Detailed Gap Analysis & Proposed Equivalents

| Existing Behavior / Requirement | Schedule X v4 Constraint | Proposed Solution & Closest Option |
|---|---|---|
| **Pills Layout & Styling** (rounded-2xl, border-[2.5px], color palette, white text, room detail) | Schedule X default events use default Material 3 event cards. | Use custom `#timeGridEvent="{ calendarEvent }"` slot. Inside slot, pass `calendarEvent` to `<CourseCard :event="mappedEvent" />`. Override container styling to remove default padding/shadows so `CourseCard` looks 100% identical. |
| **Grid Range & Boundaries** (8 AM to 5 PM default, extends to whole hours) | Schedule X config accepts `dayBoundaries: { start: '08:00', end: '17:00' }`. Schedule X cannot mutate `dayBoundaries` reactively without re-instantiation. | Recompute `dayBoundaries` and rebuild `calendarApp` (or update calendar instance key) whenever `props.selectedDate` or `props.events` boundaries change. |
| **Grid Height** (80px per hour) | Schedule X does not have `--sx-hour-height`. It supports `weekOptions: { gridHeight: number }`. | Set `gridHeight = (endHour - startHour) * 80` in `weekOptions`. This forces each hour slot to be exactly 80px high. |
| **12-Hour Labels** ("8 AM", "12 PM") | Default Schedule X time axis format is 24h ("08:00"). | Configure `weekOptions: { timeAxisFormatOptions: { hour: 'numeric', hour12: true } }` which produces "8 AM", "12 PM" natively. |
| **Grid Lines & Background** (`#F5F6EE`, `border-sky-100`) | Schedule X uses default theme CSS variables (`--sx-color-background: #ffffff`, `--sx-color-outline-variant`). | Scope CSS overrides on calendar wrapper: `--sx-color-background: #F5F6EE`, `--sx-color-outline-variant: #E0F2FE` (Tailwind `sky-100`), hide weekend shading and borders. |
| **Native Header & View Switcher** | Schedule X renders its own `.sx__calendar-header` and `.sx__time-grid-day-header`. | Hide `.sx__calendar-header` and `.sx__time-grid-day-header` via scoped CSS (`display: none !important`). Keep existing `DayViewHeader.vue` in `DayViewContainer.vue`. |
| **Custom Time Indicator** (Teal line with dot, label "Next: OOP", `useNow()`) | Schedule X has `createCurrentTimePlugin`, but it lacks the pill label ("Next: ...") and exact visual design. | Do NOT use `createCurrentTimePlugin`. Keep `TimeIndicator.vue` positioned with `top: nowTop` inside the time grid column or overlay container synchronized with scroll. |
| **Single Scrolling & Jump Button** | Schedule X encapsulates scrolling inside `.sx__time-grid`. | Keep `.sx__time-grid` as the scrolling container. Attach scroll listener to sync `scrollTop` for `TimeIndicator` and `nowDirection`. Move the "Now" jump button to `left-4 bottom-4` (`z-30`). |
| **Scrollbar styling & Overscroll** | Schedule X default styles might not have thin scrollbar. | Apply `[scrollbar-width:thin]`, `[scrollbar-color:#a8a29e_transparent]`, and `overscroll-contain` to `.sx__time-grid`. |

---

## Phase 0: Research & Dependencies Resolution

See [research.md](./research.md) for detailed package dependency verification and Schedule X v4 API signatures.

### Required Packages:
```bash
npm install @schedule-x/calendar @schedule-x/vue @schedule-x/theme-default temporal-polyfill preact @preact/signals @schedule-x/date-picker
```

---

## Phase 1: Architecture & Interface Design

### Data Mapping Contract
Input `DayEvent`:
```typescript
interface DayEvent {
  id: string
  courseId: number
  title: string
  start: string // "YYYY-MM-DD HH:mm"
  end: string   // "YYYY-MM-DD HH:mm"
  detail?: string
  colorTheme?: 'green' | 'blue' | 'purple' | 'orange'
}
```

Schedule X v4 Event Contract:
```typescript
import { Temporal } from 'temporal-polyfill'

interface ScheduleXEvent {
  id: string
  title: string
  start: Temporal.ZonedDateTime // anchored to Asia/Manila
  end: Temporal.ZonedDateTime   // anchored to Asia/Manila
  // custom properties preserved for slot rendering:
  _rawEvent: DayEvent
}
```

### Component Structure in `ScheduleCalendar.vue`:
```vue
<template>
  <div class="relative flex-1 min-h-0 schedule-calendar-wrapper">
    <!-- Schedule X Calendar Component -->
    <ScheduleXCalendar :calendar-app="calendarApp">
      <!-- Custom Event Slot -->
      <template #timeGridEvent="{ calendarEvent }">
        <CourseCard
          :event="calendarEvent._rawEvent"
          :top="0"
          :height="getEventHeight(calendarEvent)"
          class="!relative !inset-0 !h-full !w-full"
        />
      </template>
    </ScheduleXCalendar>

    <!-- Custom Time Indicator (placed over grid column or synchronized) -->
    <TimeIndicator v-if="nowTop !== null" :top="nowTop" :label="nowLabel" />

    <!-- Now Jump Button (moved to left-4) -->
    <button
      v-if="nowDirection"
      type="button"
      class="absolute bottom-4 left-4 z-30 rounded-full bg-[#0E7490] px-4 py-2 text-sm font-bold text-white shadow-lg active:scale-95 transition-transform"
      @click="scrollToNow()"
    >
      {{ nowDirection === 'up' ? '↑' : '↓' }} Now
    </button>
  </div>
</template>
```

---

## Phase 2: Implementation Sequence

1. **Install Dependencies**:
   - Run `npm install` for `@schedule-x/calendar`, `@schedule-x/vue`, `@schedule-x/theme-default`, `temporal-polyfill`, `preact`, `@preact/signals`, `@schedule-x/date-picker`.
   - Verify `package.json` and clean lockfile state.

2. **Temporal & Schedule X Event Adapter**:
   - Create helper or converter in `scheduleExpander.ts` to convert `DayEvent` to Schedule X event with `Temporal.ZonedDateTime.from(...)` in `Asia/Manila`.

3. **Refactor `ScheduleCalendar.vue`**:
   - Initialize Schedule X v4 using `createCalendar` with `createViewDay()`.
   - Set `timezone: 'Asia/Manila'`.
   - Set `dayBoundaries: { start: 'HH:00', end: 'HH:00' }` based on `calculateGridBoundaries`.
   - Set `weekOptions: { gridHeight: 80 * hours, timeAxisFormatOptions: { hour: 'numeric', hour12: true } }`.
   - Render `#timeGridEvent` slot using `CourseCard.vue`.
   - Position `TimeIndicator.vue` over the grid column and keep it synchronized with the scroll container.
   - Position the jump button at `left-4 bottom-4`.
   - Add scoped CSS rules to hide `.sx__calendar-header` and `.sx__time-grid-day-header`, set `--sx-color-background: #F5F6EE`, and style grid lines to match `border-sky-100`.

4. **Preserve Legacy Code**:
   - Keep the previous manual grid implementation intact as a fallback reference until the Schedule X rendering is visually verified.

5. **Verification**:
   - Run `npm run type-check`.
   - Run `npm run lint:oxlint`.
   - Inspect mobile viewport responsiveness (375px - 430px) and scroll behavior.
