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
