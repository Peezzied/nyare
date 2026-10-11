import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

if (import.meta.env.VITE_USE_MOCKS === 'true') {
  const { initMockAdapter } = await import('./api/mocks/adapter')
  initMockAdapter()
}

const app = createApp(App)

app.use(router)

app.mount('#app')
