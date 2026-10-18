<script setup lang="ts">
// Logged-in scaffold: top bar, routed view, bottom nav, Duckota FAB.
// Views set the header title and side actions through useShellHeader.
// The floating Duckota button is the explicit Process trigger for the planner.
// Its badge shows the pending dirty note count. The rainbow ring spins while a run is active.
import { computed, onMounted, toValue } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from './AppHeader.vue'
import DuckotaButton from './DuckotaButton.vue'
import NavigationBar from './NavigationBar.vue'
import { useAcademicEvents } from '@/composables/useAcademicEvents'
import { usePlannerStatus } from '@/composables/usePlannerStatus'
import { useProcess } from '@/composables/useProcess'
import { provideShellHeader } from '@/composables/useShellHeader'
import { useTasks } from '@/composables/useTasks'

const header = provideShellHeader()
const title = computed(() => toValue(header.title ?? ''))

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

function startProcess(): void {
  void proc.start().then(() => {
    if (proc.error.value) {
      console.warn('[AppShell] Process failed:', proc.error.value)
    }
  })
}

onMounted(() => {
  planner.refresh().catch(() => {})
})
</script>

<template>
  <!-- fixed inset-0 = always exactly the visible screen -->
  <div class="fixed inset-0 flex flex-col overflow-hidden bg-app-bg">
    <AppHeader :title="title">
      <template v-if="header.left" #left>
        <component :is="header.left" />
      </template>
      <template v-if="header.right" #right>
        <component :is="header.right" />
      </template>
    </AppHeader>

    <main class="relative min-h-0 flex-1">
      <RouterView />
      <DuckotaButton
        variant="floating"
        label="Process pending notes"
        data-testid="duckota-fab"
        class="!absolute bottom-4 left-5 z-10"
        :badge="badge"
        badge-color="destructive"
        :processing="proc.running.value"
        :disabled="!planner.canProcess.value"
        @click="startProcess"
      />
    </main>



    <!-- the h-16 reserve keeps the view clear of the fixed bar -->
    <div class="h-16 shrink-0">
      <NavigationBar />
    </div>
  </div>
</template>
