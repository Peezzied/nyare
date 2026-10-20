<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
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
import { getPlanCategory } from '@/utils/planCategory'
import { useShellHeader } from '@/composables/useShellHeader'
import { toTapOriginRect } from '@/composables/useNoteTransition'
import TaskRow from '@/components/TaskRow.vue'
import TaskContainerModal from '@/components/tasks/TaskContainerModal.vue'
import TaskQuickActionsSheet from '@/components/tasks/TaskQuickActionsSheet.vue'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'vue-sonner'
import { formatDueLabel, formatDuration, isOverdue } from '@/utils/taskUrgency'
import { minutesToDuration } from '@/utils/duration'
import { fromTask, toTaskRequest, type TaskFormState } from '@/utils/taskForm'
import type { TapOriginRect } from '@/types/notesTransition'
import type { TaskResponse, PlanCategory } from '@/types/api'

type ActiveFilter = 'ALL' | 'OVERDUE' | PlanCategory

useShellHeader({ title: 'To-do', left: () => h(HamburgerMenu) })

const catalog = useCatalog()
const { tasks, loadTasks, updateTask, updateTaskStatus, deleteTask } = useTasks()
const loading = ref(true)
const activeFilter = ref<ActiveFilter>('ALL')

interface TaskModalState {
  open: boolean
  taskId: string | null
  originRect: TapOriginRect | null
  triggerKind: 'row' | 'fab'
}

const taskModal = ref<TaskModalState>({
  open: false,
  taskId: null,
  originRect: null,
  triggerKind: 'fab',
})

function openTaskModal(options: {
  taskId: string | null
  originRect: TapOriginRect | null
  triggerKind: 'row' | 'fab'
}) {
  // A second tap while the overlay is up or animating is ignored.
  if (taskModal.value.open) {
    return
  }
  taskModal.value = {
    open: true,
    taskId: options.taskId,
    originRect: options.originRect,
    triggerKind: options.triggerKind,
  }
}

function newTask(event?: Event) {
  if (taskModal.value.open) {
    return
  }
  const el = (event?.currentTarget ?? event?.target) as Element | null
  openTaskModal({
    taskId: null,
    originRect: el ? toTapOriginRect(el) : null,
    triggerKind: 'fab',
  })
}

function openTaskFromRow(task: TaskResponse, event?: Event) {
  if (taskModal.value.open) {
    return
  }
  const el = (event?.currentTarget ?? event?.target) as Element | null
  openTaskModal({
    taskId: task.id,
    originRect: el ? toTapOriginRect(el) : null,
    triggerKind: 'row',
  })
}

function closeTaskModal() {
  taskModal.value = { ...taskModal.value, open: false }
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
    toast.success(successLabel)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Could not update task')
  }
}

function applySchedule(date: string | null) {
  const label = date ? `Scheduled for ${formatDueLabel(date).toLowerCase()}` : 'Date removed'
  void patchTask({ scheduledDate: date ?? '' }, label)
}

function applyDuration(minutes: number | null) {
  const label =
    minutes === null ? 'Duration cleared' : `Duration set to ${formatDuration(minutesToDuration(minutes))}`
  void patchTask({ durationMinutes: minutes }, label)
}

/** Removes the row now and commits the API delete when the undo toast lapses. */
function quickDelete() {
  const task = quickSheet.value.task
  if (!task) {
    return
  }
  quickSheet.value = { open: false, task: null }
  const index = tasks.value.findIndex((t) => t.id === task.id)
  tasks.value = tasks.value.filter((t) => t.id !== task.id)

  let cancelled = false
  const restore = () => {
    cancelled = true
    const next = [...tasks.value]
    next.splice(Math.min(Math.max(index, 0), next.length), 0, task)
    tasks.value = next
  }
  const commit = () => {
    if (cancelled) {
      return
    }
    deleteTask(task.id).catch((err) => {
      restore()
      toast.error(err instanceof Error ? err.message : 'Could not delete task')
    })
  }
  toast('Task deleted', {
    duration: 5000,
    action: { label: 'Undo', onClick: restore },
    onAutoClose: commit,
    onDismiss: commit,
  })
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
    await catalog.loadCatalog()
    await loadTasks()
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
</script>

<template>
  <div class="relative flex h-full flex-col bg-(--color-app-bg) text-(--color-text-main)">
    <div class="min-h-0 flex-1 overflow-y-auto pb-6">
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
      :is-open="taskModal.open"
      :task-id="taskModal.taskId"
      :origin-rect="taskModal.originRect"
      @close="closeTaskModal"
    />

    <TaskQuickActionsSheet
      :open="quickSheet.open"
      :task="quickSheet.task"
      @update:open="quickSheet.open = $event"
      @schedule="applySchedule"
      @duration="applyDuration"
      @delete="quickDelete"
    />

    <Toaster />
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
