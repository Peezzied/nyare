<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown, ChevronRight, Calendar } from 'lucide-vue-next'
import { tasksApi } from '@/api/tasks'
import { useCatalog } from '@/composables/useCatalog'
import { TASK_DISPLAY_TIMES, TASK_DUE_DATES, TODO_FIXTURE_TASKS_V2 } from '@/api/mocks/fixtures'
import { getCourseColor } from '@/constants/palette'
import { getPlanCategory } from '@/utils/planCategory'
import { getTaskUrgency, formatDueLabel, formatDuration, URGENCY_COLORS } from '@/utils/taskUrgency'
import { Checkbox } from '@/components/ui/checkbox'
import TodoHeader from '@/components/TodoHeader.vue'
import BottomNav from '@/components/BottomNav.vue'
import type { TaskResponse, PlanCategory } from '@/types/api'

type ActiveFilter = 'ALL' | PlanCategory

const router = useRouter()
const catalog = useCatalog()

const tasks = ref<TaskResponse[]>([])
const loading = ref(true)

const activeFilter = ref<ActiveFilter>('ALL')

// Independent section collapse state; Scheduled open by default (FR-006)
const expandedSections = ref<Record<PlanCategory, boolean>>({
  SCHEDULED: true,
  LATER: false,
  BACKLOG: false,
})

function getCourseName(courseId: number): string {
  const found = catalog.courses.value.find((c) => c.id === courseId)
  return found?.name ?? `Course ${courseId}`
}

/** Category: prefer backend planCategory, fall back to local derivation (FR-009). */
function getCategory(task: TaskResponse): PlanCategory {
  return task.planCategory ?? getPlanCategory(task)
}

/** Due date for urgency: fixture map first, then scheduledDate fallback (spec assumptions). */
function getDueDate(task: TaskResponse): string | null {
  return TASK_DUE_DATES[task.id] ?? task.scheduledDate ?? null
}

const scheduledTasks = computed(() =>
  tasks.value
    .filter((t) => getCategory(t) === 'SCHEDULED')
    .sort((a, b) => {
      const da = getDueDate(a) ?? a.scheduledDate ?? a.createdAt
      const db = getDueDate(b) ?? b.scheduledDate ?? b.createdAt
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

function tasksForFilter(filter: PlanCategory): TaskResponse[] {
  if (filter === 'SCHEDULED') return scheduledTasks.value
  if (filter === 'LATER') return laterTasks.value
  return backlogTasks.value
}

async function loadData() {
  loading.value = true
  try {
    await catalog.loadCatalog()
    const fetched = await tasksApi.list()
    // Merge fixture v2 tasks; prefer fetched rows when IDs overlap
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
    tasks.value = tasks.value.map((t) => (t.id === task.id ? { ...t, status: previous } : t))
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
      <!-- Segmented filter pills (FR-001, FR-002) -->
      <div class="px-4 pt-3 pb-2">
        <div
          class="flex gap-1 rounded-xl border border-(--color-app-border) bg-(--color-card) p-1"
          role="tablist"
          aria-label="Filter tasks by category"
        >
          <button
            v-for="filter in (['ALL', 'SCHEDULED', 'LATER', 'BACKLOG'] as const)"
            :key="filter"
            role="tab"
            type="button"
            :aria-selected="activeFilter === filter"
            class="flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors"
            :class="
              activeFilter === filter
                ? 'bg-(--color-primary) text-white'
                : 'text-(--color-text-muted) hover:text-(--color-text-main)'
            "
            @click="activeFilter = filter"
          >
            {{ filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase() }}
          </button>
        </div>
      </div>

      <!-- Loading indicator -->
      <p v-if="loading" class="py-8 text-center text-(--color-text-muted)">Loading tasks…</p>

      <!-- Flat list when a specific category pill is selected (FR-007) -->
      <template v-else-if="activeFilter !== 'ALL'">
        <p
          v-if="tasksForFilter(activeFilter).length === 0"
          class="py-12 text-center text-(--color-text-muted)"
        >
          No {{ activeFilter.toLowerCase() }} tasks
        </p>
        <ul v-else class="flex flex-col">
          <li
            v-for="task in tasksForFilter(activeFilter)"
            :key="task.id"
            class="flex min-h-[72px] cursor-pointer items-center gap-3 px-4 py-3 transition-opacity"
            :class="{ 'opacity-50': task.status === 'COMPLETED' }"
            role="button"
            tabindex="0"
            @click="navigateToTask(task)"
            @keydown.enter="navigateToTask(task)"
          >
            <!-- Left: checkbox -->
            <div class="flex h-11 w-11 shrink-0 items-center justify-center" @click.stop>
              <Checkbox
                :model-value="task.status === 'COMPLETED'"
                :aria-label="`Mark ${task.title} as completed`"
                @update:model-value="toggleTask(task)"
              />
            </div>

            <!-- Middle: course name, title, time -->
            <div class="flex min-w-0 flex-1 flex-col">
              <span
                class="text-sm font-bold leading-snug break-words"
                :style="{ color: getCourseColor(task.courseId).text }"
              >
                {{ getCourseName(task.courseId) }}
              </span>
              <span
                class="text-base font-semibold text-(--color-text-main)"
                :class="{ 'line-through': task.status === 'COMPLETED' }"
              >
                {{ task.title }}
              </span>
              <span class="text-sm text-(--color-text-muted)">
                {{ TASK_DISPLAY_TIMES[task.id] ?? '' }}
              </span>
            </div>

            <!-- Right: duration + calendar urgency (FR-012, FR-013, FR-014, FR-015) -->
            <div class="flex shrink-0 flex-col items-center gap-0.5">
              <span
                v-if="formatDuration(task.duration)"
                class="text-xs text-(--color-primary-bevel)"
              >
                {{ formatDuration(task.duration) }}
              </span>
              <Calendar
                class="h-5 w-5"
                :style="{ color: URGENCY_COLORS[getTaskUrgency(getDueDate(task))] }"
                aria-hidden="true"
              />
              <span
                v-if="formatDueLabel(getDueDate(task))"
                class="text-[10px] font-semibold leading-none"
                :style="{ color: URGENCY_COLORS[getTaskUrgency(getDueDate(task))] }"
              >
                {{ formatDueLabel(getDueDate(task)) }}
              </span>
            </div>
          </li>
        </ul>
      </template>

      <!-- All view: collapsible accordion sections (FR-004 through FR-008) -->
      <template v-else>
        <section
          v-for="{ category, label, taskList } in [
            { category: 'SCHEDULED' as PlanCategory, label: 'Scheduled', taskList: scheduledTasks },
            { category: 'LATER' as PlanCategory, label: 'Later', taskList: laterTasks },
            { category: 'BACKLOG' as PlanCategory, label: 'Backlog', taskList: backlogTasks },
          ]"
          :key="category"
        >
          <!-- Section header toggle (FR-005) -->
          <button
            type="button"
            class="flex w-full items-center gap-2 px-4 py-2 text-left"
            :aria-expanded="expandedSections[category]"
            @click="toggleSection(category)"
          >
            <component
              :is="expandedSections[category] ? ChevronDown : ChevronRight"
              class="h-4 w-4 shrink-0 text-(--color-text-muted)"
            />
            <span class="text-sm font-semibold text-(--color-text-main)">{{ label }}</span>
            <div class="flex-1 border-t border-(--color-app-border)" aria-hidden="true" />
          </button>

          <!-- Expanded task list -->
          <ul v-if="expandedSections[category]" class="flex flex-col">
            <p
              v-if="taskList.length === 0"
              class="px-4 pb-2 text-sm text-(--color-text-muted)"
            >
              No {{ label.toLowerCase() }} tasks
            </p>
            <li
              v-for="task in taskList"
              :key="task.id"
              class="flex min-h-[72px] cursor-pointer items-center gap-3 px-4 py-3 transition-opacity"
              :class="{ 'opacity-50': task.status === 'COMPLETED' }"
              role="button"
              tabindex="0"
              @click="navigateToTask(task)"
              @keydown.enter="navigateToTask(task)"
            >
              <!-- Left: checkbox (FR-010, FR-020) -->
              <div class="flex h-11 w-11 shrink-0 items-center justify-center" @click.stop>
                <Checkbox
                  :model-value="task.status === 'COMPLETED'"
                  :aria-label="`Mark ${task.title} as completed`"
                  @update:model-value="toggleTask(task)"
                />
              </div>

              <!-- Middle: course name, title, time (FR-011) -->
              <div class="flex min-w-0 flex-1 flex-col">
                <span
                  class="text-sm font-bold leading-snug break-words"
                  :style="{ color: getCourseColor(task.courseId).text }"
                >
                  {{ getCourseName(task.courseId) }}
                </span>
                <span
                  class="text-base font-semibold text-(--color-text-main)"
                  :class="{ 'line-through': task.status === 'COMPLETED' }"
                >
                  {{ task.title }}
                </span>
                <span class="text-sm text-(--color-text-muted)">
                  {{ TASK_DISPLAY_TIMES[task.id] ?? '' }}
                </span>
              </div>

              <!-- Right: duration + calendar icon (FR-012, FR-013, FR-014, FR-015) -->
              <div class="flex shrink-0 flex-col items-center gap-0.5">
                <span
                  v-if="formatDuration(task.duration)"
                  class="text-xs text-(--color-primary-bevel)"
                >
                  {{ formatDuration(task.duration) }}
                </span>
                <Calendar
                  class="h-5 w-5"
                  :style="{ color: URGENCY_COLORS[getTaskUrgency(getDueDate(task))] }"
                  aria-hidden="true"
                />
                <span
                  v-if="formatDueLabel(getDueDate(task))"
                  class="text-[10px] font-semibold leading-none"
                  :style="{ color: URGENCY_COLORS[getTaskUrgency(getDueDate(task))] }"
                >
                  {{ formatDueLabel(getDueDate(task)) }}
                </span>
              </div>
            </li>
          </ul>
        </section>
      </template>
    </main>

    <BottomNav />
  </div>
</template>
