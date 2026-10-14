import type { CourseResponse, ScheduleResponse } from '../types/api'

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