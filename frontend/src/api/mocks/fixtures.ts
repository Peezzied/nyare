import type {
  UserResponse,
  CourseResponse,
  ScheduleResponse,
  NoteResponse,
  TaskResponse,
  AcademicEventResponse,
  ProcessSummaryResponse,
} from '@/types/api'

export interface FixtureState {
  users: UserResponse[]
  currentUser: UserResponse | null
  courses: CourseResponse[]
  schedules: ScheduleResponse[]
  notes: NoteResponse[]
  tasks: TaskResponse[]
  academicEvents: AcademicEventResponse[]
  processSummary: ProcessSummaryResponse
}

const INITIAL_FIXTURES: FixtureState = {
  users: [
    {
      id: 1,
      username: 'karol',
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
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
      content:
        '# Lecture 7: Self-Balancing Trees (AVL Trees)\n\n## Binary Search Tree Invariant\nFor every node $X$:\n- Keys in left subtree are smaller than $X.key$\n- Keys in right subtree are greater than $X.key$\n\n## AVL Balance Factor\nBalance factor is defined as `height(left) - height(right)`.\n- Allowed balance factors: -1, 0, +1.\n- When balance factor becomes +/-2, perform rotations.\n\n### Rotations\n- Single Left Rotation (Right-Right heavy)\n- Single Right Rotation (Left-Left heavy)\n- Left-Right Double Rotation\n- Right-Left Double Rotation\n\n## Action Items\n- Complete problem set 3 rotation implementations.\n- Prepare for midterm examination review session.',
      createdAt: '2026-10-05T09:30:00Z',
      updatedAt: '2026-10-05T11:00:00Z',
      lastProcessedAt: '2026-10-05T11:30:00Z',
    },
    {
      id: 'note-math204-eigen',
      courseId: 2,
      content:
        '# Lecture 12: Eigenvalues and Diagonalization\n\n## Characteristic Equation\nLet $A$ be an $n \\times n$ matrix.\n- Solve characteristic polynomial $\\det(A - \\lambda I) = 0$.\n- Find roots $\\lambda_1, \\lambda_2, \\dots, \\lambda_k$.\n\n## Eigenspaces\nFor each eigenvalue $\\lambda$:\n- Solve $(A - \\lambda I)v = 0$ for non-trivial eigenvector $v$.\n- Dimension of eigenspace is geometric multiplicity.\n\n## Diagonalization Conditions\n- $A$ is diagonalizable if and only if geometric multiplicity equals algebraic multiplicity for each eigenvalue.\n\n## Weekly Goals\n- Practice finding eigenvectors for 3x3 symmetric matrices.\n- Verify homework solutions with peers.',
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

export function createInitialFixtures(): FixtureState {
  return structuredClone(INITIAL_FIXTURES)
}
