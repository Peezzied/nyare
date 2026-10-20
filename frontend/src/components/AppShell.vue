<script setup lang="ts">
// Logged-in scaffold: top bar, routed view, bottom nav, Duckota FAB.
// Views set the header title and side actions through useShellHeader.
// The floating Duckota button is the explicit Process trigger for the planner.
// Its badge shows the pending dirty note count. The rainbow ring spins while a run is active.
import { computed, onMounted, ref, toValue, watch } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from './AppHeader.vue'
import DuckotaButton from './DuckotaButton.vue'
import NavigationBar from './NavigationBar.vue'
import NotificationBell from './NotificationBell.vue'
import NotificationCenterModal from './NotificationCenterModal.vue'
import ProcessDialog from './ProcessDialog.vue'
import duckotaImg from '@/assets/mascot/duckota_in_button.png'
import { useAcademicEvents } from '@/composables/useAcademicEvents'
import { useNotifications } from '@/composables/useNotifications'
import { isReducedMotion, toTapOriginRect } from '@/composables/useNoteTransition'
import { useToasts } from '@/composables/useToasts'
import { usePlannerStatus } from '@/composables/usePlannerStatus'
import { useProcess } from '@/composables/useProcess'
import { provideShellHeader } from '@/composables/useShellHeader'
import { useTasks } from '@/composables/useTasks'
import type { ProcessNotification } from '@/composables/useNotifications'
import type { TapOriginRect } from '@/types/notesTransition'

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

const dialogOpen = ref(false)
// One-shot flag: a notification tap reopens the dialog on its terminal run
// state instead of resetting to the confirm phase.
const preserveRun = ref(false)
const notifications = useNotifications()
const centerOpen = ref(false)
const centerOrigin = ref<TapOriginRect | null>(null)
const centerModalRef = ref<{ requestClose: (triggerHistoryBack?: boolean) => void } | null>(null)
// Set by the center's open-run event so the Process dialog opens after collapse.
let reopenRunOnClose = false

function openProcessDialog(): void {
  dialogOpen.value = true
}

function openCenter(event: MouseEvent): void {
  const el = event.currentTarget as Element | null
  centerOrigin.value = el ? toTapOriginRect(el) : null
  centerOpen.value = true
}

function onCenterOpenRun(record: ProcessNotification): void {
  // Only the record of the live session run maps to ProcessDialog state.
  // Restored records carry no summary on proc, so their taps do nothing.
  if (record.id === proc.recordId.value) {
    reopenRunOnClose = true
    preserveRun.value = true
    centerModalRef.value?.requestClose(true)
  }
}

watch(dialogOpen, (opened) => {
  if (!opened) {
    preserveRun.value = false
  }
})

function onCenterClose(): void {
  centerOpen.value = false
  if (reopenRunOnClose) {
    reopenRunOnClose = false
    dialogOpen.value = true
  }
}

const toasts = useToasts()

watch(proc.running, (on) => {
  if (on) {
    toasts.pushToast({
      kind: 'info',
      title: 'Duckota is on it',
      detail: 'Reading your pending notes.',
    })
  }
})

watch(proc.summary, (summary) => {
  if (summary) {
    toasts.pushToast({
      kind: 'success',
      title: 'Process complete',
      detail: `${summary.tasksCreated} tasks · ${summary.eventsCreated} events · ${summary.contextsCreated} context created.`,
    })
  }
})

watch(proc.error, (err) => {
  if (err) {
    toasts.pushToast({ kind: 'error', title: 'Process failed', detail: err })
  }
})

watch(proc.cancelled, (stopped) => {
  if (stopped) {
    toasts.pushToast({
      kind: 'info',
      title: 'Process stopped',
      detail: 'Pending notes stay unprocessed.',
    })
  }
})

watch(proc.savedAfterCancel, (saved) => {
  if (saved) {
    toasts.pushToast({
      kind: 'info',
      title: 'Run saved before stopping',
      detail: 'The changes committed before Duckota stopped.',
    })
  }
})

// A Keep running click launches the mascot toward the bell: the run
// docks in the notification center and the bell rings to confirm.
const popToken = ref(0)
const flight = ref<{ fromX: number; fromY: number; dx: number; dy: number } | null>(null)

function onKeepRunning(event: MouseEvent): void {
  const source = (event.currentTarget as Element | null)?.getBoundingClientRect()
  const bell = document
    .querySelector('[data-testid="notifications-button"]')
    ?.getBoundingClientRect()
  if (source && bell && !isReducedMotion()) {
    const fromX = source.left + source.width / 2
    const fromY = source.top + source.height / 2
    flight.value = {
      fromX,
      fromY,
      dx: bell.left + bell.width / 2 - fromX,
      dy: bell.top + bell.height / 2 - fromY,
    }
    setTimeout(() => {
      flight.value = null
      popToken.value += 1
    }, 520)
  } else {
    popToken.value += 1
  }
  toasts.pushToast({
    kind: 'info',
    title: 'Running in the background',
    detail: 'Tap the bell anytime to check on Duckota.',
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
      <template v-if="header.center" #center>
        <component :is="header.center" />
      </template>
      <template #right>
        <div class="flex items-center gap-1">
          <component :is="header.right" v-if="header.right" />
          <NotificationBell
            :proc="proc"
            :unread="notifications.unreadCount.value"
            :pop-token="popToken"
            @open="openCenter"
          />
        </div>
      </template>
    </AppHeader>

    <main class="relative min-h-0 flex-1">
      <RouterView />
      <DuckotaButton
        variant="floating"
        label="Process pending notes"
        data-testid="duckota-fab"
        class="!absolute bottom-4 left-5 z-20"
        :badge="badge"
        badge-color="destructive"
        :processing="proc.running.value"
        :disabled="!planner.canProcess.value"
        @click="openProcessDialog"
      />
      <ProcessDialog
        v-model:open="dialogOpen"
        :proc="proc"
        :preserve-run="preserveRun"
        @keep-running="onKeepRunning"
      />
      <NotificationCenterModal
        ref="centerModalRef"
        :is-open="centerOpen"
        :origin-rect="centerOrigin"
        @open-run="onCenterOpenRun"
        @close="onCenterClose"
      />
      <img
        v-if="flight"
        :src="duckotaImg"
        alt=""
        aria-hidden="true"
        data-testid="run-flight"
        class="duckota-flight"
        :style="{
          left: `${flight.fromX - 24}px`,
          top: `${flight.fromY - 24}px`,
          '--dx': `${flight.dx}px`,
          '--dy': `${flight.dy}px`,
        }"
      />
    </main>

    <!-- the h-16 reserve keeps the view clear of the fixed bar -->
    <div class="h-16 shrink-0">
      <NavigationBar />
    </div>
  </div>
</template>

<style scoped>
@keyframes duckota-flight {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--dx), var(--dy)) scale(0.4) rotate(12deg);
    opacity: 0;
  }
}

.duckota-flight {
  position: fixed;
  z-index: 70;
  width: 48px;
  height: 48px;
  pointer-events: none;
  object-fit: contain;
  animation: duckota-flight 520ms cubic-bezier(0.5, 0, 0.8, 0.4) forwards;
}
</style>
