import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { AnimationPhase, TapOriginRect } from '@/types/notesTransition'

export const EXPAND_DURATION_MS = 320
export const COLLAPSE_DURATION_MS = 240
export const CONTENT_DELAY_MS = 100
export const CONTROLS_DELAY_MS = 180
export const REDUCED_MOTION_DURATION_MS = 150

interface MorphRegistration {
  handlePopState: () => void
  handleEscape: (e: KeyboardEvent) => void
  isIdle: () => boolean
}

const activeMorphStack: MorphRegistration[] = []
let globalListenersAttached = false

function getTopActiveMorph(): MorphRegistration | null {
  while (activeMorphStack.length > 0) {
    const top = activeMorphStack[activeMorphStack.length - 1]
    if (top && !top.isIdle()) {
      return top
    }
    activeMorphStack.pop()
  }
  return null
}

function onGlobalPopState() {
  const top = getTopActiveMorph()
  top?.handlePopState()
}

function onGlobalKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  const top = getTopActiveMorph()
  top?.handleEscape(e)
}

function ensureGlobalListeners() {
  if (globalListenersAttached || typeof window === 'undefined') return
  window.addEventListener('popstate', onGlobalPopState)
  window.addEventListener('keydown', onGlobalKeyDown)
  globalListenersAttached = true
}

function teardownGlobalListeners() {
  if (!globalListenersAttached || activeMorphStack.length > 0 || typeof window === 'undefined') return
  window.removeEventListener('popstate', onGlobalPopState)
  window.removeEventListener('keydown', onGlobalKeyDown)
  globalListenersAttached = false
}

export function resetActiveMorphStack(): void {
  activeMorphStack.length = 0
  teardownGlobalListeners()
}

function safeRaf(cb: () => void) {
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(cb)
  } else {
    cb()
  }
}

let pendingOrigin: TapOriginRect | null = null

/**
 * Stores the tapped element rect for the next route-driven editor open.
 * The rect must live outside the view so a remount during navigation can
 * still seed the expansion.
 */
export function setNoteMorphOrigin(rect: TapOriginRect | null): void {
  pendingOrigin = rect
}

/** Returns the stored origin once, or null when a route open carries none. */
export function takeNoteMorphOrigin(): TapOriginRect | null {
  const rect = pendingOrigin
  pendingOrigin = null
  return rect
}

export function isReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Geometry for the expanded container: the app frame when one is supplied and laid
 * out, so the overlay never outgrows the centred column. Falls back to the viewport.
 */
export function calculateTargetStyle(frameEl?: HTMLElement | null): Record<string, string> {
  if (frameEl) {
    const rect = frameEl.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      return {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        borderRadius: getComputedStyle(frameEl).borderRadius || '0px',
      }
    }
  }

  const w = typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : 390
  const viewportH = typeof window !== 'undefined' ? window.visualViewport?.height : undefined
  const innerH = typeof window !== 'undefined' ? window.innerHeight : 0
  const h = viewportH && viewportH > 0 ? viewportH : innerH > 0 ? innerH : 844
  return {
    top: '0px',
    left: '0px',
    width: `${w}px`,
    height: `${h}px`,
    borderRadius: '0px',
  }
}

/** Pixel geometry matching the tapped element, or the target when origin is unknown. */
export function getOriginStyle(origin: TapOriginRect | null): Record<string, string> {
  if (!origin) {
    return calculateTargetStyle()
  }
  return {
    top: `${origin.top}px`,
    left: `${origin.left}px`,
    width: `${origin.width}px`,
    height: `${origin.height}px`,
    borderRadius: origin.borderRadius,
  }
}

/** Captures an element's viewport rect and computed corner radius. */
export function toTapOriginRect(el: Element): TapOriginRect {
  const rect = el.getBoundingClientRect()
  const borderRadius = getComputedStyle(el).borderRadius || '16px'
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    borderRadius,
  }
}

export interface ContainerMorphOptions {
  /** Whether the overlay is open. Re-evaluated whenever the source changes. */
  isOpen: () => boolean
  /**
   * Viewport geometry of the element that triggered the expansion. When null,
   * the overlay uses the opacity crossfade instead of a spatial morph.
   */
  originRect: () => TapOriginRect | null
  /** Marker stored in the ephemeral history entry, e.g. 'nyareNoteModal'. */
  historyKey: string
  /** Element the expanded container fits. Defaults to the viewport. */
  frameEl?: () => HTMLElement | null
  /**
   * Intercepts dismiss requests (Escape, backdrop, device back). Return true when
   * the consumer keeps the overlay open, e.g. an unsaved-changes dialog.
   */
  onDismiss?: () => boolean
  /** Runs when the collapse finishes. Emit the host's close event here. */
  onClosed?: () => void
}

/**
 * Shared container-transform choreography for overlay modals: expands from the
 * tapped rect over 320ms, contracts back over 240ms, keeps an ephemeral history
 * entry for device back gestures, locks body scroll, and falls back to a 150ms
 * opacity crossfade under reduced motion or when no origin rect exists.
 */
export function useContainerMorph(options: ContainerMorphOptions) {
  const rootRef = ref<HTMLElement | null>(null)
  const containerRef = ref<HTMLElement | null>(null)
  const phase = ref<AnimationPhase>('idle')
  const isTransitioning = ref(false)
  const isExpanded = ref(false)
  const showContent = ref(false)
  const showControls = ref(false)
  const cardStyle = ref<Record<string, string>>({})
  const reduced = ref(false)
  const closeReduced = ref(false)
  const sessionKey = ref(0)

  // A forced-reduced close (e.g. delete, where the origin row is gone) uses the
  // opacity fade even when reduced motion is off.
  const fadeMode = computed(() => reduced.value || closeReduced.value)

  let phaseTimer: ReturnType<typeof setTimeout> | null = null
  let contentTimer: ReturnType<typeof setTimeout> | null = null
  let controlsTimer: ReturnType<typeof setTimeout> | null = null
  let pushedHistory = false

  const registration: MorphRegistration = {
    handlePopState: () => {
      if (phase.value === 'collapsing' || phase.value === 'idle') {
        return
      }
      pushedHistory = false
      dismiss(false)
      // A consumer that keeps the overlay open (e.g. an unsaved-changes dialog) needs
      // the history entry restored after the back gesture consumed it. The dismiss
      // may have collapsed synchronously, so re-read the phase without narrowing.
      if ((phase.value as AnimationPhase) !== 'collapsing') {
        pushHistoryState()
      }
    },
    handleEscape: (e: KeyboardEvent) => {
      if (rootRef.value && e.composedPath().includes(rootRef.value)) {
        return
      }
      dismiss(true)
    },
    isIdle: () => phase.value === 'idle',
  }

  function registerMorph() {
    if (!activeMorphStack.includes(registration)) {
      activeMorphStack.push(registration)
      ensureGlobalListeners()
    }
  }

  function unregisterMorph() {
    const idx = activeMorphStack.indexOf(registration)
    if (idx !== -1) {
      activeMorphStack.splice(idx, 1)
    }
    teardownGlobalListeners()
  }

  const targetStyle = () => calculateTargetStyle(options.frameEl?.() ?? null)

  function clearAllTimers() {
    if (phaseTimer) clearTimeout(phaseTimer)
    if (contentTimer) clearTimeout(contentTimer)
    if (controlsTimer) clearTimeout(controlsTimer)
    phaseTimer = null
    contentTimer = null
    controlsTimer = null
  }

  function pushHistoryState() {
    if (!pushedHistory && typeof window !== 'undefined') {
      try {
        window.history.pushState({ [options.historyKey]: true }, '')
        pushedHistory = true
      } catch {
        // Ignore if history API is unavailable in test environment
      }
    }
  }

  function runExpansion() {
    // A second open request while the container is already open is ignored.
    if (phase.value === 'expanding' || phase.value === 'settled') {
      return
    }

    registerMorph()
    clearAllTimers()
    // No origin rect means nothing to morph from, so open (and later close)
    // use the same 150ms opacity crossfade as reduced motion.
    reduced.value = isReducedMotion() || options.originRect() === null
    closeReduced.value = false
    phase.value = 'expanding'
    isTransitioning.value = false
    isExpanded.value = false

    cardStyle.value = reduced.value ? targetStyle() : getOriginStyle(options.originRect())

    pushHistoryState()
    // Move focus into the dialog so Escape reaches it.
    void nextTick(() => rootRef.value?.focus({ preventScroll: true }))

    if (reduced.value) {
      // Opacity crossfade only: no spatial transition, no staggered entrance.
      showContent.value = true
      showControls.value = true
      nextTick(() => {
        if (containerRef.value) {
          void containerRef.value.offsetHeight
        }
        safeRaf(() => {
          isExpanded.value = true
          phaseTimer = setTimeout(() => {
            phase.value = 'settled'
          }, REDUCED_MOTION_DURATION_MS)
        })
      })
      return
    }

    showContent.value = false
    showControls.value = false

    nextTick(() => {
      // Force browser reflow to commit initial origin geometry before transition starts
      if (containerRef.value) {
        void containerRef.value.offsetHeight
      }

      safeRaf(() => {
        isTransitioning.value = true
        isExpanded.value = true
        cardStyle.value = targetStyle()

        contentTimer = setTimeout(() => {
          showContent.value = true
        }, CONTENT_DELAY_MS)

        controlsTimer = setTimeout(() => {
          showControls.value = true
        }, CONTROLS_DELAY_MS)

        phaseTimer = setTimeout(() => {
          phase.value = 'settled'
        }, EXPAND_DURATION_MS)
      })
    })
  }

  function requestClose(triggerHistoryBack = true, forceReduced = false) {
    if (phase.value === 'collapsing' || phase.value === 'idle') {
      return
    }

    const useReduced = reduced.value || forceReduced
    closeReduced.value = forceReduced

    clearAllTimers()
    phase.value = 'collapsing'
    isTransitioning.value = !useReduced
    showContent.value = false
    showControls.value = false
    isExpanded.value = false

    if (!useReduced) {
      cardStyle.value = getOriginStyle(options.originRect())
    }

    if (triggerHistoryBack && pushedHistory && typeof window !== 'undefined') {
      pushedHistory = false
      try {
        if (window.history.state?.[options.historyKey]) {
          window.history.back()
        }
      } catch {
        // Ignore in tests
      }
    }

    phaseTimer = setTimeout(
      () => {
        phase.value = 'idle'
        isTransitioning.value = false
        unregisterMorph()
        if (typeof document !== 'undefined') {
          document.body.style.overflow = ''
        }
        options.onClosed?.()
      },
      useReduced ? REDUCED_MOTION_DURATION_MS : COLLAPSE_DURATION_MS,
    )
  }

  /** Dismiss entry point for Escape, backdrop taps, and device back gestures. */
  function dismiss(triggerHistoryBack = true) {
    if (phase.value !== 'expanding' && phase.value !== 'settled') {
      return
    }
    if (options.onDismiss?.()) {
      return
    }
    requestClose(triggerHistoryBack)
  }

  function onViewportResize() {
    if (isExpanded.value && phase.value !== 'collapsing') {
      cardStyle.value = targetStyle()
    }
  }

  watch(
    options.isOpen,
    (open) => {
      if (open) {
        sessionKey.value += 1
        if (typeof document !== 'undefined') {
          document.body.style.overflow = 'hidden'
        }
        runExpansion()
      } else {
        unregisterMorph()
        if (typeof document !== 'undefined') {
          document.body.style.overflow = ''
        }
        clearAllTimers()
        phase.value = 'idle'
        isTransitioning.value = false
        isExpanded.value = false
        showContent.value = false
        showControls.value = false
        closeReduced.value = false
        pushedHistory = false
      }
    },
    { immediate: true },
  )

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onViewportResize)
      window.visualViewport?.addEventListener('resize', onViewportResize)
    }
  })

  onUnmounted(() => {
    unregisterMorph()
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onViewportResize)
      window.visualViewport?.removeEventListener('resize', onViewportResize)
    }
    clearAllTimers()
  })

  return {
    rootRef,
    containerRef,
    phase,
    isTransitioning,
    isExpanded,
    showContent,
    showControls,
    cardStyle,
    fadeMode,
    sessionKey,
    dismiss,
    requestClose,
  }
}
