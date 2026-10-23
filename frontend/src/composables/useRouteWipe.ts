import { ref } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { isReducedMotion } from '@/composables/useNoteTransition'

export const WIPE_COVER_MS = 450
export const WIPE_REVEAL_MS = 550

const origin = ref<{ x: number; y: number } | null>(null)
const covered = ref(false)

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Drives the two-beat "portal" route exit: a cyan disc grows from the press
 * point until it covers the viewport, the route swaps underneath, then a hole
 * opens at the same origin and erases the disc to reveal the new view.
 * Reduced-motion users get the plain navigation.
 */
export function useRouteWipe() {
  const router = useRouter()

  async function wipeTo(
    to: RouteLocationRaw,
    at: { x: number; y: number },
    method: 'push' | 'replace' = 'replace',
  ) {
    if (origin.value || isReducedMotion()) {
      await router[method](to)
      return
    }
    origin.value = at
    // +60ms covers the rAF lag before the disc's scale animation starts.
    await sleep(WIPE_COVER_MS + 60)
    try {
      await router[method](to)
    } finally {
      covered.value = true
    }
    await sleep(WIPE_REVEAL_MS + 60)
    origin.value = null
    covered.value = false
  }

  return { origin, covered, wipeTo }
}

/** Clears wipe state between tests and interrupted sessions. */
export function resetRouteWipe() {
  origin.value = null
  covered.value = false
}
