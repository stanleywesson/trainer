import type { CalendarState } from '@/stores/calendar'
import type { WorkoutSession } from '@/stores/history'
import { todayKey } from '@/utils/date'

/** Bump when the file layout changes in a way older app versions can't read */
const BACKUP_FORMAT = 1
const LAST_BACKUP_KEY = 'trainer_last_backup'
const UNREADABLE_PREFIX = 'trainer_unreadable_'

/** Any new store holding user data must be added here too, or it won't be backed up */
export interface BackupFile {
  app: 'trainer'
  format: number
  exportedAt: string
  appVersion: string
  history: WorkoutSession[]
  calendar: CalendarState | null
  /** Stored data the app couldn't read, kept as raw text so it isn't lost */
  unreadable?: Record<string, string>
}

/** A problem with the chosen file; the message is shown to the user */
export class BackupError extends Error {}

/** Stored data failed to load: set a copy aside before the next save overwrites it */
export function keepUnreadable(key: string, raw: string | null) {
  if (!raw) return
  try {
    localStorage.setItem(`${UNREADABLE_PREFIX}${key}`, raw)
  } catch {
    // storage full: nothing more we can do
  }
}

function readUnreadable(): Record<string, string> | undefined {
  const found: Record<string, string> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(UNREADABLE_PREFIX)) found[key] = localStorage.getItem(key) ?? ''
    }
  } catch {
    // storage blocked: the backup still has everything that loaded
  }
  return Object.keys(found).length ? found : undefined
}

export function createBackup(history: WorkoutSession[], calendar: CalendarState | null): string {
  const backup: BackupFile = {
    app: 'trainer',
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    appVersion: __APP_VERSION__,
    history,
    calendar,
    unreadable: readUnreadable(),
  }
  return JSON.stringify(backup, null, 1)
}

function isSession(s: Partial<WorkoutSession> | null): boolean {
  return !!s && typeof s.id === 'string' && !!s.id
    && typeof s.date === 'string' && !Number.isNaN(Date.parse(s.date))
    && typeof s.workoutId === 'string' && typeof s.workoutName === 'string'
    && typeof s.durationSeconds === 'number'
    && (s.log === undefined || (Array.isArray(s.log) && s.log.every(l => Array.isArray(l?.sets))))
}

function isCalendar(c: Partial<CalendarState> | null): boolean {
  return !!c && typeof c.plan === 'string' && typeof c.startDate === 'string'
    && Array.isArray(c.entries)
    && c.entries.every(e => typeof e?.id === 'string' && typeof e.date === 'string' && typeof e.type === 'string')
}

/** Reads a backup file, or throws BackupError. Checks everything before anything is changed. */
export function parseBackup(text: string): BackupFile {
  let data: Partial<BackupFile> | null
  try {
    data = JSON.parse(text.replace(/^﻿/, ''))
  } catch {
    throw new BackupError("This file isn't a Trainer backup, or it's damaged.")
  }
  if (data?.app !== 'trainer' || typeof data.format !== 'number') {
    throw new BackupError("This file isn't a Trainer backup.")
  }
  if (data.format > BACKUP_FORMAT) {
    throw new BackupError('This backup is from a newer version of the app. Update the app and try again.')
  }
  const calendar = data.calendar ?? null
  if (!Array.isArray(data.history) || !data.history.every(isSession) || (calendar && !isCalendar(calendar))) {
    throw new BackupError('This backup is damaged, so nothing was restored.')
  }
  return { ...data, calendar } as BackupFile
}

function download(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * Opens the phone's share menu (WhatsApp etc.), or downloads the file if sharing isn't available.
 * Chrome on Android refuses to share .json files, so it falls back to .txt with the same contents.
 */
export async function saveBackup(json: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const name = `trainer-backup-${todayKey()}`
  const options = [
    new File([json], `${name}.json`, { type: 'application/json' }),
    new File([json], `${name}.txt`, { type: 'text/plain' }),
  ]
  const shareable = options.find(file => navigator.canShare?.({ files: [file] }))
  if (shareable) {
    try {
      await navigator.share({ files: [shareable] })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled'
      // sharing failed for another reason: still give them the file
    }
  }
  download(options[0]!)
  return 'downloaded'
}

export function lastBackupAt(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}

export function markBackedUp(at = new Date().toISOString()) {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, at)
  } catch {
    // only the reminder is affected
  }
}
