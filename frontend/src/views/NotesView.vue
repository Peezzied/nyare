<script setup lang="ts">
import { computed, h, onActivated, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { notesApi } from '@/api'
import type { NoteListParams } from '@/api'
import NoteCard from '@/components/NoteCard.vue'
import SearchBar from '@/components/SearchBar.vue'
import FilterSheet, { type ListFilters } from '@/components/FilterSheet.vue'
import NoteEditorModal from '@/components/notes/NoteEditorModal.vue'
import AddFab from '@/components/AddFab.vue'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import { Button } from '@/components/ui/button'
import type { NoteSummaryResponse } from '@/types/api'
import type { TapOriginRect } from '@/types/notesTransition'
import { useCatalog } from '@/composables/useCatalog'
import { useNotes } from '@/composables/useNotes'
import { useServerSearch } from '@/composables/useServerSearch'
import { useShellHeader } from '@/composables/useShellHeader'
import {
  setNoteMorphOrigin,
  takeNoteMorphOrigin,
  toTapOriginRect,
} from '@/composables/useNoteTransition'
import { extractFirstImageUrl } from '@/utils/noteImage'

defineOptions({ name: 'NotesView' })

useShellHeader({
  title: 'Notes',
  left: () => h(HamburgerMenu),
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
  // The morph's own pop may have already left this route; never pop twice.
  if (!modalOpen.value) {
    return
  }
  if (window.history.state?.back) {
    router.back()
  } else {
    void router.replace({ name: 'notes' })
  }
}
const { notes, loading, error, loadNotes, getCourseName, getBadgeColor } = useNotes()

const query = ref('')
const filters = ref<ListFilters>({})
const filterSheetOpen = ref(false)
const filtersActive = computed(() => Object.keys(filters.value).length > 0)
const searchParams = computed<NoteListParams | null>(() => {
  const q = query.value.trim()
  const { courseId, from, to } = filters.value
  if (q === '' && !filtersActive.value) {
    return null
  }
  return {
    ...(q && { q }),
    ...(courseId && { courseId }),
    ...(from && { from }),
    ...(to && { to }),
  }
})
const {
  results: searchResults,
  error: searchError,
  retry: retrySearch,
} = useServerSearch(notesApi.list, searchParams)

// Mirrors cache writes into an active search list: saved notes refresh their
// card, deleted notes drop out, and notes the cache never held keep their
// search copy so a failed list load does not blank a working search.
// ponytail: undo restores a deleted note into the cache but not this list.
watch(notes, (list, prev) => {
  if (searchResults.value === null) {
    return
  }
  const byId = new Map(list.map((n) => [n.id, n]))
  const prevIds = new Set(prev.map((n) => n.id))
  searchResults.value = searchResults.value
    .filter((n) => byId.has(n.id) || !prevIds.has(n.id))
    .map((n) => byId.get(n.id) ?? n)
})

const displayedNotes = computed(() =>
  [...(searchResults.value ?? notes.value)].sort(
    (a, b) => b.entryDate.localeCompare(a.entryDate) || b.createdAt.localeCompare(a.createdAt),
  ),
)

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
    <FilterSheet
      v-model:open="filterSheetOpen"
      v-model="filters"
      :courses="catalog.courses.value"
      :show-status="false"
    />
    <div class="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-24">
      <SearchBar
        v-model="query"
        placeholder="Search notes…"
        class="-mx-4 -mt-4"
        :filters-active="filtersActive"
        @filter="filterSheetOpen = true"
      />
      <p
        v-if="searchResults === null && loading && notes.length === 0"
        class="py-12 text-center text-sm text-text-muted"
        data-testid="notes-loading"
      >
        Notes are loading.
      </p>

      <div
        v-else-if="searchResults === null && error"
        class="rounded-2xl border border-app-border bg-card p-6 text-center"
        data-testid="notes-error"
        role="alert"
      >
        <p class="font-sans text-base font-semibold text-text-main">Notes failed to load.</p>

        <p class="mt-1 text-sm text-text-muted">{{ error }}</p>

        <Button
          type="button"
          variant="tactile"
          size="touch"
          class="mt-4"
          @click="loadNotes(true)"
        >
          Retry
        </Button>
      </div>

      <div
        v-else-if="searchError"
        class="rounded-2xl border border-app-border bg-card p-6 text-center"
        data-testid="notes-search-error"
        role="alert"
      >
        <p class="font-sans text-base font-semibold text-text-main">Search failed.</p>

        <p class="mt-1 text-sm text-text-muted">{{ searchError }}</p>

        <Button
          type="button"
          variant="tactile"
          size="touch"
          class="mt-4"
          @click="retrySearch"
        >
          Retry
        </Button>
      </div>

      <p
        v-else-if="displayedNotes.length === 0"
        class="py-12 text-center text-sm text-text-muted"
        data-testid="notes-empty"
      >
        {{ searchResults === null ? 'No notes exist yet.' : 'No matching notes' }}
      </p>

      <div v-else class="columns-2 gap-2" data-testid="notes-grid">
        <div v-for="note in displayedNotes" :key="note.id" class="break-inside-avoid pb-2">
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
