import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'

export interface UseOnboardingReturn {
  studentName: Ref<string>
  isNameValid: ComputedRef<boolean>
  setStudentName: (name: string) => void
  resetOnboarding: () => void
}

export function useOnboarding(): UseOnboardingReturn {
  const studentName = ref('')
  const isNameValid = computed(() => studentName.value.trim().length > 0)

  function setStudentName(name: string) {
    studentName.value = name
  }

  function resetOnboarding() {
    studentName.value = ''
  }

  return { studentName, isNameValid, setStudentName, resetOnboarding }
}