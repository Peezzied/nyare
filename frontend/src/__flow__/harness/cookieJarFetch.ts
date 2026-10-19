// ponytail: minimal in-memory session jar for one backend origin, no cookie library.

const BACKEND_ORIGIN = 'http://localhost:8080'

let installed = false
let sessionCookie: string | null = null

/** Resolves a relative API path against the backend origin. Absolute URLs pass through. */
export function resolveBackendUrl(url: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    return url
  }
  return new URL(url, BACKEND_ORIGIN).toString()
}

function readCookiePair(response: Response, requestUrl: string): void {
  if (!requestUrl.startsWith(BACKEND_ORIGIN)) {
    return
  }
  for (const raw of response.headers.getSetCookie()) {
    const pair = raw.split(';')[0]
    if (pair && pair.trim().startsWith('JSESSIONID=')) {
      sessionCookie = pair.trim()
    }
  }
}

function inputUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input
  }
  if (input instanceof URL) {
    return input.toString()
  }
  return input.url
}

/** Patches `globalThis.fetch` once so the browser session cookie survives across calls. */
export function installCookieJarFetch(): void {
  if (installed) {
    return
  }
  installed = true

  const originalFetch = globalThis.fetch.bind(globalThis)

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const targetUrl = resolveBackendUrl(inputUrl(input))
    const isBackendCall = targetUrl.startsWith(BACKEND_ORIGIN)

    const nextInit: RequestInit = { ...init }
    if (isBackendCall) {
      const sourceHeaders = input instanceof Request ? input.headers : init?.headers
      const headers = new Headers(sourceHeaders)
      if (sessionCookie && !headers.has('Cookie')) {
        headers.set('Cookie', sessionCookie)
      }
      nextInit.headers = headers
    }

    const requestInput = input instanceof Request ? new Request(targetUrl, input) : targetUrl
    const response = await originalFetch(requestInput, nextInit)

    if (isBackendCall) {
      readCookiePair(response, targetUrl)
    }
    return response
  }
}

installCookieJarFetch()
