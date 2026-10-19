import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { createCache } from './createCache'

// Module-level state: the name must survive the Welcome → schedule step, and
// session clears (via `resetAllCaches`) drop it with the rest of the session data.
const studentName = ref('')
createCache(() => {
  studentName.value = ''
})

export interface UseOnboardingReturn {
  studentName: Ref<string>
  isNameValid: ComputedRef<boolean>
  setStudentName: (name: string) => void
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

  function resetOnboarding() {
    studentName.value = ''
  }

  return { studentName, isNameValid, setStudentName, resetOnboarding }
}
