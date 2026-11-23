export type TabKey = 'beranda' | 'quran' | 'kalender' | 'atur' | 'prayer' | 'tasbih'

export type AmalType = 'checklist' | 'target' | 'counter' | 'amount'

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
