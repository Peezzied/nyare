<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import NoteCard from '@/components/NoteCard.vue'
import PictureNoteCard from '@/components/PictureNoteCard.vue'
import NavigationBar from '@/components/NavigationBar.vue'
import NoteEditorModal from '@/components/notes/NoteEditorModal.vue'
import { getCourseColor, type CoursePaletteColor } from '@/constants/palette'
import type { NoteSummaryResponse } from '@/types/api'
import type { NoteModalTriggerKind, TapOriginRect } from '@/types/notesTransition'
import { useCatalog } from '@/composables/useCatalog'
import { useNotes } from '@/composables/useNotes'
import { toTapOriginRect } from '@/composables/useNoteTransition'
import { devPreviewCourseNames, devPreviewNotes } from '@/api/mocks/notesDevPreview'
import {
  pictureNotePreview,
  prototypeBadgeFor,
  prototypePreviewEnabled,
} from '@/api/mocks/notesPrototypePreview'

const catalog = useCatalog()
const router = useRouter()

const modalOpen = ref(false)
const modalNoteId = ref<string | null>(null)
const modalOrigin = ref<TapOriginRect | null>(null)
const modalTrigger = ref<NoteModalTriggerKind | null>(null)

function openModal(options: {
  originRect: TapOriginRect | null
  noteId: string | null
  triggerKind: NoteModalTriggerKind
}) {
  // A second tap while the overlay is up is a fast double-tap; ignore it.
  if (modalOpen.value) {
    return
  }
  modalOrigin.value = options.originRect
  modalNoteId.value = options.noteId
  modalTrigger.value = options.triggerKind
  modalOpen.value = true
}

function openNote(id: string, event?: Event) {
  const el = (event?.currentTarget ?? event?.target) as Element | null
  openModal({
    originRect: el ? toTapOriginRect(el) : null,
    noteId: id,
    triggerKind: 'card',
  })
}

function newNote(event?: Event) {
  const el = event?.currentTarget as Element | null
  openModal({
    originRect: el ? toTapOriginRect(el) : null,
    noteId: null,
    triggerKind: 'fab',
  })
}
const { notes, pictureNote, loading, error, loadNotes, getCourseName, getBadgeColor } = useNotes()

const isAccountMenuOpen = ref(false)

function toggleAccountMenu(): void {
  isAccountMenuOpen.value = !isAccountMenuOpen.value
}

function goToSelectAccount(): void {
  isAccountMenuOpen.value = false
  router.push('/select-account')
}

const courseNames = computed(() => {
  const names = new Map<number, string>()
  for (const course of catalog.courses.value) {
    names.set(course.id, course.name)
  }
  return names
})

function courseNameFor(note: NoteSummaryResponse): string | undefined {
  return getCourseName(note.courseId, courseNames.value)
}

function badgeColorFor(note: NoteSummaryResponse) {
  return getBadgeColor(note.courseId)
}

onMounted(async () => {
  await catalog.loadCatalog()
  await loadNotes(true)
})
</script>

<template>
  <!-- ponytail: prototype header and button are visual-only and have no actions. -->
  <main class="mx-auto w-full max-w-3xl px-4 pb-20">
    <header
      class="sticky top-0 z-10 -mx-4 flex h-14 items-center border-b-[3px] border-app-border bg-app-bg px-4"
      data-testid="notes-topbar"
    >
      <div class="flex w-full items-center">
        <div class="relative">
          <button
            type="button"
            aria-label="Menu"
            aria-haspopup="true"
            :aria-expanded="isAccountMenuOpen"
            data-testid="topbar-menu"
            class="flex h-11 w-11 items-center justify-center rounded-lg text-text-main transition-colors hover:bg-black/5 active:bg-black/10"
            @click="toggleAccountMenu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <!-- In-place account menu, mirroring the day-view dropdown pattern -->
          <div
            v-if="isAccountMenuOpen"
            class="fixed inset-0 z-20"
            @click="isAccountMenuOpen = false"
          />
          <div
            v-if="isAccountMenuOpen"
            data-testid="account-menu"
            class="absolute top-12 left-1 z-30 w-44 rounded-2xl border border-app-border bg-card px-4 py-3 shadow-lg"
          >
            <button
              type="button"
              data-testid="select-account-item"
              class="w-full text-left text-base font-semibold text-text-main"
              @click="goToSelectAccount"
            >
              Select Account
            </button>
          </div>
        </div>
        <h1
          class="flex-1 text-center font-sans text-xl font-bold tracking-tight text-text-main"
          data-testid="notes-title"
        >
          Notes
        </h1>
        <button
          type="button"
          aria-label="Search"
          data-testid="topbar-search"
          class="flex h-11 w-11 items-center justify-center rounded-lg text-text-main transition-colors hover:bg-black/5 active:bg-black/10"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
            <path
              d="m16.5 16.5 4 4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </header>

    <p
      v-if="loading && notes.length === 0"
      class="mt-6 text-center text-sm text-text-muted"
      data-testid="notes-loading"
    >
      Notes are loading.
    </p>

    <div
      v-else-if="error"
      class="mt-6 rounded-2xl border border-app-border bg-card p-6 text-center"
      data-testid="notes-error"
      role="alert"
    >
      <p class="font-sans text-base font-semibold text-text-main">Notes failed to load.</p>
      <p class="mt-1 text-sm text-text-muted">{{ error }}</p>
      <button
        class="btn-tactile mt-4 rounded-xl px-4 py-2 font-sans text-sm font-bold text-white"
        type="button"
        @click="loadNotes(true)"
      >
        Retry
      </button>
    </div>

    <p
      v-else-if="notes.length === 0"
      class="mt-6 text-center text-sm text-text-muted"
      data-testid="notes-empty"
    >
      No notes exist yet.
    </p>

    <div v-else class="mt-6 columns-2 gap-4" data-testid="notes-grid">
      <div v-for="note in notes" :key="note.id" class="break-inside-avoid pb-4">
        <NoteCard
          :note="note"
          :course-name="courseNameFor(note)"
          :badge-color="badgeColorFor(note)"
          @open="openNote(note.id, $event)"
        />
      </div>
      <div v-if="pictureNote" class="break-inside-avoid pb-4">
        <PictureNoteCard
          :photo-url="pictureNotePreview.photoUrl"
          :course-id="pictureNotePreview.note.courseId"
          :course-name="courseNameFor(pictureNotePreview.note)"
          :badge-color="badgeColorFor(pictureNotePreview.note)"
          :title="pictureNotePreview.note.title"
          :text="pictureNotePreview.note.preview"
          :entry-date="pictureNotePreview.note.entryDate"
          @open="openNote(pictureNotePreview.note.id, $event)"
        />
      </div>
    </div>

    <button
      type="button"
      aria-label="Add note"
      data-testid="notes-fab"
      @click="newNote($event)"
      class="fixed right-6 bottom-20 z-10 flex min-h-14 min-w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>

    <NoteEditorModal
      :is-open="modalOpen"
      :note-id="modalNoteId"
      :origin-rect="modalOrigin"
      @close="modalOpen = false"
      @saved="loadNotes(true)"
    />

    <NavigationBar />
  </main>
</template>
