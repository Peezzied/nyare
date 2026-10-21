<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel.vue'
import { useUndoableTaskDelete } from '@/composables/useUndoableTaskDelete'
import type { TaskResponse } from '@/types/api'

const route = useRoute()
const router = useRouter()
const { deleteTaskWithUndo } = useUndoableTaskDelete()

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

function onDeleted(task: TaskResponse) {
  deleteTaskWithUndo(task)
  onClose()
}
</script>

<template>
  <div class="min-h-screen bg-(--color-app-bg) text-(--color-text-main)">
    <TaskDetailPanel
      :task-id="taskId"
      :embedded="false"
      @close="onClose"
      @deleted="onDeleted"
      @missing="onMissing"
    />
  </div>
</template>
