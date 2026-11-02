/** Local-time date helpers. Calendar days are stored as "YYYY-MM-DD" keys. */

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

export function todayKey(): string {
  return toKey(new Date())
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

/** Monday of the week containing d */
export function mondayOf(d: Date): Date {
  const day = (d.getDay() + 6) % 7 // Mon = 0 … Sun = 6
  return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -day)
}

/** Today if it's a Monday, otherwise next Monday */
export function nextMonday(from = new Date()): Date {
  const monday = mondayOf(from)
  return toKey(monday) === toKey(from) ? monday : addDays(monday, 7)
}

export function formatDayLong(key: string): string {
  return fromKey(key).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}
