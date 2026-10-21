import { onMounted, onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'

// Module-level: every mounted top bar reports into one shared inset so
// `ToastShelf` always renders below the deepest visible top bar.
const topBarInset = ref(0)
const bars = new Set<HTMLElement>()

function recompute(): void {
  let bottom = 0
  for (const bar of bars) {
    const edge = bar.getBoundingClientRect().bottom
    if (edge > bottom) {
      bottom = edge
    }
  }
  topBarInset.value = bottom
}

/**
 * Registers a top bar element so toasts stay below it. Pass the bar's
 * template ref. Call without an argument (in `ToastShelf`) to read the inset.
 */
export function useTopBarInset(el?: Ref<HTMLElement | null>): Ref<number> {
  if (el) {
    onMounted(() => {
      if (!el.value) {
        return
      }
      bars.add(el.value)
      recompute()
      // Entrance transitions can move the bar after mount; remeasure once settled.
      requestAnimationFrame(recompute)
      setTimeout(recompute, 350)
    })
    onUnmounted(() => {
      if (el.value) {
        bars.delete(el.value)
      }
      recompute()
    })
  }
  return topBarInset
}
