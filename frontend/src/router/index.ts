import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'todo',
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
