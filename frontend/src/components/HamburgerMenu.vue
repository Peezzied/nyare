<script setup lang="ts">
import { computed, onUnmounted, ref, type CSSProperties } from 'vue'
import { Archive, ArrowRightLeft, ChevronRight, GraduationCap, Menu, X } from '@lucide/vue'
import { onKeyStroke } from '@vueuse/core'
import { minidenticon } from 'minidenticons'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { isReducedMotion } from '@/composables/useNoteTransition'
import { resolveSwipe } from '@/utils/swipeGesture'
import HeaderIconButton from './HeaderIconButton.vue'

const SETTLE_MS = 220
const SCRIM_MS = 180
const COMMIT_PROGRESS = 0.5
const DRAG_LOCK_PX = 8

const router = useRouter()
const { user } = useAuth()

const isOpen = ref(false)
const mounted = ref(false)
const dragX = ref(0)
const settling = ref(false)
const panelWidth = ref(0)

let settleTimer = 0

const displayName = computed(() => user.value?.username?.trim() || 'No account selected')

const avatarSrc = computed(() => {
  const username = user.value?.username?.trim() || 'student'
  return `data:image/svg+xml;utf8,${encodeURIComponent(minidenticon(username, 70, 50))}`
})

const panelStyle = computed(() => ({
  transform: `translateX(${dragX.value}px)`,
  transition: settling.value
    ? `transform ${settleDuration()}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
    : 'none',
}))

const scrimStyle = computed<CSSProperties>(() => ({
  opacity: panelWidth.value > 0 ? clamp01(1 - Math.abs(dragX.value) / panelWidth.value) : 0,
  transition: settling.value ? `opacity ${scrimDuration()}ms ease` : 'none',
  pointerEvents: isOpen.value ? 'auto' : 'none',
}))

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function settleDuration(): number {
  return isReducedMotion() ? 0 : SETTLE_MS
}

function scrimDuration(): number {
  return isReducedMotion() ? 0 : SCRIM_MS
}

function measurePanelWidth(): number {
  panelWidth.value = Math.max(1, Math.min(Math.round(window.innerWidth * 0.78), 360))
  return panelWidth.value
}

function finalize(target: 'open' | 'closed'): void {
  window.clearTimeout(settleTimer)
  settling.value = false
  dragX.value = 0
  isOpen.value = target === 'open'
  mounted.value = target === 'open'
}

function releaseTo(target: 'open' | 'closed'): void {
  const width = panelWidth.value

  if (target === 'closed' && dragX.value <= -width) {
    finalize('closed')
    return
  }
  if (target === 'open' && dragX.value >= 0) {
    finalize('open')
    return
  }

  settling.value = true
  dragX.value = target === 'open' ? 0 : -width
  const duration = settleDuration()
  window.clearTimeout(settleTimer)
  settleTimer = window.setTimeout(() => finalize(target), duration + (duration > 0 ? 20 : 0))
}

function openMenu(): void {
  if (isOpen.value || mounted.value) return

  measurePanelWidth()
  mounted.value = true
  settling.value = false
  dragX.value = -panelWidth.value

  requestAnimationFrame(() => {
    // Hold the closed position for one frame so the browser paints it.
    requestAnimationFrame(() => {
      if (!mounted.value) return
      settling.value = true
      dragX.value = 0
      const duration = settleDuration()
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => finalize('open'), duration + (duration > 0 ? 20 : 0))
    })
  })
}

function closeMenu(): void {
  if (!mounted.value) return
  releaseTo('closed')
}

function toggleMenu(): void {
  if (isOpen.value || mounted.value) {
    closeMenu()
    return
  }
  openMenu()
}

type DragMode = 'open' | 'close'

interface DragState {
  pointerId: number | null
  mode: DragMode
  startX: number
  startY: number
  startTime: number
  startOffset: number
}

const drag: DragState = {
  pointerId: null,
  mode: 'close',
  startX: 0,
  startY: 0,
  startTime: 0,
  startOffset: 0,
}

let axisLock: 'none' | 'horizontal' | 'vertical' = 'none'

function beginGesture(mode: DragMode, event: PointerEvent): void {
  if (drag.pointerId !== null || !event.isPrimary) return

  if (mode === 'open') {
    if (isOpen.value || mounted.value) return
    measurePanelWidth()
    mounted.value = true
    settling.value = false
    dragX.value = -panelWidth.value
  } else if (!mounted.value) {
    return
  }

  drag.pointerId = event.pointerId
  drag.mode = mode
  drag.startX = event.clientX
  drag.startY = event.clientY
  drag.startTime = performance.now()
  drag.startOffset = dragX.value
  axisLock = 'none'

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerCancel)
}

function onPointerMove(event: PointerEvent): void {
  if (drag.pointerId !== event.pointerId) return

  const dx = event.clientX - drag.startX
  const dy = event.clientY - drag.startY

  if (axisLock === 'none') {
    if (Math.abs(dx) < DRAG_LOCK_PX && Math.abs(dy) < DRAG_LOCK_PX) return
    if (Math.abs(dx) <= Math.abs(dy) * 1.2) {
      const mode = drag.mode
      axisLock = 'vertical'
      endGesture()
      if (mode === 'open') releaseTo('closed')
      return
    }

    axisLock = 'horizontal'
    window.clearTimeout(settleTimer)
    settling.value = false
  }

  if (axisLock !== 'horizontal') return

  const width = panelWidth.value
  dragX.value = Math.max(-width, Math.min(0, drag.startOffset + dx))
}

function onPointerUp(event: PointerEvent): void {
  if (drag.pointerId !== event.pointerId) return

  const dx = event.clientX - drag.startX
  const dy = event.clientY - drag.startY
  const mode = drag.mode
  const width = panelWidth.value
  const startOffset = drag.startOffset
  const flick = resolveSwipe(dx, dy, performance.now() - drag.startTime)
  const horizontal = axisLock === 'horizontal'

  endGesture()

  if (!horizontal) {
    if (flick !== 0) {
      releaseTo(flick === -1 ? 'open' : 'closed')
    } else if (mode === 'open') {
      releaseTo('closed')
    }
    return
  }

  const offset = Math.max(-width, Math.min(0, startOffset + dx))
  const progress = width > 0 ? (offset + width) / width : 0
  const shouldOpen = flick === -1 ? true : flick === 1 ? false : progress > COMMIT_PROGRESS
  releaseTo(shouldOpen ? 'open' : 'closed')
}

function onPointerCancel(event: PointerEvent): void {
  if (drag.pointerId !== event.pointerId) return
  const mode = drag.mode
  endGesture()
  releaseTo(mode === 'open' ? 'closed' : 'open')
}

function endGesture(): void {
  drag.pointerId = null
  axisLock = 'none'
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerCancel)
}

onKeyStroke('Escape', () => {
  if (mounted.value) closeMenu()
})

function goToManageCourses(): void {
  closeMenu()
  void router.push({ name: 'manage-courses' })
}

function goToArchive(): void {
  closeMenu()
  void router.push({ name: 'archive' })
}

function goToSelectAccount(): void {
  closeMenu()
  void router.push('/select-account')
}

onUnmounted(() => {
  window.clearTimeout(settleTimer)
  endGesture()
})
</script>

<template>
  <div class="shrink-0">
    <HeaderIconButton
      aria-label="Open menu"
      aria-haspopup="dialog"
      aria-controls="nyare-hamburger-drawer"
      :aria-expanded="isOpen"
      data-testid="topbar-menu"
      class="focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      @click="toggleMenu"
    >
      <Menu class="h-6 w-6" aria-hidden="true" />
    </HeaderIconButton>

    <div
      v-if="!isOpen"
      data-testid="menu-edge-swipe"
      aria-hidden="true"
      class="fixed inset-y-0 left-0 z-morph w-4 touch-pan-y select-none"
      @pointerdown="beginGesture('open', $event)"
    />

    <Teleport to="body">
      <div v-if="mounted" class="pointer-events-none fixed inset-0 z-wipe">
        <button
          type="button"
          class="absolute inset-0 h-full w-full bg-scrim"
          :style="scrimStyle"
          aria-label="Close menu"
          data-testid="hamburger-backdrop"
          @click="closeMenu"
        />

        <aside
          id="nyare-hamburger-drawer"
          data-testid="account-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Nyare menu"
          tabindex="-1"
          class="pointer-events-auto absolute inset-y-0 left-0 flex h-[100dvh] w-[min(78vw,360px)] touch-pan-y flex-col overflow-y-auto border-r border-app-border bg-app-bg shadow-2xl"
          :style="panelStyle"
          @pointerdown="beginGesture('close', $event)"
        >
          <header
            class="flex items-center justify-between border-b border-app-border px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)]"
          >
            <span
              aria-label="Nyare logo"
              data-testid="nyare-wordmark"
              class="font-logo text-4xl font-bold leading-none tracking-tight text-primary"
            >
              'Nyare
            </span>
            <button
              type="button"
              aria-label="Close menu"
              class="flex h-10 w-10 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-black/5 hover:text-text-main focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              @click="closeMenu"
            >
              <X class="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div class="flex flex-1 flex-col gap-5 p-4">
            <section aria-label="Current profile">
              <div
                class="flex items-center gap-3 rounded-2xl border border-app-border bg-card p-3 shadow-sm"
              >
                <img
                  :src="avatarSrc"
                  :alt="`${displayName} profile picture`"
                  data-testid="menu-profile-avatar"
                  class="h-12 w-12 shrink-0 rounded-full border border-app-border bg-card object-cover"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Current profile
                  </p>
                  <p
                    data-testid="menu-profile-name"
                    class="mt-1 truncate text-base font-bold text-text-main"
                  >
                    {{ displayName }}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Select account"
                  data-testid="select-account-item"
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-black/5 active:bg-black/10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                  @click="goToSelectAccount"
                >
                  <ArrowRightLeft class="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </section>

            <button
              type="button"
              data-testid="manage-courses-item"
              class="flex min-h-12 w-full items-center gap-3 rounded-xl border border-app-border bg-card px-4 py-3 text-left font-semibold text-text-main transition-colors hover:bg-black/5 active:bg-black/10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              @click="goToManageCourses"
            >
              <GraduationCap class="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span class="flex-1">Manage courses</span>
              <ChevronRight class="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
            </button>

            <button
              type="button"
              data-testid="archive-item"
              class="flex min-h-12 w-full items-center gap-3 rounded-xl border border-app-border bg-card px-4 py-3 text-left font-semibold text-text-main transition-colors hover:bg-black/5 active:bg-black/10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              @click="goToArchive"
            >
              <Archive class="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span class="flex-1">Archive</span>
              <ChevronRight class="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
            </button>

            <p v-if="!user" class="px-1 text-sm text-text-muted">
              Choose a profile to get started.
            </p>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>
