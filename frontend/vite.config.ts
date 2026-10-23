import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
const isHistoire = Boolean(process.env.HISTOIRE)

export default defineConfig(() => {
  return {
    plugins: [vue(), ...(isHistoire ? [] : [vueDevTools()]), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      warmup: {
        clientFiles: [
          './src/main.ts',
          './src/App.vue',
          './src/router/index.ts',
          './src/components/AppShell.vue',
          './src/components/NavigationBar.vue',
          './src/views/StartView.vue',
          './src/views/WelcomeView.vue',
          './src/views/AccountSelectView.vue',
          './src/views/CalendarView.vue',
          './src/views/TodoView.vue',
          './src/views/NotesView.vue',
          './src/views/NoteEditor.vue',
          './src/components/day-view/ScheduleCalendar.vue',
          './src/components/day-view/DeadlinesView.vue',
          './src/components/editor/TiptapEditor.vue',
          './src/components/NoteCard.vue',
        ],
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      include: [
        '@schedule-x/vue',
        '@schedule-x/calendar',
        '@schedule-x/calendar-controls',
        '@schedule-x/date-picker',
        '@schedule-x/theme-default',
        'temporal-polyfill',
        '@tiptap/vue-3',
        '@tiptap/starter-kit',
        '@tiptap/extension-image',
        '@tiptap/extension-placeholder',
        'lucide-vue-next',
        '@lucide/vue',
        'reka-ui',
        'minidenticons',
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
      ],
    },
  }
})

