# Data Model: Headless Flow Harness & Composable Entities

**Feature**: `005-headless-flow-harness`
**Date**: 2026-10-18

This document defines the reactive data contracts and state shapes exposed by the composable layer to ensure presentation views are completely "plug and play".

## 1. Composable State Models

### 1.1 `useTasks`
```ts
export interface UseTasks {
  tasks: Ref<TaskResponse[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  
  // Actions
  loadTasks: (params?: TaskListParams, force?: boolean) => Promise<void>
  createTask: (request: TaskRequest) => Promise<TaskResponse>
  updateTask: (id: string, request: TaskRequest) => Promise<TaskResponse>
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<TaskResponse>
  deleteTask: (id: string) => Promise<void>
  refetchForCourses: (courseIds: number[]) => Promise<void>
  resetTasks: () => void
}
```

### 1.2 `useAcademicEvents`
```ts
export interface UseAcademicEvents {
  events: Ref<AcademicEventResponse[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  
  // Actions
  loadEvents: (params?: AcademicEventListParams, force?: boolean) => Promise<void>
  createEvent: (request: AcademicEventRequest) => Promise<AcademicEventResponse>
  updateEvent: (id: string, request: AcademicEventRequest) => Promise<AcademicEventResponse>
  deleteEvent: (id: string) => Promise<void>
  refetchForCourses: (courseIds: number[]) => Promise<void>
  resetEvents: () => void
}
```

### 1.3 `usePlannerStatus`
```ts
export interface UsePlannerStatus {
  status: Ref<PlannerStatusResponse | null>
  pendingCount: ComputedRef<number>
  canProcess: ComputedRef<boolean>
  loading: Ref<boolean>
  error: Ref<string | null>
  
  // Actions
  refresh: () => Promise<void>
  reset: () => void
}
```

### 1.4 `useStudyPlan` (Virtual Presentation Derivation)
```ts
export interface VirtualStudyPlan {
  // Day-level bucket of scheduled tasks
  scheduledByDate: ComputedRef<Map<string, TaskResponse[]>>
  // Unscheduled tasks with duration
  laterTasks: ComputedRef<TaskResponse[]>
  // Unscheduled tasks without duration
  backlogTasks: ComputedRef<TaskResponse[]>
  
  // Summary counts
  scheduledCount: ComputedRef<number>
  laterCount: ComputedRef<number>
  backlogCount: ComputedRef<number>
}
```

---

## 2. Fixture Data Schema (`plannerScenario.ts`)

```ts
export interface ScenarioFixtureData {
  user: { username: string }
  courses: Array<{ name: string; description: string }>
  schedules: Array<{
    courseIndex: number
    dayOfWeek: DayOfWeek
    startTime: string // "HH:mm"
    endTime: string // "HH:mm"
  }>
  existingTask: {
    courseIndex: number
    title: string
    dayOffset: number // e.g. +1
    status: TaskStatus
  }
  existingEvent: {
    courseIndex: number
    title: string
    description: string
    dayOffset: number // e.g. +3
  }
  notes: Array<{
    courseIndex: number
    textTemplate: string // Contains placeholder for uploaded image markdown
    imageText: string
    imageFileName: string
  }>
}
```
