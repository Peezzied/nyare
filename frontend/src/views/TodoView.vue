<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import { tasksApi } from '@/api/tasks'
import { useCatalog } from '@/composables/useCatalog'
import {
  TASK_DISPLAY_TIMES,
  TASK_DUE_DATES,
  TODO_FIXTURE_TASKS_V2,
  TODO_FIXTURE_COURSES,
} from '@/api/mocks/fixtures'
import { getPlanCategory } from '@/utils/planCategory'
import TodoHeader from '@/components/TodoHeader.vue'
import TaskRow from '@/components/TaskRow.vue'
import type { TaskResponse, PlanCategory } from '@/types/api'

type ActiveFilter = 'ALL' | PlanCategory

const router = useRouter()
const catalog = useCatalog()

const tasks = ref<TaskResponse[]>([])
const loading = ref(true)
const activeFilter = ref<ActiveFilter>('ALL')

const filters: { key: ActiveFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'LATER', label: 'Later' },
  { key: 'BACKLOG', label: 'Backlog' },
]

// Independent section collapse state; Scheduled open by default
const expandedSections = ref<Record<PlanCategory, boolean>>({
  SCHEDULED: true,
  LATER: false,
  BACKLOG: false,
})

function getCourseName(courseId: number): string {
  const found = catalog.courses.value.find((c) => c.id === courseId)
  if (found) return found.name
  const fixtureCourse = TODO_FIXTURE_COURSES.find((c) => c.id === courseId)
  return fixtureCourse?.name ?? `Course ${courseId}`
}

function getCategory(task: TaskResponse): PlanCategory {
  return task.planCategory ?? getPlanCategory(task)
}

function getDueDate(task: TaskResponse): string | null {
  return TASK_DUE_DATES[task.id] ?? task.scheduledDate ?? null
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
    const fetched = await tasksApi.list()
    const fetchedIds = new Set(fetched.map((t) => t.id))
    const extras = TODO_FIXTURE_TASKS_V2.filter((t) => !fetchedIds.has(t.id))
    tasks.value = [...fetched, ...extras]
  } finally {
    loading.value = false
  }
}

async function toggleTask(task: TaskResponse) {
  const previous = task.status
  const nextStatus = previous === 'COMPLETED' ? 'TODO' : 'COMPLETED'
  tasks.value = tasks.value.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
  try {
    const updated = await tasksApi.updateStatus(task.id, nextStatus)
    tasks.value = tasks.value.map((t) => (t.id === task.id ? updated : t))
  } catch {
    const isFixtureTask = TODO_FIXTURE_TASKS_V2.some((t) => t.id === task.id)
    if (!isFixtureTask) {
      tasks.value = tasks.value.map((t) => (t.id === task.id ? { ...t, status: previous } : t))
    }
  }
}

function navigateToTask(task: TaskResponse) {
  router.push({ name: 'task-detail', params: { id: task.id } })
}

function toggleSection(category: PlanCategory) {
  expandedSections.value[category] = !expandedSections.value[category]
}

onMounted(loadData)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-(--color-app-bg) text-(--color-text-main)">
    <TodoHeader />

    <main class="flex-1 pb-20">
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
            :time="TASK_DISPLAY_TIMES[task.id] ?? ''"
            @open="navigateToTask(task)"
            @toggle="toggleTask(task)"
          />
        </ul>
      </template>

      <template v-else>
        <section v-for="s in sections" :key="s.category">
          <div class="mx-4 border-b border-(--color-app-border)">
            <button
              type="button"
              class="flex w-full items-center gap-2 py-3 text-left"
              :aria-expanded="expandedSections[s.category]"
              @click="toggleSection(s.category)"
            >
              <component
                :is="expandedSections[s.category] ? ChevronDown : ChevronRight"
                class="h-6 w-6 shrink-0"
              />
              <span class="text-xl font-bold">{{ s.label }}</span>
            </button>
          </div>

          <template v-if="expandedSections[s.category]">
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
                :time="TASK_DISPLAY_TIMES[task.id] ?? ''"
                @open="navigateToTask(task)"
                @toggle="toggleTask(task)"
              />
            </ul>
          </template>
        </section>
      </template>
    </main>
  </div>
</template>
