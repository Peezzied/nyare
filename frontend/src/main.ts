import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Set VITE_USE_MOCKS=true to serve API requests from in-memory fixtures, not the backend.
// The dynamic import keeps the mock code in a separate chunk.
if (import.meta.env.VITE_USE_MOCKS === 'true') {
  const { initMockAdapter } = await import('./api/mocks/adapter')
  initMockAdapter()
}

const app = createApp(App)

app.use(router)

app.mount('#app')
