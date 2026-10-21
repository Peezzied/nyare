<script setup lang="ts">
import ToastItem from './ToastItem.vue'
import type { Toast, ToastKind } from '@/composables/useToasts'

const kinds: Toast[] = [
  { id: 's', kind: 'success', title: 'Course added.' },
  { id: 'e', kind: 'error', title: 'Could not update task', detail: 'Network unavailable.' },
  { id: 'i', kind: 'info', title: 'Saved, refresh failed', detail: 'Reload to see the changes.' },
  { id: 'l', kind: 'loading', title: 'Duckota is on it', detail: 'Reading your pending notes.' },
]

function initState() {
  return {
    kind: 'info' as ToastKind,
    title: 'Task deleted',
    detail: '',
    hasAction: true,
  }
}
</script>

<template>
  <Story title="components/ToastItem">
    <Variant title="Kinds">
      <div class="flex flex-col items-center gap-3 p-8 pt-24">
        <div
          v-for="toast in kinds"
          :key="toast.id"
          class="flex w-full max-w-[340px] flex-col items-center gap-1"
        >
          <ToastItem :toast="toast" />
          <span class="text-xs text-slate-500">{{ toast.kind }}</span>
        </div>
      </div>
    </Variant>

    <Variant title="With action">
      <div class="flex items-start justify-center p-8 pt-24">
        <ToastItem
          :toast="{
            id: 'undo',
            kind: 'info',
            title: 'Archived 2 courses',
            action: { label: 'Undo', onClick: () => {} },
          }"
        />
      </div>
    </Variant>

    <Variant title="Interactive" :init-state="initState">
      <template #default="{ state }">
        <div class="flex items-start justify-center p-8 pt-24">
          <ToastItem
            :toast="{
              id: 'demo',
              kind: state.kind,
              title: state.title,
              detail: state.detail || undefined,
              action: state.hasAction ? { label: 'Undo', onClick: () => {} } : undefined,
            }"
          />
        </div>
      </template>

      <template #controls="{ state }">
        <HstSelect
          v-model="state.kind"
          title="Kind"
          :options="['info', 'success', 'error', 'loading']"
        />
        <HstText v-model="state.title" title="Title" />
        <HstText v-model="state.detail" title="Detail" />
        <HstCheckbox v-model="state.hasAction" title="Show action" />
      </template>
    </Variant>
  </Story>
</template>
