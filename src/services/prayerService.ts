export interface PrayerTimingsRaw {
  imsak: string
  subuh: string
  terbit: string
  dhuha: string
  dzuhur: string
  ashar: string
  maghrib: string
  isya: string
}

export interface PrayerSchedule {
  source: string
  city: string
  lokasi?: string
  daerah?: string
  gregorianDate: string
  timings: PrayerTimingsRaw
  prayers: {
    id: string
    name: string
    time: string
    isNext?: boolean
    isPassed?: boolean
  }[]
  nextPrayer: {
    id: string
    name: string
    time: string
    remaining: string
    remainingLabel: string
  }
}

interface CachedPrayerData {
  source: string
  city: string
  lokasi?: string
  daerah?: string
  gregorianDate: string
  timings: PrayerTimingsRaw
}

const memoryCache = new Map<string, CachedPrayerData>()

export async function fetchPrayerTimes(city: string): Promise<PrayerSchedule | null> {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local date
    const cacheKey = `mizany_kemenag_prayer_${city}_${todayStr}`

    // 1. Check in-memory cache first (zero-overhead for 1-second countdown ticks)
    const inMem = memoryCache.get(cacheKey)
    if (inMem) {
      return calculateNextPrayer(inMem)
    }

    // 2. Check localStorage cache
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed: CachedPrayerData = JSON.parse(cached)
        if (parsed?.timings?.subuh) {
          memoryCache.set(cacheKey, parsed)
          return calculateNextPrayer(parsed)
        }
      }
    } catch {}

    // 3. Fetch from Hono edge API (Bimas Islam Kemenag RI via MyQuran)
    const res = await fetch(`/api/prayer-times?city=${encodeURIComponent(city)}`)
    if (!res.ok) throw new Error('Failed to fetch prayer times')

    const json: any = await res.json()
    const j = json?.jadwal
    if (!j?.subuh) return null

    const gregorianStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    const rawSchedule: CachedPrayerData = {
      source: json.source || 'myquran-kemenag',
      city,
      lokasi: json.lokasi,
      daerah: json.daerah,
      gregorianDate: gregorianStr,
      timings: {
        imsak: String(j.imsak || '04:28').slice(0, 5),
        subuh: String(j.subuh || '04:38').slice(0, 5),
        terbit: String(j.terbit || '05:53').slice(0, 5),
        dhuha: String(j.dhuha || '06:20').slice(0, 5),
        dzuhur: String(j.dzuhur || '12:05').slice(0, 5),
        ashar: String(j.ashar || '15:19').slice(0, 5),
        maghrib: String(j.maghrib || '18:07').slice(0, 5),
        isya: String(j.isya || '19:19').slice(0, 5),
      },
    }

    memoryCache.set(cacheKey, rawSchedule)
    try {
      localStorage.setItem(cacheKey, JSON.stringify(rawSchedule))
    } catch {}

    return calculateNextPrayer(rawSchedule)
  } catch (err) {
    console.error('Prayer fetch error:', err)
    return null
  }
}

function calculateNextPrayer(data: CachedPrayerData): PrayerSchedule {
  const now = new Date()
  const currentTotalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()

  const list = [
    { id: 'subuh', name: 'Subuh', time: data.timings.subuh },
    { id: 'terbit', name: 'Terbit', time: data.timings.terbit },
    { id: 'dzuhur', name: 'Dzuhur', time: data.timings.dzuhur },
    { id: 'ashar', name: 'Ashar', time: data.timings.ashar },
    { id: 'maghrib', name: 'Maghrib', time: data.timings.maghrib },
    { id: 'isya', name: 'Isya', time: data.timings.isya },
  ]

  let nextIdx = list.findIndex((p) => {
    const [h, m] = p.time.split(':').map(Number)
    return h * 3600 + m * 60 > currentTotalSeconds
  })

  const isTomorrow = nextIdx === -1
  if (isTomorrow) {
    nextIdx = 0
  }

  const nextP = list[nextIdx]
  const [nh, nm] = nextP.time.split(':').map(Number)
  let diffSeconds = nh * 3600 + nm * 60 - currentTotalSeconds
  if (diffSeconds <= 0) diffSeconds += 24 * 3600

  const remHours = Math.floor(diffSeconds / 3600)
  const remMins = Math.floor((diffSeconds % 3600) / 60)
  const remSecs = diffSeconds % 60
  const remainingStr = `${String(remHours).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`
  const remainingLabel =
    remHours > 0
      ? `Kurang lebih ${remHours} jam ${remMins} menit lagi`
      : `Kurang lebih ${remMins} menit lagi`

  const prayers = list.map((p, idx) => ({
    ...p,
    isNext: idx === nextIdx,
    isPassed: isTomorrow ? true : idx < nextIdx,
  }))

  return {
    source: data.source,
    city: data.city,
    lokasi: data.lokasi,
    daerah: data.daerah,
    gregorianDate: data.gregorianDate,
    timings: data.timings,
    prayers,
    nextPrayer: {
      id: nextP.id,
      name: nextP.name,
      time: nextP.time,
      remaining: remainingStr,
      remainingLabel,
    },
  }
}
