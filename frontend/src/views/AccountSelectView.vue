<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  User as UserIcon,
  Plus as PlusIcon,
  Trash2 as TrashIcon,
  ChevronRight,
  AlertCircle,
  Loader2,
  X as CloseIcon,
  ArrowLeft,
} from '@lucide/vue'
import { minidenticon } from 'minidenticons'
import { authApi } from '@/api'
import OnboardingShell from '@/components/OnboardingShell.vue'
import DialogShell from '@/components/ui/DialogShell.vue'
import { Button } from '@/components/ui/button'
import { endSession, setSessionUser, useAuth } from '@/composables/useAuth'
import { useRouteWipe } from '@/composables/useRouteWipe'
import type { UserResponse } from '@/types/api'
import duckotaCasual from '@/assets/mascot/duckota_casual.png'

const router = useRouter()
const { user: sessionUser } = useAuth()
const { wipeTo } = useRouteWipe()

function handleBack(): void {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const users = ref<UserResponse[]>([])
const isLoading = ref(true)
const authenticatingId = ref<number | null>(null)
const errorMessage = ref<string | null>(null)

// Manage mode state
const isManageMode = ref(false)
const userToDelete = ref<UserResponse | null>(null)
const isDeleting = ref(false)

const showAddAccountConfirm = ref(false)
const isStartingOnboarding = ref(false)

function getIdenticonUrl(username: string): string {
  const clean = username.trim() || 'student'
  return `data:image/svg+xml;utf8,${encodeURIComponent(minidenticon(clean, 70, 50))}`
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return 'Active student'
  }
}

async function loadUsers(): Promise<void> {
  isLoading.value = true
  errorMessage.value = null
  try {
    users.value = await authApi.listUsers()
  } catch (err: unknown) {
    errorMessage.value =
      err instanceof Error ? err.message : 'Could not load student accounts. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function selectAccount(user: UserResponse, event: MouseEvent): Promise<void> {
  if (isManageMode.value || authenticatingId.value !== null) {
    return
  }
  // Capture the portal origin before the first await, while currentTarget lives.
  const target = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  const rect = target?.getBoundingClientRect()
  const at = {
    x: event.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth / 2),
    y: event.clientY || (rect ? rect.top + rect.height / 2 : window.innerHeight / 2),
  }
  authenticatingId.value = user.id
  errorMessage.value = null
  try {
    const sessionUser = await authApi.login({ username: user.username })
    setSessionUser(sessionUser)
    // The disc swallows the picker only after a successful sign-in; a failure
    // must leave the error message visible with no cover.
    await wipeTo('/', at, 'push')
  } catch (err: unknown) {
    authenticatingId.value = null
    errorMessage.value = err instanceof Error ? err.message : 'Failed to sign in. Please try again.'
  }
}

function promptAddAccount(): void {
  // A signed-in user must confirm: adding an account signs them out.
  if (sessionUser.value) {
    showAddAccountConfirm.value = true
    return
  }
  void goToOnboarding()
}

async function goToOnboarding(): Promise<void> {
  // Adding an account starts a fresh onboarding: end the current session so
  // the router gate admits `/welcome` and the name form registers a new user.
  if (sessionUser.value) {
    isStartingOnboarding.value = true
    try {
      await authApi.logout()
    } catch {
      // A failed logout is safe to ignore: the login inside onboarding
      // replaces the server session, and local state is cleared below.
    }
    endSession()
    isStartingOnboarding.value = false
    showAddAccountConfirm.value = false
  }
  void router.push({ path: '/welcome', query: { from: 'accounts' } })
}

const isDeleteDialogOpen = computed({
  get: () => userToDelete.value !== null,
  set: (open: boolean) => {
    if (!open) {
      userToDelete.value = null
    }
  },
})

function promptDeleteUser(user: UserResponse): void {
  userToDelete.value = user
}

function cancelDeleteUser(): void {
  userToDelete.value = null
}

async function executeDeleteUser(): Promise<void> {
  const target = userToDelete.value
  if (!target || isDeleting.value) {
    return
  }

  isDeleting.value = true
  errorMessage.value = null

  try {
    await authApi.deleteUser(target.id)
    if (sessionUser.value?.id === target.id) {
      endSession()
    }
    users.value = users.value.filter((u) => u.id !== target.id)
    userToDelete.value = null
    if (users.value.length === 0) {
      isManageMode.value = false
    }
  } catch (err: unknown) {
    errorMessage.value =
      err instanceof Error ? err.message : 'Failed to delete account. Please try again.'
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <OnboardingShell page class="pt-6">
    <!-- TOP SECTION (Green Doodle in Wireframe) -->
      <header>
        <!-- Brand Header Bar with Back Button and Manage Toggle -->
        <div
          class="-mx-5 flex items-center justify-between border-b-[3px] border-app-border px-5 pb-5"
        >
          <div class="flex items-center gap-3">
            <button
              type="button"
              data-testid="back-button"
              class="flex h-10 w-10 items-center justify-center rounded-xl border-2 text-text-muted hover:border-0 hover:bg-primary/10 hover:text-primary transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary/45 focus-visible:outline-offset-2"
              aria-label="Go back"
              @click="handleBack"
            >
              <ArrowLeft class="h-5 w-5" />
            </button>

            <h1
              class="font-logo text-4xl sm:text-5xl font-bold tracking-tight text-primary leading-none drop-shadow-xs"
            >
              'Nyare
            </h1>
          </div>

          <!-- Manage Mode Toggle -->
          <button
            v-if="users.length > 0 && !isLoading"
            type="button"
            class="flex h-9 items-center justify-center rounded-xl px-3.5 text-xs font-bold transition-all duration-75 cursor-pointer focus-visible:outline-2 focus-visible:outline-primary/45 focus-visible:outline-offset-2 active:translate-y-0.5 active:shadow-none"
            :class="[
              isManageMode
                ? 'bg-primary border-b-[3px] border-primary-bevel text-white hover:bg-primary-hover'
                : 'bg-card/60 border border-app-border border-b-[3px] border-b-text-muted text-text-main hover:border-primary hover:border-b-primary-bevel hover:text-primary',
            ]"
            @click="isManageMode = !isManageMode"
          >
            {{ isManageMode ? 'Done' : 'Manage' }}
          </button>
        </div>

        <!-- Mascot Section (Speech Bubble on Left, Duckota on Right) -->
        <div class="flex items-center gap-3.5 my-3 px-1">
          <div
            class="chat-pop relative flex-1 rounded-2xl border-2 border-app-border bg-card p-3.5 shadow-bevel-ghost"
          >
            <h2 class="text-lg font-bold text-text-main leading-snug" aria-live="polite">
              <template v-if="isLoading"> Checking records... </template>
              <template v-else-if="users.length === 0">
                Ready to study? Add your profile!
              </template>
              <template v-else-if="isManageMode"> Which account are we editing? </template>
              <template v-else> Who's studying? </template>
            </h2>
            <!-- Tail pointing right towards Duckota -->
            <div
              class="absolute -right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 border-r-2 border-t-2 border-app-border bg-card"
            ></div>
          </div>

          <div class="relative shrink-0">
            <img
              :src="duckotaCasual"
              alt="Duckota Mascot"
              class="duckota-speak h-28 sm:h-32 w-auto object-contain drop-shadow-sm"
            />
          </div>
        </div>
      </header>

      <!-- MIDDLE SECTION (Red Boxes in Wireframe: Account Items) -->
      <section class="fade-enter fade-delay-2 my-6 flex min-h-0 flex-1 flex-col overflow-y-auto">
        <!-- Error Banner -->
        <div
          v-if="errorMessage"
          role="alert"
          class="mb-4 flex items-start gap-3 rounded-2xl border-2 border-destructive-line bg-destructive-soft p-3 text-sm text-destructive-bevel"
        >
          <AlertCircle class="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div class="flex-1">
            <p class="font-bold">Notice</p>
            <p class="font-secondary text-xs text-destructive-hover">{{ errorMessage }}</p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1 text-destructive-bevel hover:bg-destructive-line"
            aria-label="Dismiss error"
            @click="errorMessage = null"
          >
            <CloseIcon class="h-4 w-4" />
          </button>
        </div>

        <!-- Loading Skeletons -->
        <div
          v-if="isLoading"
          class="rounded-2xl border border-skeleton-lo bg-skeleton-hi/90 divide-y divide-skeleton overflow-hidden"
          aria-busy="true"
          aria-label="Loading profiles"
        >
          <div v-for="i in 3" :key="i" class="flex items-center gap-3.5 px-4 py-3.5 animate-pulse">
            <div class="h-11 w-11 rounded-xl bg-skeleton-lo shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-1/3 rounded bg-skeleton-lo"></div>
              <div class="h-3 w-1/2 rounded bg-skeleton"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="users.length === 0"
          class="rounded-2xl border border-dashed border-skeleton-lo bg-skeleton-hi/50 p-6 text-center"
        >
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-skeleton/70 text-text-muted mb-2"
          >
            <UserIcon class="h-6 w-6" />
          </div>
          <h2 class="text-base font-bold text-text-main">No student accounts yet</h2>
          <p class="font-secondary text-xs text-text-muted mt-1">
            Tap the button below to add your first student profile.
          </p>
        </div>

        <!-- Populated Account List (Single Grouped Container with Dividers) -->
        <div
          v-else
          class="rounded-2xl border border-skeleton-lo bg-skeleton-hi/90 divide-y divide-skeleton shadow-2xs"
          :class="{
            'max-h-[364px] overflow-y-auto': users.length > 5,
          }"
          role="list"
          aria-label="Student accounts"
        >
          <div
            v-for="user in users"
            :key="user.id"
            role="listitem"
            class="group relative flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors duration-100"
            :class="[
              isManageMode
                ? 'bg-transparent'
                : 'hover:bg-skeleton-hi active:bg-skeleton-lo cursor-pointer',
            ]"
            @click="selectAccount(user, $event)"
          >
            <!-- Account Identicon and Username -->
            <div class="flex items-center gap-3.5 min-w-0">
              <div
                class="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-skeleton-lo bg-card/80 transition-transform"
                :class="{ 'animate-jiggle': isManageMode }"
              >
                <img
                  :src="getIdenticonUrl(user.username)"
                  :alt="user.username + ' avatar'"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div class="min-w-0">
                <h3
                  class="truncate text-base font-bold text-text-main group-hover:text-primary transition-colors"
                >
                  {{ user.username }}
                </h3>
                <p class="font-secondary text-xs text-text-muted">
                  Joined {{ formatDate(user.createdAt) }}
                </p>
              </div>
            </div>

            <!-- Action: Delete (in Manage Mode) or Indicator (in Normal Mode) -->
            <div class="pl-2 shrink-0">
              <button
                v-if="isManageMode"
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-xl border border-destructive-line bg-destructive-soft text-destructive transition-all hover:bg-destructive-line active:scale-95 cursor-pointer"
                aria-label="Delete student profile"
                @click.stop="promptDeleteUser(user)"
              >
                <TrashIcon class="h-4.5 w-4.5" />
              </button>

              <div v-else class="flex items-center">
                <Loader2
                  v-if="authenticatingId === user.id"
                  class="h-5 w-5 animate-spin text-primary"
                />
                <ChevronRight
                  v-else
                  class="h-5 w-5 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-transform"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- BOTTOM SECTION (Blue Box in Wireframe: Add Account Button) -->
      <footer class="fade-enter fade-delay-3 pt-2">
        <Button
          type="button"
          variant="tactile"
          size="touch"
          class="h-14 w-full rounded-2xl text-base uppercase tracking-wider"
          @click="promptAddAccount"
        >
          <PlusIcon class="h-5 w-5" />
          <span>Add Account</span>
        </Button>
      </footer>

    <!-- Add Account Sign-out Confirmation -->
    <DialogShell
      v-model:open="showAddAccountConfirm"
      title="Add a new account?"
      :busy="isStartingOnboarding"
    >
      <p class="mt-2 font-secondary text-sm text-text-muted">
        You will be signed out of
        <strong class="text-text-main">{{ sessionUser?.username }}</strong> first. The account stays
        on this list and you can sign back in anytime.
      </p>

      <template #actions="{ disabled, dismiss }">
        <Button
          type="button"
          variant="secondary"
          size="touch"
          data-testid="add-account-cancel"
          :disabled="disabled"
          @click="dismiss"
        >
          Cancel
        </Button>

        <Button
          type="button"
          variant="tactile"
          size="touch"
          data-testid="add-account-confirm"
          :disabled="disabled"
          :aria-busy="isStartingOnboarding"
          @click="goToOnboarding"
        >
          Add account
        </Button>
      </template>
    </DialogShell>

    <!-- Delete Account Confirmation -->
    <DialogShell
      v-model:open="isDeleteDialogOpen"
      title="Delete Profile"
      :busy="isDeleting"
      @cancel="cancelDeleteUser"
    >
      <p class="mt-2 font-secondary text-sm text-text-muted">
        Are you sure you want to delete
        <strong class="text-text-main">{{ userToDelete?.username }}</strong
        >? This action cannot be undone.
      </p>

      <template #actions="{ disabled, dismiss }">
        <Button
          type="button"
          variant="secondary"
          size="touch"
          data-testid="delete-account-cancel"
          :disabled="disabled"
          @click="dismiss"
        >
          Cancel
        </Button>

        <Button
          type="button"
          variant="tactile-destructive"
          size="touch"
          data-testid="delete-account-confirm"
          :disabled="disabled"
          :aria-busy="isDeleting"
          @click="executeDeleteUser"
        >
          <Loader2 v-if="isDeleting" class="h-4 w-4 animate-spin" />
          {{ isDeleting ? 'Deleting...' : 'Delete' }}
        </Button>
      </template>
    </DialogShell>
  </OnboardingShell>
</template>

<style scoped>
@keyframes avatar-jiggle {
  0% {
    transform: rotate(-1.5deg) translate(-0.5px, 0);
  }
  50% {
    transform: rotate(1.5deg) translate(0.5px, -0.5px);
  }
  100% {
    transform: rotate(-1.5deg) translate(-0.5px, 0);
  }
}

.animate-jiggle {
  animation: avatar-jiggle 0.3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

[role='listitem']:nth-child(even) .animate-jiggle {
  animation-duration: 0.32s;
  animation-direction: reverse;
}

@media (prefers-reduced-motion: reduce) {
  .animate-jiggle {
    animation: none;
  }
}

.fade-enter {
  animation: fade-in 450ms ease-out both;
}

.fade-delay-2 {
  animation-delay: 1200ms;
}

.fade-delay-3 {
  animation-delay: 1300ms;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.duckota-speak {
  animation:
    fade-in 400ms ease-out 100ms both,
    duckota-speak 1s steps(1, end) 700ms 1 both;
}

@keyframes duckota-speak {
  0% {
    transform: translateY(0);
  }

  12.5% {
    transform: translateY(-3px) rotate(1deg);
  }

  25% {
    transform: translateY(1px) rotate(-0.5deg);
  }

  37.5% {
    transform: translateY(-2px) rotate(0.5deg);
  }

  50% {
    transform: translateY(1px) rotate(-0.5deg);
  }

  62.5% {
    transform: translateY(-3px) rotate(1deg);
  }

  75% {
    transform: translateY(2px) rotate(-1deg);
  }

  87.5% {
    transform: translateY(-2px) rotate(0.5deg);
  }

  100% {
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter,
  .duckota-speak,
  .chat-pop {
    animation: none;
  }
}

.chat-pop {
  animation: chat-pop-in 500ms cubic-bezier(0.16, 1.3, 0.5, 1) 700ms both;
}
</style>
