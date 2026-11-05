/** "52m 10s", or "1h 05m" for long sessions */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`
  return s ? `${m}m ${s}s` : `${m} min`
}

/** Local time of day, e.g. "17:42" */
export function formatClock(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

/** Running pace, e.g. "6:12 /km" */
export function formatPace(seconds: number, km: number): string {
  const perKm = Math.round(seconds / km)
  return `${Math.floor(perKm / 60)}:${String(perKm % 60).padStart(2, '0')} /km`
}
