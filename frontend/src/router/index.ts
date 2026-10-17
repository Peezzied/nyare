import { createRouter, createWebHistory } from 'vue-router'
import { ensureSession } from '@/composables/useAuth'
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
      path: '/tasks',
      alias: ['/todo'],
      name: 'tasks',
      component: () => import('@/views/TodoView.vue'),
    },
    {
      path: '/tasks/:id',
      name: 'task-detail',
      component: () => import('@/views/TaskDetailView.vue'),
    },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('../views/NotesView.vue'),
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
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('@/components/day-view/DayViewContainer.vue'),
    },
  ],
})

// First-launch detection via `GET /api/users/me`.
// Public routes: the startup/setup page (`start`) and account selection.
// Every other route needs a valid linked user session and redirects to `start`.
// A sessioned visit to `start` goes to the calendar home
// (docs/system-workflows.md section 8 identifies Calendar View as the home).
router.beforeEach(async (to) => {
  const user = await ensureSession()
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
