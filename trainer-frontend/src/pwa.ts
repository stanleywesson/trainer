import { registerSW } from 'virtual:pwa-register'
import type { Router } from 'vue-router'

// Home-screen PWAs (especially on iOS) are resumed from memory rather than
// reloaded, so the browser rarely checks for a new service worker on its own.
// We check explicitly on launch, whenever the app comes back to the foreground,
// and on an interval. A new version downloads in the background, then activates
// and reloads the page as soon as no workout is in progress.

const CHECK_INTERVAL_MS = 15 * 60 * 1000

/** Screens holding an unsaved session in memory: a reload here would lose it */
const NO_RELOAD_ROUTES = new Set(['workout', 'circuit', 'rounds', 'run', 'summary'])

export function setupAutoUpdate(router: Router) {
  let updateReady = false

  function applyUpdateIfSafe() {
    if (updateReady && !NO_RELOAD_ROUTES.has(String(router.currentRoute.value.name))) updateSW(true)
  }

  router.afterEach(applyUpdateIfSafe)

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateReady = true
      applyUpdateIfSafe()
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
