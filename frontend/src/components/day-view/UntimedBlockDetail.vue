<script setup lang="ts">
import { FileText } from 'lucide-vue-next'
import type { NonCourseBlockDetailState } from '@/types/detailModal'

defineProps<{
  data: NonCourseBlockDetailState
}>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Item Title -->
    <div>
      <h2
        id="detail-modal-title"
        class="text-xl font-bold font-quicksand text-[#334155] leading-snug"
      >
        {{ data.title }}
      </h2>
    </div>

    <!-- Singular Linked Note (hidden if null) -->
    <div v-if="data.linkedNote" class="mt-1">
      <div
        class="bg-[#F6F7EE] border border-[#CBD5E1] rounded-xl p-3 flex items-start gap-2.5 shadow-2xs"
      >
        <FileText class="w-4 h-4 text-[#0E7490] shrink-0 mt-0.5" />
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-0.5">
            Linked Note
          </p>
          <p class="text-sm font-medium text-[#334155] truncate">
            {{ data.linkedNote }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
