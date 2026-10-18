<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRightLeft, ChevronRight, Menu, X } from '@lucide/vue'
import { minidenticon } from 'minidenticons'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { user } = useAuth()
const isOpen = ref(false)

const displayName = computed(() => user.value?.username?.trim() || 'No account selected')

const avatarSrc = computed(() => {
  const username = user.value?.username?.trim() || 'student'
  return `data:image/svg+xml;utf8,${encodeURIComponent(minidenticon(username, 70, 50))}`
})

function toggleMenu(): void {
  isOpen.value = !isOpen.value
}

function closeMenu(): void {
  isOpen.value = false
}

function goToSelectAccount(): void {
  closeMenu()
  void router.push('/select-account')
}
</script>

<template>
  <div class="shrink-0">
    <button
      type="button"
      aria-label="Open menu"
      aria-haspopup="dialog"
      aria-controls="nyare-hamburger-drawer"
      :aria-expanded="isOpen"
      data-testid="topbar-menu"
      class="flex h-11 w-11 items-center justify-center rounded-lg text-text-main transition-colors hover:bg-black/5 active:bg-black/10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      @click="toggleMenu"
    >
      <Menu class="h-6 w-6" aria-hidden="true" />
    </button>

    <Teleport to="body">
      <Transition name="nyare-drawer">
        <div
          v-if="isOpen"
          class="fixed inset-0 z-[100]"
          @keydown.esc.window.prevent="closeMenu"
        >
          <button
            type="button"
            class="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-[1px]"
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
            class="menu-drawer-panel absolute inset-y-0 left-0 flex h-[100dvh] w-[min(78vw,360px)] flex-col overflow-y-auto border-r border-app-border bg-app-bg shadow-2xl"
          >
            <header
              class="flex items-center justify-between border-b border-app-border px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)]"
            >
              <span
                aria-label="Nyare logo"
                data-testid="nyare-wordmark"
                class="font-logo text-3xl font-bold leading-none tracking-tight text-primary"
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
                <div class="flex items-center gap-3 rounded-2xl border border-app-border bg-card p-3 shadow-sm">
                  <img
                    :src="avatarSrc"
                    :alt="`${displayName} profile picture`"
                    data-testid="menu-profile-avatar"
                    class="h-12 w-12 shrink-0 rounded-full border border-app-border bg-white object-cover"
                  />
                  <div class="min-w-0">
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
                </div>
              </section>

              <button
                type="button"
                data-testid="select-account-item"
                class="flex min-h-12 w-full items-center gap-3 rounded-xl border border-app-border bg-card px-4 py-3 text-left font-semibold text-text-main transition-colors hover:bg-black/5 active:bg-black/10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                @click="goToSelectAccount"
              >
                <ArrowRightLeft class="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <span class="flex-1">Select Account</span>
                <ChevronRight class="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
              </button>

              <p v-if="!user" class="px-1 text-sm text-text-muted">
                Choose a profile to get started.
              </p>
            </div>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.nyare-drawer-enter-active,
.nyare-drawer-leave-active {
  transition: opacity 180ms ease;
}

.nyare-drawer-enter-active .menu-drawer-panel,
.nyare-drawer-leave-active .menu-drawer-panel {
  transition: transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.nyare-drawer-enter-from,
.nyare-drawer-leave-to {
  opacity: 0;
}

.nyare-drawer-enter-from .menu-drawer-panel,
.nyare-drawer-leave-to .menu-drawer-panel {
  transform: translateX(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .nyare-drawer-enter-active,
  .nyare-drawer-leave-active,
  .nyare-drawer-enter-active .menu-drawer-panel,
  .nyare-drawer-leave-active .menu-drawer-panel {
    transition-duration: 0.01ms;
  }
}
</style>
