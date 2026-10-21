<script setup lang="ts">
// Archive page: every archived course as a read-only row that opens its snapshot.
import { computed, h, onMounted, ref } from 'vue'
import { Archive, ArchiveRestore, ArrowLeft, ChevronRight, Trash2 } from '@lucide/vue'
import { useRouter } from 'vue-router'
import HeaderIconButton from '@/components/HeaderIconButton.vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import DialogShell from '@/components/ui/DialogShell.vue'
import { useArchive } from '@/composables/useArchive'
import { useCatalog } from '@/composables/useCatalog'
import { useShellHeader } from '@/composables/useShellHeader'
import { useToasts } from '@/composables/useToasts'
import { formatEntryDate } from '@/utils/noteDate'
import type { CourseResponse } from '@/types/api'

const router = useRouter()
const archive = useArchive()
const catalog = useCatalog()

useShellHeader({
  title: 'Archive',
  left: () =>
    h(
      HeaderIconButton,
      {
        'aria-label': 'Back',
        'data-testid': 'archive-back',
        onClick: goBack,
      },
      () => h(ArrowLeft, { class: 'h-6 w-6', 'aria-hidden': 'true' }),
    ),
  right: () =>
    archive.archivedCourses.value.length > 0
      ? h(
          HeaderIconButton,
          {
            'aria-label': 'Delete all archived courses',
            'data-testid': 'archive-delete-all',
            onClick: () => {
              deletingAll.value = true
            },
          },
          () => h(Trash2, { class: 'h-6 w-6 text-[#B91C1C]', 'aria-hidden': 'true' }),
        )
      : h('span', { class: 'block h-11 w-11', 'aria-hidden': 'true' }),
})

const loading = ref(true)
const loadFailed = ref(false)
const unarchivingId = ref<number | null>(null)
const deletingCourse = ref<CourseResponse | null>(null)
const deletingAll = ref(false)

const deleteTitle = computed(() =>
  deletingAll.value ? 'Delete all archived courses?' : 'Delete course?',
)

const deleteMessage = computed(() => {
  if (deletingAll.value) {
    const count = archive.archivedCourses.value.length
    return `This deletes all ${count} archived ${count === 1 ? 'course' : 'courses'} and their notes, tasks, events, and class times.`
  }
  return deletingCourse.value
    ? `This deletes ${deletingCourse.value.name} and all its notes, tasks, events, and class times.`
    : ''
})

function archivedLabel(course: CourseResponse): string {
  const formatted = formatEntryDate(course.archivedAt?.slice(0, 10))
  return formatted ? `Archived ${formatted}` : 'Archived'
}

function openCourse(course: CourseResponse): void {
  void router.push({ name: 'archived-course', params: { courseId: course.id } })
}

async function unarchiveCourse(course: CourseResponse): Promise<void> {
  if (unarchivingId.value !== null) {
    return
  }
  unarchivingId.value = course.id
  try {
    await catalog.unarchiveCourses([course.id])
    archive.applyCourseRemoved(course.id)
    useToasts().pushToast({ kind: 'success', title: 'Course restored.' })
  } catch (error) {
    useToasts().pushToast({
      kind: 'error',
      title: 'Could not restore the course.',
      detail: error instanceof Error ? error.message : undefined,
    })
  } finally {
    unarchivingId.value = null
  }
}

async function confirmDelete(): Promise<void> {
  if (deletingAll.value) {
    deletingAll.value = false
    const failed = await archive.deleteAllArchived()
    useToasts().pushToast(
      failed === 0
        ? { kind: 'success', title: 'Archive emptied.' }
        : {
            kind: 'error',
            title: `Could not delete ${failed} ${failed === 1 ? 'course' : 'courses'}.`,
          },
    )
    return
  }
  const course = deletingCourse.value
  if (!course) {
    return
  }
  deletingCourse.value = null
  try {
    await archive.deleteArchivedCourse(course.id)
    useToasts().pushToast({ kind: 'success', title: 'Course deleted.' })
  } catch (error) {
    useToasts().pushToast({
      kind: 'error',
      title: 'Could not delete the course.',
      detail: error instanceof Error ? error.message : undefined,
    })
  }
}

function closeDeleteDialog(): void {
  deletingCourse.value = null
  deletingAll.value = false
}

function goBack(): void {
  if (window.history.length > 1) {
    router.back()
    return
  }
  void router.push({ name: 'calendar' })
}

async function load(): Promise<void> {
  loading.value = true
  loadFailed.value = false
  try {
    await archive.loadArchive()
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div
    data-testid="archive-page"
    class="relative h-full overflow-y-auto bg-app-bg px-4 pb-8 pt-4"
  >
    <p
      v-if="loading"
      data-testid="archive-loading"
      class="py-8 text-center text-sm text-text-muted"
    >
      Loading archive…
    </p>

    <div
      v-else-if="loadFailed"
      data-testid="archive-error"
      role="alert"
      class="mt-6 rounded-2xl border border-app-border bg-card p-6 text-center"
    >
      <p class="text-base font-semibold text-text-main">Archive failed to load.</p>
      <Button type="button" variant="tactile" size="touch" class="mt-4" @click="load">
        Retry
      </Button>
    </div>

    <TransitionGroup
      v-else
      tag="ul"
      name="archive-row"
      class="relative flex flex-col gap-4"
    >
      <li v-for="course in archive.archivedCourses.value" :key="course.id">
        <Card
          as="article"
          role="button"
          tabindex="0"
          data-testid="archive-course-row"
          class="cursor-pointer gap-0 rounded-2xl border-[#D5EBF1] bg-[#FDFEF7] px-4 py-4 shadow-[0_4px_0_#D5EBF1] transition-transform active:scale-[0.98]"
          @click="openCourse(course)"
          @keydown.enter="openCourse(course)"
          @keydown.space.prevent="openCourse(course)"
        >
          <div class="flex items-center gap-3">
            <span
              class="h-4 w-4 shrink-0 rounded-full"
              :style="{ backgroundColor: archive.courseColor(course.id).solid }"
              aria-hidden="true"
            />
            <div class="min-w-0 flex-1">
              <h2 class="truncate text-base font-bold text-text-main">{{ course.name }}</h2>
              <p class="mt-0.5 text-sm text-text-muted">{{ archivedLabel(course) }}</p>
            </div>
            <button
              type="button"
              :aria-label="`Unarchive ${course.name}`"
              :disabled="unarchivingId === course.id"
              data-testid="archive-course-unarchive"
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-black/5 active:bg-black/10 disabled:opacity-50"
              @click.stop="unarchiveCourse(course)"
              @keydown.enter.stop
              @keydown.space.stop
            >
              <ArchiveRestore class="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              :aria-label="`Delete ${course.name}`"
              data-testid="archive-course-delete"
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#B91C1C] transition-colors hover:bg-black/5 active:bg-black/10"
              @click.stop="deletingCourse = course"
              @keydown.enter.stop
              @keydown.space.stop
            >
              <Trash2 class="h-5 w-5" aria-hidden="true" />
            </button>
            <ChevronRight class="h-5 w-5 shrink-0 text-text-muted" aria-hidden="true" />
          </div>
        </Card>
      </li>
    </TransitionGroup>

    <Transition name="empty-fade">
      <div
        v-if="!loading && !loadFailed && archive.archivedCourses.value.length === 0"
        data-testid="archive-empty-state"
        class="flex flex-col items-center px-6 py-16 text-center"
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F6FA]">
          <Archive class="h-8 w-8 text-[#007B99]" aria-hidden="true" />
        </div>
        <p class="mt-4 text-lg font-bold text-text-main">No archived courses</p>
        <p class="mt-1 text-sm text-text-muted">
          Archive a course from Manage Courses. Its notes, tasks, events, and class times stay
          readable here.
        </p>
      </div>
    </Transition>

    <DialogShell
      :open="deletingCourse !== null || deletingAll"
      :title="deleteTitle"
      @update:open="closeDeleteDialog"
    >
      <p
        class="mt-2 text-sm text-[#7B8B97]"
        style="font-family: 'Inter', sans-serif; font-weight: 400"
      >
        {{ deleteMessage }}
      </p>

      <template #actions="{ dismiss }">
        <button
          type="button"
          data-testid="archive-delete-cancel"
          class="min-h-[44px] rounded-xl border-b-4 border-[#CBD5E1] bg-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#334155] transition-all duration-75 hover:bg-[#D7DEE8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 active:translate-y-1 active:border-b-0"
          style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          @click="dismiss"
        >
          Keep course
        </button>

        <button
          type="button"
          data-testid="archive-delete-confirm"
          class="min-h-[44px] rounded-xl border-b-4 border-[#991B1B] bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white transition-all duration-75 hover:bg-[#B91C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2 active:translate-y-1 active:border-b-0"
          style="font-family: 'Quicksand', sans-serif; font-weight: 700"
          @click="confirmDelete"
        >
          Delete
        </button>
      </template>
    </DialogShell>
  </div>
</template>

<style scoped>
.archive-row-enter-active,
.archive-row-leave-active,
.archive-row-move {
  transition:
    opacity 200ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.archive-row-leave-active {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 0;
  transition-duration: 160ms;
}

.archive-row-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.archive-row-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

.empty-fade-enter-active {
  transition: opacity 200ms ease-out 140ms;
}

.empty-fade-leave-active {
  position: absolute;
  right: 16px;
  left: 16px;
  transition: opacity 150ms ease-in;
}

.empty-fade-enter-from,
.empty-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .archive-row-enter-active,
  .archive-row-leave-active,
  .archive-row-move {
    transition-duration: 120ms;
  }

  .archive-row-enter-from,
  .archive-row-leave-to {
    transform: none;
  }

  .empty-fade-enter-active {
    transition-delay: 0ms;
  }
}
</style>
