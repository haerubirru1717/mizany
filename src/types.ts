export type TabKey = 'beranda' | 'quran' | 'kalender' | 'atur' | 'prayer' | 'tasbih'

export type AmalType = 'prayers' | 'checklist' | 'target' | 'counter' | 'amount'

export type CustomAmalType = 'checklist' | 'target' | 'counter' | 'amount'

export type MandatoryPrayerKey = 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya'

export type PrayerChecks = Record<MandatoryPrayerKey, boolean>

export interface DailyLogEntry {
  done?: boolean
  value?: number
  prayers?: PrayerChecks
}

export type DailyLogsByDate = Record<string, Record<string, DailyLogEntry>>

export interface AmalItem {
  id: string
  name: string
  note?: string
  icon: string
  type: AmalType
  unit?: string
  done?: boolean
  value?: number
  target?: number
  prayerChecks?: PrayerChecks
  isLocked?: boolean
  isCustom?: boolean
}

export interface PrayerTime {
  name: string
  time: string
  status: 'passed' | 'next' | 'upcoming'
}

export interface UserSettings {
  city: string
  tilawahTarget: number // halaman per hari
  hasSeenOnboarding: boolean
}
