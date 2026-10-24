<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { ArrowLeft } from '@lucide/vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import HeaderIconButton from '@/components/HeaderIconButton.vue'
import { useShellHeader } from '@/composables/useShellHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import DialogShell from '@/components/ui/DialogShell.vue'
import { Input } from '@/components/ui/input'
import { useToasts } from '@/composables/useToasts'
import { settingsApi } from '@/api'
import { ApiError } from '@/api/client'

const DEFAULT_DAYS = 14
const MIN_DAYS = 1
const MAX_DAYS = 60

const router = useRouter()
const { pushToast } = useToasts()

const loading = ref(true)
const loadFailed = ref(false)
const saving = ref(false)
const discardOpen = ref(false)
let pendingExit: (() => void) | null = null
const planningHorizonDays = ref<number | string>()
const backdatingHorizonDays = ref<number | string>()
const savedPlanningHorizonDays = ref<number | string>()
const savedBackdatingHorizonDays = ref<number | string>()

const horizonsValid = computed(
  () => inRange(planningHorizonDays.value) && inRange(backdatingHorizonDays.value),
)

const isDirty = computed(
  () =>
    savedPlanningHorizonDays.value !== undefined &&
    (Number(planningHorizonDays.value) !== Number(savedPlanningHorizonDays.value) ||
      Number(backdatingHorizonDays.value) !== Number(savedBackdatingHorizonDays.value)),
)

function inRange(value: number | string | undefined): boolean {
  if (value === undefined || value === '') return false
  const n = Number(value)
  return Number.isInteger(n) && n >= MIN_DAYS && n <= MAX_DAYS
}

async function load() {
  loading.value = true
  loadFailed.value = false
  try {
    const settings = await settingsApi.get()
    planningHorizonDays.value = settings.planningHorizonDays
    backdatingHorizonDays.value = settings.backdatingHorizonDays
    savedPlanningHorizonDays.value = settings.planningHorizonDays
    savedBackdatingHorizonDays.value = settings.backdatingHorizonDays
  } catch (error) {
    loadFailed.value = true
    pushToast({
      kind: 'error',
      title: error instanceof ApiError ? error.message : 'Settings failed to load.',
    })
  } finally {
    loading.value = false
  }
}

async function save() {
  if (saving.value) return
  if (!horizonsValid.value) {
    pushToast({ kind: 'error', title: `Enter a whole number of days between ${MIN_DAYS} and ${MAX_DAYS}.` })
    return
  }
  saving.value = true
  try {
    const saved = await settingsApi.update({
      planningHorizonDays: Number(planningHorizonDays.value),
      backdatingHorizonDays: Number(backdatingHorizonDays.value),
    })
    planningHorizonDays.value = saved.planningHorizonDays
    backdatingHorizonDays.value = saved.backdatingHorizonDays
    savedPlanningHorizonDays.value = saved.planningHorizonDays
    savedBackdatingHorizonDays.value = saved.backdatingHorizonDays
    pushToast({ kind: 'success', title: 'Settings saved.' })
  } catch (error) {
    pushToast({
      kind: 'error',
      title: error instanceof ApiError ? error.message : 'Settings failed to save.',
    })
  } finally {
    saving.value = false
  }
}

function resetToDefaults() {
  planningHorizonDays.value = DEFAULT_DAYS
  backdatingHorizonDays.value = DEFAULT_DAYS
  pushToast({ kind: 'info', title: 'Defaults restored. Save to apply.' })
}

function goBack() {
  void router.push({ name: 'calendar' })
}

function confirmDiscard() {
  discardOpen.value = false
  planningHorizonDays.value = savedPlanningHorizonDays.value
  backdatingHorizonDays.value = savedBackdatingHorizonDays.value
  pendingExit?.()
  pendingExit = null
}

onBeforeRouteLeave((to) => {
  if (!isDirty.value) return true
  pendingExit = () => void router.push(to.fullPath)
  discardOpen.value = true
  return false
})

useShellHeader({
  title: 'Settings',
  left: () =>
    h(
      HeaderIconButton,
      {
        'aria-label': 'Back to calendar',
        'data-testid': 'settings-back',
        onClick: goBack,
      },
      () => h(ArrowLeft, { class: 'h-6 w-6', 'aria-hidden': 'true' }),
    ),
  right: () => h('span', { class: 'block h-11 w-11', 'aria-hidden': 'true' }),
})

onMounted(load)
</script>

<template>
  <div data-testid="settings-page" class="flex h-full flex-col bg-app-bg">
    <div class="flex-1 overflow-y-auto px-4 pb-24 pt-4">
      <p v-if="loading" data-testid="settings-loading" class="py-8 text-center text-sm text-text-main">
        Loading settings…
      </p>

      <div
        v-else-if="loadFailed"
        data-testid="settings-error"
        role="alert"
        class="mt-6 rounded-2xl border border-app-border bg-card p-6 text-center"
      >
        <p class="text-base font-semibold text-text-main">Settings failed to load.</p>
        <Button type="button" variant="tactile" size="touch" class="mt-4" @click="load">
          Retry
        </Button>
      </div>

      <div v-else class="flex flex-col gap-4">
        <Card
          class="flex flex-col gap-5 rounded-2xl border-border-soft bg-card px-4 py-5 shadow-stationery"
        >
          <section class="flex flex-col gap-2">
            <label
              for="planning-horizon"
              class="text-sm font-semibold text-text-main"
            >
              Planning horizon
            </label>
            <p class="text-xs text-text-soft">
              Days ahead the planner inspects upcoming events for study tasks.
            </p>
            <div
              class="flex h-12 items-center rounded-xl border border-border-cyan bg-field px-4 shadow-2xs transition-colors focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/30"
            >
              <Input
                id="planning-horizon"
                v-model="planningHorizonDays"
                data-testid="planning-horizon-input"
                type="number"
                inputmode="numeric"
                :min="MIN_DAYS"
                :max="MAX_DAYS"
                step="1"
                class="h-full border-0 px-0 text-base font-semibold text-text-main shadow-none focus-visible:ring-0"
              />
              <span class="shrink-0 text-sm text-primary-bevel">days</span>
            </div>
          </section>

          <section class="flex flex-col gap-2">
            <label
              for="backdating-horizon"
              class="text-sm font-semibold text-text-main"
            >
              Note backdating horizon
            </label>
            <p class="text-xs text-text-soft">
              Oldest allowed entry date for a journal note, in days.
            </p>
            <div
              class="flex h-12 items-center rounded-xl border border-border-cyan bg-field px-4 shadow-2xs transition-colors focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/30"
            >
              <Input
                id="backdating-horizon"
                v-model="backdatingHorizonDays"
                data-testid="backdating-horizon-input"
                type="number"
                inputmode="numeric"
                :min="MIN_DAYS"
                :max="MAX_DAYS"
                step="1"
                class="h-full border-0 px-0 text-base font-semibold text-text-main shadow-none focus-visible:ring-0"
              />
              <span class="shrink-0 text-sm text-primary-bevel">days</span>
            </div>
          </section>
        </Card>

        <div class="flex flex-col gap-3">
          <Button
            type="button"
            variant="tactile"
            size="touch"
            data-testid="settings-save"
            :disabled="saving"
            @click="save"
          >
            {{ saving ? 'Saving…' : 'Save' }}
          </Button>
          <Button
            type="button"
            variant="tactile-ocean"
            size="touch"
            data-testid="settings-reset"
            @click="resetToDefaults"
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>

    <DialogShell v-model:open="discardOpen" title="Discard changes?">
      <p>Unsaved changes will be lost.</p>
      <template #actions="{ dismiss }">
        <Button
          type="button"
          variant="tactile-secondary"
          size="touch"
          data-testid="settings-discard-keep"
          @click="dismiss"
        >
          Keep editing
        </Button>
        <Button
          type="button"
          variant="tactile-destructive"
          size="touch"
          data-testid="settings-discard-confirm"
          @click="confirmDiscard"
        >
          Discard
        </Button>
      </template>
    </DialogShell>
  </div>
</template>
