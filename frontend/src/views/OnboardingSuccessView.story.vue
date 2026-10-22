<script setup lang="ts">
import OnboardingSuccessView from './OnboardingSuccessView.vue'
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
</script>

<template>
  <Story title="views/OnboardingSuccessView">
    <Variant title="Recap slip (first beat)">
      <div
        class="mx-auto h-[844px] w-[390px] overflow-hidden rounded-2xl border border-slate-300 shadow-lg relative"
      >
        <OnboardingSuccessView />
      </div>
    </Variant>

    <Variant title="Celebration (revealed)">
      <div
        class="mx-auto h-[844px] w-[390px] overflow-hidden rounded-2xl border border-slate-300 shadow-lg relative"
      >
        <OnboardingSuccessView initial-revealed />
      </div>
    </Variant>
  </Story>
</template>
