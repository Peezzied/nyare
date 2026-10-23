import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computed, ref } from 'vue'
import { useServerSearch } from '../useServerSearch'

interface SearchParams {
  q?: string
}

function deferred<T>() {
  let resolve!: (value: T[]) => void
  const promise = new Promise<T[]>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('useServerSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches once per pause with the latest params', async () => {
    const source = ref<SearchParams | null>(null)
    const fetcher = vi.fn<(p: SearchParams) => Promise<string[]>>((p) =>
      Promise.resolve([p.q ?? 'none']),
    )
    useServerSearch(
      fetcher,
      computed(() => source.value),
    )

    source.value = { q: 'a' }
    await vi.advanceTimersByTimeAsync(200)
    source.value = { q: 'ab' }
    await vi.advanceTimersByTimeAsync(200)
    expect(fetcher).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(100)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith({ q: 'ab' })
  })

  it('stays inactive on null params and clears state when params go null', async () => {
    const source = ref<SearchParams | null>(null)
    const fetcher = vi.fn<(p: SearchParams) => Promise<string[]>>((p) =>
      Promise.resolve([p.q ?? 'none']),
    )
    const search = useServerSearch(
      fetcher,
      computed(() => source.value),
    )

    await vi.advanceTimersByTimeAsync(1000)
    expect(fetcher).not.toHaveBeenCalled()
    expect(search.results.value).toBeNull()

    source.value = { q: 'a' }
    await vi.advanceTimersByTimeAsync(300)
    expect(search.results.value).toEqual(['a'])

    source.value = null
    await vi.advanceTimersByTimeAsync(300)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(search.results.value).toBeNull()
    expect(search.pending.value).toBe(false)
    expect(search.error.value).toBeNull()
  })

  it('populates results and clears pending once the fetch resolves', async () => {
    const source = ref<SearchParams | null>(null)
    const fetch = deferred<string>()
    const fetcher = vi.fn<(p: SearchParams) => Promise<string[]>>(() => fetch.promise)
    const search = useServerSearch(
      fetcher,
      computed(() => source.value),
    )

    source.value = { q: 'a' }
    await vi.advanceTimersByTimeAsync(300)
    expect(search.pending.value).toBe(true)

    fetch.resolve(['a'])
    await vi.advanceTimersByTimeAsync(0)
    expect(search.results.value).toEqual(['a'])
    expect(search.pending.value).toBe(false)
    expect(search.error.value).toBeNull()
  })

  it('discards a stale response that resolves after a newer call', async () => {
    const source = ref<SearchParams | null>(null)
    const stale = deferred<string>()
    const fetcher = vi.fn<(p: SearchParams) => Promise<string[]>>((p) =>
      p.q === 'stale' ? stale.promise : Promise.resolve(['latest']),
    )
    const search = useServerSearch(
      fetcher,
      computed(() => source.value),
    )

    source.value = { q: 'stale' }
    await vi.advanceTimersByTimeAsync(300)
    source.value = { q: 'new' }
    await vi.advanceTimersByTimeAsync(300)
    expect(search.results.value).toEqual(['latest'])

    stale.resolve(['stale'])
    await vi.advanceTimersByTimeAsync(0)
    expect(search.results.value).toEqual(['latest'])
  })

  it('sets error on rejection and keeps prior results', async () => {
    const source = ref<SearchParams | null>(null)
    const fetcher = vi.fn<(p: SearchParams) => Promise<string[]>>((p) =>
      p.q === 'fail' ? Promise.reject(new Error('boom')) : Promise.resolve(['ok']),
    )
    const search = useServerSearch(
      fetcher,
      computed(() => source.value),
    )

    source.value = { q: 'ok' }
    await vi.advanceTimersByTimeAsync(300)
    source.value = { q: 'fail' }
    await vi.advanceTimersByTimeAsync(300)

    expect(search.error.value).toBe('boom')
    expect(search.results.value).toEqual(['ok'])
    expect(search.pending.value).toBe(false)
  })
})
