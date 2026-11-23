export interface HijriDayItem {
  gregorian: string
  hijri: string
  day: number
  weekday: string
  weekdayShort: string
  isToday: boolean
  isAyyamulBidh: boolean
}

export interface HijriEvent {
  event: string
  name: string
  hijri: string
  gregorian: string
  gregorianLabel: string
  daysLeft: number
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
  weekStrip: HijriDayItem[]
  nextEvent: HijriEvent | null
}

const WEEKDAY_SHORT: Record<string, string> = {
  Ahad: 'Ahd',
  Minggu: 'Min',
  Senin: 'Sen',
  Selasa: 'Sel',
  Rabu: 'Rab',
  Kamis: 'Kam',
  Jumat: 'Jum',
  Sabtu: 'Sab',
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

function diffCalendarDays(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number)
  const [y2, m2, d2] = toIso.split('-').map(Number)
  const t1 = Date.UTC(y1, m1 - 1, d1)
  const t2 = Date.UTC(y2, m2 - 1, d2)
  return Math.round((t2 - t1) / 86400000)
}

function normalizeHijriData(raw: any): HijriHeroData | null {
  const today = raw?.today
  if (!today?.day || !today?.monthName || !today?.year) return null

  const gregorianToday: string = today.gregorian || new Date().toISOString().split('T')[0]
  const rawDays: any[] = Array.isArray(raw?.days) ? raw.days : []

  const mappedDays: HijriDayItem[] = rawDays.map((item) => {
    const dayNum = Number(String(item.hijri || '').split('-')[2]) || 0
    return {
      gregorian: item.gregorian,
      hijri: item.hijri,
      day: dayNum,
      weekday: item.weekday || '',
      weekdayShort: WEEKDAY_SHORT[item.weekday] || String(item.weekday || '').slice(0, 3),
      isToday: dayNum === today.day,
      isAyyamulBidh: dayNum >= 13 && dayNum <= 15,
    }
  })

  // Extract a 7-day window centered around today inside the month
  const todayIdx = mappedDays.findIndex((d) => d.isToday)
  let weekStrip: HijriDayItem[] = []
  if (mappedDays.length > 0) {
    const startIdx = Math.max(0, Math.min(mappedDays.length - 7, (todayIdx === -1 ? 0 : todayIdx) - 3))
    weekStrip = mappedDays.slice(startIdx, startIdx + 7)
  }

  // Find nearest upcoming Islamic event
  const rawEvents: any[] = Array.isArray(raw?.events) ? raw.events : []
  const upcoming = rawEvents
    .filter((ev) => ev?.gregorian && ev.gregorian >= gregorianToday)
    .sort((a, b) => a.gregorian.localeCompare(b.gregorian))

  const nextRaw = upcoming[0]
  const nextEvent: HijriEvent | null = nextRaw
    ? {
        event: nextRaw.event,
        name: nextRaw.name,
        hijri: nextRaw.hijri,
        gregorian: nextRaw.gregorian,
        gregorianLabel: formatGregorianId(nextRaw.gregorian),
        daysLeft: Math.max(0, diffCalendarDays(gregorianToday, nextRaw.gregorian)),
      }
    : null

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
    weekStrip,
    nextEvent,
  }
}

export async function fetchHijriHeroData(): Promise<HijriHeroData | null> {
  try {
    const todayStr = new Date().toISOString().split('T')[0]
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
