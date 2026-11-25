import type { MandatoryPrayerKey } from '../types'
import { getClockInTimezone, toSeconds, type PrayerSchedule } from './prayerService'

export type ReminderLeadMinutes = 0 | 5 | 10 | 15
export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

export interface PrayerReminderSettings {
  enabled: boolean
  leadMinutes: ReminderLeadMinutes
  sound: boolean
  prayers: Record<MandatoryPrayerKey, boolean>
}

export interface DuePrayerReminder {
  prayerId: MandatoryPrayerKey
  prayerName: string
  prayerTime: string
  leadMinutes: ReminderLeadMinutes
  dateIso: string
  firedKey: string
  title: string
  body: string
}

export const REMINDER_STORAGE_KEY = 'mizany_prayer_reminders_v1'
const FIRED_STORAGE_KEY = 'mizany_prayer_reminders_fired_v1'

export const REMINDER_LEAD_OPTIONS: readonly { value: ReminderLeadMinutes; label: string; shortLabel: string }[] = [
  { value: 0, label: 'Tepat waktu', shortLabel: 'Tepat waktu' },
  { value: 5, label: '5 menit sebelum', shortLabel: '5 mnt' },
  { value: 10, label: '10 menit sebelum', shortLabel: '10 mnt' },
  { value: 15, label: '15 menit sebelum', shortLabel: '15 mnt' },
]

export const REMINDER_PRAYER_META: readonly { id: MandatoryPrayerKey; name: string }[] = [
  { id: 'subuh', name: 'Subuh' },
  { id: 'dzuhur', name: 'Dzuhur' },
  { id: 'ashar', name: 'Ashar' },
  { id: 'maghrib', name: 'Maghrib' },
  { id: 'isya', name: 'Isya' },
]

export const DEFAULT_REMINDER_SETTINGS: PrayerReminderSettings = {
  enabled: false,
  leadMinutes: 0,
  sound: true,
  prayers: {
    subuh: true,
    dzuhur: true,
    ashar: true,
    maghrib: true,
    isya: true,
  },
}

const VALID_LEAD_VALUES = new Set<number>([0, 5, 10, 15])
const TRIGGER_WINDOW_SECONDS = 90

export function loadReminderSettings(): PrayerReminderSettings {
  try {
    const raw = localStorage.getItem(REMINDER_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_REMINDER_SETTINGS, prayers: { ...DEFAULT_REMINDER_SETTINGS.prayers } }
    const parsed = JSON.parse(raw)
    const lead = VALID_LEAD_VALUES.has(Number(parsed?.leadMinutes))
      ? (Number(parsed.leadMinutes) as ReminderLeadMinutes)
      : 0
    return {
      enabled: Boolean(parsed?.enabled),
      leadMinutes: lead,
      sound: parsed?.sound === undefined ? true : Boolean(parsed.sound),
      prayers: {
        subuh: parsed?.prayers?.subuh !== false,
        dzuhur: parsed?.prayers?.dzuhur !== false,
        ashar: parsed?.prayers?.ashar !== false,
        maghrib: parsed?.prayers?.maghrib !== false,
        isya: parsed?.prayers?.isya !== false,
      },
    }
  } catch {
    return { ...DEFAULT_REMINDER_SETTINGS, prayers: { ...DEFAULT_REMINDER_SETTINGS.prayers } }
  }
}

export function saveReminderSettings(settings: PrayerReminderSettings): void {
  try {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

export function countActiveReminderPrayers(settings: PrayerReminderSettings): number {
  return REMINDER_PRAYER_META.filter((p) => settings.prayers[p.id]).length
}

export function formatLeadLabel(leadMinutes: ReminderLeadMinutes): string {
  return leadMinutes === 0 ? 'Tepat waktu' : `${leadMinutes} menit sebelum`
}

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export function loadFiredReminderKeys(todayDateIso: string): Set<string> {
  try {
    const raw = localStorage.getItem(FIRED_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    // Keep only keys for the current date to avoid unbounded growth
    return new Set(parsed.filter((k): k is string => typeof k === 'string' && k.startsWith(`${todayDateIso}_`)))
  } catch {
    return new Set()
  }
}

export function saveFiredReminderKeys(keys: Set<string>): void {
  try {
    localStorage.setItem(FIRED_STORAGE_KEY, JSON.stringify(Array.from(keys)))
  } catch {}
}

/**
 * Pure evaluator: returns any enabled prayer reminders currently inside their trigger window
 * [targetSec, targetSec + 90s) that have not fired yet today.
 */
export function findDuePrayerReminders(
  schedule: Pick<PrayerSchedule, 'timings' | 'timeZone' | 'tzLabel' | 'city'>,
  settings: PrayerReminderSettings,
  firedKeys: ReadonlySet<string>,
  now: Date = new Date()
): DuePrayerReminder[] {
  if (!settings.enabled) return []

  const clock = getClockInTimezone(now, schedule.timeZone)
  const currentSec = clock.totalSeconds
  const due: DuePrayerReminder[] = []

  for (const prayer of REMINDER_PRAYER_META) {
    if (!settings.prayers[prayer.id]) continue
    const prayerTime = schedule.timings[prayer.id]
    if (!prayerTime || !/^\d{2}:\d{2}/.test(prayerTime)) continue

    const prayerSec = toSeconds(prayerTime)
    const targetSec = Math.max(0, prayerSec - settings.leadMinutes * 60)

    if (currentSec >= targetSec && currentSec < targetSec + TRIGGER_WINDOW_SECONDS) {
      const firedKey = `${clock.dateIso}_${prayer.id}_${settings.leadMinutes}`
      if (firedKeys.has(firedKey)) continue

      const title =
        settings.leadMinutes === 0
          ? `Waktu ${prayer.name} telah tiba`
          : `${settings.leadMinutes} menit menuju ${prayer.name}`
      const body =
        settings.leadMinutes === 0
          ? `Pukul ${prayerTime} ${schedule.tzLabel} · ${schedule.city}. Mari tunaikan sholat ${prayer.name}.`
          : `Jadwal ${prayer.name} pukul ${prayerTime} ${schedule.tzLabel} · ${schedule.city}. Mari bersiap mengambil wudhu.`

      due.push({
        prayerId: prayer.id,
        prayerName: prayer.name,
        prayerTime,
        leadMinutes: settings.leadMinutes,
        dateIso: clock.dateIso,
        firedKey,
        title,
        body,
      })
    }
  }

  return due
}

/**
 * Dispatch a browser/PWA notification (prefers ServiceWorker.showNotification for mobile PWA support).
 */
export async function dispatchBrowserNotification(
  title: string,
  body: string,
  tag: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  const options: NotificationOptions = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag,
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options)
        return true
      }
    }
  } catch {
    // Fall through to window.Notification
  }

  try {
    new Notification(title, options)
    return true
  } catch {
    return false
  }
}

/**
 * Gentle two-note harmonic chime via Web Audio API (no external audio files, fails silently if blocked).
 */
export function playGentleReminderChime(): void {
  if (typeof window === 'undefined') return
  const AudioCtx =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return

  try {
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const notes = [523.25, 659.25] // C5 -> E5 soft calm chime

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = now + idx * 0.22
      const end = start + 0.65

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, end)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(end + 0.02)
    })

    setTimeout(() => {
      ctx.close().catch(() => {})
    }, 1200)
  } catch {
    // Ignore audio context autoplay restrictions
  }
}
