<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import TactileButton from '@/components/TactileButton.vue'
import StepProgress from '@/components/StepProgress.vue'
import { useOnboarding } from '@/composables/useOnboarding'

const router = useRouter()
const route = useRoute()
const { studentName, isNameValid, setStudentName } = useOnboarding()

const ONBOARDING_STEP_ROUTES = ['/', '/welcome', '/create-schedule'] as const
const ONBOARDING_STEP_LABELS = ['Start', 'Your name', 'Class schedule']

function onStepSelect(step: number) {
  const target = ONBOARDING_STEP_ROUTES[step - 1]
  if (target && target !== route.path) {
    void router.push(target)
  }
}

// The back button only appears when the account picker sent the user here
// through Add Account (`?from=accounts`).
const showBack = computed(() => route.query.from === 'accounts')

function goBack() {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
  } else {
    router.push('/select-account')
  }
}

const canContinue = computed(() => isNameValid.value && studentName.value.trim().length > 0)

const entered = ref(false)
entered.value = true

// index.html resizes the layout viewport for the virtual keyboard
// (interactive-widget=resizes-content). Freeze this page's geometry so the
// keyboard overlays it instead of shrinking every svh-sized element.
const pageHeight = ref<number | null>(null)

onMounted(() => {
  pageHeight.value = window.innerHeight
})

function onInput(event: Event) {
  setStudentName((event.target as HTMLInputElement).value)
}

// The name stays in onboarding state; the account is only created on Submit
// at the end of the schedule step.
async function proceed() {
  if (!canContinue.value) {
    return
  }
  await router.replace('/create-schedule')
}
</script>

<template>
  <div
    class="relative mx-auto flex h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden bg-[#F6F7EE] px-6 pt-4"
    :style="
      pageHeight
        ? { height: `${pageHeight}px`, '--welcome-vh': `${pageHeight / 100}px` }
        : undefined
    "
  >
    <!-- Back to the account picker, only after Add Account -->
    <button
      v-if="showBack"
      type="button"
      data-testid="welcome-back"
      aria-label="Go back"
      class="absolute left-6 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-xl border-2 text-[#94A3B8] transition-colors duration-150 cursor-pointer hover:border-0 hover:bg-[#00A4C8]/10 hover:text-[#00A4C8] focus-visible:outline-2 focus-visible:outline-[#00A4C8]/45 focus-visible:outline-offset-2"
      @click="goBack"
    >
      <ArrowLeft class="h-5 w-5" />
    </button>

    <!-- Static background: same as Start -->
    <img
      src="@/assets/props/sun.svg"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute -top-12 -right-14 z-0 w-52 select-none sm:w-56"
    />

    <img
      src="@/assets/props/double_cloud.svg"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute left-[6%] top-[9%] z-0 w-32 select-none sm:w-36"
    />

    <!-- Step indicator -->
    <div
      class="relative z-10 flex justify-center pt-[var(--welcome-vh,1svh)]"
      :class="{ 'welcome-enter welcome-delay-1': entered }"
    >
      <StepProgress
        :active-step="2"
        :step-labels="ONBOARDING_STEP_LABELS"
        interactive
        @select="onStepSelect"
      />
    </div>

    <!-- Heading -->
    <div
      class="relative z-10 mt-[calc(var(--welcome-vh,1svh)*14)] w-full shrink-0"
      :class="{ 'welcome-enter welcome-delay-2': entered }"
    >
      <h1 class="font-logo text-5xl font-semibold leading-tight text-[#00A4C8]">Welcome,</h1>

      <p
        class="mt-1 text-lg tracking-wide text-[#526B73]"
        style="font-family: 'Quicksand', sans-serif; font-weight: 700"
      >
        let's get to know you!
      </p>
    </div>

    <!-- Name input -->
    <div
      class="relative z-10 mt-6 w-full shrink-0"
      :class="{ 'welcome-enter welcome-delay-3': entered }"
    >
      <label for="student-name" class="sr-only">Your name</label>

      <div
        class="flex items-center rounded-2xl border-[3px] border-[#C2E8F1] bg-white px-4 py-3.5 transition-colors focus-within:border-[#00A4C8]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="mr-3 h-6 w-6 shrink-0 text-[#7B8B97]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>

        <input
          id="student-name"
          type="text"
          :value="studentName"
          placeholder="What is your name?"
          aria-label="Enter your name"
          autocomplete="given-name"
          class="min-w-0 flex-1 bg-transparent text-lg font-medium text-[#334155] outline-none placeholder:text-[#7B8B97]"
          style="font-family: 'Quicksand', sans-serif"
          @input="onInput"
          @keydown.enter="proceed"
        />
      </div>
    </div>

    <!-- Duckota and speech bubble -->
    <div class="relative z-10 mt-10 flex w-full items-center justify-between gap-3">
      <img
        src="@/assets/mascot/duckuta_greet.png"
        alt="Duckota the duck greeting"
        class="w-[46%] max-w-[180px] shrink-0 select-none"
        :class="{ 'duckota-bounce': entered }"
      />

      <!-- Chat bubble pops in -->
      <div
        class="chat-pop relative mr-1 max-w-[180px] flex-1 rounded-2xl border-2 border-[#CBD5E1] bg-white p-3.5 shadow-[0_3px_0_#CBD5E1]"
        :class="{ 'chat-pop-delay': entered }"
      >
        <p
          class="text-lg font-bold leading-snug text-[#334155]"
          style="font-family: 'Quicksand', sans-serif"
        >
          my name is duckota!
        </p>

        <!-- Tail pointing toward Duckota -->
        <div
          class="absolute -left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-[#CBD5E1] bg-white"
          aria-hidden="true"
        />
      </div>
    </div>

    <!-- Continue: same position as Start -->
    <div
      class="absolute bottom-[calc(var(--welcome-vh,1svh)*20)] left-0 right-0 z-20 flex flex-col items-stretch px-6"
      :class="{ 'welcome-enter welcome-delay-6': entered }"
    >
      <TactileButton
        :disabled="!canContinue"
        aria-label="Continue to schedule setup"
        @click="proceed"
      >
        <span style="font-family: 'Quicksand', sans-serif; font-weight: 700 !important">
          CONTINUE
        </span>
      </TactileButton>
    </div>

    <!-- Static bottom wave -->
    <img
      src="@/assets/props/wave_1.svg"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute -bottom-[16%] -left-[12%] z-0 w-[124%] max-w-none select-none"
    />
  </div>
</template>

<style scoped>
.welcome-enter {
  animation: welcome-appear 450ms ease-out both;
}

.welcome-delay-1 {
  animation-delay: 80ms;
}

.welcome-delay-2 {
  animation-delay: 180ms;
}

.welcome-delay-3 {
  animation-delay: 280ms;
}

.welcome-delay-4 {
  animation-delay: 400ms;
}

.welcome-delay-6 {
  animation-delay: 650ms;
}

.chat-pop-delay {
  animation: chat-pop-in 500ms cubic-bezier(0.16, 1.3, 0.5, 1) 520ms both;
}

@keyframes welcome-appear {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes chat-pop-in {
  0% {
    opacity: 0;
    transform: scale(0.55);
  }

  65% {
    opacity: 1;
    transform: scale(1.08);
  }

  85% {
    transform: scale(0.96);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .welcome-enter,
  .chat-pop-delay {
    animation: none;
  }
}

.duckota-bounce {
  animation: duckota-bounce-in 650ms cubic-bezier(0.34, 1.56, 0.64, 1) 400ms both;
}

@keyframes duckota-bounce-in {
  0% {
    opacity: 0;
    transform: translateY(24px) scale(0.88);
  }

  55% {
    opacity: 1;
    transform: translateY(-12px) scale(1.03);
  }

  78% {
    transform: translateY(4px) scale(0.99);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .duckota-bounce {
    animation: none;
  }
}
</style>
