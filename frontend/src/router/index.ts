import { createRouter, createWebHistory } from 'vue-router'
import { clearSessionUser, ensureSession, useAuth } from '@/composables/useAuth'
import { useCatalog } from '@/composables/useCatalog'
import { useOnboarding } from '@/composables/useOnboarding'
import { setUnauthorizedHandler } from '@/api/client'
import StartView from '../views/StartView.vue'
import WelcomeView from '../views/WelcomeView.vue'
import CreateScheduleView from '../views/CreateScheduleView.vue'
import AccountSelectView from '../views/AccountSelectView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'start',
      component: StartView,
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: WelcomeView,
    },
    // Stale `/schedule` bookmarks resolve through the guard via the start route.
    {
      path: '/schedule',
      redirect: '/',
    },
    {
      path: '/create-schedule',
      name: 'create-schedule',
      component: CreateScheduleView,
    },
    {
      path: '/tasks/:id',
      name: 'task-detail',
      component: () => import('@/views/TaskDetailView.vue'),
    },
    // Optional query params `courseId` and `entryDate` prefill the new note.
    {
      path: '/notes/new',
      name: 'note-new',
      component: () => import('../views/NoteEditor.vue'),
    },
    {
      path: '/notes/:id',
      name: 'note-edit',
      component: () => import('../views/NoteEditor.vue'),
    },
    {
      path: '/select-account',
      alias: '/accounts',
      name: 'select-account',
      component: AccountSelectView,
    },
    // Logged-in tab routes render inside the shared AppShell chrome.
    {
      path: '/',
      component: () => import('@/components/AppShell.vue'),
      children: [
        {
          path: '/tasks',
          alias: ['/todo'],
          name: 'tasks',
          component: () => import('@/views/TodoView.vue'),
        },
        {
          path: '/calendar',
          name: 'calendar',
          component: () => import('@/components/day-view/DayViewContainer.vue'),
        },
        {
          path: '/notes',
          name: 'notes',
          component: () => import('../views/NotesView.vue'),
        },
        {
          path: '/manage-courses',
          name: 'manage-courses',
          component: () => import('@/views/ManageCoursesView.vue'),
        },
      ],
    },
    {
      path: '/dev-missing',
      name: 'dev-missing',
      component: () => import('@/views/DevAccountMissingView.vue'),
    },
  ],
})

// Routes that need a completed setup before a sessioned user may open them.
const GATED_WHEN_NOT_ONBOARDED = [
  'calendar',
  'tasks',
  'notes',
  'note-new',
  'note-edit',
  'task-detail',
]

// A protected 401 during use clears the session and returns to the start screen.
setUnauthorizedHandler(() => {
  clearSessionUser()
  if (router.currentRoute.value.name !== 'start') {
    void router.push({ name: 'start' })
  }
})

// First-launch detection via `GET /api/users/me`.
// Public routes: the startup/setup page (`start`), account selection, and missing dev user notice.
// Every other route needs a valid linked user session and redirects to `start`.
// A sessioned visit to `start` continues onboarding or goes to the calendar
// home (docs/system-workflows.md section 8 identifies Calendar View as the home).
router.beforeEach(async (to) => {
  const user = await ensureSession()
  const { isDevUserMissing } = useAuth()

  if (isDevUserMissing.value) {
    return to.name === 'dev-missing' ? true : { name: 'dev-missing' }
  }
  if (to.name === 'dev-missing') {
    return { path: '/' }
  }

  if (user === undefined) {
    // Backend unreachable: the session state is unknown, not absent.
    // Dev: proceed so standalone frontend runs keep working with the
    // per-view fixture fallbacks; the backend still rejects unauthenticated
    // API calls. Production builds fail closed: `import.meta.env.DEV` is
    // statically false there, so unknown sessions never render routes.
    if (!import.meta.env.DEV) {
      return false
    }
    return true
  }
  if (!user) {
    // Public sessionless routes: the startup/setup page, account selection, the
    // welcome name form, and the schedule step once a name exists (the account
    // is only registered on Submit at the end of onboarding).
    if (to.name === 'start' || to.name === 'select-account' || to.name === 'welcome') {
      return true
    }
    if (to.name === 'create-schedule') {
      return useOnboarding().isNameValid.value ? true : { name: 'welcome' }
    }
    return { path: '/' }
  }

  // Onboarding completion is derived from owned courses: an account with at
  // least one course finished setup. The gate only matters on setup and app
  // routes, so other destinations (e.g. select-account) skip the catalog wait.
  const needsCourseGate =
    GATED_WHEN_NOT_ONBOARDED.includes(to.name as string) ||
    to.name === 'welcome' ||
    to.name === 'create-schedule' ||
    to.name === 'start'
  if (needsCourseGate) {
    let hasCourses = true
    try {
      await useCatalog().loadCatalog()
      hasCourses = useCatalog().courses.value.length > 0
    } catch {
      // A failed catalog load leaves the state unknown; let the view handle it.
    }
    if (!hasCourses && GATED_WHEN_NOT_ONBOARDED.includes(to.name as string)) {
      return { name: 'welcome' }
    }
    if (hasCourses && (to.name === 'welcome' || to.name === 'create-schedule')) {
      return { name: 'calendar' }
    }
    if (to.name === 'start') {
      return { name: hasCourses ? 'calendar' : 'welcome' }
    }
  }
  return true
})

export default router
