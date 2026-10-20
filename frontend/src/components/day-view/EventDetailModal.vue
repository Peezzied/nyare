<script setup lang="ts">
// In-page container-transform overlay that hosts CalendarItemDetail. The shared
// useContainerMorph composable owns the choreography: expand from the tapped rect
// over 320ms, contract back over 240ms, ephemeral history state for device back
// gestures, reduced motion falls back to an opacity crossfade.
import { computed } from 'vue'
import { ArrowLeft } from '@lucide/vue'
import type { TapOriginRect } from '@/types/notesTransition'
import type { CalendarItemDetailView, LinkedNoteRef } from '@/types/calendarItemDetail'
import { useContainerMorph } from '@/composables/useNoteTransition'
import CalendarItemDetail from './CalendarItemDetail.vue'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    originRect: TapOriginRect | null
    item: CalendarItemDetailView | null
    /** The app frame to fill: the centred column the day view renders inside. */
    frameEl: HTMLElement | null
  }>(),
  {
    originRect: null,
    item: null,
    frameEl: null,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-note', note: LinkedNoteRef): void
  (e: 'complete-task', taskId: string): void
}>()

const {
  rootRef,
  containerRef,
  phase,
  isTransitioning,
  isExpanded,
  showContent,
  showControls,
  cardStyle,
  fadeMode,
  dismiss,
  requestClose,
} = useContainerMorph({
  isOpen: () => props.isOpen,
  originRect: () => props.originRect,
  historyKey: 'nyareDetailModal',
  frameEl: () => props.frameEl,
  onClosed: () => emit('close'),
})

const detailTitle = computed(() => {
  switch (props.item?.kind) {
    case 'class':
      return 'Class Details'
    case 'task':
      return 'Task Details'
    case 'event':
      return 'Event Details'
    default:
      return 'Item Details'
  }
})
</script>

<template>
  <div
    v-if="isOpen || phase === 'collapsing'"
    ref="rootRef"
    tabindex="-1"
    class="fixed inset-0 z-50 overflow-hidden outline-none"
    role="dialog"
    aria-modal="true"
    aria-labelledby="detail-modal-title"
    @keydown.esc="dismiss(true)"
  >
    <!-- Background layer: subtle dark scrim -->
    <div
      data-testid="modal-backdrop"
      class="absolute inset-0 bg-black/20 transition-opacity duration-300"
      :class="isExpanded ? 'opacity-100' : 'opacity-0'"
      @click="dismiss(true)"
    />

    <!-- Full-screen expanding container -->
    <div
      ref="containerRef"
      data-testid="detail-modal-container"
      class="fixed bg-[#F5F6EE] overflow-hidden flex flex-col z-10 will-change-[top,left,width,height,border-radius]"
      :class="
        fadeMode
          ? ['transition-opacity duration-[150ms]', isExpanded ? 'opacity-100' : 'opacity-0']
          : isTransitioning && phase === 'expanding'
            ? 'transition-all duration-[320ms] [transition-timing-function:cubic-bezier(0.05,0.7,0.1,1.0)]'
            : isTransitioning && phase === 'collapsing'
              ? 'transition-all duration-[240ms] [transition-timing-function:cubic-bezier(0.3,0.0,0.8,0.15)]'
              : ''
      "
      :style="cardStyle"
    >
      <!-- Google Calendar mobile top app bar with back arrow -->
      <header
        class="flex items-center justify-between px-4 pt-3 pb-3 border-b border-[#CBD5E1]/60 bg-[#F5F6EE] shrink-0 transition-opacity duration-200"
        :class="showControls ? 'opacity-100' : 'opacity-0'"
      >
        <button
          type="button"
          aria-label="Close detail view"
          class="rounded-full p-2.5 hover:bg-slate-200/70 active:scale-95 text-[#334155] transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
          @click="requestClose(true)"
        >
          <ArrowLeft class="w-6 h-6 stroke-[2.2]" />
        </button>

        <span id="detail-modal-title" class="text-sm font-semibold font-quicksand text-[#64748B]">
          {{ detailTitle }}
        </span>

        <div class="w-11" />
      </header>

      <!-- Full-screen scrollable content -->
      <div
        class="p-6 pt-5 overflow-y-auto flex-1 transition-all duration-200 max-w-lg mx-auto w-full"
        :class="[showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2']"
      >
        <CalendarItemDetail
          v-if="item"
          :item="item"
          @open-note="emit('open-note', $event)"
          @complete-task="emit('complete-task', $event)"
        />
      </div>
    </div>
  </div>
</template>
