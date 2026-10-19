import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.ts'

// `vite.config.ts` exports a function config. Resolve it before merging;
// vite's mergeConfig rejects callback configs.
export default mergeConfig(
  await viteConfig({ command: 'serve', mode: 'test', isSsrBuild: false, isPreview: false }),
  defineConfig({
    test: {
      environment: 'jsdom',
      fileParallelism: false,
      maxWorkers: 1,
      exclude: [...configDefaults.exclude, 'e2e/**', 'src/__flow__/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
