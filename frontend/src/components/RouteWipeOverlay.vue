<script setup lang="ts">
import { computed } from 'vue'
import { useRouteWipe, WIPE_COVER_MS } from '@/composables/useRouteWipe'

const { origin, covered } = useRouteWipe()

// The disc centers on the press point, sized to reach the farthest corner.
const discStyle = computed(() => {
  const at = origin.value
  if (!at) return {}
  const r = Math.hypot(
    Math.max(at.x, window.innerWidth - at.x),
    Math.max(at.y, window.innerHeight - at.y),
  )
  return {
    left: `${at.x - r}px`,
    top: `${at.y - r}px`,
    width: `${r * 2}px`,
    height: `${r * 2}px`,
    animationDuration: `${WIPE_COVER_MS}ms`,
  }
})
</script>

<template>
  <div v-if="origin" class="veil" :class="{ 'veil-out': covered }" aria-hidden="true">
    <div class="disc" :style="discStyle" />
  </div>
</template>

<style scoped>
.veil {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
}

.veil-out {
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.disc {
  position: absolute;
  border-radius: 9999px;
  background: #00a4c8;
  animation: disc-grow cubic-bezier(0.5, 0, 0.9, 0.4) both;
}

@keyframes disc-grow {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}
</style>
