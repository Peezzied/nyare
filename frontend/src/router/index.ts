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
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
