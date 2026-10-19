import { onMounted, onUnmounted, ref } from 'vue'

// Set this to a time like '10:15' to simulate the current time while testing.
// Use null for the real time.
const DEBUG_TIME: string | null = null

function readNow(): Date {
  const d = new Date()
  if (DEBUG_TIME) {
    const [h = 0, m = 0] = DEBUG_TIME.split(':').map(Number)
    d.setHours(h ?? 0, m ?? 0, 0, 0)
  }
  return d
}

export function useNow(intervalMs = 30000) {
  const now = ref(readNow())
  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    timer = setInterval(() => {
      now.value = readNow()
    }, intervalMs)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return now
}
