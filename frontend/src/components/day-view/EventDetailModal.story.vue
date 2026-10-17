<script setup lang="ts">
import { ref } from 'vue'
import EventDetailModal from './EventDetailModal.vue'
import type {
  CourseBlockDetailState,
  NonCourseBlockDetailState,
  TapOriginRect,
} from '@/types/detailModal'

const isOpen = ref(false)
const originRect = ref<TapOriginRect | null>(null)
const modalKind = ref<'course' | 'other'>('course')
const courseData: CourseBlockDetailState = {
  courseId: 1,
  courseName: 'Web Systems and Technologies',
  colorDot: 'bg-[#80C2F8]',
  timeWindow: '08:00 AM - 10:00 AM',
  tasksTarget: '/tasks',
  notesTarget: '/notes',
}

const untimedData: NonCourseBlockDetailState = {
  id: 'task-1',
  title: 'Read Operating Systems Chapter 4',
  itemType: 'task',
  linkedNote: 'OS Processes & Threads Lecture Note',
}

function openCourseModal(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  originRect.value = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
  modalKind.value = 'course'
  isOpen.value = true
}

function openUntimedModal(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  originRect.value = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
  modalKind.value = 'other'
  isOpen.value = true
}

function handleClose() {
  isOpen.value = false
}

function handleNavigate(route: string) {
  console.log('Navigate requested to:', route)
  isOpen.value = false
}
</script>

<template>
  <Story title="Calendar / EventDetailModal">
    <Variant title="Interactive Live Expansion">
      <div class="p-8 max-w-md space-y-6 bg-slate-100 min-h-[300px] flex flex-col justify-center">
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Click block to trigger expansion animation
          </p>

          <!-- Mock Course Card Button -->
          <button
            type="button"
            class="w-full text-left rounded-2xl p-4 border-[2.5px] border-[#1E293B] bg-[#80C2F8] shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
            @click="openCourseModal"
          >
            <h3 class="text-lg font-bold text-white tracking-wide">Web Systems and Technologies</h3>
            <p class="text-white/95 text-xs font-medium mt-1">8:00 - 10:00 AM • Lab 302</p>
          </button>
        </div>

        <div>
          <!-- Mock Untimed Pill Button -->
          <button
            type="button"
            class="w-full text-left flex h-9 items-center gap-2 overflow-hidden rounded-lg border-2 border-[#1E3A2F] bg-[#7CE19D] px-3 text-sm shadow-sm hover:scale-[1.01] transition-transform cursor-pointer"
            @click="openUntimedModal"
          >
            <span class="text-xs font-bold text-white">✓</span>
            <span class="truncate font-bold text-white"> Read Operating Systems Chapter 4 </span>
          </button>
        </div>

        <EventDetailModal
          :is-open="isOpen"
          :origin-rect="originRect"
          :kind="modalKind"
          :data="modalKind === 'course' ? courseData : untimedData"
          @close="handleClose"
          @navigate="handleNavigate"
        />
      </div>
    </Variant>
  </Story>
</template>
