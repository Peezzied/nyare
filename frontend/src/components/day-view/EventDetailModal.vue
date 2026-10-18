<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ArrowLeft } from '@lucide/vue'
import type { AnimationPhase, TapOriginRect } from '@/types/detailModal'
import type { CalendarItemDetailView, LinkedNoteRef } from '@/types/calendarItemDetail'
import CalendarItemDetail from './CalendarItemDetail.vue'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    originRect: TapOriginRect | null
    item: CalendarItemDetailView | null
  }>(),
  {
    originRect: null,
    item: null,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-note', note: LinkedNoteRef): void
  (e: 'complete-task', taskId: string): void
}>()

/** Skips the container transform when the user asks for reduced motion. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

const containerRef = ref<HTMLElement | null>(null)
const phase = ref<AnimationPhase>('idle')
const isTransitioning = ref(false)
const isExpanded = ref(false)
const showContent = ref(false)
const cardStyle = ref<Record<string, string>>({})

let phaseTimer: ReturnType<typeof setTimeout> | null = null
let contentTimer: ReturnType<typeof setTimeout> | null = null
let pushedHistory = false

function clearAllTimers() {
  if (phaseTimer) clearTimeout(phaseTimer)
  if (contentTimer) clearTimeout(contentTimer)
  phaseTimer = null
  contentTimer = null
}

function calculateTargetStyle(): Record<string, string> {
  const w = typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : 390
  const h = typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : 844
  return {
    top: '0px',
    left: '0px',
    width: `${w}px`,
    height: `${h}px`,
    borderRadius: '0px',
  }
}

function runExpansion() {
  clearAllTimers()
  const reducedMotion = prefersReducedMotion()
  phase.value = 'expanding'
  isTransitioning.value = false
  showContent.value = false
  isExpanded.value = false

  const origin = props.originRect
  if (origin) {
    cardStyle.value = {
      top: `${origin.top}px`,
      left: `${origin.left}px`,
      width: `${origin.width}px`,
      height: `${origin.height}px`,
      borderRadius: '16px',
    }
  } else {
    cardStyle.value = calculateTargetStyle()
  }

  // Push history state once per open
  if (!pushedHistory && typeof window !== 'undefined') {
    try {
      window.history.pushState({ nyareDetailModal: true }, '')
      pushedHistory = true
    } catch {
      // Ignore if history API is unavailable in test environment
    }
  }

  nextTick(() => {
    // Force browser reflow to commit initial origin geometry before transition starts
    if (containerRef.value) {
      void containerRef.value.offsetHeight
    }

    requestAnimationFrame(() => {
      // Enable CSS transitions and animate to full-screen target
      isTransitioning.value = !reducedMotion
      isExpanded.value = true
      cardStyle.value = calculateTargetStyle()

      // Staggered entrance: inner text/details at 100ms
      contentTimer = setTimeout(
        () => {
          showContent.value = true
        },
        reducedMotion ? 0 : 100,
      )

      // Fully settled at 320ms
      phaseTimer = setTimeout(
        () => {
          phase.value = 'settled'
        },
        reducedMotion ? 0 : 320,
      )
    })
  })
}

function requestClose(triggerHistoryBack = true) {
  if (phase.value === 'collapsing' || phase.value === 'idle') {
    return
  }

  clearAllTimers()
  const reducedMotion = prefersReducedMotion()
  phase.value = 'collapsing'
  isTransitioning.value = !reducedMotion

  // Fast content exit in first 80ms
  showContent.value = false

  const origin = props.originRect
  if (origin) {
    cardStyle.value = {
      top: `${origin.top}px`,
      left: `${origin.left}px`,
      width: `${origin.width}px`,
      height: `${origin.height}px`,
      borderRadius: '16px',
    }
  }
  isExpanded.value = false

  if (triggerHistoryBack && pushedHistory && typeof window !== 'undefined') {
    pushedHistory = false
    try {
      if (window.history.state?.nyareDetailModal) {
        window.history.back()
      }
    } catch {
      // Ignore in tests
    }
  }

  // 240ms collapse animation finishes
  phaseTimer = setTimeout(
    () => {
      phase.value = 'idle'
      isTransitioning.value = false
      emit('close')
    },
    reducedMotion ? 0 : 240,
  )
}

function onPopState() {
  if (props.isOpen) {
    pushedHistory = false
    requestClose(false)
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    requestClose(true)
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden'
      }
      runExpansion()
    } else {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
      }
      clearAllTimers()
      phase.value = 'idle'
      isExpanded.value = false
      showContent.value = false
      pushedHistory = false
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', onPopState)
    window.addEventListener('keydown', onKeyDown)
  }
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('popstate', onPopState)
    window.removeEventListener('keydown', onKeyDown)
  }
  clearAllTimers()
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
    class="fixed inset-0 z-50 overflow-hidden"
    role="dialog"
    aria-modal="true"
    aria-labelledby="detail-modal-title"
  >
    <!-- Background layer: subtle dark scrim -->
    <div
      data-testid="modal-backdrop"
      class="absolute inset-0 bg-black/20 transition-opacity duration-300"
      :class="isExpanded ? 'opacity-100' : 'opacity-0'"
      @click="requestClose(true)"
    />

    <!-- Full-screen expanding container -->
    <div
      ref="containerRef"
      class="fixed bg-[#F5F6EE] overflow-hidden flex flex-col z-10 will-change-[top,left,width,height,border-radius]"
      :class="[
        isTransitioning && phase === 'expanding'
          ? 'transition-all duration-[320ms] [transition-timing-function:cubic-bezier(0.05,0.7,0.1,1.0)]'
          : isTransitioning && phase === 'collapsing'
            ? 'transition-all duration-[240ms] [transition-timing-function:cubic-bezier(0.3,0.0,0.8,0.15)]'
            : '',
      ]"
      :style="cardStyle"
    >
      <!-- Google Calendar mobile top app bar with back arrow -->
      <header
        class="flex items-center justify-between px-4 pt-3 pb-3 border-b border-[#CBD5E1]/60 bg-[#F5F6EE] shrink-0"
      >
        <button
          type="button"
          aria-label="Close detail view"
          class="rounded-full p-2.5 hover:bg-slate-200/70 active:scale-95 text-[#334155] transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
          @click="requestClose(true)"
        >
          <ArrowLeft class="w-6 h-6 stroke-[2.2]" />
        </button>

        <span class="text-sm font-semibold font-quicksand text-[#64748B]">
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
