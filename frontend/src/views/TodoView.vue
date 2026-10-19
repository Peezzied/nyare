<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import { Plus } from '@lucide/vue'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { useCatalog } from '@/composables/useCatalog'
import { useTasks } from '@/composables/useTasks'
import { getPlanCategory } from '@/utils/planCategory'
import { useShellHeader } from '@/composables/useShellHeader'
import { toTapOriginRect } from '@/composables/useNoteTransition'
import TaskRow from '@/components/TaskRow.vue'
import TaskContainerModal from '@/components/tasks/TaskContainerModal.vue'
import type { TapOriginRect } from '@/types/notesTransition'
import type { TaskResponse, PlanCategory } from '@/types/api'

type ActiveFilter = 'ALL' | PlanCategory

useShellHeader({ title: 'To-do', left: () => h(HamburgerMenu) })

const catalog = useCatalog()
const { tasks, loadTasks, updateTaskStatus } = useTasks()
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

const filters: { key: ActiveFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
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
  if (activeFilter.value === 'SCHEDULED') return scheduledTasks.value
  if (activeFilter.value === 'LATER') return laterTasks.value
  if (activeFilter.value === 'BACKLOG') return backlogTasks.value
  return []
})

async function loadData() {
  loading.value = true
  try {
    await catalog.loadCatalog()
    await loadTasks()
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
  } catch {
    tasks.value = tasks.value.map((t) => (t.id === task.id ? { ...t, status: previous } : t))
  }
}

onMounted(loadData)
</script>

<template>
  <div class="relative flex min-h-full flex-col bg-(--color-app-bg) text-(--color-text-main)">
    <div class="flex-1 pb-6">
      <div class="px-4 pt-3 pb-2">
        <div
          class="inline-flex rounded-full border border-(--color-app-border) bg-(--color-card) p-1"
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

      <template v-else-if="activeFilter !== 'ALL'">
        <p v-if="flatTasks.length === 0" class="py-12 text-center text-(--color-text-muted)">
          No {{ activeFilter.toLowerCase() }} tasks
        </p>
        <ul v-else>
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
          />
        </ul>
      </template>

      <template v-else>
        <Accordion type="multiple" :default-value="['SCHEDULED']">
          <AccordionItem
            v-for="s in sections"
            :key="s.category"
            :value="s.category"
            class="mx-4 border-b border-(--color-app-border) last:border-b"
          >
            <AccordionTrigger class="py-3 text-xl font-bold hover:no-underline">
              {{ s.label }}
            </AccordionTrigger>
            <AccordionContent class="p-0">
              <p v-if="s.list.length === 0" class="px-4 py-3 text-sm text-(--color-text-muted)">
                No {{ s.label.toLowerCase() }} tasks
              </p>
              <ul v-else>
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
                />
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </template>
    </div>

    <Button
      type="button"
      variant="default"
      size="icon-touch"
      data-testid="tasks-fab"
      aria-label="Add task"
      class="absolute right-4 bottom-4 z-10 h-14 w-14 rounded-2xl shadow-lg"
      @click="newTask($event)"
    >
      <Plus class="size-6" aria-hidden="true" />
    </Button>

    <TaskContainerModal
      :is-open="taskModal.open"
      :task-id="taskModal.taskId"
      :origin-rect="taskModal.originRect"
      @close="closeTaskModal"
    />
  </div>
</template>
