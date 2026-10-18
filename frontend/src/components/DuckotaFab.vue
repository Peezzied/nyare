<script setup lang="ts">
// Floating Duckota button: the explicit Process trigger for the planner.
// The badge shows the pending dirty note count. The rainbow ring spins while a
// run is active. The caller positions it with the `class` attribute.
import { computed, onMounted } from 'vue'
import DuckotaButton from './DuckotaButton.vue'
import { useAcademicEvents } from '@/composables/useAcademicEvents'
import { usePlannerStatus } from '@/composables/usePlannerStatus'
import { useProcess } from '@/composables/useProcess'
import { useTasks } from '@/composables/useTasks'

const planner = usePlannerStatus()
const tasks = useTasks()
const events = useAcademicEvents()

const proc = useProcess({
  onDone: async (summary) => {
    const courseIds = summary.affectedCourseIds ?? []
    await Promise.all([
      tasks.refetchForCourses(courseIds),
      events.refetchForCourses(courseIds),
      planner.refresh(),
    ])
  },
  onSavedAfterCancel: async () => {
    await Promise.all([
      tasks.loadTasks(undefined, true),
      events.loadEvents(undefined, true),
      planner.refresh(),
    ])
  },
})

const badge = computed(() =>
  planner.pendingCount.value > 0 ? planner.pendingCount.value : undefined,
)

function start(): void {
  void proc.start().then(() => {
    if (proc.error.value) {
      console.warn('[DuckotaFab] Process failed:', proc.error.value)
    }
  })
}

onMounted(() => {
  planner.refresh().catch(() => {})
})
</script>

<template>
    <DuckotaButton
      variant="floating"
      label="Process pending notes"
      data-testid="duckota-fab"
      :badge="badge"
      badge-color="destructive"
      :processing="proc.running.value"
      :disabled="!planner.canProcess.value"
      @click="start"
    />
</template>
