<script setup lang="ts">
import DuckotaBubble from './DuckotaBubble.vue'
import DuckotaButton from './DuckotaButton.vue'

function initState() {
  return {
    kind: 'info' as 'info' | 'success' | 'error',
    title: 'Duckota is on it',
    detail: 'Reading your pending notes.',
  }
}
</script>

<template>
  <Story title="components/DuckotaBubble">
    <Variant title="Kinds">
      <div class="flex items-start justify-center gap-16 p-8 pt-24">
        <div class="relative flex flex-col items-center gap-2">
          <DuckotaBubble kind="info" title="Duckota is on it" detail="Reading your pending notes." />
          <span class="text-xs text-slate-500">info</span>
        </div>
        <div class="relative flex flex-col items-center gap-2">
          <DuckotaBubble
            kind="success"
            title="Process complete"
            detail="7 tasks · 2 events · 1 context created."
          />
          <span class="text-xs text-slate-500">success</span>
        </div>
        <div class="relative flex flex-col items-center gap-2">
          <DuckotaBubble kind="error" title="Process failed" detail="The AI provider timed out." />
          <span class="text-xs text-slate-500">error</span>
        </div>
      </div>
    </Variant>

    <Variant title="Anchored to FAB">
      <div class="relative h-64 p-8">
        <div class="absolute bottom-4 left-5">
          <DuckotaBubble
            kind="success"
            title="Process complete"
            detail="7 tasks · 2 events · 1 context created."
          />
          <DuckotaButton variant="floating" :badge="3" />
        </div>
      </div>
    </Variant>

    <Variant title="Interactive" :init-state="initState">
      <template #default="{ state }">
        <div class="relative flex items-center justify-center p-8 pt-24">
          <DuckotaBubble :kind="state.kind" :title="state.title" :detail="state.detail" />
        </div>
      </template>

      <template #controls="{ state }">
        <HstSelect
          v-model="state.kind"
          title="Kind"
          :options="['info', 'success', 'error']"
        />
        <HstText v-model="state.title" title="Title" />
        <HstText v-model="state.detail" title="Detail" />
      </template>
    </Variant>
  </Story>
</template>
