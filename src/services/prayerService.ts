export interface PrayerSchedule {
  city: string
  hijriDate: string
  gregorianDate: string
  prayers: {
    id: string
    name: string
    time: string
    isNext?: boolean
    isPassed?: boolean
  }[]
  nextPrayer: {
    name: string
    time: string
    remaining: string
  }
}

export async function fetchPrayerTimes(city: string): Promise<PrayerSchedule | null> {
  try {
    const todayStr = new Date().toISOString().split('T')[0]
    const cacheKey = `mizany_prayer_${city}_${todayStr}`

    // 1. Check local cache first
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        return calculateNextPrayer(parsed)
      } catch {}
    }

    // 2. Fetch from Hono edge API
    const res = await fetch(`/api/prayer-times?city=${encodeURIComponent(city)}`)
    if (!res.ok) throw new Error('Failed to fetch prayer times')

    const json: any = await res.json()
    const timings = json?.data?.timings
    const date = json?.data?.date

    if (!timings) return null

    const hijri = date?.hijri
    const hijriStr = hijri
      ? `${hijri.day} ${hijri.month?.en || 'Ramadan'} ${hijri.year} H`
      : '12 Ramadan 1448 H'

    const gregorianStr = date?.readable || new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const rawSchedule = {
      city,
      hijriDate: hijriStr,
      gregorianDate: gregorianStr,
      timings: {
        subuh: timings.Fajr?.slice(0, 5) || '04:38',
        terbit: timings.Sunrise?.slice(0, 5) || '05:53',
        dzuhur: timings.Dhuhr?.slice(0, 5) || '12:05',
        ashar: timings.Asr?.slice(0, 5) || '15:19',
        maghrib: timings.Maghrib?.slice(0, 5) || '18:07',
        isya: timings.Isha?.slice(0, 5) || '19:19',
      },
    }

    // Cache raw response
    try {
      localStorage.setItem(cacheKey, JSON.stringify(rawSchedule))
    } catch {}

    return calculateNextPrayer(rawSchedule)
  } catch (err) {
    console.error('Prayer fetch error:', err)
    return null
  }
}

function calculateNextPrayer(data: any): PrayerSchedule {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

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
    return h * 60 + m > currentMinutes
  })

  if (nextIdx === -1) {
    // Lewat Isya -> sholat berikutnya Subuh besok
    nextIdx = 0
  }

  const nextP = list[nextIdx]
  const [nh, nm] = nextP.time.split(':').map(Number)
  let diffMinutes = nh * 60 + nm - currentMinutes
  if (diffMinutes < 0) diffMinutes += 24 * 60 // besok

  const remHours = Math.floor(diffMinutes / 60)
  const remMins = diffMinutes % 60
  const remainingStr = `${String(remHours).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(59 - now.getSeconds()).padStart(2, '0')}`

  const prayers = list.map((p, idx) => ({
    ...p,
    isNext: idx === nextIdx,
    isPassed: idx < nextIdx,
  }))

  return {
    city: data.city,
    hijriDate: data.hijriDate,
    gregorianDate: data.gregorianDate,
    prayers,
    nextPrayer: {
      name: nextP.name,
      time: nextP.time,
      remaining: remainingStr,
    },
  }
}
