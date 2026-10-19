<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { Search } from '@lucide/vue'
import NoteCard from '@/components/NoteCard.vue'
import PictureNoteCard from '@/components/PictureNoteCard.vue'
import HeaderIconButton from '@/components/HeaderIconButton.vue'
import NoteEditorModal from '@/components/notes/NoteEditorModal.vue'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import type { NoteSummaryResponse } from '@/types/api'
import type { NoteModalTriggerKind, TapOriginRect } from '@/types/notesTransition'
import { useCatalog } from '@/composables/useCatalog'
import { useNotes } from '@/composables/useNotes'
import { useShellHeader } from '@/composables/useShellHeader'
import { toTapOriginRect } from '@/composables/useNoteTransition'

// ponytail: the search button is visual-only and has no action.
useShellHeader({
  title: 'Notes',
  left: () => h(HamburgerMenu),
  right: () =>
    h(HeaderIconButton, { 'aria-label': 'Search', 'data-testid': 'topbar-search' }, () =>
      h(Search, { class: 'h-6 w-6' }),
    ),
})

const catalog = useCatalog()

const rootEl = ref<HTMLElement | null>(null)

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
  <div ref="rootEl" class="flex min-h-full mx-auto w-full">
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

    <div v-else class="mt-6 w-full columns-2 gap-4" data-testid="notes-grid">
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
          :photo-url="pictureNote.photoUrl"
          :course-id="pictureNote.note.courseId"
          :course-name="courseNameFor(pictureNote.note)"
          :badge-color="badgeColorFor(pictureNote.note)"
          :title="pictureNote.note.title"
          :text="pictureNote.note.preview"
          :entry-date="pictureNote.note.entryDate"
          @open="openNote(pictureNote.note.id, $event)"
        />
      </div>
    </div>

    <Teleport :to="rootEl" :disabled="!rootEl">
      <button
        type="button"
        aria-label="Add note"
        data-testid="notes-fab"
        @click="newNote($event)"
        class="absolute right-4 bottom-4 z-10 flex min-h-14 min-w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </Teleport>

    <NoteEditorModal
      :is-open="modalOpen"
      :note-id="modalNoteId"
      :origin-rect="modalOrigin"
      @close="modalOpen = false"
      @saved="loadNotes(true)"
    />
  </div>
</template>
