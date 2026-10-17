<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
import { clearSessionUser, setSessionUser, useAuth } from '@/composables/useAuth'
import type { UserResponse } from '@/types/api'
import duckotaCasual from '@/assets/mascot/duckota_casual.png'

const router = useRouter()
const { user: sessionUser } = useAuth()

function handleBack(): void {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const users = ref<UserResponse[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const authenticatingId = ref<number | null>(null)
const errorMessage = ref<string | null>(null)

// Manage mode state
const isManageMode = ref(false)
const userToDelete = ref<UserResponse | null>(null)
const isDeleting = ref(false)

// Add account modal state
const showAddModal = ref(false)
const newUsername = ref('')
const formError = ref<string | null>(null)

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

async function selectAccount(user: UserResponse): Promise<void> {
  if (isManageMode.value || authenticatingId.value !== null || isSubmitting.value) {
    return
  }
  authenticatingId.value = user.id
  errorMessage.value = null
  try {
    const sessionUser = await authApi.login({ username: user.username })
    setSessionUser(sessionUser)
    await router.push('/')
  } catch (err: unknown) {
    authenticatingId.value = null
    errorMessage.value = err instanceof Error ? err.message : 'Failed to sign in. Please try again.'
  }
}

function openAddModal(): void {
  newUsername.value = ''
  formError.value = null
  showAddModal.value = true
}

function closeAddModal(): void {
  showAddModal.value = false
  formError.value = null
  newUsername.value = ''
}

async function handleCreateAccount(): Promise<void> {
  const trimmed = newUsername.value.trim()
  if (!trimmed) {
    formError.value = 'Please enter your username.'
    return
  }
  if (trimmed.length < 2) {
    formError.value = 'Username must be at least 2 characters.'
    return
  }
  if (trimmed.length > 50) {
    formError.value = 'Username must not exceed 50 characters.'
    return
  }

  formError.value = null
  isSubmitting.value = true
  errorMessage.value = null

  try {
    const created = await authApi.register({ username: trimmed })
    users.value = [...users.value, created]
    const sessionUser = await authApi.login({ username: created.username })
    setSessionUser(sessionUser)
    await router.push('/welcome')
  } catch (err: unknown) {
    isSubmitting.value = false
    formError.value =
      err instanceof Error ? err.message : 'Could not create account. Please try again.'
  }
}

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
      clearSessionUser()
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
  <div
    class="relative min-h-screen w-full overflow-x-hidden bg-[#F6F7EE] text-[#334155] font-['Quicksand'] select-none"
  >
    <!-- Main Wireframe Mobile Container -->
    <main
      class="relative z-10 mx-auto flex min-h-screen max-w-[420px] flex-col justify-between px-5 pt-6 pb-8"
    >
      <!-- TOP SECTION (Green Doodle in Wireframe) -->
      <header class="divide-y-2">
        <!-- Brand Header Bar with Back Button and Manage Toggle -->
        <div class="flex items-center justify-between pb-5">
          <div class="flex items-center gap-3">
            <button
              type="button"
              data-testid="back-button"
              class="flex h-10 w-10 items-center justify-center rounded-xl border-2 text-[#94A3B8] hover:border-0 hover:bg-[#00A4C8]/10 hover:text-[#00A4C8] transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#00A4C8]/45 focus-visible:outline-offset-2"
              aria-label="Go back"
              @click="handleBack"
            >
              <ArrowLeft class="h-5 w-5" />
            </button>

            <h1
              class="font-['DynaPuff'] text-4xl sm:text-5xl font-bold tracking-tight text-[#00A4C8] leading-none drop-shadow-xs"
            >
              'Nyare
            </h1>
          </div>

          <!-- Manage Mode Toggle -->
          <button
            v-if="users.length > 0 && !isLoading"
            type="button"
            class="flex h-9 items-center justify-center rounded-xl px-3.5 text-xs font-bold transition-all duration-75 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#00A4C8]/45 focus-visible:outline-offset-2 active:translate-y-0.5 active:shadow-none"
            :class="[
              isManageMode
                ? 'bg-[#00A4C8] border-b-[3px] border-[#007B99] text-white hover:bg-[#0096B7]'
                : 'bg-white/60 border border-[#CBD5E1] border-b-[3px] border-b-[#94A3B8] text-[#334155] hover:border-[#00A4C8] hover:border-b-[#007B99] hover:text-[#00A4C8]',
            ]"
            @click="isManageMode = !isManageMode"
          >
            {{ isManageMode ? 'Done' : 'Manage' }}
          </button>
        </div>

        <!-- Mascot Section (Speech Bubble on Left, Duckota on Right) -->
        <div class="flex items-center gap-3.5 my-3 px-1">
          <div
            class="relative flex-1 rounded-2xl border-2 border-[#CBD5E1] bg-white p-3.5 shadow-[0_3px_0_#CBD5E1]"
          >
            <h2 class="text-lg font-bold text-[#334155] leading-snug" aria-live="polite">
              <template v-if="isLoading"> Checking records... </template>
              <template v-else-if="users.length === 0">
                Ready to study? Add your profile!
              </template>
              <template v-else-if="isManageMode"> Which account are we editing? </template>
              <template v-else> Who's studying? </template>
            </h2>
            <!-- Tail pointing right towards Duckota -->
            <div
              class="absolute -right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 border-r-2 border-t-2 border-[#CBD5E1] bg-white"
            ></div>
          </div>

          <div class="relative shrink-0">
            <img
              :src="duckotaCasual"
              alt="Duckota Mascot"
              class="h-28 sm:h-32 w-auto object-contain drop-shadow-sm transition-transform duration-200 hover:scale-105"
            />
          </div>
        </div>
      </header>

      <!-- MIDDLE SECTION (Red Boxes in Wireframe: Account Items) -->
      <section class="my-6 flex-1 flex flex-col">
        <!-- Error Banner -->
        <div
          v-if="errorMessage"
          role="alert"
          class="mb-4 flex items-start gap-3 rounded-2xl border-2 border-[#FCA5A5] bg-[#FEF2F2] p-3 text-sm text-[#991B1B]"
        >
          <AlertCircle class="h-5 w-5 shrink-0 text-[#DC2626] mt-0.5" />
          <div class="flex-1">
            <p class="font-bold">Notice</p>
            <p class="font-['Inter'] text-xs text-[#B91C1C]">{{ errorMessage }}</p>
          </div>
          <button
            type="button"
            class="rounded-lg p-1 text-[#991B1B] hover:bg-[#FEE2E2]"
            aria-label="Dismiss error"
            @click="errorMessage = null"
          >
            <CloseIcon class="h-4 w-4" />
          </button>
        </div>

        <!-- Loading Skeletons -->
        <div
          v-if="isLoading"
          class="rounded-2xl border border-[#D5D9CE] bg-[#ECEFE6]/90 divide-y divide-[#DCE0D5] overflow-hidden"
          aria-busy="true"
          aria-label="Loading profiles"
        >
          <div v-for="i in 3" :key="i" class="flex items-center gap-3.5 px-4 py-3.5 animate-pulse">
            <div class="h-11 w-11 rounded-xl bg-[#D5D9CE] shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-1/3 rounded bg-[#D5D9CE]"></div>
              <div class="h-3 w-1/2 rounded bg-[#DCE0D5]"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="users.length === 0"
          class="rounded-2xl border border-dashed border-[#D5D9CE] bg-[#ECEFE6]/50 p-6 text-center"
        >
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#DCE0D5]/70 text-[#7B8B97] mb-2"
          >
            <UserIcon class="h-6 w-6" />
          </div>
          <h2 class="text-base font-bold text-[#334155]">No student accounts yet</h2>
          <p class="font-['Inter'] text-xs text-[#7B8B97] mt-1">
            Tap the button below to add your first student profile.
          </p>
        </div>

        <!-- Populated Account List (Single Grouped Container with Dividers) -->
        <div
          v-else
          class="rounded-2xl border border-[#D5D9CE] bg-[#ECEFE6]/90 divide-y divide-[#DCE0D5] overflow-hidden shadow-2xs"
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
                : 'hover:bg-[#E3E7DC] active:bg-[#D9DDD1] cursor-pointer',
            ]"
            @click="selectAccount(user)"
          >
            <!-- Account Identicon and Username -->
            <div class="flex items-center gap-3.5 min-w-0">
              <div
                class="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[#D5D9CE] bg-white/80 transition-transform"
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
                  class="truncate text-base font-bold text-[#334155] group-hover:text-[#00A4C8] transition-colors"
                >
                  {{ user.username }}
                </h3>
                <p class="font-['Inter'] text-xs text-[#64748B]">
                  Joined {{ formatDate(user.createdAt) }}
                </p>
              </div>
            </div>

            <!-- Action: Delete (in Manage Mode) or Indicator (in Normal Mode) -->
            <div class="pl-2 shrink-0">
              <button
                v-if="isManageMode"
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] transition-all hover:bg-[#FEE2E2] active:scale-95 cursor-pointer"
                aria-label="Delete student profile"
                @click.stop="promptDeleteUser(user)"
              >
                <TrashIcon class="h-4.5 w-4.5" />
              </button>

              <div v-else class="flex items-center">
                <Loader2
                  v-if="authenticatingId === user.id"
                  class="h-5 w-5 animate-spin text-[#00A4C8]"
                />
                <ChevronRight
                  v-else
                  class="h-5 w-5 text-[#94A3B8] group-hover:text-[#00A4C8] group-hover:translate-x-0.5 transition-transform"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- BOTTOM SECTION (Blue Box in Wireframe: Add Account Button) -->
      <footer class="pt-2">
        <button
          type="button"
          class="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#00A4C8] border-b-4 border-[#007B99] text-base font-bold text-white uppercase tracking-wider transition-all duration-75 hover:bg-[#0096B7] active:translate-y-1 active:border-b-0 cursor-pointer shadow-xs"
          @click="openAddModal"
        >
          <PlusIcon class="h-5 w-5" />
          <span>Add Account</span>
        </button>
      </footer>
    </main>

    <!-- Create Account Modal Dialog -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-modal-title"
    >
      <div
        class="w-full max-w-sm rounded-3xl border-2 border-[#CBD5E1]/80 bg-[#FDFEF7] p-6 shadow-2xl"
      >
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2">
            <span class="inline-block h-2 w-2 rounded-full bg-[#00A4C8]" />
            <h2 id="add-modal-title" class="text-lg font-bold tracking-tight text-[#1E293B]">
              Add Student Profile
            </h2>
          </div>
          <button
            type="button"
            class="rounded-full p-1.5 text-[#94A3B8] hover:bg-slate-200/60 hover:text-[#1E293B] transition-colors cursor-pointer"
            aria-label="Close dialog"
            @click="closeAddModal"
          >
            <CloseIcon class="h-4 w-4" />
          </button>
        </div>

        <form @submit.prevent="handleCreateAccount" class="space-y-4">
          <div
            class="flex items-center gap-3.5 rounded-2xl border border-[#CBD5E1]/70 bg-white p-2.5 shadow-xs"
          >
            <div
              class="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#94A3B8]/30 bg-[#F8FAFC] shadow-inner"
            >
              <img
                :src="getIdenticonUrl(newUsername || 'new-student')"
                alt="Identicon preview"
                class="h-full w-full object-cover transition-transform duration-150"
              />
            </div>

            <div class="relative flex-1 pr-1">
              <label for="modal-username-input-v1" class="sr-only">Username</label>
              <input
                id="modal-username-input-v1"
                v-model="newUsername"
                type="text"
                maxlength="50"
                autofocus
                placeholder="Enter your username..."
                class="h-10 w-full bg-transparent px-1 text-sm font-semibold text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-hidden"
                :disabled="isSubmitting"
              />
            </div>
          </div>

          <p
            v-if="formError"
            role="alert"
            class="font-['Inter'] text-xs font-semibold text-[#DC2626]"
          >
            {{ formError }}
          </p>

          <div class="flex items-center gap-2.5 pt-2">
            <button
              type="submit"
              class="flex h-12 flex-1 items-center justify-center rounded-2xl bg-[#00A4C8] border-b-[5px] border-[#007B99] text-xs font-black text-white uppercase tracking-wider transition-all duration-75 hover:bg-[#0096B7] active:translate-y-1 active:border-b-0 disabled:opacity-60 cursor-pointer shadow-md"
              :disabled="isSubmitting"
            >
              <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin mr-2" />
              <span>{{ isSubmitting ? 'Creating...' : 'Create & Enter' }}</span>
            </button>
            <button
              type="button"
              class="flex h-12 items-center justify-center rounded-2xl border-2 border-[#CBD5E1] bg-white px-4 text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#334155] active:scale-95 transition-all cursor-pointer"
              @click="closeAddModal"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal Dialog -->
    <div
      v-if="userToDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div class="w-full max-w-sm rounded-2xl border-2 border-[#FCA5A5] bg-white p-5 shadow-lg">
        <div class="flex items-center gap-3 mb-3 text-[#DC2626]">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#FEF2F2]">
            <TrashIcon class="h-5 w-5" />
          </div>
          <h2 id="delete-modal-title" class="text-lg font-bold text-[#991B1B]">Delete Profile</h2>
        </div>

        <p class="font-['Inter'] text-sm text-[#475569] mb-4">
          Are you sure you want to delete
          <strong class="text-[#334155]">{{ userToDelete.username }}</strong
          >? This action cannot be undone.
        </p>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#DC2626] border-b-4 border-[#991B1B] text-sm font-bold text-white uppercase tracking-wider transition-all duration-75 hover:bg-[#B91C1C] active:translate-y-1 active:border-b-0 disabled:opacity-60 cursor-pointer"
            :disabled="isDeleting"
            @click="executeDeleteUser"
          >
            <Loader2 v-if="isDeleting" class="h-4 w-4 animate-spin mr-2" />
            <span>{{ isDeleting ? 'Deleting...' : 'Delete' }}</span>
          </button>
          <button
            type="button"
            class="flex h-11 items-center justify-center rounded-xl border-2 border-[#CBD5E1] px-4 text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] active:translate-y-0.5 cursor-pointer"
            :disabled="isDeleting"
            @click="cancelDeleteUser"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
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
</style>
