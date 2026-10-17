import { nextTick } from 'vue'
import type { RouteLocationNormalized, Router } from 'vue-router'

// ponytail: shared-element transition between a note card or the + button and the editor.
const HERO = 'note-hero'
const EDITOR_SELECTOR = '[data-testid="note-editor-container"]'

type StartViewTransition = (update: () => Promise<void> | void) => { finished: Promise<void> }

const startViewTransition =
  typeof document !== 'undefined'
    ? (
        document as unknown as { startViewTransition?: StartViewTransition }
      ).startViewTransition?.bind(document)
    : undefined

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True when the browser supports view transitions and the user allows motion. */
export const heroEnabled = Boolean(startViewTransition) && !prefersReducedMotion

let lastKey: string | null = null
let inFlight = false

function findHero(key: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>('[data-hero-key]')
  return Array.from(nodes).find((el) => el.dataset.heroKey === key) ?? null
}

function nameElement(el: Element | null): void {
  ;(el as HTMLElement | null)?.style.setProperty('view-transition-name', HERO)
}

function clearNames(): void {
  document
    .querySelectorAll<HTMLElement>(`[data-hero-key], ${EDITOR_SELECTOR}`)
    .forEach((el) => el.style.removeProperty('view-transition-name'))
}

const isEditor = (r: RouteLocationNormalized) => r.name === 'note-new' || r.name === 'note-edit'
const isNoteRoute = (r: RouteLocationNormalized) => r.meta.transition === 'note'

/** Call from a click handler right before navigating to the editor. */
export function rememberHero(key: string): void {
  lastKey = key
  if (heroEnabled) {
    nameElement(findHero(key))
  }
}

export function installNoteHero(router: Router): void {
  if (!heroEnabled || !startViewTransition) {
    return
  }
  let domReady: (() => void) | null = null

  router.beforeResolve((to, from) => {
    const isFirstLoad = from.matched.length === 0
    if (inFlight || isFirstLoad || (!isNoteRoute(to) && !isNoteRoute(from))) {
      return undefined
    }
    // Entering the editor from another screen has no card to shrink back into.
    if (isEditor(to) && from.name !== 'notes') {
      lastKey = null
    }
    if (isEditor(from)) {
      nameElement(document.querySelector(EDITOR_SELECTOR))
    }
    return new Promise<void>((resolve) => {
      inFlight = true
      const transition = startViewTransition(() => {
        const updated = new Promise<void>((done) => {
          domReady = done
        })
        resolve()
        return updated
      })
      void transition.finished
        .catch(() => undefined)
        .finally(() => {
          inFlight = false
          clearNames()
        })
    })
  })

  router.afterEach((to) => {
    if (!domReady) {
      return
    }
    const done = domReady
    domReady = null
    void nextTick(() => {
      if (isEditor(to)) {
        nameElement(document.querySelector(EDITOR_SELECTOR))
      } else if (to.name === 'notes' && lastKey) {
        nameElement(findHero(lastKey))
      }
      done()
    })
  })
}
