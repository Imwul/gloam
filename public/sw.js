const CACHE_VERSION = 'gloam-v1.0.0-20260811'
const SHELL_CACHE = `${CACHE_VERSION}-shell`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const CACHE_PREFIX = 'gloam-v'
const SCOPE_URL = new URL('./', globalThis.registration.scope).href
const INDEX_URL = new URL('index.html', SCOPE_URL).href

const cacheableResponse = (response) => response && (response.ok || response.type === 'opaque')

const requestFor = (url) => {
  const target = new URL(url, SCOPE_URL)
  return new Request(target.href, {
    credentials: target.origin === globalThis.location.origin ? 'same-origin' : 'omit',
    mode: target.origin === globalThis.location.origin ? 'same-origin' : 'cors',
  })
}

const fetchAndCache = async (cache, url) => {
  try {
    const request = requestFor(url)
    const response = await fetch(request)
    if (!cacheableResponse(response)) return false
    await cache.put(request, response.clone())
    return true
  } catch {
    return false
  }
}

const shellReferences = (html) => [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)]
  .map((match) => match[1])
  .filter((url) => url && !url.startsWith('data:'))
  .map((url) => new URL(url, SCOPE_URL))
  .filter((url) => (url.protocol === 'http:' || url.protocol === 'https:') && !url.pathname.includes('/tarot/'))
  .map((url) => url.href)

const precacheShell = async () => {
  const cache = await caches.open(SHELL_CACHE)
  const response = await fetch(SCOPE_URL, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Unable to cache Gloam shell: ${response.status}`)

  const html = await response.clone().text()
  await cache.put(SCOPE_URL, response.clone())
  await cache.put(INDEX_URL, response.clone())
  await Promise.all(shellReferences(html).map((url) => fetchAndCache(cache, url)))
}

globalThis.addEventListener('install', (event) => {
  event.waitUntil(precacheShell().then(() => globalThis.skipWaiting()))
})

globalThis.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== SHELL_CACHE && name !== RUNTIME_CACHE)
      .map((name) => caches.delete(name)))
    await globalThis.clients.claim()
  })())
})

const cacheFirst = async (request) => {
  const cached = await caches.match(request, { ignoreVary: true })
  if (cached) return cached

  const response = await fetch(request)
  if (cacheableResponse(response)) {
    const cache = await caches.open(RUNTIME_CACHE)
    await cache.put(request, response.clone())
  }
  return response
}

const navigationResponse = async (request) => {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE)
      await cache.put(SCOPE_URL, response.clone())
      await cache.put(INDEX_URL, response.clone())
    }
    return response
  } catch {
    return (await caches.match(SCOPE_URL, { ignoreVary: true }))
      ?? (await caches.match(INDEX_URL, { ignoreVary: true }))
      ?? Response.error()
  }
}

globalThis.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(navigationResponse(request))
    return
  }

  const url = new URL(request.url)
  const sameOrigin = url.origin === globalThis.location.origin
  const cacheableAsset = sameOrigin && (
    url.pathname.includes('/assets/')
    || url.pathname.includes('/tarot/')
    || url.pathname.endsWith('/favicon.svg')
    || request.destination === 'style'
    || request.destination === 'script'
    || request.destination === 'image'
    || request.destination === 'font'
  )
  const externalFontAsset = !sameOrigin && (
    request.destination === 'style'
    || request.destination === 'font'
    || url.hostname === 'fonts.googleapis.com'
    || url.hostname === 'fonts.gstatic.com'
    || url.hostname === 'cdn.jsdelivr.net'
  )

  if (cacheableAsset || externalFontAsset) event.respondWith(cacheFirst(request))
})

globalThis.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_USED_RESOURCES' || !Array.isArray(event.data.urls)) return

  event.waitUntil((async () => {
    const cache = await caches.open(RUNTIME_CACHE)
    const urls = [...new Set(event.data.urls)]
      .filter((url) => typeof url === 'string')
      .filter((url) => {
        try {
          const target = new URL(url)
          return target.protocol === 'http:' || target.protocol === 'https:'
        } catch {
          return false
        }
      })
    await Promise.all(urls.map((url) => fetchAndCache(cache, url)))
    event.ports[0]?.postMessage({ cached: urls.length })
  })())
})
