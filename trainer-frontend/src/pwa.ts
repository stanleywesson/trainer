import { registerSW } from 'virtual:pwa-register'

// Home-screen PWAs (especially on iOS) are resumed from memory rather than
// reloaded, so the browser rarely checks for a new service worker on its own.
// We check explicitly on launch, whenever the app comes back to the foreground,
// and on an interval. When a new version is found it activates immediately
// (skipWaiting + clientsClaim) and the page reloads onto it.

const CHECK_INTERVAL_MS = 15 * 60 * 1000

export function setupAutoUpdate() {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Fallback: if a waiting worker is ever reported, force it in and reload.
      updateSW(true)
    },
    onRegisteredSW(swUrl, registration) {
      if (!registration) return

      const checkForUpdate = async () => {
        if (registration.installing || !navigator.onLine) return
        try {
          // Bypass the HTTP cache so a fresh sw.js is always compared.
          const res = await fetch(swUrl, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } })
          if (res.status === 200) await registration.update()
        } catch {
          // offline or network hiccup: try again next time
        }
      }

      checkForUpdate()
      setInterval(checkForUpdate, CHECK_INTERVAL_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate()
      })
      window.addEventListener('focus', checkForUpdate)
    },
  })
}
