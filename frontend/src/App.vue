<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import ToastShelf from '@/components/ToastShelf.vue'
import RouteWipeOverlay from '@/components/RouteWipeOverlay.vue'

// The account picker and the setup-complete finale crossfade. The onboarding
// stepper (start → welcome → create-schedule) slides with step direction.
// The sign-in portal wipe keeps ownership of its exit; other routes swap plain.
const ONBOARDING_STEP_ORDER = ['start', 'welcome', 'create-schedule']

const routeTransition = ref('route-none')
useRouter().beforeEach((to, from) => {
  if (to.name === 'select-account' || from.name === 'select-account') {
    routeTransition.value = 'route-fade'
    return
  }
  if (from.name === 'create-schedule' && to.name === 'setup-complete') {
    routeTransition.value = 'route-fade-slow'
    return
  }
  const fromStep = ONBOARDING_STEP_ORDER.indexOf(from.name as string)
  const toStep = ONBOARDING_STEP_ORDER.indexOf(to.name as string)
  routeTransition.value =
    fromStep !== -1 && toStep !== -1 && fromStep !== toStep
      ? toStep > fromStep
        ? 'route-slide-next'
        : 'route-slide-prev'
      : 'route-none'
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition :name="routeTransition">
      <component :is="Component" />
    </Transition>
  </RouterView>
  <ToastShelf />
  <RouteWipeOverlay />
</template>

<style scoped>
/* Keyframe-driven (not enter-from/enter-to class swaps): the animation
   completes on its own even if Vue's rAF class swap stalls, so a stalled
   frame can never leave the new view invisible. */
.route-fade-enter-active {
  animation: route-fade-in 180ms ease-out both;
}

/* The leaving view is pulled out of flow so it crossfades over the incoming
   one without pushing it down, and stays harmless if removal stalls. */
.route-fade-leave-active {
  position: fixed;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  animation: route-fade-out 140ms ease-in both;
}

@keyframes route-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes route-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* Finale handoff: a slower, gentler crossfade into the celebration. */
.route-fade-slow-enter-active {
  animation: route-fade-in 560ms ease-out both;
}

.route-fade-slow-leave-active {
  position: fixed;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  animation: route-fade-out 420ms ease-in both;
}

/* Stepper push: the new step slides over the old one while the old one
   recedes a third of its width and dims, reading as a lateral step forward. */
.route-slide-next-enter-active {
  position: relative;
  z-index: 40;
  box-shadow: -16px 0 32px -16px rgba(30, 41, 59, 0.25);
  animation: route-slide-next-in 320ms cubic-bezier(0.32, 0.72, 0, 1) both;
}

.route-slide-next-leave-active {
  position: fixed;
  inset: 0;
  pointer-events: none;
  animation: route-slide-next-out 320ms cubic-bezier(0.32, 0.72, 0, 1) both;
}

/* Stepper pop: the departing step slides away on top, revealing the previous
   step as it drifts back into place underneath. */
.route-slide-prev-leave-active {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  box-shadow: -16px 0 32px -16px rgba(30, 41, 59, 0.25);
  animation: route-slide-prev-out 320ms cubic-bezier(0.32, 0.72, 0, 1) both;
}

.route-slide-prev-enter-active {
  animation: route-slide-prev-in 320ms cubic-bezier(0.32, 0.72, 0, 1) both;
}

@keyframes route-slide-next-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes route-slide-next-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-28%);
    opacity: 0.55;
  }
}

@keyframes route-slide-prev-in {
  from {
    transform: translateX(-28%);
    opacity: 0.55;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes route-slide-prev-out {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .route-fade-enter-active,
  .route-fade-leave-active,
  .route-fade-slow-enter-active,
  .route-fade-slow-leave-active {
    animation: none;
  }

  /* Spatial movement drops out; a quick crossfade keeps the state change
     legible instead of cutting. */
  .route-slide-next-enter-active,
  .route-slide-prev-enter-active {
    box-shadow: none;
    animation: route-fade-in 180ms ease-out both;
  }

  .route-slide-next-leave-active,
  .route-slide-prev-leave-active {
    box-shadow: none;
    animation: route-fade-out 140ms ease-in both;
  }
}
</style>
