<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouteWipe, WIPE_COVER_MS, WIPE_REVEAL_MS } from '@/composables/useRouteWipe'

const { origin, covered } = useRouteWipe()

// The hole needs one painted frame at size 0 before it grows, or the reveal
// starts partway open.
const grown = ref(false)
watch(
  covered,
  async (isCovered) => {
    if (!isCovered) {
      grown.value = false
      return
    }
    await nextTick()
    requestAnimationFrame(() => {
      grown.value = true
    })
  },
  { flush: 'post' },
)

// Radius to the farthest viewport corner, so both beats clear the screen.
const radius = computed(() => {
  const at = origin.value
  if (!at) return 0
  return Math.hypot(
    Math.max(at.x, window.innerWidth - at.x),
    Math.max(at.y, window.innerHeight - at.y),
  )
})

const discStyle = computed(() => {
  const at = origin.value
  if (!at) return {}
  const r = radius.value
  return {
    left: `${at.x - r}px`,
    top: `${at.y - r}px`,
    width: `${r * 2}px`,
    height: `${r * 2}px`,
    animationDuration: `${WIPE_COVER_MS}ms`,
  }
})

const holeStyle = computed(() => {
  const at = origin.value
  if (!at) return {}
  return {
    left: `${at.x}px`,
    top: `${at.y}px`,
    '--hole-d': `${radius.value * 2}px`,
    transitionDuration: `${WIPE_REVEAL_MS}ms`,
  }
})
</script>

<template>
  <div v-if="origin" class="veil" aria-hidden="true">
    <div v-if="!covered" class="disc" :style="discStyle" />
    <!-- The hole is a transparent circle whose box-shadow floods the viewport
         cyan. Growing its border-box subtracts the cover from the center out. -->
    <div v-else class="hole" :class="{ grown }" :style="holeStyle" />
  </div>
</template>

<style scoped>
.veil {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
}

.disc {
  position: absolute;
  border-radius: 9999px;
  background: var(--color-primary);
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

.hole {
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 9999px;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 200vmax var(--color-primary);
  transition-property: width, height;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

.hole.grown {
  width: var(--hole-d);
  height: var(--hole-d);
}
</style>
