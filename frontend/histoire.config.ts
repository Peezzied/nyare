import { defineConfig } from 'histoire'
import { HstVue } from '@histoire/plugin-vue'

export default defineConfig({
  plugins: [HstVue()],
  setupFile: '/src/histoire.setup.ts',
  storyIgnored: [
    '**/node_modules/**',
    '**/dist/**',
    '**/__tests__/**',
    '**/*.spec.ts',
    '**/*.test.ts',
  ],
})
