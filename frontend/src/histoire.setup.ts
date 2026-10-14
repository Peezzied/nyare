import { defineSetupVue3 } from '@histoire/plugin-vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import './assets/main.css'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
})

export const setupVue3 = defineSetupVue3(({ app }) => {
  app.use(router)
})

