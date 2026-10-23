<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import ToastShelf from '@/components/ToastShelf.vue'
import RouteWipeOverlay from '@/components/RouteWipeOverlay.vue'

// Crossfade applies only when the account picker enters or leaves; the
// sign-in portal wipe keeps ownership of its exit and other routes swap plain.
const routeFade = ref(false)
useRouter().beforeEach((to, from) => {
  routeFade.value = to.name === 'select-account' || from.name === 'select-account'
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition :name="routeFade ? 'route-fade' : 'route-none'">
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

@media (prefers-reduced-motion: reduce) {
  .route-fade-enter-active,
  .route-fade-leave-active {
    animation: none;
  }
}
</style>
