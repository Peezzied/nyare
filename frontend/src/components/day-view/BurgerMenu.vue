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

    <!-- Menu Card: same styling as the Notes account menu, anchored under the burger -->
    <div
      class="absolute top-[54px] left-5 z-10 w-44 rounded-2xl border border-app-border bg-card px-4 py-3 shadow-lg"
    >
      <button
        type="button"
        class="w-full text-start text-base font-semibold text-text-main"
        @click="handleSelect('edit')"
      >
        Edit Schedule
      </button>

      <button
        type="button"
        class="w-full text-start text-base font-semibold text-text-main"
        @click="handleSelect('new')"
      >
        New Schedule
      </button>

      <button
        type="button"
        class="w-full text-start text-base font-semibold text-rose-400"
        @click="handleSelect('delete')"
      >
        Delete Schedule
      </button>

      <button
        type="button"
        class="w-full text-start text-base font-semibold text-text-main"
        @click="handleSelect('archive')"
      >
        Archive
      </button>
    </div>
  </div>
</template>
