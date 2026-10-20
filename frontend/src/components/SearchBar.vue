<script setup lang="ts">
import { Search } from '@lucide/vue'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <div class="px-4 pt-2 pb-3">
    <div class="relative">
      <Search
        class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted"
        aria-hidden="true"
      />
      <Input
        :placeholder="placeholder ?? 'Search…'"
        class="pl-10 pr-4 py-2 h-11 rounded-xl border border-(--color-app-border) bg-[#F0F8FA] text-text-main placeholder-text-(--color-text-muted) shadow-2xs focus-visible:bg-card focus-visible:border-[#00A4C8] focus-visible:ring-2 focus-visible:ring-[#00A4C8]/30 outline-none"
        aria-label="Search"
      />
    </div>
  </div>
</template>
