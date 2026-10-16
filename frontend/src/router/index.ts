import { createRouter, createWebHistory } from 'vue-router'
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
  ],
})

export default router
