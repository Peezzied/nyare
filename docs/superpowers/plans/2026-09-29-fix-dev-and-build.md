# Fix Dev and Build Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve Vite dev server asset resolution failure and TypeScript 6 deprecation build errors.

**Architecture:** Configure native Vite path aliases for `@` in `vite.config.ts`, remove redundant `vite-tsconfig-paths`, and remove deprecated `baseUrl` options from TypeScript configuration files.

**Tech Stack:** Vue 3, Vite 8, TypeScript 6, Tailwind CSS v4, vue-tsc

**Spec:** N/A (Bug fix plan based on error diagnostics)

## Global Constraints

- Use active voice and simple tenses.
- Limit instruction sentences to 20 words or fewer.
- Limit description sentences to 25 words or fewer.
- Do not use semicolons.
- Use native platform features before dependencies (Ponytail rule).
- Keep changes minimal.

---

### Task 1: Fix Vite Asset Resolution in Dev Server

**Files:**
- Modify: `D:/General Project Bins/Academics/CCS201/nyare/frontend/vite.config.ts:1-11`

**Interfaces:**
- Consumes: `node:url` (`fileURLToPath`, `URL`)
- Produces: Vite alias `@` mapped to `src` directory

- [ ] **Step 1: Update vite.config.ts with native alias configuration**

Replace `vite-tsconfig-paths` with native `resolve.alias` in [vite.config.ts](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/frontend/vite.config.ts):

```typescript
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

- [ ] **Step 2: Verify dev server resolves static assets without error**

Run: `npm run dev` in background and request `/src/App.vue`.
Expected: Dev server transforms `src/App.vue` without `Failed to resolve import "@/assets/logo.svg"` error.

- [ ] **Step 3: Remove unused vite-tsconfig-paths dependency**

Remove `vite-tsconfig-paths` from `package.json`:
Run: `npm uninstall vite-tsconfig-paths`

---

### Task 2: Fix TypeScript 6 Deprecation Errors in Build

**Files:**
- Modify: `D:/General Project Bins/Academics/CCS201/nyare/frontend/tsconfig.app.json:9-10`
- Modify: `D:/General Project Bins/Academics/CCS201/nyare/frontend/tsconfig.json:14-16`

**Interfaces:**
- Consumes: TypeScript 6 compiler options
- Produces: Clean type-check output without TS5101 deprecation error

- [ ] **Step 1: Remove baseUrl from tsconfig.app.json**

In [tsconfig.app.json](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/frontend/tsconfig.app.json), delete `"baseUrl": ".",` line:

```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"],
  "exclude": ["src/**/__tests__/*"],
  "compilerOptions": {
    // Extra safety for array and object lookups, but may have false positives.
    "noUncheckedIndexedAccess": true,

    // Path mapping for cleaner imports.
    "paths": {
      "@/*": ["./src/*"]
    },

    // `vue-tsc --build` produces a .tsbuildinfo file for incremental type-checking.
    // Specified here to keep it out of the root directory.
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo"
  }
}
```

- [ ] **Step 2: Remove baseUrl from tsconfig.json**

In [tsconfig.json](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/frontend/tsconfig.json), delete `"baseUrl": ".",` line:

```json
{
  "files": [],
  "references": [
    {
      "path": "./tsconfig.node.json"
    },
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.vitest.json"
    }
  ],
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 3: Run type-check to verify TS5101 error is gone**

Run: `npm run type-check`
Expected: `vue-tsc --build` exits with code 0.

- [ ] **Step 4: Run full build script**

Run: `npm run build`
Expected: Both `type-check` and `build-only` exit with code 0.
