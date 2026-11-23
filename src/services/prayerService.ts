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
  timeZone: string
  tzLabel: 'WIB' | 'WITA' | 'WIT'
  gregorianDate: string
  currentTime: string
  arcProgress: number // exact 0..1 elapsed fraction from currentPrayer -> nextPrayer
  timings: PrayerTimingsRaw
  currentPrayer: {
    id: string
    name: string
    time: string
  }
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

export interface CachedPrayerData {
  source: string
  city: string
  lokasi?: string
  daerah?: string
  timeZone: string
  tzLabel: 'WIB' | 'WITA' | 'WIT'
  dateIso: string
  gregorianDate: string
  timings: PrayerTimingsRaw
}

const DAY_SECONDS = 86400
const memoryCache = new Map<string, CachedPrayerData>()
const inFlightRequests = new Map<string, Promise<CachedPrayerData | null>>()

function resolveTimezoneMeta(
  daerah?: string,
  city?: string
): { timeZone: string; tzLabel: 'WIB' | 'WITA' | 'WIT' } {
  const text = `${daerah || ''} ${city || ''}`.toUpperCase()
  if (/PAPUA|MALUKU|JAYAPURA|AMBON|SORONG|TERNATE/.test(text)) {
    return { timeZone: 'Asia/Jayapura', tzLabel: 'WIT' }
  }
  if (
    /BALI|DENPASAR|NUSA TENGGARA|MATARAM|KUPANG|SULAWESI|MAKASSAR|MANADO|PALU|KENDARI|GORONTALO|BALIKPAPAN|SAMARINDA|BANJARMASIN|KALIMANTAN SELATAN|KALIMANTAN TIMUR|KALIMANTAN UTARA/.test(
      text
    )
  ) {
    return { timeZone: 'Asia/Makassar', tzLabel: 'WITA' }
  }
  return { timeZone: 'Asia/Jakarta', tzLabel: 'WIB' }
}

function getClockInTimezone(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '00'
  const year = get('year')
  const month = get('month')
  const day = get('day')
  // Some locales/engines emit "24" at midnight with hour12: false; normalize to 0
  const hour = Number(get('hour')) % 24
  const minute = Number(get('minute'))
  const second = Number(get('second'))

  return {
    dateIso: `${year}-${month}-${day}`,
    hour,
    minute,
    second,
    totalSeconds: hour * 3600 + minute * 60 + second,
    hhmm: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  }
}

export function getDateIsoInTimezone(now: Date, timeZone: string): string {
  return getClockInTimezone(now, timeZone).dateIso
}

export function toSeconds(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 3600 + (m || 0) * 60
}

/**
 * Pure algorithm computing current prayer, next obligatory prayer, countdown,
 * and exact elapsed arc progress (0..1) from previous obligatory prayer to next.
 *
 * Cycle: Subuh -> Dzuhur -> Ashar -> Maghrib -> Isya -> Subuh (besok).
 * Terbit is kept informational in `prayers` list but never treated as a prayer target.
 */
export function computePrayerSchedule(
  data: CachedPrayerData,
  now: Date = new Date()
): PrayerSchedule {
  const clock = getClockInTimezone(now, data.timeZone)
  const currentSec = clock.totalSeconds

  const obligatoryPrayers = [
    { id: 'subuh', name: 'Subuh', time: data.timings.subuh },
    { id: 'dzuhur', name: 'Dzuhur', time: data.timings.dzuhur },
    { id: 'ashar', name: 'Ashar', time: data.timings.ashar },
    { id: 'maghrib', name: 'Maghrib', time: data.timings.maghrib },
    { id: 'isya', name: 'Isya', time: data.timings.isya },
  ]

  // Find the next obligatory prayer strictly after currentSec
  let nextIdx = obligatoryPrayers.findIndex((p) => toSeconds(p.time) > currentSec)
  const isAfterIsya = nextIdx === -1
  if (isAfterIsya) {
    nextIdx = 0 // Subuh tomorrow
  }

  const prevIdx = nextIdx === 0 ? obligatoryPrayers.length - 1 : nextIdx - 1
  const prevPrayer = obligatoryPrayers[prevIdx]
  const nextPrayer = obligatoryPrayers[nextIdx]

  const prevBaseSec = toSeconds(prevPrayer.time)
  const nextBaseSec = toSeconds(nextPrayer.time)

  let prevSec: number
  let nextSec: number

  if (isAfterIsya) {
    // Between Isya today (e.g. 19:10) and 23:59:59 -> next is Subuh tomorrow (+24h)
    prevSec = prevBaseSec
    nextSec = nextBaseSec + DAY_SECONDS
  } else if (nextIdx === 0) {
    // Between 00:00:00 and Subuh today (e.g. 04:06) -> previous was Isya yesterday (-24h)
    prevSec = prevBaseSec - DAY_SECONDS
    nextSec = nextBaseSec
  } else {
    // Daytime/evening between two prayers on the same day
    prevSec = prevBaseSec
    nextSec = nextBaseSec
  }

  const intervalDuration = Math.max(1, nextSec - prevSec)
  const elapsedSeconds = Math.max(0, currentSec - prevSec)
  const remainingSeconds = Math.max(0, nextSec - currentSec)
  const arcProgress = Math.max(0, Math.min(1, elapsedSeconds / intervalDuration))

  const remHours = Math.floor(remainingSeconds / 3600)
  const remMins = Math.floor((remainingSeconds % 3600) / 60)
  const remSecs = remainingSeconds % 60
  const remainingStr = `${String(remHours).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`
  const remainingLabel =
    remHours > 0
      ? `Kurang lebih ${remHours} jam ${remMins} menit lagi`
      : remMins > 0
      ? `Kurang lebih ${remMins} menit lagi`
      : 'Kurang dari 1 menit lagi'

  // Display list for PrayerRow (includes Terbit as informational, never marked isNext)
  const displayList = [
    { id: 'subuh', name: 'Subuh', time: data.timings.subuh },
    { id: 'terbit', name: 'Terbit', time: data.timings.terbit },
    { id: 'dzuhur', name: 'Dzuhur', time: data.timings.dzuhur },
    { id: 'ashar', name: 'Ashar', time: data.timings.ashar },
    { id: 'maghrib', name: 'Maghrib', time: data.timings.maghrib },
    { id: 'isya', name: 'Isya', time: data.timings.isya },
  ]

  const prayers = displayList.map((p) => {
    const isNext = p.id === nextPrayer.id
    const isPassed = !isNext && toSeconds(p.time) <= currentSec
    return {
      ...p,
      isNext,
      isPassed,
    }
  })

  return {
    source: data.source,
    city: data.city,
    lokasi: data.lokasi,
    daerah: data.daerah,
    timeZone: data.timeZone,
    tzLabel: data.tzLabel,
    gregorianDate: data.gregorianDate,
    currentTime: clock.hhmm,
    arcProgress,
    timings: data.timings,
    currentPrayer: {
      id: prevPrayer.id,
      name: prevPrayer.name,
      time: prevPrayer.time,
    },
    prayers,
    nextPrayer: {
      id: nextPrayer.id,
      name: nextPrayer.name,
      time: nextPrayer.time,
      remaining: remainingStr,
      remainingLabel,
    },
  }
}

export async function loadCityPrayerData(city: string): Promise<CachedPrayerData | null> {
  const tzGuess = resolveTimezoneMeta(undefined, city)
  const todayIso = getClockInTimezone(new Date(), tzGuess.timeZone).dateIso
  const cacheKey = `mizany_kemenag_prayer_v2_${city}_${todayIso}`

  const inMem = memoryCache.get(cacheKey)
  if (inMem) return inMem

  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const parsed: CachedPrayerData = JSON.parse(cached)
      if (parsed?.timings?.subuh && parsed?.timings?.isya && parsed?.timeZone) {
        memoryCache.set(cacheKey, parsed)
        return parsed
      }
    }
  } catch {}

  const existingPromise = inFlightRequests.get(cacheKey)
  if (existingPromise) return existingPromise

  const promise = (async (): Promise<CachedPrayerData | null> => {
    try {
      const res = await fetch(`/api/prayer-times?city=${encodeURIComponent(city)}`)
      if (!res.ok) throw new Error('Failed to fetch prayer times')

      const json: any = await res.json()
      const j = json?.jadwal
      if (!j?.subuh || !j?.isya) return null

      const tzMeta =
        json.timeZone && json.tzLabel
          ? { timeZone: json.timeZone as string, tzLabel: json.tzLabel as 'WIB' | 'WITA' | 'WIT' }
          : resolveTimezoneMeta(json.daerah, city)

      const dateIso: string = json.date || getClockInTimezone(new Date(), tzMeta.timeZone).dateIso
      const [y, m, d] = dateIso.split('-').map(Number)
      const gregorianDate =
        y && m && d
          ? new Date(y, m - 1, d).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })

      const rawSchedule: CachedPrayerData = {
        source: json.source || 'myquran-kemenag',
        city,
        lokasi: json.lokasi,
        daerah: json.daerah,
        timeZone: tzMeta.timeZone,
        tzLabel: tzMeta.tzLabel,
        dateIso,
        gregorianDate,
        timings: {
          imsak: String(j.imsak || '').slice(0, 5),
          subuh: String(j.subuh || '').slice(0, 5),
          terbit: String(j.terbit || '').slice(0, 5),
          dhuha: String(j.dhuha || '').slice(0, 5),
          dzuhur: String(j.dzuhur || '').slice(0, 5),
          ashar: String(j.ashar || '').slice(0, 5),
          maghrib: String(j.maghrib || '').slice(0, 5),
          isya: String(j.isya || '').slice(0, 5),
        },
      }

      const finalKey = `mizany_kemenag_prayer_v2_${city}_${dateIso}`
      memoryCache.set(cacheKey, rawSchedule)
      memoryCache.set(finalKey, rawSchedule)
      try {
        localStorage.setItem(finalKey, JSON.stringify(rawSchedule))
      } catch {}

      return rawSchedule
    } catch (err) {
      console.error('Prayer fetch error:', err)
      return null
    } finally {
      inFlightRequests.delete(cacheKey)
    }
  })()

  inFlightRequests.set(cacheKey, promise)
  return promise
}

export async function fetchPrayerTimes(city: string): Promise<PrayerSchedule | null> {
  const data = await loadCityPrayerData(city)
  if (!data) return null
  return computePrayerSchedule(data)
}

export interface IndonesianCityOption {
  id: string
  lokasi: string
  label: string
}

const CITIES_STORAGE_KEY = 'mizany_kemenag_cities_v1'
let cachedCityList: IndonesianCityOption[] | null = null

export async function fetchAllIndonesianCities(): Promise<IndonesianCityOption[]> {
  if (cachedCityList && cachedCityList.length > 0) return cachedCityList

  try {
    const raw = localStorage.getItem(CITIES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 100) {
        cachedCityList = parsed
        return parsed
      }
    }
  } catch {}

  try {
    const res = await fetch('/api/cities')
    if (!res.ok) return []
    const json: any = await res.json()
    const list: IndonesianCityOption[] = Array.isArray(json?.cities) ? json.cities : []
    if (list.length > 0) {
      cachedCityList = list
      try {
        localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(list))
      } catch {}
    }
    return list
  } catch {
    return []
  }
}

export interface DetectedCityResult {
  city: string
  lokasi: string
  cityId: string
  detectedPlace?: string
}

export function detectCityFromDeviceGeolocation(): Promise<DetectedCityResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('Browser tidak mendukung deteksi lokasi perangkat.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `/api/locate-city?lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(
              String(longitude)
            )}`
          )
          const json: any = await res.json().catch(() => ({}))
          if (!res.ok || !json?.city) {
            reject(new Error(json?.error || 'Gagal mencocokkan kota dari lokasi perangkat.'))
            return
          }
          resolve({
            city: json.city,
            lokasi: json.lokasi,
            cityId: String(json.cityId || ''),
            detectedPlace: json.detectedPlace,
          })
        } catch {
          reject(new Error('Gagal terhubung ke server untuk menentukan kota.'))
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Izin lokasi ditolak. Aktifkan izin lokasi di browser atau pilih kota manual.'))
        } else if (err.code === err.TIMEOUT) {
          reject(new Error('Waktu tunggu GPS habis. Coba lagi atau pilih kota manual.'))
        } else {
          reject(new Error('Lokasi perangkat tidak tersedia saat ini.'))
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    )
  })
}
