<script setup lang="ts">
import { Clock } from 'lucide-vue-next'
import type { CourseBlockDetailState } from '@/types/detailModal'

const props = withDefaults(
  defineProps<{
    data: CourseBlockDetailState
    showButtons?: boolean
  }>(),
  {
    showButtons: true,
  },
)

const emit = defineEmits<{
  (e: 'navigate', routePath: string): void
}>()

function onNavigateTasks() {
  // Scaffolding: Future enhancement can append query parameter like ?courseId=${props.data.courseId}
  emit('navigate', props.data.tasksTarget || '/tasks')
}

function onNavigateNotes() {
  // Scaffolding: Future enhancement can append query parameter like ?courseId=${props.data.courseId}
  emit('navigate', props.data.notesTarget || '/notes')
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Title and color dot header -->
    <div class="flex items-center gap-3">
      <!-- 10px circular color dot -->
      <span
        class="w-2.5 h-2.5 rounded-full ring-2 ring-black/10 shrink-0"
        :class="data.colorDot.startsWith('bg-') ? data.colorDot : ''"
        :style="!data.colorDot.startsWith('bg-') ? { backgroundColor: data.colorDot } : {}"
        aria-hidden="true"
      />
      <h2
        id="detail-modal-title"
        class="text-2xl font-bold font-quicksand text-[#334155] leading-tight tracking-wide"
      >
        {{ data.courseName }}
      </h2>
    </div>

    <!-- Meeting time window badge -->
    <div class="flex items-center">
      <span
        class="bg-[#F6F7EE] border border-[#CBD5E1] text-[#334155] font-quicksand font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-2 text-sm shadow-xs"
      >
        <Clock class="w-4 h-4 text-[#64748B]" />
        <span>{{ data.timeWindow }}</span>
      </span>
    </div>

    <!-- 3D Tactile Buttons -->
    <div
      class="flex items-center gap-3 pt-2 transition-all duration-200"
      :class="[
        showButtons
          ? 'opacity-100 scale-100 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1.0)]'
          : 'opacity-0 scale-95 pointer-events-none',
      ]"
    >
      <!-- Tasks button -->
      <button
        type="button"
        class="flex-1 min-h-[44px] px-4 py-2.5 bg-[#00A4C8] hover:bg-[#0092B3] text-white font-quicksand font-bold text-sm tracking-wide rounded-xl border-b-4 border-[#007B99] active:translate-y-1 active:border-b-0 transition-all cursor-pointer shadow-sm select-none"
        @click="onNavigateTasks"
      >
        Tasks
      </button>

      <!-- Notes button -->
      <button
        type="button"
        class="flex-1 min-h-[44px] px-4 py-2.5 bg-[#00A4C8] hover:bg-[#0092B3] text-white font-quicksand font-bold text-sm tracking-wide rounded-xl border-b-4 border-[#007B99] active:translate-y-1 active:border-b-0 transition-all cursor-pointer shadow-sm select-none"
        @click="onNavigateNotes"
      >
        Notes
      </button>
    </div>
  </div>
</template>
