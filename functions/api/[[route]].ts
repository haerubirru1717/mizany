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

// Endpoint proxy & cache untuk API Aladhan (Metode Kemenag RI method=20)
app.get('/prayer-times', async (c) => {
  const city = c.req.query('city') || 'Kota Tangerang'
  try {
    const response = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Indonesia&method=20`
    )
    if (!response.ok) {
      return c.json({ error: 'Gagal mengambil jadwal sholat dari API Aladhan' }, 502)
    }
    const data = await response.json()
    return c.json(data)
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

export const onRequest = handle(app)
