<script setup lang="ts">
defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'action', actionName: 'edit' | 'new' | 'delete' | 'archive'): void
}>()

function handleSelect(actionName: 'edit' | 'new' | 'delete' | 'archive') {
  emit('action', actionName)
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="absolute inset-0 z-50">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-transparent transition-opacity"
      @click="emit('close')"
    />

    <!-- Menu Card -->
    <div
      class="absolute top-16 left-6 w-48 bg-white rounded-2xl shadow-xl py-3 px-4 z-10 flex flex-col gap-3.5 border border-stone-100"
    >
      <button
        type="button"
        class="text-left text-base font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        @click="handleSelect('edit')"
      >
        Edit Schedule
      </button>

      <button
        type="button"
        class="text-left text-base font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        @click="handleSelect('new')"
      >
        New Schedule
      </button>

      <button
        type="button"
        class="text-left text-base font-semibold text-rose-400 hover:text-rose-600 transition-colors"
        @click="handleSelect('delete')"
      >
        Delete Schedule
      </button>

      <button
        type="button"
        class="text-left text-base font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        @click="handleSelect('archive')"
      >
        Archive
      </button>
    </div>
  </div>
</template>