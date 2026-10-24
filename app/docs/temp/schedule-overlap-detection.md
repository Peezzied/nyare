# Schedule Overlap Detection — Deferred Note

> **Status**: Deferred — not in scope for MVP  
> **Relates to**: `ScheduleService`, `ScheduleRepository`

## Context

When a student adds a recurring class slot (`POST /api/schedules`), the service could optionally detect if the same course already has a schedule entry on the same `day` with an overlapping time range — e.g., blocking `MWF 09:00–10:00` if `MWF 08:30–09:30` already exists for that course.

## Why Deferred

- MVP time integrity only requires `startTime < endTime` (already in scope).
- Overlap detection adds a range-query JPQL predicate with `OR`-based time intersection logic (`a.startTime < b.endTime AND a.endTime > b.startTime`) that increases repository complexity.
- Students entering their own schedule are unlikely to enter overlapping times accidentally.
- The calendar UI will visually surface overlaps, making a hard server-side block lower priority.

## If Implemented Later

**Repository query** — find existing slots on the same course + day that overlap with the requested time range:

```jpql
SELECT s FROM Schedule s
WHERE s.course.id = :courseId
  AND s.day = :day
  AND s.startTime < :endTime
  AND s.endTime > :startTime
  AND (:excludeId IS NULL OR s.id <> :excludeId)
```

**Service guard** (on create and update):
```java
if (!scheduleRepository.findOverlapping(courseId, day, startTime, endTime, null).isEmpty()) {
    throw new BadRequestException("Schedule overlaps with an existing class slot for this course.");
}
```

**On update**, pass the current `scheduleId` as `excludeId` to avoid self-conflict.
