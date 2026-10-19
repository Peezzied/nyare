import type { DayOfWeek, TaskStatus } from '@/types/api'

export interface ScenarioFixtureData {
  user: { username: string }
  courses: Array<{ name: string; description: string }>
  schedules: Array<{
    courseIndex: number
    dayOfWeek: DayOfWeek
    startTime: string
    endTime: string
  }>
  existingTask: {
    courseIndex: number
    title: string
    dayOffset: number
    status: TaskStatus
  }
  existingEvent: {
    courseIndex: number
    title: string
    description: string
    dayOffset: number
  }
  notes: Array<{
    courseIndex: number
    textTemplate: string
    imageText: string
    imageFileName: string
  }>
}

export const plannerScenario: ScenarioFixtureData = {
  user: { username: 'demo_user' },
  courses: [
    { name: 'Computer Architecture and Organization', description: 'CS Core Course' },
    { name: 'Principles of Programming Languages', description: 'CS Core Course' },
    { name: 'GE Elective 1 - Living in the IT Era', description: 'General Education Elective' },
    { name: 'Calculus 2', description: 'Mathematics Course' },
    { name: 'Readings in Philippine History', description: 'General Education Course' },
    { name: 'Mobile Computing', description: 'CS Elective Course' },
    { name: 'Object-Oriented Programming', description: 'CS Core Course' },
    {
      name: 'Physical Activities Toward Health & Fitness 3 (PATHFit 3)',
      description: 'Physical Education',
    },
  ],
  schedules: [
    { courseIndex: 0, dayOfWeek: 'MONDAY', startTime: '07:30', endTime: '08:30' },
    { courseIndex: 1, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:30' },
    { courseIndex: 2, dayOfWeek: 'MONDAY', startTime: '10:30', endTime: '12:00' },
    { courseIndex: 3, dayOfWeek: 'MONDAY', startTime: '13:30', endTime: '15:30' },
    { courseIndex: 4, dayOfWeek: 'MONDAY', startTime: '15:30', endTime: '16:30' },
    { courseIndex: 5, dayOfWeek: 'TUESDAY', startTime: '10:30', endTime: '13:30' },
    { courseIndex: 6, dayOfWeek: 'TUESDAY', startTime: '13:30', endTime: '16:30' },
    { courseIndex: 0, dayOfWeek: 'WEDNESDAY', startTime: '07:30', endTime: '10:30' },
    { courseIndex: 0, dayOfWeek: 'WEDNESDAY', startTime: '11:30', endTime: '12:30' },
    { courseIndex: 3, dayOfWeek: 'WEDNESDAY', startTime: '13:30', endTime: '15:30' },
    { courseIndex: 4, dayOfWeek: 'WEDNESDAY', startTime: '15:30', endTime: '16:30' },
    { courseIndex: 5, dayOfWeek: 'THURSDAY', startTime: '10:30', endTime: '12:30' },
    { courseIndex: 6, dayOfWeek: 'THURSDAY', startTime: '13:30', endTime: '15:30' },
    { courseIndex: 1, dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '10:30' },
    { courseIndex: 2, dayOfWeek: 'FRIDAY', startTime: '10:30', endTime: '12:00' },
    { courseIndex: 7, dayOfWeek: 'FRIDAY', startTime: '13:30', endTime: '15:30' },
    { courseIndex: 4, dayOfWeek: 'FRIDAY', startTime: '15:30', endTime: '16:30' },
  ],
  existingTask: {
    courseIndex: 0,
    title: 'Review MIPS instruction encoding',
    dayOffset: 1,
    status: 'TODO',
  },
  existingEvent: {
    courseIndex: 5,
    title: 'Mobile Computing Quiz',
    description: 'Activity lifecycle callbacks',
    dayOffset: 3,
  },
  notes: [
    {
      courseIndex: 6,
      textTemplate:
        'grabe sabaw ako sa lab 3 kanina puro inheritance at polymorphism... may pa-lab report si sir due next tue ng 1:30pm bago mag-start lab. kailangan ko tapusin yung uml class diagram asap.\n\n![Lab Notice]({{noticeUrl}})',
      imageText: 'Important: Submit Lab Report 3 before Friday midnight.',
      imageFileName: 'notice.png',
    },
    {
      courseIndex: 5,
      textTemplate:
        'intro pa lang sa android studio setup and activity lifecycle pero shookt kami biglang announced quiz sa thursday 10:30am coverage yung lifecycle callbacks. need ko mag-install ng android studio tsaka sdk sa laptop bago mag-next lab session.',
      imageText: '',
      imageFileName: '',
    },
    {
      courseIndex: 3,
      textTemplate:
        'calculus discussion abt inverse trigo functions. kasama raw yata sa midterm exam which will prolly be on oct 7.\n\n![Lecture Slide]({{slideUrl}})',
      imageText: 'CS201 Algorithm: Binary Tree Traversal. Time Complexity: O(n).',
      imageFileName: 'slide.png',
    },
  ],
}
