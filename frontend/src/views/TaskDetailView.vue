<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel.vue'

const route = useRoute()
const router = useRouter()

const taskId = computed(() => {
  const id = route.params['id']
  return typeof id === 'string' ? id : null
})

function onMissing() {
  void router.replace('/tasks')
}

function onClose() {
  if (window.history.length > 1) {
    router.back()
  } else {
    void router.replace('/tasks')
  }
}
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) text-(--color-text-main)">
    <TaskDetailPanel :task-id="taskId" :embedded="false" @close="onClose" @missing="onMissing" />
  </div>
</template>
