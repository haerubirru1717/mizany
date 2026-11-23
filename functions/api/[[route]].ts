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

export const onRequest = handle(app)
