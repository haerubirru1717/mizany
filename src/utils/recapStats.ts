import type {
  AmalItem,
  DailyLogEntry,
  DailyLogsByDate,
  MandatoryPrayerKey,
} from '../types'

export const MANDATORY_PRAYER_KEYS: MandatoryPrayerKey[] = [
  'subuh',
  'dzuhur',
  'ashar',
  'maghrib',
  'isya',
]

export const PAGES_PER_JUZ = 20

const DAY_SHORTS_ID = ['Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTH_SHORTS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export function getLocalIsoDate(daysOffset = 0, baseDate: Date = new Date()): string {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + daysOffset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function shiftIsoDate(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays))
  const ny = dt.getUTCFullYear()
  const nm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const nd = String(dt.getUTCDate()).padStart(2, '0')
  return `${ny}-${nm}-${nd}`
}

export function diffIsoDays(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number)
  const [y2, m2, d2] = toIso.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

export function formatShortDateId(isoDate: string): { weekdayShort: string; dayMonth: string } {
  const [y, m, d] = isoDate.split('-').map(Number)
  const wdIdx = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return {
    weekdayShort: DAY_SHORTS_ID[wdIdx] || '',
    dayMonth: `${d} ${MONTH_SHORTS_ID[m - 1] || ''}`,
  }
}

export function formatChecklistDateTitle(selectedIso: string, todayIso: string): {
  title: string
  subtitle: string | null
  isPast: boolean
} {
  if (selectedIso === todayIso) {
    return { title: 'Checklist Hari Ini', subtitle: null, isPast: false }
  }
  const diff = diffIsoDays(selectedIso, todayIso)
  const { weekdayShort, dayMonth } = formatShortDateId(selectedIso)
  if (diff === 1) {
    return { title: 'Checklist Kemarin', subtitle: `${weekdayShort}, ${dayMonth}`, isPast: true }
  }
  return {
    title: `Checklist ${weekdayShort}, ${dayMonth}`,
    subtitle: `${diff} hari yang lalu`,
    isPast: true,
  }
}

export function hasCompletedAny(dayLog?: Record<string, DailyLogEntry>): boolean {
  if (!dayLog) return false
  return Object.values(dayLog).some((entry) => {
    if (entry.done === true || (entry.value || 0) > 0) return true
    if (entry.prayers && Object.values(entry.prayers).some(Boolean)) return true
    return false
  })
}

export function findLinkedQuranAmal(items: AmalItem[]): AmalItem | undefined {
  return items.find(
    (item) =>
      (item.type === 'target' || item.type === 'counter' || item.type === 'checklist') &&
      /qur|tilawah|tadarus|mushaf|ngaji|mengaji/i.test(item.name)
  )
}

export function isJuzUnit(unit?: string): boolean {
  return /juz/i.test(unit || '')
}

export function isPageUnit(unit?: string): boolean {
  return /hal|lembar|page/i.test(unit || '')
}

export function pagesToLinkedEntry(
  item: AmalItem,
  pages: number,
  effectiveTargetPages: number
): DailyLogEntry {
  const safePages = Math.max(0, pages)
  if (item.type === 'checklist') {
    return { done: safePages >= Math.max(1, effectiveTargetPages) }
  }
  if (isJuzUnit(item.unit)) {
    return { value: Math.round((safePages / PAGES_PER_JUZ) * 10) / 10 }
  }
  return { value: safePages }
}

export function linkedEntryToPages(
  item: AmalItem,
  entry: DailyLogEntry,
  effectiveTargetPages: number
): number {
  if (item.type === 'checklist') {
    return entry.done ? Math.max(1, effectiveTargetPages) : 0
  }
  const val = Math.max(0, entry.value || 0)
  if (isJuzUnit(item.unit)) {
    return Math.round(val * PAGES_PER_JUZ)
  }
  return Math.round(val)
}

export function getDayTilawahPages(
  dayLog: Record<string, DailyLogEntry> | undefined,
  linkedQuranAmal: AmalItem | undefined,
  effectiveQuranTarget: number
): number {
  if (!dayLog) return 0
  if (dayLog.tilawah !== undefined) {
    return Math.max(0, dayLog.tilawah.value || 0)
  }
  const linkedEntry = linkedQuranAmal ? dayLog[linkedQuranAmal.id] : undefined
  if (linkedQuranAmal && linkedEntry) {
    return linkedEntryToPages(linkedQuranAmal, linkedEntry, effectiveQuranTarget)
  }
  return 0
}

export function countDayPrayers(dayLog?: Record<string, DailyLogEntry>): number {
  const prayers = dayLog?.sholat?.prayers
  if (!prayers) return 0
  return MANDATORY_PRAYER_KEYS.filter((k) => Boolean(prayers[k])).length
}

export interface RecapDayBar {
  iso: string
  weekdayShort: string
  dayNum: number
  prayerCount: number
  overallPercent: number
  hasAny: boolean
}

export interface CustomAmalRecapStat {
  id: string
  name: string
  type: AmalItem['type']
  unit?: string
  target?: number
  completedDays: number
  totalValue: number
  summaryLabel: string
}

export interface PeriodRecapResult {
  daysCount: number
  activeDays: number
  prayersTotal: number
  prayersPossible: number
  prayersPercent: number
  prayerBreakdown: Record<MandatoryPrayerKey, number>
  tilawahPages: number
  dailyBars: RecapDayBar[]
  customAmalStats: CustomAmalRecapStat[]
}

/**
 * Computes an honest worship recap over an explicit inclusive list of ISO dates (YYYY-MM-DD).
 * Future dates should not be passed in so denominators never penalize days that haven't arrived.
 */
export function computePeriodRecap(params: {
  dates: string[]
  dailyLogs: DailyLogsByDate
  customAmalItems: AmalItem[]
  effectiveQuranTarget: number
}): PeriodRecapResult {
  const { dates, dailyLogs, customAmalItems, effectiveQuranTarget } = params
  const linkedQuranAmal = findLinkedQuranAmal(customAmalItems)

  const prayerBreakdown: Record<MandatoryPrayerKey, number> = {
    subuh: 0,
    dzuhur: 0,
    ashar: 0,
    maghrib: 0,
    isya: 0,
  }

  let activeDays = 0
  let prayersTotal = 0
  let tilawahPages = 0

  const customAccum = customAmalItems.map((item) => ({
    item,
    completedDays: 0,
    totalValue: 0,
  }))

  const dailyBars: RecapDayBar[] = []

  for (const iso of dates) {
    const dayLog = dailyLogs[iso]
    const hasAny = hasCompletedAny(dayLog)
    if (hasAny) activeDays += 1

    const prayers = dayLog?.sholat?.prayers
    let dayPrayerCount = 0
    for (const key of MANDATORY_PRAYER_KEYS) {
      if (prayers?.[key]) {
        prayerBreakdown[key] += 1
        prayersTotal += 1
        dayPrayerCount += 1
      }
    }

    tilawahPages += getDayTilawahPages(dayLog, linkedQuranAmal, effectiveQuranTarget)

    // Day completion fraction (Sholat 5 waktu + all custom amals)
    let fractionSum = dayPrayerCount / 5
    for (const acc of customAccum) {
      const entry = dayLog?.[acc.item.id]
      if (acc.item.type === 'checklist') {
        if (entry?.done) {
          acc.completedDays += 1
          fractionSum += 1
        }
      } else if (acc.item.type === 'target') {
        const val = entry?.value || 0
        const target = acc.item.target || 1
        acc.totalValue += val
        if (val >= target) acc.completedDays += 1
        fractionSum += Math.min(1, val / target)
      } else if (acc.item.type === 'counter' || acc.item.type === 'amount') {
        const val = entry?.value || 0
        acc.totalValue += val
        if (val > 0) {
          acc.completedDays += 1
          fractionSum += 1
        }
      }
    }

    const totalItems = 1 + customAmalItems.length
    const overallPercent = Math.round((fractionSum / totalItems) * 100)
    const { weekdayShort } = formatShortDateId(iso)
    const dayNum = Number(iso.split('-')[2]) || 0

    dailyBars.push({
      iso,
      weekdayShort,
      dayNum,
      prayerCount: dayPrayerCount,
      overallPercent,
      hasAny,
    })
  }

  const daysCount = dates.length
  const prayersPossible = daysCount * 5
  const prayersPercent =
    prayersPossible > 0 ? Math.round((prayersTotal / prayersPossible) * 100) : 0

  const customAmalStats: CustomAmalRecapStat[] = customAccum.map(({ item, completedDays, totalValue }) => {
    let summaryLabel = `${completedDays}/${daysCount} hari`
    if (item.type === 'amount') {
      summaryLabel = `Rp ${Math.round(totalValue).toLocaleString('id-ID')} · ${completedDays} hr`
    } else if (item.type === 'target') {
      const formattedVal = Number.isInteger(totalValue) ? totalValue : Number(totalValue.toFixed(1))
      summaryLabel = `${completedDays}/${daysCount} tercapai · ${formattedVal}${item.unit ? ` ${item.unit}` : ''}`
    } else if (item.type === 'counter') {
      summaryLabel = `Total ${Math.round(totalValue)}${item.unit ? ` ${item.unit}` : ''} · ${completedDays} hr`
    }

    return {
      id: item.id,
      name: item.name,
      type: item.type,
      unit: item.unit,
      target: item.target,
      completedDays,
      totalValue,
      summaryLabel,
    }
  })

  return {
    daysCount,
    activeDays,
    prayersTotal,
    prayersPossible,
    prayersPercent,
    prayerBreakdown,
    tilawahPages,
    dailyBars,
    customAmalStats,
  }
}

/**
 * Generates inclusive dates for the last 7 days ending on todayIso.
 */
export function getLast7Dates(todayIso: string): string[] {
  const result: string[] = []
  for (let offset = -6; offset <= 0; offset++) {
    result.push(shiftIsoDate(todayIso, offset))
  }
  return result
}

/**
 * Generates elapsed dates in a given Gregorian month (year, month 1..12) clamped at todayIso.
 * Returns empty array if the entire month is in the future.
 */
export function getElapsedDatesInMonth(year: number, month: number, todayIso: string): string[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const pad2 = (n: number) => String(n).padStart(2, '0')
  const dates: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${pad2(month)}-${pad2(d)}`
    if (iso > todayIso) break
    dates.push(iso)
  }
  return dates
}
