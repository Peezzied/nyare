<script setup lang="ts">
import { ref, computed, h, onActivated, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import AddFab from '@/components/AddFab.vue'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { useCatalog } from '@/composables/useCatalog'
import { useTasks } from '@/composables/useTasks'
import { useToasts } from '@/composables/useToasts'
import { useUndoableTaskDelete } from '@/composables/useUndoableTaskDelete'
import { getPlanCategory } from '@/utils/planCategory'
import { useShellHeader } from '@/composables/useShellHeader'
import {
  setNoteMorphOrigin,
  takeNoteMorphOrigin,
  toTapOriginRect,
} from '@/composables/useNoteTransition'
import TaskRow from '@/components/TaskRow.vue'
import TaskContainerModal from '@/components/tasks/TaskContainerModal.vue'
import TaskQuickActionsSheet from '@/components/tasks/TaskQuickActionsSheet.vue'
import { formatDueLabel, formatDuration, isOverdue } from '@/utils/taskUrgency'
import { minutesToDuration } from '@/utils/duration'
import { fromTask, toTaskRequest, type TaskFormState } from '@/utils/taskForm'
import type { TapOriginRect } from '@/types/notesTransition'
import type { TaskResponse, PlanCategory } from '@/types/api'

defineOptions({ name: 'TodoView' })

type ActiveFilter = 'ALL' | 'OVERDUE' | PlanCategory

useShellHeader({ title: 'To-do', left: () => h(HamburgerMenu) })

const route = useRoute()
const router = useRouter()
const catalog = useCatalog()
const { tasks, loadTasks, updateTask, updateTaskStatus } = useTasks()
const { deleteTaskWithUndo } = useUndoableTaskDelete()
const loading = ref(true)
const activeFilter = ref<ActiveFilter>('ALL')

// The route drives the overlay: /tasks/new creates, /tasks/:id edits, /tasks lists.
const modalOpen = computed(() => route.name === 'task-new' || route.name === 'task-detail')
const modalTaskId = computed(() => (route.name === 'task-detail' ? String(route.params.id) : null))
const modalOrigin = ref<TapOriginRect | null>(null)

// Consume the stored tap rect exactly when the overlay opens, so a remount
// during navigation or an open without a tap never replays a stale origin.
watch(
  modalOpen,
  (open) => {
    if (open) {
      modalOrigin.value = takeNoteMorphOrigin()
    }
  },
  { immediate: true },
)

function newTask(event?: Event) {
  if (modalOpen.value) {
    return
  }
  const el = (event?.currentTarget ?? event?.target) as Element | null
  setNoteMorphOrigin(el ? toTapOriginRect(el) : null)
  void router.push({ name: 'task-new' })
}

function openTaskFromRow(task: TaskResponse, event?: Event) {
  if (modalOpen.value) {
    return
  }
  const el = (event?.currentTarget ?? event?.target) as Element | null
  setNoteMorphOrigin(el ? toTapOriginRect(el) : null)
  void router.push({ name: 'task-detail', params: { id: task.id } })
}

function onModalClosed() {
  if (window.history.state?.back) {
    router.back()
  } else {
    void router.replace({ name: 'tasks' })
  }
}

function onTaskDeleted(task: TaskResponse) {
  deleteTaskWithUndo(task)
}

const quickSheet = ref<{ open: boolean; task: TaskResponse | null }>({
  open: false,
  task: null,
})

function openQuickActions(task: TaskResponse) {
  quickSheet.value = { open: true, task }
}

/** Applies one field change through the full TaskRequest and trusts the saved DTO. */
async function patchTask(patch: Partial<TaskFormState>, successLabel: string) {
  const task = quickSheet.value.task
  if (!task) {
    return
  }
  try {
    await updateTask(task.id, toTaskRequest({ ...fromTask(task), ...patch }, task.status))
    quickSheet.value = { ...quickSheet.value, open: false }
    useToasts().pushToast({ kind: 'success', title: successLabel })
  } catch (err) {
    useToasts().pushToast({
      kind: 'error',
      title: err instanceof Error ? err.message : 'Could not update task',
    })
  }
}

function applySchedule(date: string | null) {
  const label = date ? `Scheduled for ${formatDueLabel(date).toLowerCase()}` : 'Date removed'
  void patchTask({ scheduledDate: date ?? '' }, label)
}

function applyDuration(minutes: number | null) {
  const label =
    minutes === null
      ? 'Duration cleared'
      : `Duration set to ${formatDuration(minutesToDuration(minutes))}`
  void patchTask({ durationMinutes: minutes }, label)
}

function quickDelete() {
  const task = quickSheet.value.task
  if (!task) {
    return
  }
  quickSheet.value = { open: false, task: null }
  deleteTaskWithUndo(task)
}

const filters: { key: ActiveFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OVERDUE', label: 'Overdue' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'LATER', label: 'Later' },
  { key: 'BACKLOG', label: 'Backlog' },
]

function getCourseName(courseId: number): string {
  const found = catalog.courses.value.find((c) => c.id === courseId)
  return found?.name ?? `Course ${courseId}`
}

function getCategory(task: TaskResponse): PlanCategory {
  return task.planCategory ?? getPlanCategory(task)
}

function getDueDate(task: TaskResponse): string | null {
  return task.scheduledDate ?? null
}

const overdueTasks = computed(() =>
  tasks.value
    .filter((t) => t.status !== 'COMPLETED' && isOverdue(getDueDate(t)))
    .sort((a, b) => (getDueDate(a) ?? '').localeCompare(getDueDate(b) ?? '')),
)

const scheduledTasks = computed(() =>
  tasks.value
    .filter((t) => getCategory(t) === 'SCHEDULED')
    .sort((a, b) => {
      const da = getDueDate(a) ?? a.createdAt
      const db = getDueDate(b) ?? b.createdAt
      return da.localeCompare(db)
    }),
)

const laterTasks = computed(() =>
  tasks.value
    .filter((t) => getCategory(t) === 'LATER')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
)

const backlogTasks = computed(() =>
  tasks.value
    .filter((t) => getCategory(t) === 'BACKLOG')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
)

const sections = computed(() => [
  { category: 'SCHEDULED' as PlanCategory, label: 'Scheduled', list: scheduledTasks.value },
  { category: 'LATER' as PlanCategory, label: 'Later', list: laterTasks.value },
  { category: 'BACKLOG' as PlanCategory, label: 'Backlog', list: backlogTasks.value },
])

const flatTasks = computed(() => {
  if (activeFilter.value === 'OVERDUE') return overdueTasks.value
  if (activeFilter.value === 'SCHEDULED') return scheduledTasks.value
  if (activeFilter.value === 'LATER') return laterTasks.value
  if (activeFilter.value === 'BACKLOG') return backlogTasks.value
  return []
})

const loadError = ref<string | null>(null)

async function loadData() {
  loading.value = true
  loadError.value = null
  try {
    await Promise.all([catalog.loadCatalog(), loadTasks()])
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Tasks failed to load'
  } finally {
    loading.value = false
  }
}

async function toggleTask(task: TaskResponse) {
  const previous = task.status
  const nextStatus = previous === 'COMPLETED' ? 'TODO' : 'COMPLETED'
  tasks.value = tasks.value.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
  try {
    await updateTaskStatus(task.id, nextStatus)
  } catch (err) {
    tasks.value = tasks.value.map((t) => (t.id === task.id ? { ...t, status: previous } : t))
    useToasts().pushToast({
      kind: 'error',
      title: 'Could not update task',
      detail: err instanceof Error ? err.message : 'Try again.',
    })
  }
}

onMounted(loadData)
// Cache-guarded: free on warm revisits, self-heals after cache resets.
onActivated(loadData)
</script>

<template>
  <div class="relative flex h-full flex-col bg-(--color-app-bg) text-(--color-text-main)">
    <div class="min-h-0 flex-1 overflow-y-auto pb-26">
      <div class="overflow-x-auto px-4 pt-3 pb-2" style="scrollbar-width: none">
        <div
          class="mx-auto inline-flex w-max rounded-full border border-(--color-app-border) bg-(--color-card) p-1"
          role="tablist"
          aria-label="Filter tasks by category"
        >
          <button
            v-for="f in filters"
            :key="f.key"
            role="tab"
            type="button"
            :aria-selected="activeFilter === f.key"
            class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
            :class="
              activeFilter === f.key
                ? 'bg-(--color-primary) text-white'
                : 'text-(--color-text-muted)'
            "
            @click="activeFilter = f.key"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <p v-if="loading" class="py-8 text-center text-(--color-text-muted)">Loading tasks…</p>

      <div v-else-if="loadError" class="flex flex-col items-center gap-3 py-12">
        <p role="alert" class="text-center text-(--color-text-muted)">{{ loadError }}</p>
        <Button type="button" variant="outline" @click="loadData">Retry</Button>
      </div>

      <template v-else-if="activeFilter !== 'ALL'">
        <p v-if="flatTasks.length === 0" class="py-12 text-center text-(--color-text-muted)">
          No {{ activeFilter.toLowerCase() }} tasks
        </p>
        <TransitionGroup v-else tag="ul" name="task-item" class="relative">
          <TaskRow
            v-for="task in flatTasks"
            :key="task.id"
            :task="task"
            :course-name="getCourseName(task.courseId)"
            :due-date="getDueDate(task)"
            :time="''"
            @click="openTaskFromRow(task, $event)"
            @keydown.enter="openTaskFromRow(task, $event)"
            @toggle="toggleTask(task)"
            @actions="openQuickActions(task)"
          />
        </TransitionGroup>
      </template>

      <template v-else>
        <Accordion type="multiple" :default-value="['SCHEDULED']">
          <AccordionItem
            v-for="s in sections"
            :key="s.category"
            :value="s.category"
            class="border-b border-(--color-app-border) last:border-b"
          >
            <AccordionTrigger class="px-4 py-3 text-xl font-bold hover:no-underline">
              {{ s.label }}
            </AccordionTrigger>
            <AccordionContent class="p-0">
              <p v-if="s.list.length === 0" class="px-4 py-3 text-sm text-(--color-text-muted)">
                No {{ s.label.toLowerCase() }} tasks
              </p>
              <TransitionGroup v-else tag="ul" name="task-item" class="relative">
                <TaskRow
                  v-for="task in s.list"
                  :key="task.id"
                  :task="task"
                  :course-name="getCourseName(task.courseId)"
                  :due-date="getDueDate(task)"
                  :time="''"
                  @click="openTaskFromRow(task, $event)"
                  @keydown.enter="openTaskFromRow(task, $event)"
                  @toggle="toggleTask(task)"
                  @actions="openQuickActions(task)"
                />
              </TransitionGroup>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </template>
    </div>

    <AddFab label="Add task" data-testid="tasks-fab" @click="newTask($event)" />

    <TaskContainerModal
      :is-open="modalOpen"
      :task-id="modalTaskId"
      :origin-rect="modalOrigin"
      @close="onModalClosed"
      @deleted="onTaskDeleted"
    />

    <TaskQuickActionsSheet
      :open="quickSheet.open"
      :task="quickSheet.task"
      @update:open="quickSheet.open = $event"
      @schedule="applySchedule"
      @duration="applyDuration"
      @delete="quickDelete"
    />
  </div>
</template>

<style scoped>
.task-item-enter-active,
.task-item-leave-active,
.task-item-move {
  transition:
    opacity 200ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.task-item-leave-active {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 0;
  transition-duration: 160ms;
}

.task-item-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.task-item-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

@media (prefers-reduced-motion: reduce) {
  .task-item-enter-active,
  .task-item-leave-active,
  .task-item-move {
    transition-duration: 120ms;
  }

  .task-item-enter-from,
  .task-item-leave-to {
    transform: none;
  }
}
</style>
