<script setup lang="ts">
import { useRouter } from 'vue-router'
import OnboardingShell from '@/components/OnboardingShell.vue'
import TactileButton from '@/components/TactileButton.vue'

const router = useRouter()

function begin() {
  router.push('/select-account')
}
</script>

<template>
  <OnboardingShell show-sun show-cloud show-wave class="items-center px-6">
    <!-- Brand title -->
    <div class="relative z-10 flex w-full flex-col items-center pt-[17svh]">
      <h1
        class="font-logo text-8xl font-semibold leading-tight tracking-tight text-primary sm:text-8xl"
      >
        'Nyare
      </h1>

      <p class="mt-1 font-sans text-lg font-bold tracking-wide text-text-muted">
        para di ma yare
      </p>
    </div>

    <!-- Mascot section -->
    <div class="absolute left-6 right-6 top-[50%] z-10 flex -translate-y-1/2 flex-col items-center">
      <div class="relative flex w-full items-end justify-center">
        <!-- Plant -->
        <img
          src="@/assets/props/plant.png"
          alt=""
          aria-hidden="true"
          class="pointer-events-none absolute bottom-[-5%] left-0 z-0 w-18 select-none sm:w-16 grass-appear"
        />

        <!-- Duckota -->
        <img
          src="@/assets/mascot/duckota_in_stone.png"
          alt="Duckota the duck mascot on a stone"
          loading="eager"
          fetchpriority="high"
          decoding="sync"
          class="relative z-10 w-70 select-none sm:w-72"
        />

        <!-- Starfish -->
        <img
          src="@/assets/props/star_fish.png"
          alt=""
          aria-hidden="true"
          class="pointer-events-none absolute bottom-[65%] right-7 z-20 w-13 select-none sm:w-14 starfish-rise"
        />
      </div>
    </div>

    <!-- CTA: original TactileButton sizing preserved -->
    <div class="absolute bottom-[20svh] left-0 right-0 z-20 flex flex-col items-stretch px-6">
      <TactileButton aria-label="Get started with Nyare" @click="begin">
        <span>GET STARTED</span>
      </TactileButton>
    </div>

    <!-- Shell decorative: above the waves -->
    <img
      src="@/assets/props/shell.png"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute bottom-[12%] left-1/3 z-10 w-9 -translate-x-1/2 select-none sm:w-10 shell-rise"
    />
  </OnboardingShell>
</template>

<style scoped>
/* Grass/plant: materializes, grows in, then settles */
.grass-appear {
  transform-origin: bottom center;
  animation: grass-appear 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes grass-appear {
  0% {
    opacity: 0;
    transform: scale(0.15) translateY(12px);
    filter: blur(5px);
  }
  65% {
    opacity: 1;
    transform: scale(1.06) translateY(-2px);
    filter: blur(0);
  }
  82% {
    transform: scale(0.97) translateY(1px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0);
  }
}

/* Starfish: slides upward into position */
.starfish-rise {
  animation: starfish-rise 750ms cubic-bezier(0.16, 1, 0.3, 1) 250ms both;
}

@keyframes starfish-rise {
  0% {
    opacity: 0;
    transform: translateY(55px) rotate(-12deg);
  }
  75% {
    opacity: 1;
    transform: translateY(-4px) rotate(3deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotate(0);
  }
}

/* Shell: enters from below, moving in the reverse direction */
.shell-rise {
  animation: shell-rise 800ms cubic-bezier(0.16, 1, 0.3, 1) 450ms both;
}

@keyframes shell-rise {
  0% {
    opacity: 0;
    transform: translate(-50%, 65px) rotate(160deg) scale(0.75);
  }
  75% {
    opacity: 1;
    transform: translate(-50%, -4px) rotate(-8deg) scale(1.03);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) rotate(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .grass-appear,
  .starfish-rise,
  .shell-rise {
    animation: none;
    opacity: 1;
    filter: none;
  }
}
</style>
