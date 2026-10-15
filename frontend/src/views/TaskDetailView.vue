<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { tasksApi } from '@/api/tasks'
import { TODO_FIXTURE_TASKS_V2 } from '@/api/mocks/fixtures'

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  const id = route.params['id']
  if (!id || typeof id !== 'string') {
    router.replace('/')
    return
  }
  try {
    await tasksApi.get(id)
  } catch {
    const isFixtureTask = TODO_FIXTURE_TASKS_V2.some((t) => t.id === id)
    if (!isFixtureTask) {
      router.replace('/')
    }
  }
})

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/')
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-(--color-app-bg) text-(--color-text-main)">
    <header
      class="sticky top-0 z-20 flex h-14 w-full items-center border-b-[3px] border-(--color-app-border) bg-(--color-app-bg) px-4"
    >
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-lg text-(--color-text-main) transition-colors hover:bg-black/5 active:bg-black/10"
        aria-label="Go back"
        @click="goBack"
      >
        <ArrowLeft class="h-6 w-6" />
      </button>
      <h1 class="flex-1 text-center text-xl font-bold tracking-tight text-(--color-text-main)">
        Task Detail
      </h1>
      <!-- spacer matches back button width to center the title -->
      <div class="h-11 w-11" aria-hidden="true" />
    </header>

    <main class="flex-1 pb-20" />
  </div>
</template>
