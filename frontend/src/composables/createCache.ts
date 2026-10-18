/**
 * Shared cache guard for composable list caches.
 * A cache tracks a generation counter. `reset()` bumps the generation,
 * so async work that started before the reset can drop its stale result.
 * Do not import `useAuth` here. `useAuth` calls `resetAllCaches()` and
 * an import back would create a cycle.
 */
export interface CacheHandle {
  /** Returns the current generation. Capture it before an awaited fetch. */
  begin(): number
  /** True when `g` still matches the current generation. */
  isCurrent(g: number): boolean
  /** True after a successful load. Writable by the owner composable. */
  loaded: boolean
  /** The shared in-flight load promise, or null. Writable by the owner composable. */
  pending: Promise<void> | null
  /** Starts a load and returns its sequence. The newest load wins writes. */
  beginLoad(): number
  /** True when `seq` is the newest load and `g` is the current generation. */
  isLatest(seq: number, g: number): boolean
  /** Bumps the generation, clears `loaded` and `pending`, then runs `onReset`. */
  reset(): void
}

const registry = new Set<CacheHandle>()

/**
 * Creates a registered cache. `onReset` runs inside `reset()`,
 * so the owner can clear its data refs.
 */
export function createCache(onReset?: () => void): CacheHandle {
  let generation = 0
  let loadSeq = 0

  const cache: CacheHandle = {
    loaded: false,
    pending: null,
    begin: () => generation,
    isCurrent: (g) => g === generation,
    beginLoad: () => ++loadSeq,
    isLatest: (seq, g) => seq === loadSeq && g === generation,
    reset: () => {
      generation += 1
      cache.loaded = false
      cache.pending = null
      onReset?.()
    },
  }

  registry.add(cache)
  return cache
}

/** Resets every registered cache. `useAuth` calls this on session clear. */
export function resetAllCaches(): void {
  for (const cache of registry) {
    cache.reset()
  }
}
