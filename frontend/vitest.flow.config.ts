import { fileURLToPath } from 'node:url'
import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    root: fileURLToPath(new URL('./', import.meta.url)),
    include: ['src/__flow__/**/*.flow.spec.ts'],
    exclude: [...configDefaults.exclude, 'src/**/__tests__/**'],
    passWithNoTests: true,
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 600_000,
  },
})
