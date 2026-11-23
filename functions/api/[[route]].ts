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

// Helper untuk mencocokkan nama kota Indonesia paling akurat dari hasil MyQuran Kemenag
function pickBestIndonesianCity(items: Array<{ id: string; lokasi: string }>, query: string) {
  const norm = query.trim().toUpperCase().replace(/\s+/g, ' ')
  const withoutPrefix = norm.replace(/^(KOTA|KAB\.?)\s+/, '')

  return (
    items.find((it) => it.lokasi === norm) ||
    items.find((it) => it.lokasi === `KOTA ${withoutPrefix}`) ||
    items.find((it) => it.lokasi === `KAB. ${withoutPrefix}`) ||
    items.find((it) => new RegExp(`\\b${withoutPrefix}\\b`).test(it.lokasi) && it.lokasi.startsWith('KOTA ')) ||
    items.find((it) => new RegExp(`\\b${withoutPrefix}\\b`).test(it.lokasi)) ||
    items[0]
  )
}

function getJakartaDateParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const year = parts.find((p) => p.type === 'year')?.value || '2026'
  const month = parts.find((p) => p.type === 'month')?.value || '11'
  const day = parts.find((p) => p.type === 'day')?.value || '23'
  return { year, month, day, iso: `${year}-${month}-${day}` }
}

// Endpoint Jadwal Sholat resmi Bimas Islam Kemenag RI via api.myquran.com
app.get('/prayer-times', async (c) => {
  const city = (c.req.query('city') || 'Kota Tangerang').trim()
  const keyword = city.replace(/^(Kota|Kab\.?)\s+/i, '').trim()

  try {
    const searchRes = await fetch(
      `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(keyword)}`
    )
    if (!searchRes.ok) {
      return c.json({ error: 'Gagal mencari kota di API Kemenag (MyQuran)' }, 502)
    }
    const searchJson: any = await searchRes.json()
    const candidates: Array<{ id: string; lokasi: string }> = Array.isArray(searchJson?.data)
      ? searchJson.data
      : []

    if (candidates.length === 0) {
      return c.json({ error: `Kota "${city}" tidak ditemukan di data Kemenag` }, 404)
    }

    const matched = pickBestIndonesianCity(candidates, city)
    const { year, month, day, iso } = getJakartaDateParts()

    const jadwalRes = await fetch(
      `https://api.myquran.com/v2/sholat/jadwal/${matched.id}/${year}/${month}/${day}`
    )
    if (!jadwalRes.ok) {
      return c.json({ error: 'Gagal mengambil jadwal sholat dari API Kemenag (MyQuran)' }, 502)
    }
    const jadwalJson: any = await jadwalRes.json()
    const j = jadwalJson?.data?.jadwal

    if (!j) {
      return c.json({ error: 'Format jadwal sholat Kemenag tidak valid' }, 502)
    }

    c.header('Cache-Control', 'public, max-age=1800')
    return c.json({
      source: 'myquran-kemenag',
      cityId: String(jadwalJson.data.id || matched.id),
      lokasi: jadwalJson.data.lokasi || matched.lokasi,
      daerah: jadwalJson.data.daerah || 'INDONESIA',
      date: j.date || iso,
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
