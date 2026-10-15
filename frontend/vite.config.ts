import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
const isHistoire = Boolean(process.env.HISTOIRE)

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devUser = env.VITE_DEV_USER
  const isDev = command === 'serve'

  let devCookie = ''
  let loginPromise: Promise<void> | null = null

  async function ensureDevSession(): Promise<string> {
    if (devCookie) {
      return devCookie
    }
    if (loginPromise) {
      await loginPromise
      return devCookie
    }

    loginPromise = (async () => {
      try {
        const res = await fetch('http://localhost:8080/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: devUser }),
        })

        if (!res.ok) {
          console.warn(`[vite-proxy] Dev login for "${devUser}" returned status ${res.status}`)
          return
        }

        const setCookie = res.headers.get('set-cookie')
        if (setCookie) {
          devCookie = setCookie.split(';')[0] ?? ''
          console.log(`[vite-proxy] Authenticated dev session for user: ${devUser}`)
        }
      } catch (err) {
        console.warn(`[vite-proxy] Could not reach backend to log in "${devUser}":`, err)
      } finally {
        loginPromise = null
      }
    })()

    await loginPromise
    return devCookie
  }

  return {
    plugins: [vue(), ...(isHistoire ? [] : [vueDevTools()]), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          configure: (proxy) => {
            if (isDev && devUser) {
              proxy.on('proxyReq', async (proxyReq) => {
                const cookie = await ensureDevSession()
                if (cookie && !proxyReq.getHeader('cookie')) {
                  proxyReq.setHeader('cookie', cookie)
                }
              })
            }
          },
        },
      },
    },
  }
})

