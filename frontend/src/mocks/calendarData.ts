import type {
  AcademicEventResponse,
  CourseResponse,
  ScheduleResponse,
  TaskResponse,
} from '../types/api'

export const mockCourses: CourseResponse[] = [
  {
    id: 1,
    name: 'Computer Architecture and Organization',
    description: 'CS Core Course',
    userId: 1,
  },
  { id: 2, name: 'Principles of Programming Languages', description: 'CS Core Course', userId: 1 },
  {
    id: 3,
    name: 'GE Elective 1 - Living in the IT Era',
    description: 'General Education Elective',
    userId: 1,
  },
  { id: 4, name: 'Calculus 2', description: 'Mathematics Course', userId: 1 },
  {
    id: 5,
    name: 'Readings in Philippine History',
    description: 'General Education Course',
    userId: 1,
  },
  { id: 6, name: 'Mobile Computing', description: 'CS Elective Course', userId: 1 },
  { id: 7, name: 'Object-Oriented Programming', description: 'CS Core Course', userId: 1 },
  {
    id: 8,
    name: 'Physical Activities Toward Health & Fitness 3 (PATHFit 3)',
    description: 'Physical Education',
    userId: 1,
  },
]

export const mockSchedules: ScheduleResponse[] = [
  // Monday
  { id: 101, courseId: 1, day: 'MONDAY', startTime: '07:30:00', endTime: '08:30:00' },
  { id: 102, courseId: 2, day: 'MONDAY', startTime: '09:00:00', endTime: '10:30:00' },
  { id: 103, courseId: 3, day: 'MONDAY', startTime: '10:30:00', endTime: '12:00:00' },
  { id: 104, courseId: 4, day: 'MONDAY', startTime: '13:30:00', endTime: '15:30:00' },
  { id: 105, courseId: 5, day: 'MONDAY', startTime: '15:30:00', endTime: '16:30:00' },

  // Tuesday
  { id: 106, courseId: 6, day: 'TUESDAY', startTime: '10:30:00', endTime: '13:30:00' },
  { id: 107, courseId: 7, day: 'TUESDAY', startTime: '13:30:00', endTime: '16:30:00' },

  // Wednesday
  { id: 108, courseId: 1, day: 'WEDNESDAY', startTime: '07:30:00', endTime: '10:30:00' },
  { id: 109, courseId: 1, day: 'WEDNESDAY', startTime: '11:30:00', endTime: '12:30:00' },
  { id: 110, courseId: 4, day: 'WEDNESDAY', startTime: '13:30:00', endTime: '15:30:00' },
  { id: 111, courseId: 5, day: 'WEDNESDAY', startTime: '15:30:00', endTime: '16:30:00' },

  // Thursday
  { id: 112, courseId: 6, day: 'THURSDAY', startTime: '10:30:00', endTime: '12:30:00' },
  { id: 113, courseId: 7, day: 'THURSDAY', startTime: '13:30:00', endTime: '15:30:00' },

  // Friday
  { id: 114, courseId: 2, day: 'FRIDAY', startTime: '09:00:00', endTime: '10:30:00' },
  { id: 115, courseId: 3, day: 'FRIDAY', startTime: '10:30:00', endTime: '12:00:00' },
  { id: 116, courseId: 8, day: 'FRIDAY', startTime: '13:30:00', endTime: '15:30:00' },
  { id: 117, courseId: 5, day: 'FRIDAY', startTime: '15:30:00', endTime: '16:30:00' },
]

// Untimed fixtures: date-only tasks + deadline-date events (no time-of-day).
// 2026-10-14 is a Wednesday; 2026-10-15 is a Thursday.
export const mockTasks: TaskResponse[] = [
  {
    id: 't-1',
    courseId: 7,
    title: 'Review OOP lab notes',
    scheduledDate: '2026-10-14',
    status: 'TODO',
    createdAt: '2026-10-13T08:00:00',
    updatedAt: '2026-10-13T08:00:00',
  },
  {
    id: 't-2',
    courseId: 4,
    title: 'Very long calculus problem set title that exceeds the compact pill bounds',
    scheduledDate: '2026-10-14',
    status: 'TODO',
    createdAt: '2026-10-13T08:00:00',
    updatedAt: '2026-10-13T08:00:00',
  },
  {
    id: 't-3',
    courseId: 1,
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
    courseId: 5,
    title: 'RPH paper deadline',
    deadline: '2026-10-14',
    createdAt: '2026-10-13T08:00:00',
  },
  {
    id: 'e-2',
    courseId: 4,
    title: 'CALC quiz',
    deadline: '2026-10-14',
    createdAt: '2026-10-13T08:00:00',
  },
]
