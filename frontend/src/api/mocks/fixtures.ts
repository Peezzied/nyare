import type {
  UserResponse,
  CourseResponse,
  ScheduleResponse,
  NoteResponse,
  TaskResponse,
  AcademicEventResponse,
  ProcessSummaryResponse,
} from '@/types/api'

/** Full in-memory data set of the mock backend. */
export interface FixtureState {
  users: UserResponse[]
  /** Session user. `null` means logged out. */
  currentUser: UserResponse | null
  courses: CourseResponse[]
  schedules: ScheduleResponse[]
  notes: NoteResponse[]
  tasks: TaskResponse[]
  academicEvents: AcademicEventResponse[]
  /** Fixed summary that every mock Process run returns. */
  processSummary: ProcessSummaryResponse
}

// The tasks cover each tri-state category (SCHEDULED, LATER, BACKLOG) and each task status.
const INITIAL_FIXTURES: FixtureState = {
  users: [
    {
      id: 1,
      username: 'karol',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 2,
      username: 'elena_r',
      createdAt: '2026-09-14T09:30:00Z',
      updatedAt: '2026-09-14T09:30:00Z',
    },
    {
      id: 3,
      username: 'marcus.chen',
      createdAt: '2026-10-02T14:15:00Z',
      updatedAt: '2026-10-02T14:15:00Z',
    },
    {
      id: 4,
      username: 'samira_k',
      createdAt: '2026-10-11T16:45:00Z',
      updatedAt: '2026-10-11T16:45:00Z',
    },
  ],
  currentUser: {
    id: 1,
    username: 'karol',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
  },
  courses: [
    {
      id: 1,
      name: 'CS 201 - Data Structures & Algorithms',
      description:
        'Fundamental data structures, algorithmic complexity, trees, graphs, and search algorithms.',
      userId: 1,
    },
    {
      id: 2,
      name: 'MATH 204 - Linear Algebra',
      description: 'Vector spaces, matrix decomposition, eigenvalues, and linear transformations.',
      userId: 1,
    },
    {
      id: 3,
      name: 'PHYS 102 - General Physics II',
      description: 'Electromagnetism, circuit analysis, wave optics, and thermal physics.',
      userId: 1,
    },
  ],
  schedules: [
    {
      id: 1,
      courseId: 1,
      day: 'MONDAY',
      startTime: '09:00:00',
      endTime: '10:30:00',
    },
    {
      id: 2,
      courseId: 1,
      day: 'WEDNESDAY',
      startTime: '09:00:00',
      endTime: '10:30:00',
    },
    {
      id: 3,
      courseId: 2,
      day: 'TUESDAY',
      startTime: '10:30:00',
      endTime: '12:00:00',
    },
    {
      id: 4,
      courseId: 2,
      day: 'THURSDAY',
      startTime: '10:30:00',
      endTime: '12:00:00',
    },
    {
      id: 5,
      courseId: 3,
      day: 'FRIDAY',
      startTime: '13:00:00',
      endTime: '15:00:00',
    },
  ],
  notes: [
    {
      id: 'note-cs201-avl',
      courseId: 1,
      title: 'Lecture 7: Self-Balancing Trees',
      content:
        '# Lecture 7: Self-Balancing Trees (AVL Trees)\n\n## Binary Search Tree Invariant\nFor every node $X$:\n- Keys in left subtree are smaller than $X.key$\n- Keys in right subtree are greater than $X.key$\n\n## AVL Balance Factor\nBalance factor is defined as `height(left) - height(right)`.\n- Allowed balance factors: -1, 0, +1.\n- When balance factor becomes +/-2, perform rotations.\n\n### Rotations\n- Single Left Rotation (Right-Right heavy)\n- Single Right Rotation (Left-Left heavy)\n- Left-Right Double Rotation\n- Right-Left Double Rotation\n\n## Action Items\n- Complete problem set 3 rotation implementations.\n- Prepare for midterm examination review session.',
      entryDate: '2026-10-05',
      createdAt: '2026-10-05T09:30:00Z',
      updatedAt: '2026-10-05T11:00:00Z',
      lastProcessedAt: '2026-10-05T11:30:00Z',
    },
    {
      id: 'note-math204-eigen',
      courseId: 2,
      title: 'Lecture 12: Eigenvalues and Diagonalization',
      content:
        '# Lecture 12: Eigenvalues and Diagonalization\n\n## Characteristic Equation\nLet $A$ be an $n \\times n$ matrix.\n- Solve characteristic polynomial $\\det(A - \\lambda I) = 0$.\n- Find roots $\\lambda_1, \\lambda_2, \\dots, \\lambda_k$.\n\n## Eigenspaces\nFor each eigenvalue $\\lambda$:\n- Solve $(A - \\lambda I)v = 0$ for non-trivial eigenvector $v$.\n- Dimension of eigenspace is geometric multiplicity.\n\n## Diagonalization Conditions\n- $A$ is diagonalizable if and only if geometric multiplicity equals algebraic multiplicity for each eigenvalue.\n\n## Weekly Goals\n- Practice finding eigenvectors for 3x3 symmetric matrices.\n- Verify homework solutions with peers.',
      entryDate: '2026-10-06',
      createdAt: '2026-10-06T14:15:00Z',
      updatedAt: '2026-10-06T15:45:00Z',
      lastProcessedAt: null,
    },
  ],
  tasks: [
    {
      id: 'task-cs201-avl-impl',
      courseId: 1,
      noteId: 'note-cs201-avl',
      title: 'Implement AVL Tree Rotations',
      description:
        'Write unit tests and code for left and right rotations in the self-balancing binary search tree repository.',
      scheduledDate: '2026-10-10',
      duration: 'PT1H30M',
      status: 'IN_PROGRESS',
      planCategory: 'SCHEDULED',
      createdAt: '2026-10-05T12:00:00Z',
      updatedAt: '2026-10-08T09:00:00Z',
    },
    {
      id: 'task-math204-pset4',
      courseId: 2,
      noteId: 'note-math204-eigen',
      title: 'Complete Linear Algebra Problem Set 4',
      description:
        'Solve textbook exercises 5.1 through 5.4 focusing on computing characteristic polynomials, verifying algebraic versus geometric multiplicity of eigenvalues, constructing transformation matrices P, and demonstrating diagonalizability across various symmetric matrices.',
      scheduledDate: '2026-10-12',
      duration: 'PT2H',
      status: 'TODO',
      planCategory: 'SCHEDULED',
      createdAt: '2026-10-06T16:00:00Z',
      updatedAt: '2026-10-06T16:00:00Z',
    },
    {
      id: 'task-phys102-lab-report',
      courseId: 3,
      noteId: null,
      title: 'Draft Physics Lab 3 Report on Gauss Law',
      description:
        'Synthesize experimental electric field measurements and calculate flux through cylindrical Gaussian surfaces.',
      scheduledDate: null,
      duration: 'PT1H',
      status: 'TODO',
      planCategory: 'LATER',
      createdAt: '2026-10-07T08:00:00Z',
      updatedAt: '2026-10-07T08:00:00Z',
    },
    {
      id: 'task-cs201-graph-preview',
      courseId: 1,
      noteId: null,
      title: 'Preview Graph Traversal Algorithms',
      description: 'Read textbook section 8.2 on breadth-first search and depth-first search.',
      scheduledDate: null,
      duration: null,
      status: 'TODO',
      planCategory: 'BACKLOG',
      createdAt: '2026-10-07T10:00:00Z',
      updatedAt: '2026-10-07T10:00:00Z',
    },
    {
      id: 'task-cs201-hw1',
      courseId: 1,
      noteId: null,
      title: 'Submit CS 201 Homework 1',
      description: 'Asymptotic notation proofs and recurrence relations via Master theorem.',
      scheduledDate: '2026-10-04',
      duration: 'PT45M',
      status: 'COMPLETED',
      planCategory: 'SCHEDULED',
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-04T16:00:00Z',
    },
    // Over-limit day (FR-024): three untimed items on one day, so the week
    // header shows two chips and a "+1" marker.
    {
      id: 'task-cs201-heap-impl',
      courseId: 1,
      noteId: 'note-cs201-avl',
      title: 'Implement Binary Heap Operations',
      description: 'Add sift-up and sift-down to the priority queue exercise.',
      scheduledDate: '2026-10-21',
      duration: 'PT1H',
      status: 'TODO',
      planCategory: 'SCHEDULED',
      createdAt: '2026-10-08T09:00:00Z',
      updatedAt: '2026-10-08T09:00:00Z',
    },
    {
      id: 'task-math204-pset5',
      courseId: 2,
      noteId: 'note-math204-eigen',
      title: 'Complete Linear Algebra Problem Set 5',
      description: 'Practise orthogonal diagonalization of symmetric matrices.',
      scheduledDate: '2026-10-21',
      duration: 'PT1H15M',
      status: 'TODO',
      planCategory: 'SCHEDULED',
      createdAt: '2026-10-08T10:00:00Z',
      updatedAt: '2026-10-08T10:00:00Z',
    },
    {
      id: 'task-phys102-lab-prep',
      courseId: 3,
      noteId: null,
      title: 'Prepare Physics Lab 4 Equipment List',
      description: 'Confirm apparatus for the magnetic field experiment.',
      scheduledDate: '2026-10-21',
      duration: null,
      status: 'TODO',
      planCategory: 'SCHEDULED',
      createdAt: '2026-10-08T11:00:00Z',
      updatedAt: '2026-10-08T11:00:00Z',
    },
  ],
  academicEvents: [
    {
      id: 'event-cs201-midterm',
      courseId: 1,
      noteId: 'note-cs201-avl',
      title: 'CS 201 Midterm Examination',
      description:
        'In-person closed-book exam on asymptotic analysis, stacks, queues, trees, and hash tables.',
      deadline: '2026-10-22T09:00:00',
      createdAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 'event-math204-quiz2',
      courseId: 2,
      noteId: 'note-math204-eigen',
      title: 'MATH 204 Quiz 2 on Eigenvalues',
      description: 'In-class assessment on computing characteristic polynomials and eigenvectors.',
      deadline: '2026-10-16T11:00:00',
      createdAt: '2026-10-02T09:00:00Z',
    },
    {
      id: 'event-phys102-exam1',
      courseId: 3,
      noteId: null,
      title: 'PHYS 102 First Midterm Exam',
      description: 'Exam covering Coulomb law, electric fields, Gauss law, and electric potential.',
      deadline: '2026-10-28T13:30:00',
      createdAt: '2026-10-03T10:00:00Z',
    },
  ],
  processSummary: {
    tasksCreated: 2,
    eventsCreated: 1,
    contextsCreated: 1,
    affectedCourseIds: [2],
  },
}

export const TODO_FIXTURE_COURSES: CourseResponse[] = [
  { id: 4, name: 'Object-Oriented Programming', description: null, userId: 1 },
  { id: 5, name: 'Computer Architecture and Organization', description: null, userId: 1 },
  { id: 6, name: 'Reading in Philippine History', description: null, userId: 1 },
  { id: 7, name: 'Calculus 2', description: null, userId: 1 },
]

export const TODO_FIXTURE_TASKS: TaskResponse[] = [
  {
    id: 'task-oop-midterm',
    courseId: 4,
    noteId: null,
    title: 'Midterm Long Quiz',
    description: 'Covers encapsulation, polymorphism, inheritance, and interface abstraction.',
    scheduledDate: '2026-10-08',
    duration: 'PT2H',
    status: 'TODO',
    planCategory: 'SCHEDULED',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'task-cao-lab-exp',
    courseId: 5,
    noteId: null,
    title: 'Laboratory Experiment',
    description: 'Implement ALU arithmetic micro-operations and verify control unit logic.',
    scheduledDate: '2026-10-10',
    duration: 'PT3H',
    status: 'TODO',
    planCategory: 'SCHEDULED',
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'task-rph-guide-q',
    courseId: 6,
    noteId: null,
    title: 'Guide Questions',
    description: 'Primary source analysis on the Proclamation of Independence.',
    scheduledDate: '2026-10-10',
    duration: 'PT1H',
    status: 'TODO',
    planCategory: 'SCHEDULED',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'task-oop-proj-prop',
    courseId: 4,
    noteId: null,
    title: 'Final Project Proposal',
    description: 'Draft software architecture proposal and design patterns document.',
    scheduledDate: '2026-10-23',
    duration: 'PT2H',
    status: 'TODO',
    planCategory: 'SCHEDULED',
    createdAt: '2026-10-02T11:00:00Z',
    updatedAt: '2026-10-02T11:00:00Z',
  },
  {
    id: 'task-calc2-finals-quiz',
    courseId: 7,
    noteId: null,
    title: 'Finals Quiz',
    description: 'Integration by parts, trigonometric substitution, and partial fraction decomposition.',
    scheduledDate: '2026-10-28',
    duration: 'PT1H30M',
    status: 'TODO',
    planCategory: 'SCHEDULED',
    createdAt: '2026-10-02T12:00:00Z',
    updatedAt: '2026-10-02T12:00:00Z',
  },
]

export const TASK_DISPLAY_TIMES: Record<string, string> = {
  'task-oop-midterm': '3:00 PM',
  'task-cao-lab-exp': '11:59 PM',
  'task-rph-guide-q': '5:30 PM',
  'task-oop-proj-prop': '7:30 AM',
  'task-calc2-finals-quiz': '1:00 PM',
  'task-cs201-hw1': '2:00 PM',
  'task-cs201-avl-impl': '10:00 AM',
  'task-math204-pset4': '4:00 PM',
  'task-phys102-lab-report': '11:59 PM',
  'task-cs201-graph-preview': '8:00 AM',
}

/** Due-date map for urgency calculation in the redesigned task list.
 *  Values are yyyy-MM-dd strings relative to 2026-10-15 (spec FR-024). */
function offsetDate(days: number): string {
  const d = new Date('2026-10-15T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const TASK_DUE_DATES: Record<string, string> = {
  'task-oop-midterm': offsetDate(0),
  'task-cao-lab-exp': offsetDate(1),
  'task-rph-guide-q': offsetDate(2),
  'task-oop-proj-prop': offsetDate(3),
  'task-calc2-finals-quiz': offsetDate(5),
  'task-cs201-avl-impl': offsetDate(15),
  'task-math204-pset4': offsetDate(40),
}

/** Extended dummy tasks covering SCHEDULED, LATER, and BACKLOG categories. */
export const TODO_FIXTURE_TASKS_V2: TaskResponse[] = [
  ...TODO_FIXTURE_TASKS,
  // LATER tasks (duration, no scheduledDate)
  {
    id: 'task-phys102-lab-later',
    courseId: 3,
    noteId: null,
    title: 'Draft Physics Lab 3 Report',
    description: 'Synthesize Gauss Law experiment data.',
    scheduledDate: null,
    duration: 'PT30M',
    status: 'TODO',
    planCategory: 'LATER',
    createdAt: '2026-10-07T08:00:00Z',
    updatedAt: '2026-10-07T08:00:00Z',
  },
  {
    id: 'task-math204-review',
    courseId: 2,
    noteId: null,
    title: 'Review Eigenvalue Decomposition',
    description: 'Re-read textbook chapter 5.',
    scheduledDate: null,
    duration: 'PT1H',
    status: 'TODO',
    planCategory: 'LATER',
    createdAt: '2026-10-08T08:00:00Z',
    updatedAt: '2026-10-08T08:00:00Z',
  },
  {
    id: 'task-cs201-refactor',
    courseId: 1,
    noteId: null,
    title: 'Refactor BST Insert Method',
    description: 'Clean up recursive insert for clarity.',
    scheduledDate: null,
    duration: 'PT1H30M',
    status: 'TODO',
    planCategory: 'LATER',
    createdAt: '2026-10-09T10:00:00Z',
    updatedAt: '2026-10-09T10:00:00Z',
  },
  // BACKLOG tasks (no date, no duration)
  {
    id: 'task-cs201-graph-preview',
    courseId: 1,
    noteId: null,
    title: 'Preview Graph Traversal Algorithms',
    description: 'Read textbook section 8.2.',
    scheduledDate: null,
    duration: null,
    status: 'TODO',
    planCategory: 'BACKLOG',
    createdAt: '2026-10-07T10:00:00Z',
    updatedAt: '2026-10-07T10:00:00Z',
  },
  {
    id: 'task-oop-patterns',
    courseId: 4,
    noteId: null,
    title: 'Study Design Patterns Catalog',
    description: 'Review GoF patterns for final exam.',
    scheduledDate: null,
    duration: null,
    status: 'TODO',
    planCategory: 'BACKLOG',
    createdAt: '2026-10-10T08:00:00Z',
    updatedAt: '2026-10-10T08:00:00Z',
  },
]

export function createInitialFixtures(): FixtureState {
  return structuredClone(INITIAL_FIXTURES)
}
