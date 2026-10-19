import { createRouter, createWebHistory } from 'vue-router'
import { clearSessionUser, ensureSession, useAuth } from '@/composables/useAuth'
import { setUnauthorizedHandler } from '@/api/client'
import StartView from '../views/StartView.vue'
import WelcomeView from '../views/WelcomeView.vue'
import ScheduleView from '../views/ScheduleView.vue'
import CreateScheduleView from '../views/CreateScheduleView.vue'
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
    {
      path: '/schedule',
      name: 'schedule',
      component: ScheduleView,
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
      component: () => import('../views/AccountSelectView.vue'),
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
      ],
    },
    {
      path: '/dev-missing',
      name: 'dev-missing',
      component: () => import('@/views/DevAccountMissingView.vue'),
    },
  ],
})

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
// A sessioned visit to `start` goes to the calendar home
// (docs/system-workflows.md section 8 identifies Calendar View as the home).
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
    return to.name === 'start' || to.name === 'select-account' ? true : { path: '/' }
  }
  return to.name === 'start' ? { name: 'calendar' } : true
})

export default router
