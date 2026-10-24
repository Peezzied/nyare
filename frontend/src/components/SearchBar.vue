<script setup lang="ts">
import { Search, SlidersHorizontal } from '@lucide/vue'
import { Input } from '@/components/ui/input'

withDefaults(
  defineProps<{
    placeholder?: string
    modelValue?: string
    filtersActive?: boolean
    showFilter?: boolean
  }>(),
  {
    showFilter: true,
  },
)

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string): void
  (e: 'filter'): void
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
        :model-value="modelValue"
        :placeholder="placeholder ?? 'Search…'"
        class="pl-10 pr-12 py-2 h-11 rounded-xl border-0 bg-card text-text-main placeholder:text-text-muted shadow-none focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30 outline-none"
        aria-label="Search"
        @update:model-value="emits('update:modelValue', String($event))"
      />
      <button
        v-if="showFilter"
        type="button"
        class="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-primary-bevel transition-colors hover:bg-ocean-soft active:bg-border-soft focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none"
        aria-label="Filter"
        @click="emits('filter')"
      >
        <SlidersHorizontal class="h-5 w-5" aria-hidden="true" />
        <span
          v-if="filtersActive"
          class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>
