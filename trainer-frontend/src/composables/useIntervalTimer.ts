import { computed, onUnmounted, ref, type Ref } from 'vue'

export interface TimerStep {
  seconds: number
}

interface Options<T extends TimerStep> {
  /** Called when a step ends; skipped = user tapped Skip */
  onStepEnd?: (step: T, skipped: boolean) => void
  /** Called after the last step */
  onFinish: () => void
  /** High beep when a "work" step starts, low beep otherwise */
  isWork?: (step: T) => boolean
}

/**
 * Wall-clock interval timer: survives the phone locking or the app being backgrounded
 * (it catches up on return), beeps on the last 3 seconds and step changes,
 * and keeps the screen awake while running.
 */
export function useIntervalTimer<T extends TimerStep>(steps: Ref<T[]>, options: Options<T>) {
  const started = ref(false)
  const paused = ref(false)
  const stepIndex = ref(0)
  const remainingMs = ref(0)
  const startTime = ref(0)

  let endAt = 0
  let ticker: ReturnType<typeof setInterval> | undefined
  let lastBeepSecond = -1
  // active (unpaused) time tracking
  let activeMs = 0
  let resumedAt = 0

  /** Seconds the timer has actually been running, excluding pauses */
  function activeSeconds(): number {
    const running = started.value && !paused.value && resumedAt ? Date.now() - resumedAt : 0
    return Math.round((activeMs + running) / 1000)
  }

  const step = computed(() => steps.value[stepIndex.value])
  const remainingSeconds = computed(() => Math.max(0, Math.ceil(remainingMs.value / 1000)))
  const stepProgress = computed(() => (step.value ? 1 - remainingMs.value / (step.value.seconds * 1000) : 0))
  const overallProgress = computed(() => (steps.value.length ? stepIndex.value / steps.value.length : 0))

  // ---- sound (unlocked by the Start tap; iOS requires a user gesture) ----
  let audio: AudioContext | undefined
  function beep(freq = 880, ms = 120) {
    if (!audio) return
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.25, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + ms / 1000)
    osc.connect(gain).connect(audio.destination)
    osc.start()
    osc.stop(audio.currentTime + ms / 1000)
  }

  // ---- keep the screen on ----
  let wakeLock: WakeLockSentinel | undefined
  async function requestWakeLock() {
    try {
      wakeLock = await navigator.wakeLock?.request('screen')
    } catch {
      // not supported / denied: timer still works
    }
  }
  function onVisibility() {
    if (document.visibilityState === 'visible' && started.value && !paused.value) {
      requestWakeLock()
      tick()
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  function tick() {
    const now = Date.now()
    while (now >= endAt) {
      if (!advance(false)) return
    }
    remainingMs.value = endAt - now
    const s = remainingSeconds.value
    if (s !== lastBeepSecond && s <= 3 && s >= 1) beep(660, 100)
    lastBeepSecond = s
  }

  /** Move to the next step. Returns false when finished. */
  function advance(skipped: boolean): boolean {
    if (step.value) options.onStepEnd?.(step.value, skipped)
    if (stepIndex.value >= steps.value.length - 1) {
      stop()
      options.onFinish()
      return false
    }
    stepIndex.value++
    const next = step.value!
    endAt = skipped ? Date.now() + next.seconds * 1000 : endAt + next.seconds * 1000
    remainingMs.value = endAt - Date.now()
    lastBeepSecond = -1
    const work = options.isWork?.(next) ?? false
    beep(work ? 1046 : 523, work ? 300 : 200)
    return true
  }

  function start() {
    try {
      audio = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      audio = undefined
    }
    started.value = true
    startTime.value = Date.now()
    activeMs = 0
    resumedAt = Date.now()
    stepIndex.value = 0
    endAt = Date.now() + (step.value?.seconds ?? 0) * 1000
    remainingMs.value = endAt - Date.now()
    ticker = setInterval(tick, 200)
    requestWakeLock()
  }

  function togglePause() {
    if (paused.value) {
      endAt = Date.now() + remainingMs.value
      ticker = setInterval(tick, 200)
      paused.value = false
      resumedAt = Date.now()
      requestWakeLock()
    } else {
      clearInterval(ticker)
      activeMs += Date.now() - resumedAt
      resumedAt = 0
      remainingMs.value = Math.max(0, endAt - Date.now())
      paused.value = true
    }
  }

  function skip() {
    if (paused.value) togglePause()
    advance(true)
  }

  function stop() {
    if (resumedAt && !paused.value) {
      activeMs += Date.now() - resumedAt
      resumedAt = 0
    }
    clearInterval(ticker)
    wakeLock?.release().catch(() => { })
    wakeLock = undefined
  }

  onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibility)
    audio?.close().catch(() => { })
  })

  return {
    started, paused, stepIndex, step, startTime, activeSeconds,
    remainingSeconds, stepProgress, overallProgress,
    start, togglePause, skip, stop,
  }
}
