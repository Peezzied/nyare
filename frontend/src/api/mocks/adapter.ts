import { setMockHandler } from '@/api/client'
import { createInitialFixtures, type FixtureState } from './fixtures'
import { getPlanCategory } from '@/utils/planCategory'
import { toNoteSummary } from '@/utils/noteSummary'
import type {
  ProblemDetail,
  UserResponse,
  UserRequest,
  LoginRequest,
  CourseResponse,
  CourseRequest,
  ScheduleResponse,
  ScheduleRequest,
  NoteResponse,
  NoteSummaryResponse,
  NoteRequest,
  TaskResponse,
  TaskRequest,
  TaskStatusRequest,
  AcademicEventResponse,
  AcademicEventRequest,
  ImageUploadResponse,
} from '@/types/api'

interface MockImage {
  id: string
  url: string
  contentType: string
  size: number
  createdAt: string
}

// In-memory data store. Mutations last until resetMockFixtures() or a page reload.
let state: FixtureState = createInitialFixtures()
let images: MockImage[] = []

function notFound(detail: string): { status: number; data: ProblemDetail } {
  return {
    status: 404,
    data: {
      title: 'Not Found',
      status: 404,
      detail,
    },
  }
}

function badRequest(detail: string): { status: number; data: ProblemDetail } {
  return {
    status: 400,
    data: {
      title: 'Bad Request',
      status: 400,
      detail,
    },
  }
}

function unauthorized(): { status: number; data: ProblemDetail } {
  return {
    status: 401,
    data: {
      title: 'Unauthorized',
      status: 401,
      detail: 'Authentication required',
    },
  }
}

/** Path prefixes that need a session. User routes stay open. */
const PROTECTED_PREFIXES = [
  '/api/courses',
  '/api/schedules',
  '/api/tasks',
  '/api/notes',
  '/api/academic-events',
  '/api/study-planner',
  '/api/images',
]

/** Restores the mock data to the initial fixtures and removes all uploaded images. */
export function resetMockFixtures(): void {
  state = createInitialFixtures()
  images = []
}

/**
 * In-memory `MockHandler` that imitates the backend REST routes, filters, and error responses.
 * @returns the mock response, or `null` when no route matches so the request goes to `fetch`.
 */
export function mockRouter(
  method: string,
  url: string,
  body?: unknown,
): { status: number; data?: unknown } | null {
  let pathname = url
  let searchParams = new URLSearchParams()

  // A dummy base lets `URL` parse the relative API paths. The catch handles malformed input.
  try {
    const parsed = new URL(url, 'http://localhost')
    pathname = parsed.pathname
    searchParams = parsed.searchParams
  } catch {
    const [pathPart, queryPart] = url.split('?')
    pathname = pathPart ?? ''
    searchParams = new URLSearchParams(queryPart ?? '')
  }

  // Session gate. Protected routes answer 401 until a user logs in.
  if (
    !state.currentUser &&
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return unauthorized()
  }

  // Auth endpoints
  if (method === 'POST' && pathname === '/api/users/login') {
    const req = body as LoginRequest | undefined
    if (!req?.username) {
      return badRequest('Username is required')
    }
    const user = state.users.find((u) => u.username === req.username)
    if (!user) {
      return notFound(`User not found: ${req.username}`)
    }
    state.currentUser = user
    return { status: 200, data: user }
  }

  if (method === 'POST' && pathname === '/api/users/logout') {
    state.currentUser = null
    return { status: 204 }
  }

  if (method === 'GET' && pathname === '/api/users/me') {
    if (!state.currentUser) {
      return {
        status: 401,
        data: {
          title: 'Unauthorized',
          status: 401,
          detail: 'User not authenticated',
        },
      }
    }
    return { status: 200, data: state.currentUser }
  }

  if (method === 'GET' && pathname === '/api/users') {
    return { status: 200, data: state.users }
  }

  if (method === 'POST' && pathname === '/api/users') {
    const req = body as UserRequest | undefined
    if (!req?.username) {
      return badRequest('Username is required')
    }
    const nextId = state.users.reduce((max, u) => Math.max(max, u.id), 0) + 1
    const now = new Date().toISOString()
    const newUser: UserResponse = {
      id: nextId,
      username: req.username,
      createdAt: now,
      updatedAt: now,
    }
    state.users.push(newUser)
    return { status: 201, data: newUser }
  }

  const userMatch = pathname.match(/^\/api\/users\/(\d+)$/)
  if (userMatch?.[1]) {
    const id = Number(userMatch[1])
    if (method === 'GET') {
      const user = state.users.find((u) => u.id === id)
      if (!user) {
        return notFound(`User not found with ID: ${id}`)
      }
      return { status: 200, data: user }
    }
    if (method === 'DELETE') {
      const index = state.users.findIndex((u) => u.id === id)
      if (index === -1) {
        return notFound(`User not found with ID: ${id}`)
      }
      state.users.splice(index, 1)
      if (state.currentUser?.id === id) {
        state.currentUser = null
      }
      return { status: 204 }
    }
  }

  // Courses endpoints
  if (method === 'GET' && pathname === '/api/courses') {
    let list = state.courses
    const userIdParam = searchParams.get('userId')
    if (userIdParam !== null) {
      const userId = Number(userIdParam)
      list = list.filter((c) => c.userId === userId)
    }
    return { status: 200, data: list }
  }

  if (method === 'POST' && pathname === '/api/courses') {
    const req = body as CourseRequest | undefined
    if (!req?.name?.trim()) {
      return badRequest('Course name is required')
    }
    const nextId = state.courses.reduce((max, c) => Math.max(max, c.id), 0) + 1
    const newCourse: CourseResponse = {
      id: nextId,
      name: req.name,
      description: req.description ?? null,
      userId: req.userId ?? state.currentUser?.id ?? 1,
    }
    state.courses.push(newCourse)
    return { status: 201, data: newCourse }
  }

  const courseMatch = pathname.match(/^\/api\/courses\/(\d+)$/)
  if (courseMatch?.[1]) {
    const id = Number(courseMatch[1])
    if (method === 'GET') {
      const course = state.courses.find((c) => c.id === id)
      if (!course) {
        return notFound(`Course not found with ID: ${id}`)
      }
      return { status: 200, data: course }
    }
    if (method === 'DELETE') {
      const index = state.courses.findIndex((c) => c.id === id)
      if (index === -1) {
        return notFound(`Course not found with ID: ${id}`)
      }
      state.courses.splice(index, 1)
      return { status: 204 }
    }
  }

  // Schedules endpoints
  if (method === 'GET' && pathname === '/api/schedules') {
    let list = state.schedules
    const courseIdParam = searchParams.get('courseId')
    if (courseIdParam !== null) {
      const courseId = Number(courseIdParam)
      list = list.filter((s) => s.courseId === courseId)
    }
    const dayParam = searchParams.get('day')
    if (dayParam !== null) {
      list = list.filter((s) => s.day === dayParam)
    }
    return { status: 200, data: list }
  }

  if (method === 'POST' && pathname === '/api/schedules') {
    const req = body as ScheduleRequest | undefined
    if (!req?.courseId || !req.day || !req.startTime || !req.endTime) {
      return badRequest('All schedule fields are required')
    }
    const nextId = state.schedules.reduce((max, s) => Math.max(max, s.id), 0) + 1
    const newSchedule: ScheduleResponse = {
      id: nextId,
      courseId: req.courseId,
      day: req.day,
      startTime: req.startTime,
      endTime: req.endTime,
    }
    state.schedules.push(newSchedule)
    return { status: 201, data: newSchedule }
  }

  const scheduleMatch = pathname.match(/^\/api\/schedules\/(\d+)$/)
  if (scheduleMatch?.[1]) {
    const id = Number(scheduleMatch[1])
    if (method === 'GET') {
      const schedule = state.schedules.find((s) => s.id === id)
      if (!schedule) {
        return notFound(`Schedule not found with ID: ${id}`)
      }
      return { status: 200, data: schedule }
    }
    if (method === 'PUT') {
      const index = state.schedules.findIndex((s) => s.id === id)
      if (index === -1) {
        return notFound(`Schedule not found with ID: ${id}`)
      }
      const existing = state.schedules[index]!
      const req = body as ScheduleRequest | undefined
      if (!req?.courseId || !req.day || !req.startTime || !req.endTime) {
        return badRequest('All schedule fields are required')
      }
      const updated: ScheduleResponse = {
        id: existing.id,
        courseId: req.courseId,
        day: req.day,
        startTime: req.startTime,
        endTime: req.endTime,
      }
      state.schedules[index] = updated
      return { status: 200, data: updated }
    }
    if (method === 'DELETE') {
      const index = state.schedules.findIndex((s) => s.id === id)
      if (index === -1) {
        return notFound(`Schedule not found with ID: ${id}`)
      }
      state.schedules.splice(index, 1)
      return { status: 204 }
    }
  }

  // Notes endpoints
  if (method === 'GET' && pathname === '/api/notes') {
    let list = state.notes
    const courseIdParam = searchParams.get('courseId')
    if (courseIdParam !== null) {
      const courseId = Number(courseIdParam)
      list = list.filter((n) => n.courseId === courseId)
    }
    const summaries: NoteSummaryResponse[] = list.map(toNoteSummary)
    return { status: 200, data: summaries }
  }

  if (method === 'POST' && pathname === '/api/notes') {
    const req = body as NoteRequest | undefined
    if (!req?.courseId || req.content === undefined) {
      return badRequest('Course ID and content are required')
    }
    const now = new Date().toISOString()
    const today = now.slice(0, 10)
    const newNote: NoteResponse = {
      id: `note-${crypto.randomUUID()}`,
      courseId: req.courseId,
      title: req.title?.trim() ? req.title.trim() : 'Untitled Note',
      content: req.content,
      entryDate: req.entryDate?.trim() ? req.entryDate : today,
      createdAt: now,
      updatedAt: now,
      lastProcessedAt: null,
    }
    state.notes.push(newNote)
    return { status: 201, data: newNote }
  }

  const noteMatch = pathname.match(/^\/api\/notes\/([^/]+)$/)
  if (noteMatch?.[1]) {
    const id = noteMatch[1]
    if (method === 'GET') {
      const note = state.notes.find((n) => n.id === id)
      if (!note) {
        return notFound(`Note not found with ID: ${id}`)
      }
      return { status: 200, data: note }
    }
    if (method === 'PUT') {
      const index = state.notes.findIndex((n) => n.id === id)
      if (index === -1) {
        return notFound(`Note not found with ID: ${id}`)
      }
      const existing = state.notes[index]!
      const req = body as NoteRequest | undefined
      if (!req?.courseId || req.content === undefined) {
        return badRequest('Course ID and content are required')
      }
      const updated: NoteResponse = {
        ...existing,
        courseId: req.courseId,
        title:
          req.title !== undefined && req.title !== null && req.title.trim() !== ''
            ? req.title.trim()
            : existing.title,
        content: req.content,
        entryDate:
          req.entryDate !== undefined && req.entryDate !== null && req.entryDate.trim() !== ''
            ? req.entryDate
            : existing.entryDate,
        updatedAt: new Date().toISOString(),
      }
      state.notes[index] = updated
      return { status: 200, data: updated }
    }
    if (method === 'DELETE') {
      const index = state.notes.findIndex((n) => n.id === id)
      if (index === -1) {
        return notFound(`Note not found with ID: ${id}`)
      }
      state.notes.splice(index, 1)
      return { status: 204 }
    }
  }

  // Tasks endpoints
  if (method === 'GET' && pathname === '/api/tasks') {
    let list = state.tasks
    const courseIdParam = searchParams.get('courseId')
    if (courseIdParam !== null) {
      const courseId = Number(courseIdParam)
      list = list.filter((t) => t.courseId === courseId)
    }
    const statusParam = searchParams.get('status')
    if (statusParam !== null) {
      list = list.filter((t) => t.status === statusParam)
    }
    const scheduledParam = searchParams.get('scheduled')
    if (scheduledParam !== null) {
      const isScheduled = scheduledParam === 'true'
      list = list.filter((t) => (isScheduled ? t.scheduledDate !== null : t.scheduledDate === null))
    }
    return { status: 200, data: list }
  }

  if (method === 'POST' && pathname === '/api/tasks') {
    const req = body as TaskRequest | undefined
    if (!req?.courseId || !req.title?.trim()) {
      return badRequest('Course ID and title are required')
    }
    const now = new Date().toISOString()
    const scheduledDate = req.scheduledDate ?? null
    const duration = req.duration ?? null
    const newTask: TaskResponse = {
      id: `task-${crypto.randomUUID()}`,
      courseId: req.courseId,
      noteId: null,
      title: req.title,
      description: req.description ?? null,
      scheduledDate,
      duration,
      status: req.status ?? 'TODO',
      planCategory: getPlanCategory({ scheduledDate, duration }),
      createdAt: now,
      updatedAt: now,
    }
    state.tasks.push(newTask)
    return { status: 201, data: newTask }
  }

  // Match the status sub-route before the generic task ID route.
  const taskStatusMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/status$/)
  if (taskStatusMatch?.[1]) {
    const id = taskStatusMatch[1]
    if (method === 'PATCH') {
      const index = state.tasks.findIndex((t) => t.id === id)
      if (index === -1) {
        return notFound(`Task not found with ID: ${id}`)
      }
      const existing = state.tasks[index]!
      const req = body as TaskStatusRequest | undefined
      if (!req?.status) {
        return badRequest('Status is required')
      }
      const updated: TaskResponse = {
        ...existing,
        status: req.status,
        updatedAt: new Date().toISOString(),
      }
      state.tasks[index] = updated
      return { status: 200, data: updated }
    }
  }

  const taskMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/)
  if (taskMatch?.[1] && !pathname.endsWith('/status')) {
    const id = taskMatch[1]
    if (method === 'GET') {
      const task = state.tasks.find((t) => t.id === id)
      if (!task) {
        return notFound(`Task not found with ID: ${id}`)
      }
      return { status: 200, data: task }
    }
    if (method === 'PUT') {
      const index = state.tasks.findIndex((t) => t.id === id)
      if (index === -1) {
        return notFound(`Task not found with ID: ${id}`)
      }
      const existing = state.tasks[index]!
      const req = body as TaskRequest | undefined
      if (!req?.courseId || !req.title?.trim()) {
        return badRequest('Course ID and title are required')
      }
      const scheduledDate =
        req.scheduledDate !== undefined ? req.scheduledDate : existing.scheduledDate
      const duration = req.duration !== undefined ? req.duration : existing.duration
      const updated: TaskResponse = {
        ...existing,
        courseId: req.courseId,
        title: req.title,
        description: req.description !== undefined ? req.description : existing.description,
        scheduledDate,
        duration,
        status: req.status !== undefined && req.status !== null ? req.status : existing.status,
        planCategory: getPlanCategory({ scheduledDate, duration }),
        updatedAt: new Date().toISOString(),
      }
      state.tasks[index] = updated
      return { status: 200, data: updated }
    }
    if (method === 'DELETE') {
      const index = state.tasks.findIndex((t) => t.id === id)
      if (index === -1) {
        return notFound(`Task not found with ID: ${id}`)
      }
      state.tasks.splice(index, 1)
      return { status: 204 }
    }
  }

  // Academic Events endpoints
  if (method === 'GET' && pathname === '/api/academic-events') {
    let list = state.academicEvents
    const courseIdParam = searchParams.get('courseId')
    if (courseIdParam !== null) {
      const courseId = Number(courseIdParam)
      list = list.filter((e) => e.courseId === courseId)
    }
    const upcomingParam = searchParams.get('upcoming')
    if (upcomingParam === 'true') {
      // A string compare of ISO values. It treats the zone-less deadlines as UTC times.
      const now = new Date().toISOString()
      list = list.filter((e) => e.deadline >= now)
    }
    return { status: 200, data: list }
  }

  if (method === 'POST' && pathname === '/api/academic-events') {
    const req = body as AcademicEventRequest | undefined
    if (!req?.courseId || !req.title || !req.deadline) {
      return badRequest('Course ID, title, and deadline are required')
    }
    const now = new Date().toISOString()
    const newEvent: AcademicEventResponse = {
      id: `event-${crypto.randomUUID()}`,
      courseId: req.courseId,
      noteId: req.noteId ?? null,
      title: req.title,
      description: req.description ?? null,
      deadline: req.deadline,
      createdAt: now,
    }
    state.academicEvents.push(newEvent)
    return { status: 201, data: newEvent }
  }

  const eventMatch = pathname.match(/^\/api\/academic-events\/([^/]+)$/)
  if (eventMatch?.[1]) {
    const id = eventMatch[1]
    if (method === 'GET') {
      const event = state.academicEvents.find((e) => e.id === id)
      if (!event) {
        return notFound(`Academic event not found with ID: ${id}`)
      }
      return { status: 200, data: event }
    }
    if (method === 'PUT') {
      const index = state.academicEvents.findIndex((e) => e.id === id)
      if (index === -1) {
        return notFound(`Academic event not found with ID: ${id}`)
      }
      const existing = state.academicEvents[index]!
      const req = body as AcademicEventRequest | undefined
      if (!req?.courseId || !req.title || !req.deadline) {
        return badRequest('Course ID, title, and deadline are required')
      }
      const updated: AcademicEventResponse = {
        ...existing,
        courseId: req.courseId,
        noteId: req.noteId !== undefined ? req.noteId : existing.noteId,
        title: req.title,
        description: req.description !== undefined ? req.description : existing.description,
        deadline: req.deadline,
      }
      state.academicEvents[index] = updated
      return { status: 200, data: updated }
    }
    if (method === 'DELETE') {
      const index = state.academicEvents.findIndex((e) => e.id === id)
      if (index === -1) {
        return notFound(`Academic event not found with ID: ${id}`)
      }
      state.academicEvents.splice(index, 1)
      return { status: 204 }
    }
  }

  // Study planner endpoints
  // The mock does not track dirty notes, so the status always reports no pending notes.
  if (method === 'GET' && pathname === '/api/study-planner/status') {
    return {
      status: 200,
      data: {
        hasPendingNotes: false,
        dirtyNoteCount: 0,
        dirtyDates: [],
        courseNames: [],
        pendingNotes: [],
      },
    }
  }

  // This route serves only apiClient.post(). streamProcess() uses the patched `fetch` below.
  if (method === 'POST' && pathname === '/api/study-planner/process') {
    return { status: 200, data: state.processSummary }
  }

  // Images endpoints
  if (method === 'POST' && pathname === '/api/images') {
    let fileObj: File | null = null
    if (body instanceof FormData) {
      const entry = body.get('file')
      if (entry instanceof File) {
        fileObj = entry
      }
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'
    let url = `/api/images/${id}`

    // In the browser, a blob URL lets the editor show the image without a backend.
    // Tests keep the stable API path, so assertions can match it.
    if (
      !isTestEnv &&
      fileObj &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function'
    ) {
      try {
        url = URL.createObjectURL(fileObj)
      } catch {
        url = `/api/images/${id}`
      }
    }

    const img: ImageUploadResponse = {
      id,
      url,
      contentType: fileObj?.type || 'image/png',
      size: fileObj?.size || 1024,
      createdAt: now,
    }
    images.push(img)
    return { status: 201, data: img }
  }

  const imgMatch = pathname.match(/^\/api\/images\/([^/]+)$/)
  if (imgMatch?.[1]) {
    const id = imgMatch[1]
    if (method === 'GET') {
      const img = images.find((i) => i.id === id)
      if (!img) {
        return notFound(`Image not found with ID: ${id}`)
      }
      return { status: 200, data: img }
    }
    if (method === 'DELETE') {
      const index = images.findIndex((i) => i.id === id)
      if (index === -1) {
        return notFound(`Image not found with ID: ${id}`)
      }
      images.splice(index, 1)
      return { status: 204 }
    }
  }

  return null
}

/**
 * Routes API calls to the in-memory mock backend.
 * `main.ts` calls it when `VITE_USE_MOCKS` is `'true'`. Repeated calls are safe.
 */
export function initMockAdapter(): void {
  setMockHandler(mockRouter)

  // streamProcess() calls `fetch` directly, so the apiClient mock handler cannot answer it.
  // Patch `fetch` once to return a one-frame SSE `done` response for Process.
  if (typeof globalThis.fetch === 'function') {
    const currentFetch = globalThis.fetch
    // The marker stops a second call from wrapping the patched `fetch` again.
    if (!(currentFetch as { __nyare_mock__?: boolean }).__nyare_mock__) {
      const patchedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const urlStr =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : (input as Request).url
        const method = (
          init?.method ??
          (typeof input === 'object' && input !== null && 'method' in input
            ? (input as Request).method
            : 'GET') ??
          'GET'
        ).toUpperCase()

        let pathname = urlStr
        try {
          const parsed = new URL(urlStr, 'http://localhost')
          pathname = parsed.pathname
        } catch {
          const [path] = urlStr.split('?')
          pathname = path ?? ''
        }

        if (pathname === '/api/study-planner/process' && method === 'POST') {
          const sseText = `event: done\ndata: ${JSON.stringify(state.processSummary)}\n\n`
          return new Response(sseText, {
            status: 200,
            headers: {
              'Content-Type': 'text/event-stream',
            },
          })
        }

        return currentFetch(input, init)
      }
      ;(patchedFetch as { __nyare_mock__?: boolean }).__nyare_mock__ = true
      globalThis.fetch = patchedFetch as typeof fetch
    }
  }
}
