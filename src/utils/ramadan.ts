import type { CustomAmalType } from '../types'
import { getClockInTimezone, toSeconds, type PrayerTimingsRaw } from '../services/prayerService'

export const RAMADAN_PREVIEW_STORAGE_KEY = 'mizany_ramadan_preview_v1'

export interface RamadanContext {
  isActive: boolean
  isRealRamadan: boolean
  isPreview: boolean
  dayOfRamadan: number
  totalDays: number
  daysRemaining: number
  isLastTenNights: boolean
}

export interface RamadanPhaseInfo {
  phase: 'sahur' | 'imsak_wait' | 'puasa' | 'malam'
  label: string
  targetLabel: string
  targetTime: string
  countdown: string
  imsakTime: string
  maghribTime: string
}

export interface RamadanAmalSuggestion {
  key: string
  name: string
  shortLabel: string
  type: CustomAmalType
  icon: string
  matchPattern: RegExp
  highlightLastTen?: boolean
}

export const RAMADAN_AMAL_SUGGESTIONS: readonly RamadanAmalSuggestion[] = [
  {
    key: 'tarawih',
    name: 'Sholat Tarawih',
    shortLabel: 'Tarawih',
    type: 'checklist',
    icon: 'moon',
    matchPattern: /tarawih|taraweh/i,
  },
  {
    key: 'sahur',
    name: 'Sahur',
    shortLabel: 'Sahur',
    type: 'checklist',
    icon: 'bowl',
    matchPattern: /sahur/i,
  },
  {
    key: 'sedekah_subuh',
    name: 'Sedekah Subuh',
    shortLabel: 'Sedekah Subuh',
    type: 'amount',
    icon: 'gift',
    matchPattern: /sedekah|infaq|infak/i,
  },
  {
    key: 'dzikir_pagi_petang',
    name: 'Dzikir Pagi & Petang',
    shortLabel: 'Dzikir Pagi/Petang',
    type: 'checklist',
    icon: 'beads',
    matchPattern: /dzikir|zikir/i,
  },
  {
    key: 'qiyamul_lail',
    name: 'Qiyamul Lail',
    shortLabel: 'Qiyamul Lail',
    type: 'checklist',
    icon: 'moon',
    matchPattern: /qiyam|tahajud|witir|itikaf|i'tikaf/i,
    highlightLastTen: true,
  },
]

const DAY_SECONDS = 86400

function formatCountdown(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function buildRamadanContext(
  hijriMonth: number | undefined,
  hijriDay: number | undefined,
  monthCount: number | undefined,
  previewEnabled: boolean
): RamadanContext {
  const isRealRamadan = hijriMonth === 9
  const isActive = isRealRamadan || previewEnabled
  const isPreview = !isRealRamadan && previewEnabled
  const totalDays = isRealRamadan ? (monthCount === 29 ? 29 : 30) : 30
  const dayOfRamadan = isRealRamadan
    ? Math.min(totalDays, Math.max(1, hijriDay || 1))
    : 1
  const daysRemaining = Math.max(1, totalDays - dayOfRamadan + 1)

  return {
    isActive,
    isRealRamadan,
    isPreview,
    dayOfRamadan,
    totalDays,
    daysRemaining,
    isLastTenNights: dayOfRamadan >= 21,
  }
}

export function computeRamadanPhase(
  timings: Pick<PrayerTimingsRaw, 'imsak' | 'subuh' | 'maghrib'> | undefined,
  timeZone: string,
  now: Date = new Date()
): RamadanPhaseInfo | null {
  if (!timings?.imsak || !timings?.subuh || !timings?.maghrib) return null

  const clock = getClockInTimezone(now, timeZone)
  const currentSec = clock.totalSeconds
  const imsakSec = toSeconds(timings.imsak)
  const subuhSec = toSeconds(timings.subuh)
  const maghribSec = toSeconds(timings.maghrib)

  if (currentSec < imsakSec) {
    return {
      phase: 'sahur',
      label: 'Waktu Sahur',
      targetLabel: 'Imsak',
      targetTime: timings.imsak,
      countdown: formatCountdown(imsakSec - currentSec),
      imsakTime: timings.imsak,
      maghribTime: timings.maghrib,
    }
  }

  if (currentSec < subuhSec) {
    return {
      phase: 'imsak_wait',
      label: 'Waktu Imsak',
      targetLabel: 'Subuh',
      targetTime: timings.subuh,
      countdown: formatCountdown(subuhSec - currentSec),
      imsakTime: timings.imsak,
      maghribTime: timings.maghrib,
    }
  }

  if (currentSec < maghribSec) {
    return {
      phase: 'puasa',
      label: 'Menuju Berbuka',
      targetLabel: 'Berbuka',
      targetTime: timings.maghrib,
      countdown: formatCountdown(maghribSec - currentSec),
      imsakTime: timings.imsak,
      maghribTime: timings.maghrib,
    }
  }

  return {
    phase: 'malam',
    label: 'Malam Ramadan',
    targetLabel: 'Imsak',
    targetTime: timings.imsak,
    countdown: formatCountdown(imsakSec + DAY_SECONDS - currentSec),
    imsakTime: timings.imsak,
    maghribTime: timings.maghrib,
  }
}

export function computeKhatamPagesPerDay(remainingPages: number, daysRemaining: number): number {
  const safeDays = Math.max(1, Math.round(daysRemaining))
  const safePages = Math.max(1, Math.round(remainingPages))
  return Math.min(604, Math.max(1, Math.ceil(safePages / safeDays)))
}
