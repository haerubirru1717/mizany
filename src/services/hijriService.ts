export interface HijriDayItem {
  gregorian: string
  gregorianShort: string
  hijri: string
  day: number
  weekday: string
  weekdayShort: string
  weekdayIndex: number // 0=Ahad .. 6=Sabtu
  isToday: boolean
  isPast: boolean
  isAyyamulBidh: boolean
}

export interface HijriEvent {
  event: string
  name: string
  hijri: string
  gregorian: string
  gregorianLabel: string
  daysLeft: number
  isPast: boolean
}

export interface HijriHeroData {
  source: string
  formattedDate: string
  today: {
    gregorian: string
    gregorianLabel: string
    hijri: string
    day: number
    month: number
    monthName: string
    year: number
    weekday: string
  }
  monthCount: number
  days: HijriDayItem[]
  weekStrip: HijriDayItem[]
  events: HijriEvent[]
  nextEvent: HijriEvent | null
}

export const HIJRI_MONTH_NAMES: Record<number, string> = {
  1: 'Muharram',
  2: 'Safar',
  3: 'Rabiul Awal',
  4: 'Rabiul Akhir',
  5: 'Jumadil Awal',
  6: 'Jumadil Akhir',
  7: 'Rajab',
  8: "Sya'ban",
  9: 'Ramadan',
  10: 'Syawal',
  11: "Dzulqa'dah",
  12: 'Dzulhijjah',
}

const WEEKDAY_SHORT: Record<string, string> = {
  Ahad: 'Ahd',
  Minggu: 'Ahd',
  Senin: 'Sen',
  Selasa: 'Sel',
  Rabu: 'Rab',
  Kamis: 'Kam',
  Jumat: 'Jum',
  Sabtu: 'Sab',
}

const WEEKDAY_INDEX: Record<string, number> = {
  Ahad: 0,
  Minggu: 0,
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
}

function formatGregorianId(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatGregorianShort(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}

function diffCalendarDays(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number)
  const [y2, m2, d2] = toIso.split('-').map(Number)
  const t1 = Date.UTC(y1, m1 - 1, d1)
  const t2 = Date.UTC(y2, m2 - 1, d2)
  return Math.round((t2 - t1) / 86400000)
}

function mapRawDays(rawDays: any[], gregorianToday: string): HijriDayItem[] {
  return rawDays.map((item) => {
    const dayNum = Number(String(item.hijri || '').split('-')[2]) || 0
    const weekday = item.weekday || ''
    return {
      gregorian: item.gregorian,
      gregorianShort: formatGregorianShort(item.gregorian),
      hijri: item.hijri,
      day: dayNum,
      weekday,
      weekdayShort: WEEKDAY_SHORT[weekday] || String(weekday).slice(0, 3),
      weekdayIndex: WEEKDAY_INDEX[weekday] ?? 0,
      isToday: item.gregorian === gregorianToday,
      isPast: item.gregorian < gregorianToday,
      isAyyamulBidh: dayNum >= 13 && dayNum <= 15,
    }
  })
}

function normalizeHijriData(raw: any): HijriHeroData | null {
  const today = raw?.today
  if (!today?.day || !today?.monthName || !today?.year) return null

  const gregorianToday: string = today.gregorian || new Date().toLocaleDateString('en-CA')
  const rawDays: any[] = Array.isArray(raw?.days) ? raw.days : []
  const mappedDays = mapRawDays(rawDays, gregorianToday)

  // Extract a 7-day window centered around today inside the month
  const todayIdx = mappedDays.findIndex((d) => d.isToday)
  let weekStrip: HijriDayItem[] = []
  if (mappedDays.length > 0) {
    const startIdx = Math.max(0, Math.min(mappedDays.length - 7, (todayIdx === -1 ? 0 : todayIdx) - 3))
    weekStrip = mappedDays.slice(startIdx, startIdx + 7)
  }

  // Map all Islamic events from MABIMS
  const rawEvents: any[] = Array.isArray(raw?.events) ? raw.events : []
  const events: HijriEvent[] = rawEvents
    .filter((ev) => ev?.gregorian)
    .sort((a, b) => a.gregorian.localeCompare(b.gregorian))
    .map((ev) => {
      const diff = diffCalendarDays(gregorianToday, ev.gregorian)
      return {
        event: ev.event,
        name: ev.name,
        hijri: ev.hijri,
        gregorian: ev.gregorian,
        gregorianLabel: formatGregorianId(ev.gregorian),
        daysLeft: Math.max(0, diff),
        isPast: diff < 0,
      }
    })

  const nextEvent = events.find((ev) => !ev.isPast) || null

  return {
    source: raw?.source || 'mabims',
    formattedDate: `${today.day} ${today.monthName} ${today.year} H`,
    today: {
      gregorian: gregorianToday,
      gregorianLabel: formatGregorianId(gregorianToday),
      hijri: today.hijri,
      day: today.day,
      month: today.month,
      monthName: today.monthName,
      year: today.year,
      weekday: today.weekday || '',
    },
    monthCount: raw?.monthCount || mappedDays.length || 30,
    days: mappedDays,
    weekStrip,
    events,
    nextEvent,
  }
}

export async function fetchHijriHeroData(): Promise<HijriHeroData | null> {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA')
    const cacheKey = `mizany_mabims_hijri_${todayStr}`

    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed = normalizeHijriData(JSON.parse(cached))
        if (parsed) return parsed
      }
    } catch {}

    const res = await fetch('/api/hijri')
    if (!res.ok) throw new Error('Failed to fetch /api/hijri')

    const json = await res.json()
    try {
      localStorage.setItem(cacheKey, JSON.stringify(json))
    } catch {}

    return normalizeHijriData(json)
  } catch (err) {
    console.error('Hijri fetch error:', err)
    return null
  }
}

export async function fetchHijriMonth(
  year: number,
  month: number,
  gregorianToday: string
): Promise<{ count: number; days: HijriDayItem[] } | null> {
  try {
    const cacheKey = `mizany_mabims_month_${year}_${month}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed?.days)) {
          return {
            count: parsed.count || parsed.days.length,
            days: mapRawDays(parsed.days, gregorianToday),
          }
        }
      }
    } catch {}

    const res = await fetch(`/api/hijri/month?year=${year}&month=${month}`)
    if (!res.ok) throw new Error('Failed to fetch /api/hijri/month')

    const json: any = await res.json()
    const rawDays = Array.isArray(json?.days) ? json.days : []
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ count: json?.count || rawDays.length, days: rawDays }))
    } catch {}

    return {
      count: json?.count || rawDays.length,
      days: mapRawDays(rawDays, gregorianToday),
    }
  } catch (err) {
    console.error('Hijri month fetch error:', err)
    return null
  }
}

export const GREGORIAN_MONTH_NAMES_ID: Record<number, string> = {
  1: 'Januari',
  2: 'Februari',
  3: 'Maret',
  4: 'April',
  5: 'Mei',
  6: 'Juni',
  7: 'Juli',
  8: 'Agustus',
  9: 'September',
  10: 'Oktober',
  11: 'November',
  12: 'Desember',
}

export const GREGORIAN_MONTH_SHORT_ID: Record<number, string> = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'Mei',
  6: 'Jun',
  7: 'Jul',
  8: 'Agu',
  9: 'Sep',
  10: 'Okt',
  11: 'Nov',
  12: 'Des',
}

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

export function toArabicIndic(value: number | string): string {
  return String(value).replace(/\d/g, (d) => ARABIC_INDIC_DIGITS[Number(d)] || d)
}

const PASARAN_CYCLE = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'] as const
const WEEKDAY_NAMES_ID = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const

/**
 * Computes exact Javanese Pasaran (Legi, Pahing, Pon, Wage, Kliwon) for any ISO date.
 * Anchored to verified reference date 2026-11-24 = Selasa Kliwon (index 4).
 */
export function getJavanesePasaran(isoDate: string): string {
  const diff = diffCalendarDays('2026-11-24', isoDate)
  const idx = (((4 + diff) % 5) + 5) % 5
  return PASARAN_CYCLE[idx]
}

export function getWeekdayNameId(isoDate: string): { name: string; index: number } {
  const [y, m, d] = isoDate.split('-').map(Number)
  const idx = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return { name: WEEKDAY_NAMES_ID[idx] || 'Ahad', index: idx }
}

export interface GregorianCalendarDay {
  gregorian: string
  gregorianDay: number
  gregorianMonth: number
  gregorianYear: number
  gregorianFullLabel: string
  hijri: string
  hijriDay: number
  hijriDayArabic: string
  hijriMonth: number
  hijriMonthName: string
  hijriYear: number
  hijriFullLabel: string
  weekday: string
  weekdayIndex: number // 0=Ahad .. 6=Sabtu
  pasaran: string
  isToday: boolean
  isSunnahFasting: boolean
  fastingLabels: string[]
  isRamadan: boolean
  isLailatulQadr: boolean
}

export interface GregorianCalendarMonth {
  year: number
  month: number
  monthTitle: string
  hijriRangeLabel: string
  daysInMonth: number
  firstWeekdayIndex: number // 0=Ahad .. 6=Sabtu
  days: GregorianCalendarDay[]
  events: HijriEvent[]
}

/**
 * Evaluates Sunnah fasting eligibility per Islamic fiqh:
 * - Excludes Haram fasting days: 1 Syawal (Idul Fitri), 10 Dzulhijjah (Idul Adha), 11-13 Dzulhijjah (Tasyrik).
 * - During Ramadan (month 9), fasting is Wajib Ramadan rather than Sunnah Senin/Kamis/Ayyamul Bidh.
 */
function evaluateFastingLabels(
  weekdayIndex: number,
  hijriMonth: number,
  hijriDay: number
): { isSunnah: boolean; labels: string[] } {
  // Hari haram berpuasa
  if (hijriMonth === 10 && hijriDay === 1) return { isSunnah: false, labels: [] }
  if (hijriMonth === 12 && hijriDay >= 10 && hijriDay <= 13) return { isSunnah: false, labels: [] }

  // Bulan Ramadan: puasa wajib (bukan titik puasa sunnah harian)
  if (hijriMonth === 9) return { isSunnah: false, labels: ['Puasa Wajib Ramadan'] }

  const labels: string[] = []
  if (hijriMonth === 12 && hijriDay === 9) {
    labels.push('Puasa Arafah')
  }
  if (hijriMonth === 1 && hijriDay === 9) {
    labels.push("Puasa Tasu'a")
  }
  if (hijriMonth === 1 && hijriDay === 10) {
    labels.push('Puasa Asyura')
  }
  if (hijriDay >= 13 && hijriDay <= 15) {
    labels.push('Puasa Ayyamul Bidh')
  }
  if (weekdayIndex === 1) {
    labels.push('Puasa Senin')
  } else if (weekdayIndex === 4) {
    labels.push('Puasa Kamis')
  }

  return { isSunnah: labels.length > 0, labels }
}

function buildHijriRangeLabel(pairs: Array<{ year: number; month: number }>): string {
  if (pairs.length === 0) return ''
  const first = pairs[0]
  const last = pairs[pairs.length - 1]
  const firstName = HIJRI_MONTH_NAMES[first.month] || `Bulan ${first.month}`
  const lastName = HIJRI_MONTH_NAMES[last.month] || `Bulan ${last.month}`

  if (first.year === last.year && first.month === last.month) {
    return `${firstName} ${first.year} H`
  }
  if (first.year === last.year) {
    return `${firstName} – ${lastName} ${first.year} H`
  }
  return `${firstName} ${first.year} – ${lastName} ${last.year} H`
}

function normalizeGregorianMonth(raw: any, gregorianToday: string): GregorianCalendarMonth | null {
  const year = Number(raw?.year)
  const month = Number(raw?.month)
  const rawDays: any[] = Array.isArray(raw?.days) ? raw.days : []
  if (!year || !month || rawDays.length === 0) return null

  const days: GregorianCalendarDay[] = rawDays.map((item) => {
    const [gy, gm, gd] = String(item.gregorian || '').split('-').map(Number)
    const [hy, hm, hd] = String(item.hijri || '').split('-').map(Number)
    const wd = getWeekdayNameId(item.gregorian)
    const pasaran = getJavanesePasaran(item.gregorian)
    const hijriMonthName = HIJRI_MONTH_NAMES[hm] || `Bulan ${hm}`
    const gregMonthName = GREGORIAN_MONTH_NAMES_ID[gm] || ''
    const fasting = evaluateFastingLabels(wd.index, hm, hd)

    return {
      gregorian: item.gregorian,
      gregorianDay: gd,
      gregorianMonth: gm,
      gregorianYear: gy,
      gregorianFullLabel: `${gd} ${gregMonthName} ${gy}`,
      hijri: item.hijri,
      hijriDay: hd,
      hijriDayArabic: toArabicIndic(hd),
      hijriMonth: hm,
      hijriMonthName,
      hijriYear: hy,
      hijriFullLabel: `${hd} ${hijriMonthName} ${hy} H`,
      weekday: wd.name,
      weekdayIndex: wd.index,
      pasaran,
      isToday: item.gregorian === gregorianToday,
      isSunnahFasting: fasting.isSunnah,
      fastingLabels: fasting.labels,
      isRamadan: hm === 9,
      isLailatulQadr: hm === 9 && hd >= 21 && hd % 2 !== 0,
    }
  })

  const rawEvents: any[] = Array.isArray(raw?.events) ? raw.events : []
  const seenEvents = new Set<string>()
  const events: HijriEvent[] = []
  for (const ev of rawEvents) {
    if (!ev?.gregorian) continue
    const key = `${ev.event}-${ev.gregorian}`
    if (seenEvents.has(key)) continue
    seenEvents.add(key)
    const diff = diffCalendarDays(gregorianToday, ev.gregorian)
    events.push({
      event: ev.event,
      name: ev.name,
      hijri: ev.hijri,
      gregorian: ev.gregorian,
      gregorianLabel: formatGregorianId(ev.gregorian),
      daysLeft: Math.max(0, diff),
      isPast: diff < 0,
    })
  }
  events.sort((a, b) => a.gregorian.localeCompare(b.gregorian))

  const pairs: Array<{ year: number; month: number }> = Array.isArray(raw?.hijriMonths)
    ? raw.hijriMonths
    : []

  return {
    year,
    month,
    monthTitle: `${GREGORIAN_MONTH_NAMES_ID[month] || month} ${year}`,
    hijriRangeLabel: buildHijriRangeLabel(pairs),
    daysInMonth: raw?.daysInMonth || days.length,
    firstWeekdayIndex: days[0]?.weekdayIndex ?? 0,
    days,
    events,
  }
}

export async function fetchGregorianCalendarMonth(
  year: number,
  month: number,
  gregorianToday: string
): Promise<GregorianCalendarMonth | null> {
  try {
    const cacheKey = `mizany_mabims_greg_v1_${year}_${month}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed = normalizeGregorianMonth(JSON.parse(cached), gregorianToday)
        if (parsed) return parsed
      }
    } catch {}

    const res = await fetch(`/api/hijri/gregorian-month?year=${year}&month=${month}`)
    if (!res.ok) throw new Error('Failed to fetch /api/hijri/gregorian-month')

    const json = await res.json()
    try {
      localStorage.setItem(cacheKey, JSON.stringify(json))
    } catch {}

    return normalizeGregorianMonth(json, gregorianToday)
  } catch (err) {
    console.error('Gregorian calendar fetch error:', err)
    return null
  }
}
