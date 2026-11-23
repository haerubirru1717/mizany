import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    name: 'mizany-api',
    timestamp: new Date().toISOString()
  })
})

type KemenagCity = { id: string; lokasi: string }

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatIndonesianCityLabel(lokasi: string): string {
  return lokasi
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (word === 'kab.' || word === 'kab') return 'Kab.'
      if (word === 'dki') return 'DKI'
      if (word === 'di') return 'DI'
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

function normalizeCityQuery(query: string): string {
  let norm = query
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/^KABUPATEN\s+/, 'KAB. ')
    .replace(/^KAB\s+/, 'KAB. ')
    .replace(/^KOTA\s+ADMINISTRASI\s+/, 'KOTA ')
    .replace(/^DAERAH\s+KHUSUS\s+IBUKOTA\s+/, '')
    .replace(/^DAERAH\s+ISTIMEWA\s+/, '')

  if (/JAKARTA/i.test(norm) && !/SERIBU/i.test(norm)) {
    norm = 'KOTA JAKARTA'
  }
  return norm
}

// Helper untuk mencocokkan nama kota Indonesia paling akurat dari hasil MyQuran Kemenag
function pickBestIndonesianCity(items: KemenagCity[], query: string): KemenagCity | undefined {
  const norm = normalizeCityQuery(query)
  const withoutPrefix = norm.replace(/^(KOTA|KAB\.?)\s+/, '')
  const wordRegex = new RegExp(`\\b${escapeRegex(withoutPrefix)}\\b`)
  const wantsKab = norm.startsWith('KAB.')

  if (wantsKab) {
    return (
      items.find((it) => it.lokasi === norm) ||
      items.find((it) => it.lokasi === `KAB. ${withoutPrefix}`) ||
      items.find((it) => wordRegex.test(it.lokasi) && it.lokasi.startsWith('KAB. ')) ||
      items.find((it) => wordRegex.test(it.lokasi))
    )
  }

  return (
    items.find((it) => it.lokasi === norm) ||
    items.find((it) => it.lokasi === `KOTA ${withoutPrefix}`) ||
    items.find((it) => it.lokasi === `KAB. ${withoutPrefix}`) ||
    items.find((it) => wordRegex.test(it.lokasi) && it.lokasi.startsWith('KOTA ')) ||
    items.find((it) => wordRegex.test(it.lokasi))
  )
}

async function fetchAllKemenagCities(): Promise<KemenagCity[]> {
  const res = await fetch('https://api.myquran.com/v2/sholat/kota/semua')
  if (!res.ok) return []
  const json: any = await res.json()
  return Array.isArray(json?.data) ? json.data : []
}

function resolveIndonesianTimezone(daerah?: string): { timeZone: string; tzLabel: 'WIB' | 'WITA' | 'WIT' } {
  const p = String(daerah || '').toUpperCase()
  if (/PAPUA|MALUKU/.test(p)) {
    return { timeZone: 'Asia/Jayapura', tzLabel: 'WIT' }
  }
  if (/BALI|NUSA TENGGARA|SULAWESI|GORONTALO|KALIMANTAN SELATAN|KALIMANTAN TIMUR|KALIMANTAN UTARA/.test(p)) {
    return { timeZone: 'Asia/Makassar', tzLabel: 'WITA' }
  }
  return { timeZone: 'Asia/Jakarta', tzLabel: 'WIB' }
}

function getDatePartsInZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const year = parts.find((p) => p.type === 'year')?.value || '2026'
  const month = parts.find((p) => p.type === 'month')?.value || '11'
  const day = parts.find((p) => p.type === 'day')?.value || '23'
  return { year, month, day, iso: `${year}-${month}-${day}` }
}

// Endpoint daftar seluruh Kab/Kota Indonesia resmi Kemenag RI (518 wilayah)
app.get('/cities', async (c) => {
  try {
    const cities = await fetchAllKemenagCities()
    if (cities.length === 0) {
      return c.json({ error: 'Gagal memuat daftar kota Kemenag RI' }, 502)
    }
    const formatted = cities.map((it) => ({
      id: it.id,
      lokasi: it.lokasi,
      label: formatIndonesianCityLabel(it.lokasi),
    }))
    c.header('Cache-Control', 'public, max-age=86400')
    return c.json({ count: formatted.length, cities: formatted })
  } catch (err: any) {
    return c.json({ error: err.message || 'Server error' }, 500)
  }
})

// Endpoint deteksi otomatis Kab/Kota Kemenag RI berdasarkan koordinat GPS perangkat
app.get('/locate-city', async (c) => {
  const lat = Number(c.req.query('lat'))
  const lon = Number(c.req.query('lon'))
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return c.json({ error: 'Koordinat lokasi tidak valid' }, 400)
  }

  try {
    const placeCandidates: string[] = []
    let countryCode = ''

    // Primary: OpenStreetMap Nominatim (paling akurat membedakan Kota vs Kabupaten di Indonesia)
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
          String(lat)
        )}&lon=${encodeURIComponent(String(lon))}&accept-language=id`,
        {
          headers: {
            'User-Agent': 'MizanyApp/1.0 (+https://mizany.pages.dev)',
            Accept: 'application/json',
          },
        }
      )
      if (nomRes.ok) {
        const nomJson: any = await nomRes.json()
        const addr = nomJson?.address || {}
        countryCode = String(addr.country_code || '').toLowerCase()
        const ordered = [
          addr.county,
          addr.city,
          addr.regency,
          addr.municipality,
          addr.town,
          addr.city_district,
          addr.state_district,
          addr.state,
        ]
        for (const item of ordered) {
          if (typeof item === 'string' && item.trim()) {
            placeCandidates.push(item.trim())
          }
        }
      }
    } catch {
      // Lanjut ke fallback BigDataCloud
    }

    // Fallback: BigDataCloud free client reverse geocoder
    if (placeCandidates.length === 0) {
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
          String(lat)
        )}&longitude=${encodeURIComponent(String(lon))}&localityLanguage=id`
      )
      if (bdcRes.ok) {
        const bdcJson: any = await bdcRes.json()
        countryCode = String(bdcJson?.countryCode || '').toLowerCase()
        const adminList: Array<{ name?: string; adminLevel?: number }> = Array.isArray(
          bdcJson?.localityInfo?.administrative
        )
          ? bdcJson.localityInfo.administrative
          : []
        const byAdminDesc = [...adminList]
          .filter((a) => a.name && (a.adminLevel || 0) >= 4)
          .sort((a, b) => (b.adminLevel || 0) - (a.adminLevel || 0))
          .map((a) => a.name as string)

        for (const item of [bdcJson?.city, bdcJson?.locality, ...byAdminDesc, bdcJson?.principalSubdivision]) {
          if (typeof item === 'string' && item.trim()) {
            placeCandidates.push(item.trim())
          }
        }
      }
    }

    if (countryCode && countryCode !== 'id') {
      return c.json(
        { error: 'Lokasi terdeteksi di luar Indonesia. Silakan pilih kota Indonesia secara manual.' },
        404
      )
    }

    const allCities = await fetchAllKemenagCities()
    if (allCities.length === 0) {
      return c.json({ error: 'Gagal memuat data wilayah Kemenag RI' }, 502)
    }

    let matched: KemenagCity | undefined
    for (const candidate of placeCandidates) {
      const found = pickBestIndonesianCity(allCities, candidate)
      if (found) {
        matched = found
        break
      }
    }

    if (!matched) {
      return c.json(
        { error: 'Kota Kemenag tidak dapat dicocokkan dari lokasi perangkat. Pilih kota secara manual.' },
        404
      )
    }

    c.header('Cache-Control', 'no-store')
    return c.json({
      cityId: matched.id,
      lokasi: matched.lokasi,
      city: formatIndonesianCityLabel(matched.lokasi),
      detectedPlace: placeCandidates[0] || matched.lokasi,
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Gagal mendeteksi lokasi' }, 500)
  }
})

// Endpoint Jadwal Sholat resmi Bimas Islam Kemenag RI via api.myquran.com
app.get('/prayer-times', async (c) => {
  const city = (c.req.query('city') || 'Kota Tangerang').trim()
  const normalizedCity = normalizeCityQuery(city)
  const keyword = normalizedCity.replace(/^(KOTA|KAB\.?)\s+/, '').trim()

  try {
    const searchRes = await fetch(
      `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(keyword)}`
    )
    if (!searchRes.ok) {
      return c.json({ error: 'Gagal mencari kota di API Kemenag (MyQuran)' }, 502)
    }
    const searchJson: any = await searchRes.json()
    const candidates: KemenagCity[] = Array.isArray(searchJson?.data)
      ? searchJson.data
      : []

    if (candidates.length === 0) {
      return c.json({ error: `Kota "${city}" tidak ditemukan di data Kemenag` }, 404)
    }

    const matched = pickBestIndonesianCity(candidates, city) || candidates[0]
    const initialDate = getDatePartsInZone('Asia/Jakarta')

    let jadwalRes = await fetch(
      `https://api.myquran.com/v2/sholat/jadwal/${matched.id}/${initialDate.year}/${initialDate.month}/${initialDate.day}`
    )
    if (!jadwalRes.ok) {
      return c.json({ error: 'Gagal mengambil jadwal sholat dari API Kemenag (MyQuran)' }, 502)
    }
    let jadwalJson: any = await jadwalRes.json()
    const daerah: string = jadwalJson?.data?.daerah || 'INDONESIA'
    const { timeZone, tzLabel } = resolveIndonesianTimezone(daerah)

    // Jika kota berada di WITA/WIT dan sudah melewati tengah malam lokal dibanding WIB, ambil tanggal lokal kota
    const localDate = getDatePartsInZone(timeZone)
    if (localDate.iso !== initialDate.iso) {
      const localRes = await fetch(
        `https://api.myquran.com/v2/sholat/jadwal/${matched.id}/${localDate.year}/${localDate.month}/${localDate.day}`
      )
      if (localRes.ok) {
        jadwalJson = await localRes.json()
      }
    }

    const j = jadwalJson?.data?.jadwal
    if (!j) {
      return c.json({ error: 'Format jadwal sholat Kemenag tidak valid' }, 502)
    }

    c.header('Cache-Control', 'public, max-age=1800')
    return c.json({
      source: 'myquran-kemenag',
      cityId: String(jadwalJson.data.id || matched.id),
      lokasi: jadwalJson.data.lokasi || matched.lokasi,
      daerah,
      timeZone,
      tzLabel,
      date: j.date || localDate.iso,
      jadwal: {
        imsak: j.imsak,
        subuh: j.subuh,
        terbit: j.terbit,
        dhuha: j.dhuha,
        dzuhur: j.dzuhur,
        ashar: j.ashar,
        maghrib: j.maghrib,
        isya: j.isya,
      },
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Server error' }, 500)
  }
})

// Endpoint Kalender Hijriah resmi Kemenag RI (Neo MABIMS) via api.mabims.dev
app.get('/hijri', async (c) => {
  const tz = c.req.query('tz') || 'Asia/Jakarta'
  try {
    const todayRes = await fetch(`https://api.mabims.dev/api/v1/today?tz=${encodeURIComponent(tz)}`)
    if (!todayRes.ok) {
      return c.json({ error: 'Gagal mengambil tanggal Hijriah dari MABIMS' }, 502)
    }
    const todayJson: any = await todayRes.json()
    const out = todayJson?.output
    const gregorianToday: string = todayJson?.input?.date

    if (!out?.year || !out?.month) {
      return c.json({ error: 'Format respons MABIMS tidak valid' }, 502)
    }

    const [monthRes, eventsRes] = await Promise.all([
      fetch(`https://api.mabims.dev/api/v1/month?year=${out.year}&month=${out.month}`),
      fetch(`https://api.mabims.dev/api/v1/events?year=${out.year}`),
    ])

    const monthJson: any = monthRes.ok ? await monthRes.json() : null
    const eventsJson: any = eventsRes.ok ? await eventsRes.json() : null

    let events: any[] = Array.isArray(eventsJson?.events) ? eventsJson.events : []
    const upcomingInYear = events.filter((ev) => ev?.gregorian && ev.gregorian >= gregorianToday)

    if (upcomingInYear.length === 0) {
      const nextYearEventsRes = await fetch(`https://api.mabims.dev/api/v1/events?year=${out.year + 1}`)
      if (nextYearEventsRes.ok) {
        const nextJson: any = await nextYearEventsRes.json()
        if (Array.isArray(nextJson?.events)) {
          events = [...events, ...nextJson.events]
        }
      }
    }

    c.header('Cache-Control', 'public, max-age=1800')
    return c.json({
      source: todayJson?.source || 'mabims',
      today: {
        gregorian: gregorianToday,
        hijri: out.date,
        day: out.day,
        month: out.month,
        monthName: out.month_name,
        year: out.year,
        weekday: out.weekday,
      },
      monthCount: monthJson?.count || 30,
      days: Array.isArray(monthJson?.items) ? monthJson.items : [],
      events,
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Server error' }, 500)
  }
})

// Endpoint grid bulan Hijriah tertentu dari api.mabims.dev (untuk navigasi kalender)
app.get('/hijri/month', async (c) => {
  const year = Number(c.req.query('year'))
  const month = Number(c.req.query('month'))
  if (!year || !month || month < 1 || month > 12) {
    return c.json({ error: 'Parameter year dan month (1-12) wajib valid' }, 400)
  }
  try {
    const res = await fetch(`https://api.mabims.dev/api/v1/month?year=${year}&month=${month}`)
    if (!res.ok) {
      return c.json({ error: 'Gagal mengambil kalender bulan dari MABIMS' }, 502)
    }
    const json: any = await res.json()
    c.header('Cache-Control', 'public, max-age=86400')
    return c.json({
      year,
      month,
      count: json?.count || 30,
      days: Array.isArray(json?.items) ? json.items : [],
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Server error' }, 500)
  }
})

export const onRequest = handle(app)
