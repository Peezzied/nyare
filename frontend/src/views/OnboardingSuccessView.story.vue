<script setup lang="ts">
import { defineComponent, h, onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import OnboardingSuccessView from './OnboardingSuccessView.vue'
import RouteWipeOverlay from '@/components/RouteWipeOverlay.vue'
import { useOnboarding } from '@/composables/useOnboarding'

const { setStudentName, setSavedSummary } = useOnboarding()
setStudentName('Karol')
setSavedSummary({
  courses: [
    { name: 'CCS 201', colorId: 'peacock' },
    { name: 'MATH 142', colorId: 'banana' },
    { name: 'ENG 110', colorId: 'sage' },
    { name: 'PE 1', colorId: 'tangerine' },
  ],
  classBlocks: 9,
})

// The wipe reveals the next route, so the demo needs the same routes the app
// navigates between. The stub stands in for the real CalendarView.
const router = useRouter()
// The stub doubles as the replay target: tap it to return to the celebration.
const CalendarStub = defineComponent({
  setup: () => () =>
    h(
      'button',
      {
        class: 'flex h-full w-full items-center justify-center font-bold text-[#007B99]',
        onClick: () => void router.replace('/setup-complete'),
      },
      'CALENDAR — tap to replay',
    ),
})
if (router) {
  router.addRoute({
    path: '/setup-complete',
    component: OnboardingSuccessView,
    props: { initialRevealed: true },
  })
  router.addRoute({ path: '/calendar', component: CalendarStub })
  void router.replace('/setup-complete')
}

const WipeDemo = defineComponent({
  setup: () => {
    // Re-arm the demo on every remount so the variant can be replayed.
    onMounted(() => void router?.replace('/setup-complete'))
    return () => [h(RouterView), h(RouteWipeOverlay)]
  },
})
</script>

<template>
  <Story title="views/OnboardingSuccessView">
    <Variant title="Recap slip (first beat)">
      <div
        class="mx-auto h-[844px] w-[390px] overflow-hidden rounded-2xl border border-slate-300 shadow-lg relative"
      >
        <OnboardingSuccessView />
        <RouteWipeOverlay />
      </div>
    </Variant>

    <Variant title="Celebration (revealed)">
      <div
        class="mx-auto h-[844px] w-[390px] overflow-hidden rounded-2xl border border-slate-300 shadow-lg relative"
      >
        <OnboardingSuccessView initial-revealed />
        <RouteWipeOverlay />
      </div>
    </Variant>

    <Variant title="GO TO CALENDAR (circular wipe)">
      <div
        class="mx-auto h-[844px] w-[390px] overflow-hidden rounded-2xl border border-slate-300 shadow-lg relative"
      >
        <WipeDemo />
      </div>
    </Variant>
  </Story>
</template>
