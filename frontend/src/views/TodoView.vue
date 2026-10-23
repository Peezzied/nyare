<script setup lang="ts">
import { ref, computed, h, nextTick, onActivated, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tasksApi } from '@/api'
import type { TaskListParams } from '@/api'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import AddFab from '@/components/AddFab.vue'
import SearchBar from '@/components/SearchBar.vue'
import FilterSheet, { type ListFilters } from '@/components/FilterSheet.vue'
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
import { useServerSearch } from '@/composables/useServerSearch'
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

const query = ref('')
const filters = ref<ListFilters>({})
const filterSheetOpen = ref(false)
const filtersActive = computed(() => Object.keys(filters.value).length > 0)
const searchParams = computed<TaskListParams | null>(() => {
  const q = query.value.trim()
  const { courseId, from, to, status } = filters.value
  if (q === '' && !filtersActive.value) {
    return null
  }
  return {
    ...(q && { q }),
    ...(courseId && { courseId }),
    ...(from && { from }),
    ...(to && { to }),
    ...(status && { status }),
  }
})
const { results: searchResults, error: searchError, retry: retrySearch } = useServerSearch(
  tasksApi.list,
  searchParams,
)

// Mirrors cache writes into an active search list: saved rows refresh in
// place, deleted rows drop out, and rows the cache never held keep their
// search copy so a failed list load does not blank a working search.
// ponytail: undo restores a deleted task into the cache but not this list.
watch(tasks, (list, prev) => {
  if (searchResults.value === null) {
    return
  }
  const byId = new Map(list.map((t) => [t.id, t]))
  const prevIds = new Set(prev.map((t) => t.id))
  searchResults.value = searchResults.value
    .filter((t) => byId.has(t.id) || !prevIds.has(t.id))
    .map((t) => byId.get(t.id) ?? t)
})

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
  // The morph's own pop may have already left this route; never pop twice.
  if (!modalOpen.value) {
    return
  }
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

const filterTabs: { key: ActiveFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OVERDUE', label: 'Overdue' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'LATER', label: 'Later' },
  { key: 'BACKLOG', label: 'Backlog' },
]

const tabEls = new Map<ActiveFilter, HTMLElement>()

function setTabEl(key: ActiveFilter, el: unknown) {
  if (el instanceof HTMLElement) {
    tabEls.set(key, el)
  } else {
    tabEls.delete(key)
  }
}

function selectFilter(key: ActiveFilter, focus = false) {
  activeFilter.value = key
  void nextTick(() => {
    const el = tabEls.get(key)
    if (focus) {
      el?.focus()
    }
    el?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  })
}

function onTabKeydown(event: KeyboardEvent, key: ActiveFilter) {
  const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (!delta) {
    return
  }
  event.preventDefault()
  const index = filterTabs.findIndex((f) => f.key === key)
  const next = filterTabs[(index + delta + filterTabs.length) % filterTabs.length]
  if (next) {
    selectFilter(next.key, true)
  }
}

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

    <div
      v-if="searchResults === null && searchError === null"
      class="shrink-0 overflow-visible mx-4 pt-3 pb-3 [&::-webkit-scrollbar]:hidden"
      style="scrollbar-width: none"
    >
      <div
        role="tablist"
        aria-label="Filter tasks by category"
        class="flex w-full items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          role="group"
          aria-label="Task views"
          class="flex shrink-0 items-center gap-1 rounded-full border border-[#D5EBF1] bg-[#FDFEF7] p-1 shadow-[0_2px_0_#D5EBF1]"
        >
          <button
            v-for="f in filterTabs.slice(0, 2)"
            :key="f.key"
            :ref="(el) => setTabEl(f.key, el)"
            role="tab"
            type="button"
            :aria-selected="activeFilter === f.key"
            :tabindex="activeFilter === f.key ? 0 : -1"
            class="flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-bold whitespace-nowrap transition-[background-color,color,box-shadow,translate] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)/50"
            :class="
              activeFilter === f.key
                ? 'bg-(--color-primary) text-white shadow-[0_2px_0_var(--color-primary-bevel)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-primary-bevel)]'
                : 'text-(--color-primary-bevel) hover:bg-white/70 active:bg-white'
            "
            @click="selectFilter(f.key)"
            @keydown="onTabKeydown($event, f.key)"
          >
            {{ f.label }}
          </button>
        </div>
        <div
          role="group"
          aria-label="Plan categories"
          class="flex flex-1 items-center gap-1 rounded-full border border-[#D5EBF1] bg-[#F0F8FA] p-1 shadow-[inset_0_1px_3px_rgba(0,75,99,0.1)]"
        >
          <button
            v-for="f in filterTabs.slice(2)"
            :key="f.key"
            :ref="(el) => setTabEl(f.key, el)"
            role="tab"
            type="button"
            :aria-selected="activeFilter === f.key"
            :tabindex="activeFilter === f.key ? 0 : -1"
            class="flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-sm font-bold whitespace-nowrap transition-[background-color,color,box-shadow,translate] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)/50"
            :class="
              activeFilter === f.key
                ? 'bg-(--color-primary) text-white shadow-[0_2px_0_var(--color-primary-bevel)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-primary-bevel)]'
                : 'text-(--color-primary-bevel) hover:bg-white/70 active:bg-white'
            "
            @click="selectFilter(f.key)"
            @keydown="onTabKeydown($event, f.key)"
          >
            {{ f.label }}
          </button>
        </div>
      </div>
    </div>

    <FilterSheet
      v-model:open="filterSheetOpen"
      v-model="filters"
      :courses="catalog.courses.value"
      :show-status="true"
    />

    <div class="min-h-0 flex-1 overflow-y-auto pb-26">
      <SearchBar
        v-model="query"
        placeholder="Search tasks…"
        :filters-active="filtersActive"
        @filter="filterSheetOpen = true"
      />
      <p v-if="loading && searchResults === null" class="py-8 text-center text-(--color-text-muted)">
        Loading tasks…
      </p>

      <div
        v-else-if="loadError && searchResults === null"
        class="flex flex-col items-center gap-3 py-12"
      >
        <p role="alert" class="text-center text-(--color-text-muted)">{{ loadError }}</p>
        <Button type="button" variant="outline" @click="loadData">Retry</Button>
      </div>

      <div v-else-if="searchError" class="flex flex-col items-center gap-3 py-12">
        <p role="alert" class="text-center text-(--color-text-muted)">{{ searchError }}</p>
        <Button type="button" variant="outline" @click="retrySearch">Retry</Button>
      </div>

      <template v-else-if="searchResults !== null">
        <p v-if="searchResults.length === 0" class="py-12 text-center text-(--color-text-muted)">
          No matching tasks
        </p>
        <TransitionGroup v-else tag="ul" name="task-item" class="relative">
          <TaskRow
            v-for="task in searchResults"
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
