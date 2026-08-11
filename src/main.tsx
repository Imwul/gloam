import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const registerOfflineShell = async () => {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

  try {
    const serviceWorkerUrl = new URL('sw.js', document.baseURI)
    const scopeUrl = new URL('./', document.baseURI)
    const registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
      scope: scopeUrl.pathname,
      updateViaCache: 'none',
    })
    await navigator.serviceWorker.ready

    const worker = navigator.serviceWorker.controller ?? registration.active
    if (!worker) return

    const resources = performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((url) => url.startsWith('http://') || url.startsWith('https://'))

    worker.postMessage({ type: 'CACHE_USED_RESOURCES', urls: resources })
  } catch {
    // Online use and local campaign persistence remain available if shell caching fails.
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

window.addEventListener('load', () => {
  void registerOfflineShell()
})
