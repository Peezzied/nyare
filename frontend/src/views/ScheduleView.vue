<script setup lang="ts">
import { useRouter } from 'vue-router'
import StepProgress from '@/components/StepProgress.vue'

const router = useRouter()

function goBack() {
  router.push('/welcome')
}
</script>

<template>
  <div
    class="relative mx-auto flex h-[100svh] w-full max-w-[420px] flex-col overflow-x-hidden overflow-y-hidden bg-[#F6F7EE] px-6 pt-8"
  >
    <div class="relative z-10 flex w-full justify-center pt-[1svh]">
      <StepProgress :active-step="3" :animate-active="true" />
    </div>

    <header class="relative z-10 mt-[7svh] flex w-full items-center justify-between">
      <button
        type="button"
        aria-label="Go back"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#334155] transition-colors hover:bg-[#C2E8F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2"
        @click="goBack"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5m7-7-7 7 7 7" />
        </svg>
      </button>

      <h1
        class="px-2 text-center text-lg font-semibold text-[#334155]"
        style="font-family: 'Quicksand', sans-serif; font-weight: 700"
      >
        Create a Schedule
      </h1>

      <button
        type="button"
        aria-label="Confirm"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#00A4C8] transition-colors hover:bg-[#C2E8F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-7 w-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </header>
  </div>
</template>
