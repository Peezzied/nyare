<script setup lang="ts">
import { computed, h, onActivated, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from '@lucide/vue'
import NoteCard from '@/components/NoteCard.vue'
import HeaderIconButton from '@/components/HeaderIconButton.vue'
import NoteEditorModal from '@/components/notes/NoteEditorModal.vue'
import AddFab from '@/components/AddFab.vue'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import type { NoteSummaryResponse } from '@/types/api'
import type { TapOriginRect } from '@/types/notesTransition'
import { useCatalog } from '@/composables/useCatalog'
import { useNotes } from '@/composables/useNotes'
import { useShellHeader } from '@/composables/useShellHeader'
import {
  setNoteMorphOrigin,
  takeNoteMorphOrigin,
  toTapOriginRect,
} from '@/composables/useNoteTransition'
import { extractFirstImageUrl } from '@/utils/noteImage'

defineOptions({ name: 'NotesView' })

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

const route = useRoute()
const router = useRouter()

// The route drives the overlay: /notes/new creates, /notes/:id edits, /notes lists.
const modalOpen = computed(() => route.name === 'note-new' || route.name === 'note-edit')
const modalNoteId = computed(() => (route.name === 'note-edit' ? String(route.params.id) : null))
const modalOrigin = ref<TapOriginRect | null>(null)

// Consume the stored tap rect exactly when the overlay opens, so a remount
// during navigation or an open without a tap never replays a stale origin.
watch(
  modalOpen,
  (open) => {
    if (open) {
      modalOrigin.value = takeNoteMorphOrigin()
    }
  },
  { immediate: true },
)

function openNote(id: string, event?: Event) {
  // A second tap while the overlay is up is a fast double-tap; ignore it.
  if (modalOpen.value) {
    return
  }
  const el = (event?.currentTarget ?? event?.target) as Element | null
  setNoteMorphOrigin(el ? toTapOriginRect(el) : null)
  void router.push({ name: 'note-edit', params: { id } })
}

function newNote(event?: Event) {
  if (modalOpen.value) {
    return
  }
  const el = event?.currentTarget as Element | null
  setNoteMorphOrigin(el ? toTapOriginRect(el) : null)
  void router.push({ name: 'note-new' })
}

function onModalClosed() {
  if (window.history.state?.back) {
    router.back()
  } else {
    void router.replace({ name: 'notes' })
  }
}
const { notes, loading, error, loadNotes, getCourseName, getBadgeColor } = useNotes()

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

async function loadData() {
  await Promise.all([catalog.loadCatalog(), loadNotes()])
}

onMounted(loadData)
// Cache-guarded: free on warm revisits, self-heals after cache resets.
onActivated(loadData)
</script>

<template>
  <div ref="rootEl" class="relative flex h-full flex-col">
    <div class="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-24">
      <p
        v-if="loading && notes.length === 0"
        class="py-12 text-center text-sm text-text-muted"
        data-testid="notes-loading"
      >
        Notes are loading.
      </p>

      <div
        v-else-if="error"
        class="rounded-2xl border border-app-border bg-card p-6 text-center"
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
        class="py-12 text-center text-sm text-text-muted"
        data-testid="notes-empty"
      >
        No notes exist yet.
      </p>

      <div v-else class="columns-2 gap-2" data-testid="notes-grid">
        <div v-for="note in notes" :key="note.id" class="break-inside-avoid pb-2">
          <NoteCard
            :note="note"
            :course-name="courseNameFor(note)"
            :badge-color="badgeColorFor(note)"
            :class="extractFirstImageUrl(note.preview) ? 'max-h-80' : 'max-h-64'"
            @open="openNote(note.id, $event)"
          />
        </div>
      </div>
    </div>

    <Teleport :to="rootEl" :disabled="!rootEl">
      <AddFab label="Add note" data-testid="notes-fab" @click="newNote($event)" />
    </Teleport>

    <NoteEditorModal
      :is-open="modalOpen"
      :note-id="modalNoteId"
      :origin-rect="modalOrigin"
      @close="onModalClosed"
    />
  </div>
</template>
