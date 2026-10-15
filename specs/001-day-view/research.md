# Research: Schedule X v4 Migration for Day View

## 1. Package Dependencies & Compatibility

### Context
Schedule X v4 relies on the standard ECMAScript Temporal API and Preact signals. Browsers currently lack universal native Temporal support, so `temporal-polyfill` is required.

### Decisions & Peer Dependencies
1. **`temporal-polyfill`**:
   - Schedule X packages specify `temporal-polyfill@0.3.2`.
   - Global import: `import 'temporal-polyfill/global'` or modular import `import { Temporal } from 'temporal-polyfill'`.
2. **Preact**:
   - Schedule X core uses Preact under the hood: `preact@^10.19.2` and `@preact/signals@^2.0.2`.
   - Must be installed in `dependencies` so `@schedule-x/calendar` resolves without peer dependency errors in Vite.
3. **`@schedule-x/vue`**:
   - Requires `@schedule-x/date-picker@4.2.0` and `@schedule-x/calendar`.
4. **Timezone**:
   - `Asia/Manila` specified via `timezone: 'Asia/Manila'`.
   - Events mapped to `Temporal.ZonedDateTime` format: e.g. `2026-10-08T08:30:00+08:00[Asia/Manila]`.

---

## 2. Schedule X v4 Day View API & Configuration

### View Initialization
```typescript
import { createCalendar, createViewDay } from '@schedule-x/calendar'
import '@schedule-x/theme-default/dist/index.css'
import 'temporal-polyfill/global'

const calendarApp = createCalendar({
  views: [createViewDay()],
  defaultView: 'day',
  timezone: 'Asia/Manila',
  selectedDate: Temporal.PlainDate.from(dateString), // YYYY-MM-DD
  dayBoundaries: {
    start: `${String(boundaries.startHour).padStart(2, '0')}:00`,
    end: `${String(boundaries.endHour).padStart(2, '0')}:00`,
  },
  weekOptions: {
    gridHeight: (boundaries.endHour - boundaries.startHour) * 80,
    timeAxisFormatOptions: {
      hour: 'numeric',
      hour12: true,
    },
    gridStep: 60,
  },
  events: scheduleXEvents,
})
```

---

## 3. Styling & Custom Overrides

### Hiding Native Headers
Schedule X renders native toolbar and day headers that conflict with Nyare's mobile layout (`DayViewHeader.vue`):
```css
/* Hide default calendar header & day header */
.schedule-calendar-wrapper .sx__calendar-header,
.schedule-calendar-wrapper .sx__time-grid-day-header {
  display: none !important;
}
```

### Color Variables Override
Match existing Nyare palette:
```css
.schedule-calendar-wrapper {
  --sx-color-background: #F5F6EE;
  --sx-color-surface: #F5F6EE;
  --sx-color-outline-variant: #E0F2FE; /* sky-100 */
}
```

### Event Slot Rendering
Schedule X wraps the event inside its internal positioning container.
In the `#timeGridEvent="{ calendarEvent }"` slot, we render `<CourseCard :event="calendarEvent._rawEvent" />` styled with `class="!relative !inset-0 !h-full !w-full"`.

---

## 4. Current Time Indicator & Scroll Synchronization

### Strategy:
1. Do not use `createCurrentTimePlugin` because it cannot render the dynamic text chip ("OOP" / "Next: OOP" / "No class") or match the exact teal indicator design.
2. The scroll container rendered by Schedule X is `.sx__time-grid`.
3. An absolute overlay container inside or matching `.sx__time-grid` will render `<TimeIndicator :top="nowTop" :label="nowLabel" />`.
4. A scroll listener on `.sx__time-grid` updates `scrollTop` so the "Now" jump button and indicator position remain accurate.
5. The "Now" jump button is rendered at `bottom-4 left-4 z-30`.
