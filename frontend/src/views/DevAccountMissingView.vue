<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircle, RefreshCw, UserCheck } from '@lucide/vue'
import OnboardingShell from '@/components/OnboardingShell.vue'
import { Button } from '@/components/ui/button'
import { clearSessionUser, ensureSession, useAuth } from '@/composables/useAuth'
import duckotaCasual from '@/assets/mascot/duckota_casual.png'

const router = useRouter()
const isRetrying = ref(false)
const retryError = ref<string | null>(null)
const { configuredDevUser } = useAuth()
const devUser = configuredDevUser

async function handleRetry(): Promise<void> {
  if (isRetrying.value) {
    return
  }
  isRetrying.value = true
  retryError.value = null
  try {
    clearSessionUser()
    const user = await ensureSession()
    if (user) {
      await router.push('/calendar')
    } else {
      retryError.value = `Account "${devUser}" is still missing from the database.`
    }
  } catch (err: unknown) {
    retryError.value = err instanceof Error ? err.message : 'Connection failed. Please retry.'
  } finally {
    isRetrying.value = false
  }
}

function handleChooseAccount(): void {
  clearSessionUser()
  router.push('/select-account')
}
</script>

<template>
  <OnboardingShell page class="pt-8">
    <!-- Header -->
    <header class="text-center">
        <h1
          class="font-logo text-4xl sm:text-5xl font-bold tracking-tight text-primary leading-none drop-shadow-xs"
        >
          'Nyare
        </h1>
        <p class="mt-2 text-xs font-bold uppercase tracking-widest text-text-muted">
          Developer Mode Notice
        </p>
      </header>

      <!-- Middle Mascot & Notice -->
      <section class="my-auto flex flex-col items-center">
        <div class="relative shrink-0 mb-4">
          <img
            :src="duckotaCasual"
            alt="Duckota Mascot"
            class="h-32 sm:h-36 w-auto object-contain drop-shadow-sm"
          />
        </div>

        <div
          class="w-full rounded-2xl border-2 border-app-border bg-card p-5 shadow-bevel-ghost text-center"
        >
          <div
            class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-warn-bg text-warn"
          >
            <AlertCircle class="h-6 w-6" />
          </div>

          <h2 class="text-lg font-bold text-text-main">Dev Account Missing</h2>

          <p class="mt-2 font-secondary text-xs text-text-muted leading-relaxed">
            The configured student account
            <span class="font-mono font-bold text-text-main">{{ devUser }}</span> does not exist in
            the backend database.
          </p>

          <div class="mt-4 rounded-xl border border-warn/40 bg-warn-bg/70 p-3 text-left">
            <p class="font-bold text-xs text-warn">How to restore:</p>
            <ol class="mt-1 list-decimal pl-4 font-secondary text-[11px] text-warn space-y-1">
              <li>
                Re-run
                <code class="font-mono font-semibold">app/src/main/resources/data.sql</code>
              </li>
              <li>Or restart the Spring Boot backend server</li>
            </ol>
          </div>

          <div
            v-if="retryError"
            role="alert"
            class="mt-3 rounded-xl border border-destructive-line bg-destructive-soft p-2 font-secondary text-xs text-destructive-hover"
          >
            {{ retryError }}
          </div>
        </div>
      </section>

      <!-- Actions -->
      <footer class="space-y-3 pt-2">
        <Button
          type="button"
          variant="tactile"
          size="touch"
          class="h-13 w-full rounded-2xl uppercase tracking-wider"
          :disabled="isRetrying"
          @click="handleRetry"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isRetrying }" />
          <span>{{ isRetrying ? 'Retrying...' : 'Retry Connection' }}</span>
        </Button>

        <button
          type="button"
          class="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-app-border bg-card text-xs font-bold text-text-muted transition-colors hover:bg-skeleton-hi cursor-pointer"
          @click="handleChooseAccount"
        >
          <UserCheck class="h-4 w-4" />
          <span>Choose Different Account</span>
        </button>
      </footer>
  </OnboardingShell>
</template>
