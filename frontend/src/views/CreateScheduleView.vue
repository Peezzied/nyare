<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalog } from '@/composables/useCatalog'
import { coursesApi, schedulesApi } from '@/api'
import { ApiError } from '@/api/client'
import type { DayOfWeek } from '@/types/api'
import { COURSE_PALETTE_24 } from '@/constants/palette'

interface ScheduleDraft {
  day: DayOfWeek
  state: 'draft' | 'saving' | 'saved' | 'failed'
  savedId: number | null
  error: string
  submitted: boolean
}

interface TimeBlockDraft {
  id: string
  selectedDays: DayOfWeek[]
  startTime: string
  endTime: string
  room: string
  state: 'draft' | 'saving' | 'saved' | 'failed'
  schedules: ScheduleDraft[]
  error: string
}

const router = useRouter()
const {
  loadCatalog,
  applyCourseCreated,
  applyScheduleCreated,
} = useCatalog()

const WEEKDAYS = [
  { label: 'Su', value: 'SUNDAY' as DayOfWeek },
  { label: 'Mo', value: 'MONDAY' as DayOfWeek },
  { label: 'Tu', value: 'TUESDAY' as DayOfWeek },
  { label: 'We', value: 'WEDNESDAY' as DayOfWeek },
  { label: 'Th', value: 'THURSDAY' as DayOfWeek },
  { label: 'Fr', value: 'FRIDAY' as DayOfWeek },
  { label: 'Sa', value: 'SATURDAY' as DayOfWeek },
]

const colorOptions = COURSE_PALETTE_24
let nextBlockId = 0

function createScheduleDraft(day: DayOfWeek): ScheduleDraft {
  return {
    day,
    state: 'draft',
    savedId: null,
    error: '',
    submitted: false,
  }
}

function createBlock(): TimeBlockDraft {
  return {
    id: `block-${nextBlockId++}`,
    selectedDays: [],
    startTime: '',
    endTime: '',
    room: '',
    state: 'draft',
    schedules: [],
    error: '',
  }
}

function syncScheduleDrafts(block: TimeBlockDraft) {
  const byDay = new Map(block.schedules.map((schedule) => [schedule.day, schedule]))

  const selectedDrafts = block.selectedDays.map((day) => byDay.get(day) ?? createScheduleDraft(day))
  const savedDrafts = block.schedules.filter(
    (schedule) => schedule.state === 'saved' && !block.selectedDays.includes(schedule.day),
  )

  block.schedules = [...selectedDrafts, ...savedDrafts]
}

function blockStatus(block: TimeBlockDraft): TimeBlockDraft['state'] {
  if (block.schedules.length === 0) {
    return block.selectedDays.length > 0 ? 'draft' : 'draft'
  }

  if (block.schedules.some((schedule) => schedule.state === 'failed')) {
    return 'failed'
  }
  if (block.schedules.some((schedule) => schedule.state === 'saving')) {
    return 'saving'
  }
  if (block.schedules.every((schedule) => schedule.state === 'saved')) {
    return 'saved'
  }
  return 'draft'
}

function blockError(block: TimeBlockDraft): string {
  return block.schedules.find((schedule) => schedule.error)?.error ?? block.error
}

const courseName = ref('')
const selectedColorId = ref(COURSE_PALETTE_24[0]!.id)
const colorOpen = ref(false)
const blocks = ref<TimeBlockDraft[]>([createBlock()])
const saving = ref(false)
const formError = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const createdCourseId = ref<number | null>(null)

const selectedColor = computed(
  () => COURSE_PALETTE_24.find((color) => color.id === selectedColorId.value) ?? COURSE_PALETTE_24[0]!,
)

const allBlocksValid = computed(() =>
  blocks.value.length > 0 &&
  blocks.value.every((block) => {
    const selected = block.selectedDays.length > 0
    const validTimes =
      block.startTime !== '' &&
      block.endTime !== '' &&
      block.startTime < block.endTime
    return selected && validTimes
  }),
)

const canSubmit = computed(
  () =>
    courseName.value.trim().length > 0 &&
    allBlocksValid.value &&
    !saving.value,
)

const pendingScheduleCount = computed(() =>
  blocks.value.flatMap((block) => block.schedules).filter((schedule) => schedule.state !== 'saved').length,
)

function goBack() {
  router.push('/schedule')
}

function addBlock() {
  blocks.value = [...blocks.value, createBlock()]
}

function removeBlock(block: TimeBlockDraft) {
  if (blocks.value.length === 1) {
    return
  }

  blocks.value = blocks.value.filter((item) => item.id !== block.id)
}

function toggleDay(block: TimeBlockDraft, day: DayOfWeek) {
  const existing = block.schedules.find((schedule) => schedule.day === day)

  if (block.selectedDays.includes(day)) {
    if (existing?.state === 'saved') {
      return
    }
    block.selectedDays = block.selectedDays.filter((item) => item !== day)
  } else {
    block.selectedDays = [...block.selectedDays, day]
  }

  syncScheduleDrafts(block)
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong while saving the course.'
}

async function createCourseIfNeeded() {
  if (createdCourseId.value !== null) {
    return createdCourseId.value
  }

  try {
    await loadCatalog()
  } catch {
    // Catalog loading is helpful for local mutation updates but not required to save.
  }

  const course = await coursesApi.create({
    name: courseName.value.trim(),
  })
  applyCourseCreated(course)
  createdCourseId.value = course.id
  return course.id
}

async function saveBlockSchedules(block: TimeBlockDraft, courseId: number) {
  syncScheduleDrafts(block)
  const failed: string[] = []
  const requestsWereMade = block.schedules.filter((schedule) => schedule.state !== 'saved')

  for (const schedule of block.schedules) {
    if (!block.selectedDays.includes(schedule.day) || schedule.state === 'saved') {
      continue
    }

    schedule.state = 'saving'
    schedule.error = ''
    schedule.submitted = true

    try {
      const response = await schedulesApi.create({
        courseId,
        day: schedule.day,
        startTime: block.startTime,
        endTime: block.endTime,
      })
      schedule.state = 'saved'
      schedule.savedId = response.id
      applyScheduleCreated(response)
    } catch (error) {
      schedule.state = 'failed'
      schedule.error = errorMessage(error)
      failed.push(schedule.day)
    }
  }

  block.state = blockStatus(block)
  block.error = block.schedules.find((schedule) => schedule.error)?.error ?? ''
  return { failed, requestsWereMade }
}

async function submit() {
  formError.value = null
  successMessage.value = null

  if (courseName.value.trim().length === 0) {
    formError.value = 'Enter a course name before saving.'
    return
  }
  if (!allBlocksValid.value) {
    formError.value =
      'Each time block needs at least one weekday, and every time must have an end time after its start time.'
    return
  }

  saving.value = true

  try {
    const courseId = await createCourseIfNeeded()
    let failedCount = 0
    let totalPending = 0

    for (const block of blocks.value) {
      const pending = block.schedules.filter((schedule) => schedule.state !== 'saved')
      totalPending += pending.length
      const result = await saveBlockSchedules(block, courseId)
      failedCount += result.failed.length
    }

    if (failedCount > 0) {
      formError.value = `${failedCount} of ${totalPending} schedule record${totalPending === 1 ? '' : 's'} could not be saved. You can retry the failed blocks.`
      return
    }

    successMessage.value = 'Course saved. Color selection and room values are kept in this session only.'
  } catch (error) {
    formError.value = errorMessage(error)
  } finally {
    saving.value = false
  }
}

function retryFailed() {
  for (const block of blocks.value) {
    for (const schedule of block.schedules) {
      if (schedule.state === 'failed') {
        schedule.state = 'draft'
        schedule.error = ''
      }
    }
    block.state = blockStatus(block)
  }

  void submit()
}
</script>

<template>
  <div class="relative mx-auto flex h-[100svh] w-full max-w-[420px] flex-col overflow-x-hidden overflow-y-hidden bg-[#F6F7EE] px-6">
    <div class="relative z-10 flex w-full justify-center pt-[4.2svh]">
      <div class="h-[18px] w-full" aria-hidden="true"></div>
    </div>

    <!-- Header -->
    <header class="relative z-10 mt-[7svh] flex w-full items-center justify-between">
      <button
        type="button"
        aria-label="Go back"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#334155] transition-colors hover:bg-[#C2E8F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2"
        @click="goBack"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5m7-7-7 7 7 7" />
        </svg>
      </button>

      <h1
        class="px-2 text-center text-lg font-semibold text-[#334155]"
        style="font-family: 'Quicksand', sans-serif; font-weight: 700"
      >
        Schedule a Course
      </h1>

      <button
        type="button"
        aria-label="Confirm"
        :aria-busy="saving"
        :disabled="!canSubmit"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#00A4C8] transition-colors hover:bg-[#C2E8F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 disabled:text-slate-300 disabled:hover:bg-transparent"
        @click="submit"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-7 w-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </header>

    <div class="relative z-10 mt-5 min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-4">
      <form class="min-w-0 space-y-6" @submit.prevent="submit">
        <!-- Course details -->
        <section class="space-y-3" aria-labelledby="course-details-heading">
          <h2
            id="course-details-heading"
            class="text-center text-sm font-semibold text-[#334155]"
            style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          >
            Course details
          </h2>

          <div class="grid min-w-0 grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-2">
            <label class="space-y-1">
              <span class="text-sm text-[#7B8B97]">Name</span>
              <input
                v-model.trim="courseName"
                type="text"
                required
                maxlength="128"
                :disabled="saving"
                class="h-11 w-full rounded-xl border-[3px] border-[#C2E8F1] bg-white px-3 py-2.5 text-[#334155] outline-none transition-colors focus-within:border-[#00A4C8] disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </label>

            <div class="min-w-0 space-y-1">
              <span class="text-sm text-[#7B8B97]">Color</span>
              <div class="relative min-w-0">
                <button
                  type="button"
                  data-testid="color-toggle"
                  :aria-expanded="colorOpen"
                  :aria-haspopup="true"
                  aria-label="Course color"
                  :disabled="saving"
                  class="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border-[3px] border-[#C2E8F1] bg-white px-3 py-2.5 transition-colors hover:border-[#00A4C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  @click="colorOpen = !colorOpen"
                >
                  <span
                    class="h-7 w-7 shrink-0 rounded border-2 border-[#C2E8F1]"
                    :style="{ backgroundColor: selectedColor.solid }"
                    aria-hidden="true"
                  ></span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 shrink-0 text-[#7B8B97]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                <button
                  v-if="colorOpen"
                  type="button"
                  aria-label="Close color picker"
                  class="fixed inset-0 z-10 cursor-default"
                  @click="colorOpen = false"
                ></button>

                <div
                  v-if="colorOpen"
                  class="absolute left-0 right-0 top-full z-20 mt-2 max-w-full rounded-2xl border-2 border-[#C2E8F1] bg-white p-2 shadow-lg"
                  role="listbox"
                  aria-label="Course color options"
                >
                  <div class="grid grid-cols-4 gap-2">
                    <button
                      v-for="color in colorOptions"
                      :key="color.id"
                      type="button"
                      role="option"
                      :aria-selected="selectedColorId === color.id"
                      :aria-pressed="selectedColorId === color.id"
                      :aria-label="color.name"
                      :title="color.name"
                      data-testid="color-swatch"
                      :data-color-id="color.id"
                      class="flex h-7 w-7 items-center justify-center rounded-md border-2 text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2"
                      :class="selectedColorId === color.id ? 'border-[#334155] ring-2 ring-[#00A4C8]' : 'border-[#C2E8F1]'"
                      :style="{ backgroundColor: color.solid }"
                      @click="selectedColorId = color.id; colorOpen = false"
                    >
                      <span v-if="selectedColorId === color.id" class="text-white mix-blend-difference" aria-hidden="true">✓</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Time blocks -->
        <section class="-mx-4 space-y-4" aria-labelledby="time-blocks-heading">
          <h2
            id="time-blocks-heading"
            class="text-sm font-semibold text-[#334155]"
            style="font-family: 'Quicksand', sans-serif; font-weight: 600"
          >
            Class times
          </h2>

          <div class="flex flex-col gap-5">
            <article
              v-for="(block, index) in blocks"
              :key="block.id"
              data-testid="time-block-card"
              class="flex min-w-0 flex-col gap-4 rounded-2xl border-2 bg-white p-4 shadow-sm transition-colors sm:p-5"
              :class="blockStatus(block) === 'failed' ? 'border-red-300' : 'border-[#E2E8F0]'"
            >
              <!-- Card header -->
              <div class="flex min-w-0 items-center justify-between gap-3">
                <h3
                  class="min-w-0 flex-1 text-sm font-semibold text-[#334155]"
                  style="font-family: 'Quicksand', sans-serif; font-weight: 600"
                >
                  Time block {{ index + 1 }}
                </h3>

                <div class="flex shrink-0 items-center gap-2">
                  <span
                    v-if="blockStatus(block) === 'saved'"
                    class="rounded-md bg-[#E6F4EA] px-2 py-1 text-xs font-medium text-[#0D652D]"
                  >
                    Saved
                  </span>
                  <span
                    v-else-if="blockStatus(block) === 'saving'"
                    class="rounded-md bg-[#E1F5FE] px-2 py-1 text-xs font-medium text-[#0277BD]"
                  >
                    Saving
                  </span>
                  <span
                    v-else-if="blockStatus(block) === 'failed'"
                    class="rounded-md bg-[#FFEBEE] px-2 py-1 text-xs font-medium text-[#B71C1C]"
                  >
                    Failed
                  </span>

                  <button
                    v-if="index > 0"
                    type="button"
                    aria-label="Delete time block"
                    :disabled="saving"
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-red-200 bg-white text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    @click="removeBlock(block)"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div class="space-y-4">
                <!-- Weekday selector -->
                <div role="group" aria-label="Weekdays" class="min-w-0">
                  <div class="grid grid-cols-7 gap-1.5">
                    <button
                      v-for="weekday in WEEKDAYS"
                      :key="weekday.value"
                      type="button"
                      :aria-pressed="block.selectedDays.includes(weekday.value)"
                      :aria-label="weekday.value"
                      :disabled="saving || blockStatus(block) === 'saved'"
                      class="flex aspect-square h-auto min-w-0 items-center justify-center rounded-xl border-2 px-0 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      :class="
                        block.selectedDays.includes(weekday.value)
                          ? 'border-[#00A4C8] bg-[#00A4C8] text-white shadow-sm'
                          : 'border-[#C2E8F1] bg-[#F8FAFC] text-[#334155] hover:bg-[#E1F5FE]'
                      "
                      @click="toggleDay(block, weekday.value)"
                    >
                      {{ weekday.label }}
                    </button>
                  </div>
                </div>


                <!-- Start and end times -->
                <div class="grid min-w-0 grid-cols-2 gap-3">
                  <label class="min-w-0 space-y-2">
                    <span class="block py-3 text-sm text-[#7B8B97]">Start time</span>
                    <input
                      v-model="block.startTime"
                      type="time"
                      required
                      :disabled="saving || blockStatus(block) === 'saved'"
                      class="h-14 w-full min-w-0 rounded-xl border-[3px] border-[#C2E8F1] bg-white px-3 text-base text-[#334155] outline-none transition-colors focus-within:border-[#00A4C8] disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>

                  <label class="min-w-0 space-y-2">
                    <span class="block py-3 text-sm text-[#7B8B97]">End time</span>
                    <input
                      v-model="block.endTime"
                      type="time"
                      required
                      :disabled="saving || blockStatus(block) === 'saved'"
                      class="h-14 w-full min-w-0 rounded-xl border-[3px] border-[#C2E8F1] bg-white px-3 text-base text-[#334155] outline-none transition-colors focus-within:border-[#00A4C8] disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </label>
                </div>


                <!-- Errors -->
                <div v-if="blockError(block)" class="space-y-2">
                  <p
                    v-for="schedule in block.schedules.filter((item) => item.error)"
                    :key="schedule.day"
                    class="break-words text-sm text-red-600"
                  >
                    {{ schedule.day }}: {{ schedule.error }}
                  </p>
                  <p
                    v-if="!block.schedules.some((item) => item.error)"
                    class="break-words text-sm text-red-600"
                  >
                    {{ blockError(block) }}
                  </p>
                </div>
              </div>
            </article>

            <button
              type="button"
              data-testid="add-another-time"
              :disabled="saving"
              class="flex min-h-14 w-full items-center justify-center rounded-xl border-2 border-dashed border-[#00A4C8] bg-white px-4 py-4 text-sm font-semibold text-[#00A4C8] transition-colors hover:bg-[#E1F5FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A4C8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              style="font-family: 'Quicksand', sans-serif; font-weight: 600"
              @click="addBlock"
            >
              + Add another time
            </button>
          </div>
        </section>

        <p
          v-if="formError"
          class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {{ formError }}
        </p>

        <p
          v-if="successMessage"
          class="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
          role="status"
        >
          {{ successMessage }}
        </p>

        <p
          v-if="pendingScheduleCount > 0 && createdCourseId !== null"
          class="text-xs text-[#7B8B97]"
        >
          {{ pendingScheduleCount }} schedule record{{ pendingScheduleCount === 1 ? '' : 's' }} still pending.
        </p>

        <div class="flex gap-2">
          <button
            v-if="blocks.some((block) => blockStatus(block) === 'failed')"
            type="button"
            class="flex-1 rounded-xl border-2 border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            :disabled="saving"
            @click="retryFailed"
          >
            Retry failed blocks
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
