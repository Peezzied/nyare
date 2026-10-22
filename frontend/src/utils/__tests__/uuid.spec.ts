import { afterEach, describe, expect, it, vi } from 'vitest'
import { uuid } from '../uuid'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('uuid', () => {
  it('returns a UUID v4 through crypto.randomUUID', () => {
    expect(uuid()).toMatch(UUID_V4)
  })

  it('returns a UUID v4 through getRandomValues when randomUUID is absent', () => {
    // Insecure origins such as http://<ip>:5173 expose getRandomValues only.
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => bytes.fill(0xff),
    })

    const id = uuid()

    expect(id).toMatch(UUID_V4)
  })
})
