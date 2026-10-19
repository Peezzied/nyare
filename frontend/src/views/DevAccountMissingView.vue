<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircle, RefreshCw, UserCheck } from '@lucide/vue'
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
  <div
    class="relative min-h-screen w-full overflow-x-hidden bg-[#F6F7EE] text-[#334155] font-['Quicksand'] select-none"
  >
    <main
      class="relative z-10 mx-auto flex h-[100svh] max-w-[420px] flex-col justify-between px-5 pt-8 pb-8"
    >
      <!-- Header -->
      <header class="text-center">
        <h1
          class="font-['DynaPuff'] text-4xl sm:text-5xl font-bold tracking-tight text-[#00A4C8] leading-none drop-shadow-xs"
        >
          'Nyare
        </h1>
        <p class="mt-2 text-xs font-bold uppercase tracking-widest text-[#94A3B8]">
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
          class="w-full rounded-2xl border-2 border-[#CBD5E1] bg-white p-5 shadow-[0_3px_0_#CBD5E1] text-center"
        >
          <div
            class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600"
          >
            <AlertCircle class="h-6 w-6" />
          </div>

          <h2 class="text-lg font-bold text-[#334155]">Dev Account Missing</h2>

          <p class="mt-2 font-['Inter'] text-xs text-[#64748B] leading-relaxed">
            The configured student account
            <span class="font-mono font-bold text-[#334155]">{{ devUser }}</span> does not exist in
            the backend database.
          </p>

          <div class="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-left">
            <p class="font-bold text-xs text-amber-900">How to restore:</p>
            <ol class="mt-1 list-decimal pl-4 font-['Inter'] text-[11px] text-amber-800 space-y-1">
              <li>
                Re-run
                <code class="font-mono font-semibold">backend/src/main/resources/data.sql</code>
              </li>
              <li>Or restart the Spring Boot backend server</li>
            </ol>
          </div>

          <div
            v-if="retryError"
            role="alert"
            class="mt-3 rounded-xl border border-red-200 bg-red-50 p-2 text-xs font-['Inter'] text-red-700"
          >
            {{ retryError }}
          </div>
        </div>
      </section>

      <!-- Actions -->
      <footer class="space-y-3 pt-2">
        <button
          type="button"
          class="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#00A4C8] border-b-4 border-[#007B99] text-sm font-bold text-white uppercase tracking-wider transition-all duration-75 hover:bg-[#0096B7] active:translate-y-1 active:border-b-0 cursor-pointer shadow-xs disabled:opacity-50"
          :disabled="isRetrying"
          @click="handleRetry"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isRetrying }" />
          <span>{{ isRetrying ? 'Retrying...' : 'Retry Connection' }}</span>
        </button>

        <button
          type="button"
          class="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#CBD5E1] bg-white text-xs font-bold text-[#64748B] transition-colors hover:bg-[#ECEFE6] cursor-pointer"
          @click="handleChooseAccount"
        >
          <UserCheck class="h-4 w-4" />
          <span>Choose Different Account</span>
        </button>
      </footer>
    </main>
  </div>
</template>
