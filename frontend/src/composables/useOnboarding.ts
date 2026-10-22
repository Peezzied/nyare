import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { createCache } from './createCache'

export interface OnboardingSummaryCourse {
  name: string
  colorId: string
}

/** What the first Submit persisted, shown once on the setup-complete screen. */
export interface OnboardingSummary {
  courses: OnboardingSummaryCourse[]
  classBlocks: number
}

// Module-level state: the name must survive the Welcome → schedule step, and
// session clears (via `resetAllCaches`) drop it with the rest of the session data.
const studentName = ref('')
const savedSummary = ref<OnboardingSummary | null>(null)
createCache(() => {
  studentName.value = ''
  savedSummary.value = null
})

export interface UseOnboardingReturn {
  studentName: Ref<string>
  savedSummary: Ref<OnboardingSummary | null>
  isNameValid: ComputedRef<boolean>
  setStudentName: (name: string) => void
  setSavedSummary: (summary: OnboardingSummary) => void
  resetOnboarding: () => void
}

export function useOnboarding(): UseOnboardingReturn {
  const isNameValid = computed(() => {
    const length = studentName.value.trim().length
    return length >= 3 && length <= 64
  })

  function setStudentName(name: string) {
    studentName.value = name
  }

  function setSavedSummary(summary: OnboardingSummary) {
    savedSummary.value = summary
  }

  function resetOnboarding() {
    studentName.value = ''
    savedSummary.value = null
  }

  return {
    studentName,
    savedSummary,
    isNameValid,
    setStudentName,
    setSavedSummary,
    resetOnboarding,
  }
}
