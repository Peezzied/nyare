<script setup lang="ts">
// Direct note route for links outside the Notes tab. The editor fades in over
// the detail view, then closes back to the route that opened it.
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NoteEditorModal from '@/components/notes/NoteEditorModal.vue'
import { takeNoteMorphOrigin } from '@/composables/useNoteTransition'
import type { TapOriginRect } from '@/types/notesTransition'

const route = useRoute()
const router = useRouter()

const noteId = computed(() => String(route.params.id))
const originRect = ref<TapOriginRect | null>(takeNoteMorphOrigin())

function onClosed() {
  // The morph's own pop may have already left this route; never pop twice.
  if (route.name !== 'note-open') {
    return
  }
  if (window.history.state?.back) {
    router.back()
    return
  }
  void router.replace({ name: 'calendar' })
}
</script>

<template>
  <NoteEditorModal is-open :note-id="noteId" :origin-rect="originRect" @close="onClosed" />
</template>
