<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { Check, Plus, SquarePen } from '@lucide/vue'
import TactileButton from '../TactileButton.vue'
import { useCatalog } from '@/composables/useCatalog'
import type { CalendarItemDetailView, LinkedNoteRef } from '@/types/calendarItemDetail'

const props = defineProps<{
  item: CalendarItemDetailView
}>()

const emit = defineEmits<{
  (e: 'open-note', note: LinkedNoteRef): void
  (e: 'add-note'): void
  (e: 'complete-task', taskId: string): void
}>()

const catalog = useCatalog()

const dotStyle = computed<CSSProperties>(() => ({
  backgroundColor: catalog.courseColor(props.item.courseId).solid,
}))
const notesLabel = computed(() => (props.item.kind === 'class' ? 'Notes' : 'Linked note'))
const completeLabel = computed(() =>
  props.item.task?.completed ? 'Task completed' : 'Mark task complete',
)

function noteTitle(note: LinkedNoteRef): string {
  return note.title ?? 'Linked note'
}

function onOpenNote(note: LinkedNoteRef) {
  emit('open-note', note)
}

function onCompleteTask() {
  if (props.item.task && !props.item.task.completed) emit('complete-task', props.item.task.id)
}
</script>

<template>
  <article class="flex flex-col gap-4">
    <header class="flex items-center gap-3">
      <span
        data-testid="detail-color-dot"
        class="h-3.5 w-3.5 shrink-0 rounded-full"
        :style="dotStyle"
        aria-hidden="true"
      />
      <h2
        id="detail-modal-title"
        class="min-w-0 flex-1 truncate font-quicksand text-xl font-bold text-[#1E293B]"
      >
        {{ item.title }}
      </h2>
    </header>

    <!-- Only the fields this item owns render; a missing field shows no placeholder (FR-022). -->
    <dl class="flex flex-col gap-3">
      <div v-if="item.timeWindow" class="flex flex-col gap-0.5">
        <dt class="text-xs font-bold tracking-wide text-[#64748B] uppercase">Time</dt>
        <dd data-testid="detail-time-window" class="text-sm font-semibold text-[#334155]">
          {{ item.timeWindow }}
        </dd>
      </div>

      <div v-if="item.duration" class="flex flex-col gap-0.5">
        <dt class="text-xs font-bold tracking-wide text-[#64748B] uppercase">Duration</dt>
        <dd data-testid="detail-duration" class="text-sm font-semibold text-[#334155]">
          {{ item.duration }}
        </dd>
      </div>
    </dl>

    <div v-if="item.notes.length" class="flex flex-col gap-2">
      <h3 class="text-xs font-bold tracking-wide text-[#64748B] uppercase">{{ notesLabel }}</h3>
      <button
        v-for="note in item.notes"
        :key="note.id"
        data-testid="note-control"
        type="button"
        class="flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-2 rounded-xl border-2 border-[#CBD5E1] bg-white/70 px-4 py-2.5 text-left font-quicksand text-sm font-bold text-[#334155] transition-transform hover:bg-white active:translate-y-0.5"
        :aria-label="`Open linked note: ${noteTitle(note)}`"
        @click="onOpenNote(note)"
      >
        <SquarePen class="h-4 w-4 shrink-0" aria-hidden="true" />
        <span class="truncate">{{ noteTitle(note) }}</span>
      </button>
    </div>

    <button
      v-if="item.entryDate"
      data-testid="add-note-control"
      type="button"
      class="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#7CCFE2] bg-[#E8F6FA]/60 px-4 py-2.5 font-quicksand text-sm font-bold text-[#007B99] transition-colors hover:bg-[#E8F6FA] active:translate-y-0.5"
      :aria-label="`Add a note for ${item.title}`"
      @click="emit('add-note')"
    >
      <Plus class="h-4 w-4" aria-hidden="true" />
      Add note
    </button>

    <div v-if="item.task">
      <TactileButton
        data-testid="complete-control"
        class="w-full"
        :disabled="item.task.completed"
        :aria-label="completeLabel"
        @click="onCompleteTask"
      >
        <Check class="mr-2 h-5 w-5" aria-hidden="true" />
        {{ item.task.completed ? 'Task completed' : 'Mark complete' }}
      </TactileButton>
    </div>
  </article>
</template>
