<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { Check, ClipboardList, Plus, SquarePen, Trash2 } from '@lucide/vue'
import TactileButton from '../TactileButton.vue'
import { Button } from '@/components/ui/button'
import DialogShell from '@/components/ui/DialogShell.vue'
import { useCatalog } from '@/composables/useCatalog'
import type { CalendarItemDetailView, LinkedNoteRef } from '@/types/calendarItemDetail'

const props = defineProps<{
  item: CalendarItemDetailView
}>()

const emit = defineEmits<{
  (e: 'open-note', note: LinkedNoteRef): void
  (e: 'add-note'): void
  (e: 'open-task', taskId: string): void
  (e: 'complete-task', taskId: string): void
  /** Confirmed delete of an academic event. The parent owns the API call. */
  (e: 'deleted'): void
}>()

const catalog = useCatalog()

const dotStyle = computed<CSSProperties>(() => ({
  backgroundColor: catalog.courseColor(props.item.courseId).solid,
}))
const notesLabel = computed(() => (props.item.kind === 'class' ? 'Notes' : 'Linked note'))
const completeLabel = computed(() =>
  props.item.task?.completed ? 'Task completed' : 'Mark task complete',
)

function onOpenNote(note: LinkedNoteRef) {
  emit('open-note', note)
}

function onOpenTask() {
  if (props.item.task) emit('open-task', props.item.task.id)
}

function onCompleteTask() {
  if (props.item.task && !props.item.task.completed) emit('complete-task', props.item.task.id)
}

const deleteOpen = ref(false)

function confirmDelete() {
  deleteOpen.value = false
  emit('deleted')
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
        class="min-w-0 flex-1 truncate font-sans text-xl font-bold text-heading"
      >
        {{ item.title }}
      </h2>
    </header>

    <!-- Only the fields this item owns render; a missing field shows no placeholder (FR-022). -->
    <dl class="flex flex-col gap-3">
      <div v-if="item.timeWindow" class="flex flex-col gap-0.5">
        <dt class="text-xs font-bold tracking-wide text-text-muted uppercase">Time</dt>
        <dd data-testid="detail-time-window" class="text-sm font-semibold text-text-main">
          {{ item.timeWindow }}
        </dd>
      </div>

      <div v-if="item.duration" class="flex flex-col gap-0.5">
        <dt class="text-xs font-bold tracking-wide text-text-muted uppercase">Duration</dt>
        <dd data-testid="detail-duration" class="text-sm font-semibold text-text-main">
          {{ item.duration }}
        </dd>
      </div>
    </dl>

    <div v-if="item.notes.length" class="flex flex-col gap-2">
      <h3 class="text-xs font-bold tracking-wide text-text-muted uppercase">{{ notesLabel }}</h3>
      <button
        v-for="note in item.notes"
        :key="note.id"
        data-testid="note-control"
        type="button"
        class="flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-2 rounded-xl border-2 border-app-border bg-white/70 px-4 py-2.5 text-left font-sans text-sm font-bold text-text-main transition-transform hover:bg-white active:translate-y-0.5"
        :aria-label="`Open linked note: ${note.title}`"
        @click="onOpenNote(note)"
      >
        <SquarePen class="h-4 w-4 shrink-0" aria-hidden="true" />
        <span class="truncate">{{ note.title }}</span>
      </button>
    </div>

    <button
      v-if="item.entryDate"
      data-testid="add-note-control"
      type="button"
      class="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#7CCFE2] bg-ocean-soft/60 px-4 py-2.5 font-sans text-sm font-bold text-primary-bevel transition-colors hover:bg-ocean-soft active:translate-y-0.5"
      :aria-label="`Add a note for ${item.title}`"
      @click="emit('add-note')"
    >
      <Plus class="h-4 w-4" aria-hidden="true" />
      Add note
    </button>

    <div v-if="item.task" class="flex flex-col gap-2">
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
      <button
        data-testid="open-task-control"
        type="button"
        class="flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-2 rounded-xl border-2 border-app-border bg-white/70 px-4 py-2.5 text-left font-sans text-sm font-bold text-text-main transition-transform hover:bg-white active:translate-y-0.5"
        :aria-label="`Open ${item.title} in the To-do view`"
        @click="onOpenTask"
      >
        <ClipboardList class="h-4 w-4 shrink-0" aria-hidden="true" />
        <span class="truncate">Open in To-do</span>
      </button>
    </div>

    <Button
      v-if="item.kind === 'event'"
      type="button"
      variant="tactile-destructive"
      size="touch"
      data-testid="delete-event-control"
      class="w-full"
      :aria-label="`Delete event ${item.title}`"
      @click="deleteOpen = true"
    >
      <Trash2 class="size-5" aria-hidden="true" />
      Delete event
    </Button>

    <DialogShell v-model:open="deleteOpen" title="Delete Event">
      <p
        class="mt-2 text-sm text-text-muted"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        Are you sure you want to delete this event?
      </p>
      <p
        class="mt-3 text-sm font-semibold text-text-main"
        style="font-family: 'Quicksand', sans-serif; font-weight: 600"
      >
        {{ item.title }}
      </p>

      <template #actions="{ disabled, dismiss }">
        <Button
          type="button"
          variant="secondary"
          size="touch"
          data-testid="delete-event-cancel"
          :disabled="disabled"
          style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          @click="dismiss"
        >
          Cancel
        </Button>

        <Button
          type="button"
          variant="tactile-destructive"
          size="touch"
          data-testid="delete-event-confirm"
          :disabled="disabled"
          style="font-family: 'Quicksand', sans-serif; font-weight: 700"
          @click="confirmDelete"
        >
          CONFIRM
        </Button>
      </template>
    </DialogShell>
  </article>
</template>
