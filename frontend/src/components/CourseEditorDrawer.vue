<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DrawerOpenChangeDetails } from 'reka-ui'
import { Plus, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import SaveButton from '@/components/SaveButton.vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Drawer, DrawerContent, DrawerHeader } from '@/components/ui/drawer'
import DialogShell from '@/components/ui/DialogShell.vue'
import TimeBlockCard, { type TimeBlockDraft } from '@/components/TimeBlockCard.vue'
import { COURSE_PALETTE_24 } from '@/utils/courseColors'
import type { CourseEditor } from '@/composables/useCourseEditor'
import type { DayOfWeek } from '@/types/api'

const props = withDefaults(
  defineProps<{
    editor: CourseEditor
    open: boolean
    stage: 'partial' | 'full'
    saving: boolean
    canSave: boolean
    showColor?: boolean
    portal?: boolean
    canRemove?: boolean
    coverBottomWhenFull?: boolean
    unavailableDays?: (block: TimeBlockDraft) => DayOfWeek[]
    /** True when the draft has unsaved changes; the close button prompts before it closes. */
    dirty?: boolean
    /** Message for the unsaved-changes prompt. */
    discardMessage?: string
  }>(),
  {
    showColor: true,
    portal: false,
    unavailableDays: () => [],
    dirty: false,
  },
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean, details?: DrawerOpenChangeDetails): void
  (e: 'update:stage', value: 'partial' | 'full'): void
  (e: 'save'): void
  (e: 'close'): void
  (e: 'discard'): void
  (e: 'keepEditing'): void
  (e: 'submit'): void
  (e: 'add-block'): void
  (e: 'remove', block: TimeBlockDraft): void
  (e: 'toggleDay', block: TimeBlockDraft, day: DayOfWeek): void
  (e: 'update:startTime', block: TimeBlockDraft, value: string): void
  (e: 'update:endTime', block: TimeBlockDraft, value: string): void
}>()

const DISCARD_MESSAGE = 'You have unsaved changes. Are you sure you want to discard your draft?'

const discardOpen = ref(false)
const discardMessageOverride = ref<string | null>(null)
const discardClosesDrawer = ref(false)

function requestClose() {
  if (props.saving) {
    return
  }
  if (!props.dirty) {
    emit('close')
    return
  }
  discardClosesDrawer.value = true
  discardMessageOverride.value = null
  discardOpen.value = true
}

/** Opens the unsaved-changes prompt for a parent-driven exit. */
function requestDiscard(message?: string) {
  discardClosesDrawer.value = false
  discardMessageOverride.value = message ?? null
  discardOpen.value = true
}

function handleDiscard() {
  discardOpen.value = false
  if (discardClosesDrawer.value) {
    emit('close')
    return
  }
  emit('discard')
}

function handleKeepEditing() {
  discardOpen.value = false
  emit('keepEditing')
}

defineExpose({ requestDiscard, discardOpen })

const SNAP_PARTIAL = '210px'
const SNAP_FULL = 1
const snapPoints = [SNAP_PARTIAL, SNAP_FULL]

const activeSnapPoint = ref<string | number>(props.stage === 'full' ? SNAP_FULL : SNAP_PARTIAL)

const isFull = computed(() => activeSnapPoint.value === SNAP_FULL || activeSnapPoint.value === 1)

// The parchment wash keeps the sheet blending into the page in partial mode
// and fades out once the sheet expands to full.
const parchmentCover = computed(() => (isFull.value ? 0 : 1))

// The 4rem lift keeps the sheet above a bottom bar in partial mode. In full
// mode an opted-in parent drops the lift so the sheet covers that bar.
const lifted = computed(() => !isFull.value || !props.coverBottomWhenFull)

watch(
  () => props.stage,
  (val) => {
    activeSnapPoint.value = val === 'full' ? SNAP_FULL : SNAP_PARTIAL
  },
)

watch(activeSnapPoint, (val) => {
  if (val === SNAP_FULL || val === 1) {
    emit('update:stage', 'full')
  } else if (val === SNAP_PARTIAL) {
    emit('update:stage', 'partial')
  }
})

function setStage(nextStage: 'partial' | 'full') {
  activeSnapPoint.value = nextStage === 'full' ? SNAP_FULL : SNAP_PARTIAL
  emit('update:stage', nextStage)
}

function toggleStage() {
  setStage(isFull.value ? 'partial' : 'full')
}

function onCourseDetailsClick() {
  if (!isFull.value) {
    setStage('full')
  }
}

function handleInputFocus() {
  if (!isFull.value) {
    setStage('full')
  }
}

function handleInput() {
  if (!isFull.value) {
    setStage('full')
  }
}

function onColorToggleClick() {
  if (!isFull.value) {
    setStage('full')
    colorOpen.value = true
  }
}

const scrollContainerRef = ref<HTMLElement | null>(null)
let touchStartY = 0
let touchStartX = 0

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) return
  touchStartY = touch.clientY
  touchStartX = touch.clientX
}

function handleTouchEnd(e: TouchEvent) {
  const touch = e.changedTouches[0]
  if (!touch) return
  const deltaY = touch.clientY - touchStartY
  const deltaX = touch.clientX - touchStartX

  if (Math.abs(deltaY) > 35 && Math.abs(deltaY) > Math.abs(deltaX)) {
    if (deltaY < 0 && !isFull.value) {
      setStage('full')
    } else if (deltaY > 0 && isFull.value) {
      const isAtTop = !scrollContainerRef.value || scrollContainerRef.value.scrollTop <= 5
      if (isAtTop) {
        setStage('partial')
      }
    }
  }
}

function forwardOpenChange(value: boolean, details?: DrawerOpenChangeDetails) {
  emit('update:open', value, details)
}

// The editor record is a shared reactive draft owned by the parent; the
// drawer edits its fields in place.
const draft = computed(() => props.editor)

const courseName = computed({
  get: () => draft.value.name,
  set: (value: string) => {
    draft.value.name = value
  },
})
const colorOpen = computed({
  get: () => draft.value.colorOpen,
  set: (value: boolean) => {
    draft.value.colorOpen = value
  },
})
const selectedColorId = computed({
  get: () => draft.value.colorId,
  set: (value: string) => {
    draft.value.colorId = value
  },
})
const blocks = computed(() => draft.value.blocks)

const colorOptions = COURSE_PALETTE_24

function paletteFor(colorId: string) {
  return COURSE_PALETTE_24.find((color) => color.id === colorId) ?? COURSE_PALETTE_24[0]!
}

const selectedColor = computed(() => paletteFor(selectedColorId.value))

function selectColor(colorId: string) {
  selectedColorId.value = colorId
  colorOpen.value = false
}

const isAddAnotherTimeDisabled = computed(() => {
  if (blocks.value.length === 0) {
    return false
  }
  const currentBlock = blocks.value[blocks.value.length - 1]!
  if (
    !currentBlock.startTime ||
    !currentBlock.endTime ||
    currentBlock.startTime >= currentBlock.endTime
  ) {
    return false
  }
  const unavail = props.unavailableDays(currentBlock)
  return unavail.length === 7
})
</script>

<template>
  <Drawer
    :open="open"
    :modal="false"
    v-model:snap-point="activeSnapPoint"
    :snap-points="snapPoints"
    :default-snap-point="SNAP_PARTIAL"
    @update:open="forwardOpenChange"
  >
    <DrawerContent
      :portal="portal"
      :full-view="isFull"
      :class="[
        'border-t border-border-cyan bg-card outline-none shadow-2xl',
        lifted &&
          'data-[swipe-direction=down]:bottom-[calc(4rem+env(safe-area-inset-bottom))] data-[swipe-direction=down]:h-[calc(100dvh-4rem-env(safe-area-inset-bottom))]',
      ]"
      @click:handle="toggleStage"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
      @interact-outside.prevent
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-app-bg transition-opacity duration-300 ease-out"
        :style="{ opacity: parchmentCover }"
      ></div>
      <DrawerHeader
        class="relative z-10 flex w-full flex-row items-center justify-between px-3 !py-0"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close drawer"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-main transition-colors hover:bg-border-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          @click="requestClose"
        >
          <X class="size-5" aria-hidden="true" />
        </Button>

        <SaveButton
          v-show="isFull"
          data-testid="save-course"
          aria-label="Save course"
          :aria-busy="saving"
          :saving="saving"
          :disabled="saving || !canSave"
          class="shrink-0"
          @click="emit('save')"
        />
      </DrawerHeader>

      <div
        ref="scrollContainerRef"
        class="relative z-10 min-h-0 flex-1 overflow-x-hidden"
        :class="isFull ? 'overflow-y-auto py-2 overscroll-contain' : 'overflow-y-hidden pt-2 pb-6'"
      >
        <form class="min-w-0 space-y-6" @submit.prevent="emit('submit')">
          <!-- Course details -->
          <section
            data-testid="course-details-section"
            class="space-y-4 px-7"
            :class="{ 'cursor-pointer select-none': !isFull }"
            @click="onCourseDetailsClick"
          >
            <input
              id="course-name-input"
              v-model.trim="courseName"
              type="text"
              required
              maxlength="128"
              placeholder="Add Course Title"
              :readonly="!isFull"
              :tabindex="isFull ? 0 : -1"
              :disabled="saving"
              aria-label="Course name"
              class="w-full bg-transparent px-0 py-1 font-sans text-2xl font-bold text-heading placeholder:font-semibold placeholder:text-slate-400 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
              :class="{ 'cursor-pointer': !isFull }"
              @focus="handleInputFocus"
              @input="handleInput"
            />
            <Popover v-if="showColor" v-model:open="colorOpen">
              <PopoverTrigger as-child>
                <button
                  type="button"
                  data-testid="color-toggle"
                  :aria-expanded="colorOpen"
                  :aria-haspopup="true"
                  aria-label="Course color"
                  :disabled="saving"
                  class="inline-flex min-w-0 items-center gap-2 rounded-lg border border-border-soft bg-field px-3 py-2 shadow-xs transition-all hover:border-primary hover:bg-ocean-soft active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  @click="onColorToggleClick"
                >
                  <span
                    class="h-5 w-5 shrink-0 rounded-full border border-black/10 shadow-xs"
                    :style="{ backgroundColor: selectedColor.solid }"
                    aria-hidden="true"
                  ></span>
                  <span
                    class="min-w-0 truncate text-left font-sans text-sm font-semibold text-heading"
                    >{{ selectedColor.name }}</span
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 shrink-0 text-text-muted"
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
              </PopoverTrigger>

              <PopoverContent
                :portal="false"
                class="z-50 w-auto max-w-full rounded-2xl border border-border-soft bg-card p-2 shadow-lg"
                role="listbox"
                aria-label="Course color options"
              >
                <div class="grid grid-cols-4 gap-1 p-0.5">
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
                    class="flex h-11 w-11 items-center justify-center rounded-xl p-1 transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    @click="selectColor(color.id)"
                  >
                    <span
                      class="flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-bold shadow-xs transition-transform"
                      :class="
                        selectedColorId === color.id
                          ? 'border-text-main ring-2 ring-primary'
                          : 'border-black/10'
                      "
                      :style="{ backgroundColor: color.solid }"
                    >
                      <span
                        v-if="selectedColorId === color.id"
                        class="text-white mix-blend-difference"
                        aria-hidden="true"
                        >✓</span
                      >
                    </span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </section>

          <!-- Divider -->
          <hr class="-mx-5 sm:-mx-6 border-t border-ghost/80" />

          <!-- Time blocks -->
          <section class="space-y-4 px-5" aria-labelledby="time-blocks-heading">
            <h2
              id="time-blocks-heading"
              class="text-xs font-bold tracking-wider text-text-soft uppercase"
            >
              Class times
            </h2>

            <TransitionGroup tag="div" name="time-block" class="relative flex flex-col gap-5">
              <div
                v-for="(block, index) in blocks"
                :id="`block-card-${block.id}`"
                :key="block.id"
                :data-block-id="block.id"
              >
                <!-- `undefined` keeps TimeBlockCard's index>0 fallback for Create Schedule. -->
                <TimeBlockCard
                  :block="block"
                  :index="index"
                  :saving="saving"
                  :can-remove="canRemove || undefined"
                  :unavailable-days="unavailableDays(block)"
                  @remove="emit('remove', block)"
                  @toggle-day="emit('toggleDay', block, $event)"
                  @update:start-time="emit('update:startTime', block, $event)"
                  @update:end-time="emit('update:endTime', block, $event)"
                />
                <p
                  v-if="block.error"
                  role="alert"
                  class="px-1 pt-2 text-sm font-semibold text-red-700"
                >
                  {{ block.error }}
                </p>
              </div>

              <Button
                key="add-time"
                type="button"
                data-testid="add-another-time"
                :disabled="saving || isAddAnotherTimeDisabled"
                class="flex min-h-12 w-full items-center justify-center rounded-xl border border-secondary-border bg-ocean-soft px-4 py-3 font-sans text-sm font-bold text-primary-bevel shadow-bevel-secondary transition-all hover:bg-ocean-soft hover:text-primary-deep active:translate-y-0.5 active:shadow-bevel-secondary-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:active:translate-y-0"
                @click="emit('add-block')"
              >
                <Plus class="mr-2 h-4 w-4 stroke-2" aria-hidden="true" />
                Add another time
              </Button>
            </TransitionGroup>
          </section>

          <slot name="footer" />
        </form>
      </div>
    </DrawerContent>
  </Drawer>

  <DialogShell
    :open="discardOpen"
    title="Discard changes?"
    overlay-class="z-overlay"
    @update:open="discardOpen = $event"
    @cancel="handleKeepEditing"
  >
    <p class="mt-2 font-secondary text-sm text-text-muted">
      {{ discardMessageOverride ?? discardMessage ?? DISCARD_MESSAGE }}
    </p>

    <template #actions="{ dismiss }">
      <Button type="button" variant="tactile-secondary" size="touch" @click="dismiss">
        Keep editing
      </Button>

      <Button
        type="button"
        variant="tactile-destructive"
        size="touch"
        class="px-5"
        @click="handleDiscard"
      >
        Discard
      </Button>
    </template>
  </DialogShell>
</template>

<style scoped>
.time-block-enter-active {
  animation: time-block-land 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
  transform-origin: top center;
}

@keyframes time-block-land {
  0% {
    opacity: 0;
    transform: translateY(26px) scale(0.96) rotate(-0.8deg);
    filter: blur(6px);
  }

  55% {
    opacity: 1;
    filter: blur(0);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0);
    filter: blur(0);
  }
}

.time-block-move {
  transition: transform 380ms cubic-bezier(0.16, 1, 0.3, 1);
}

.time-block-leave-active {
  position: absolute;
  width: 100%;
  transition:
    opacity 200ms ease-in,
    transform 280ms cubic-bezier(0.4, 0, 1, 1),
    filter 200ms ease-in;
}

.time-block-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.94);
  filter: blur(6px);
}

@media (prefers-reduced-motion: reduce) {
  .time-block-enter-active {
    animation: time-block-fade 220ms ease-out both;
  }

  .time-block-move,
  .time-block-leave-active {
    transition: none;
  }
}

@keyframes time-block-fade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
