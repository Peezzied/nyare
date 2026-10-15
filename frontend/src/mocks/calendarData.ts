import type {
  AcademicEventResponse,
  CourseResponse,
  ScheduleResponse,
  TaskResponse,
} from '../types/api'

export const mockCourses: CourseResponse[] = [
  { id: 1, name: 'OOP', description: 'Lab 204', userId: 1 },
  { id: 2, name: 'CALC 2', description: 'Room 301', userId: 1 },
  { id: 3, name: 'COA', description: 'Room 205', userId: 1 },
  { id: 4, name: 'RPH', description: 'Room 110', userId: 1 },
]

export const mockSchedules: ScheduleResponse[] = [
  // Monday
  { id: 101, courseId: 4, day: 'MONDAY', startTime: '09:00:00', endTime: '11:00:00' },
  { id: 102, courseId: 2, day: 'MONDAY', startTime: '13:00:00', endTime: '15:00:00' },

  // Tuesday
  { id: 103, courseId: 1, day: 'TUESDAY', startTime: '08:30:00', endTime: '10:30:00' },
  { id: 104, courseId: 3, day: 'TUESDAY', startTime: '14:00:00', endTime: '16:00:00' },

  // Wednesday
  { id: 105, courseId: 3, day: 'WEDNESDAY', startTime: '09:00:00', endTime: '11:00:00' },
  { id: 106, courseId: 2, day: 'WEDNESDAY', startTime: '13:00:00', endTime: '15:00:00' },
  { id: 107, courseId: 4, day: 'WEDNESDAY', startTime: '15:30:00', endTime: '17:30:00' },
    { id: 112, courseId: 4, day: 'WEDNESDAY', startTime: '07:00:00', endTime: '08:30:00' },
  { id: 113, courseId: 1, day: 'WEDNESDAY', startTime: '18:30:00', endTime: '20:00:00' },

  // Thursday (matches the design screenshot)
  { id: 108, courseId: 1, day: 'THURSDAY', startTime: '08:30:00', endTime: '10:30:00' },
  { id: 109, courseId: 2, day: 'THURSDAY', startTime: '11:30:00', endTime: '13:30:00' },

  // Friday
  { id: 110, courseId: 3, day: 'FRIDAY', startTime: '08:00:00', endTime: '10:00:00' },
  { id: 111, courseId: 1, day: 'FRIDAY', startTime: '13:00:00', endTime: '15:00:00' },
]

// Untimed fixtures: date-only tasks + deadline-date events (no time-of-day).
// 2026-10-14 is a Wednesday; 2026-10-15 is a Thursday.
export const mockTasks: TaskResponse[] = [
  {
    id: 't-1',
    courseId: 1,
    title: 'Review OOP lab notes',
    scheduledDate: '2026-10-14',
    status: 'TODO',
    createdAt: '2026-10-13T08:00:00',
    updatedAt: '2026-10-13T08:00:00',
  },
  {
    id: 't-2',
    courseId: 2,
    title: 'Very long calculus problem set title that exceeds the compact pill bounds',
    scheduledDate: '2026-10-14',
    status: 'TODO',
    createdAt: '2026-10-13T08:00:00',
    updatedAt: '2026-10-13T08:00:00',
  },
  {
    id: 't-3',
    courseId: 3,
    title: 'Read COA chapter 4',
    scheduledDate: '2026-10-15',
    status: 'IN_PROGRESS',
    createdAt: '2026-10-13T08:00:00',
    updatedAt: '2026-10-13T08:00:00',
  },
]

export const mockEvents: AcademicEventResponse[] = [
  {
    id: 'e-1',
    courseId: 4,
    title: 'RPH paper deadline',
    deadline: '2026-10-14',
    createdAt: '2026-10-13T08:00:00',
  },
  {
    id: 'e-2',
    courseId: 2,
    title: 'CALC quiz',
    deadline: '2026-10-14',
    createdAt: '2026-10-13T08:00:00',
  },
]