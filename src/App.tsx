import React, { useState, useEffect, useMemo } from 'react'
import { TabKey, AmalItem } from './types'
import { HeroPrayer } from './components/HeroPrayer'
import { PrayerRow } from './components/PrayerRow'
import { QuickActions } from './components/QuickActions'
import { AmalChecklist } from './components/AmalChecklist'
import { BottomNav } from './components/BottomNav'
import { QuranView } from './views/QuranView'
import { TasbihView } from './views/TasbihView'
import { KalenderView } from './views/KalenderView'
import { AturView } from './views/AturView'
import { PrayerView } from './views/PrayerView'
import { Onboarding } from './components/Onboarding'
import { fetchPrayerTimes, PrayerSchedule } from './services/prayerService'
import { fetchHijriHeroData, HijriHeroData } from './services/hijriService'

type DailyLogEntry = { done?: boolean; value?: number }
type DailyLogsByDate = Record<string, Record<string, DailyLogEntry>>

const DAILY_LOGS_STORAGE_KEY = 'mizany_daily_logs_v1'

function getLocalIsoDate(daysOffset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  return d.toLocaleDateString('en-CA')
}

function hasCompletedAny(dayLog?: Record<string, DailyLogEntry>): boolean {
  if (!dayLog) return false
  return Object.values(dayLog).some((entry) => entry.done === true || (entry.value || 0) > 0)
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('beranda')
  const [city, setCity] = useState<string>('Kota Tangerang')
  const [tilawahTarget, setTilawahTarget] = useState<number>(20)
  const [customAmalItems, setCustomAmalItems] = useState<AmalItem[]>([])
  const [dailyLogs, setDailyLogs] = useState<DailyLogsByDate>({})
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false)
  const [prayerSchedule, setPrayerSchedule] = useState<PrayerSchedule | null>(null)
  const [hijriData, setHijriData] = useState<HijriHeroData | null>(null)

  const todayIso = getLocalIsoDate(0)

  // Initialize persisted settings & real daily logs from localStorage
  useEffect(() => {
    try {
      const storedOnboarding = localStorage.getItem('mizany_has_seen_onboarding')
      if (!storedOnboarding) {
        setShowOnboarding(true)
      }
      const storedCity = localStorage.getItem('mizany_city')
      if (storedCity) setCity(storedCity)

      const storedTarget = localStorage.getItem('mizany_tilawah_target')
      if (storedTarget) setTilawahTarget(Number(storedTarget))

      const storedCustom = localStorage.getItem('mizany_custom_amal')
      if (storedCustom) setCustomAmalItems(JSON.parse(storedCustom))

      const storedLogs = localStorage.getItem(DAILY_LOGS_STORAGE_KEY)
      if (storedLogs) setDailyLogs(JSON.parse(storedLogs))
    } catch {
      // Ignore storage errors in sandbox
    }
  }, [])

  // Live Prayer Times (Bimas Islam Kemenag RI) & dynamic 1s countdown loop
  useEffect(() => {
    let isMounted = true

    const updateTimes = () => {
      fetchPrayerTimes(city).then((data) => {
        if (isMounted && data) {
          setPrayerSchedule(data)
        }
      })
    }

    updateTimes()
    const interval = setInterval(updateTimes, 1000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [city])

  // Fetch official Kemenag RI (Neo MABIMS) Hijri calendar data
  useEffect(() => {
    let isMounted = true
    fetchHijriHeroData().then((data) => {
      if (isMounted && data) {
        setHijriData(data)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Helper to update today's real daily log and persist immediately
  const updateTodayEntry = (id: string, updater: (prev: DailyLogEntry) => DailyLogEntry) => {
    setDailyLogs((prevLogs) => {
      const dayLog = prevLogs[todayIso] || {}
      const updatedLogs: DailyLogsByDate = {
        ...prevLogs,
        [todayIso]: {
          ...dayLog,
          [id]: updater(dayLog[id] || {}),
        },
      }
      try {
        localStorage.setItem(DAILY_LOGS_STORAGE_KEY, JSON.stringify(updatedLogs))
      } catch {}
      return updatedLogs
    })
  }

  // Mode Ramadan aktif otomatis saat bulan Hijriah = 9 (Ramadan) dari MABIMS
  const isRamadan = hijriData?.today?.month === 9

  const todayLog = dailyLogs[todayIso] || {}

  // Build real base checklist items synchronized with live prayer times, target tilawah, and Mode Ramadan
  const baseAmalItems: AmalItem[] = useMemo(() => {
    const nextPrayerNote = prayerSchedule?.nextPrayer
      ? `Berikutnya: ${prayerSchedule.nextPrayer.name} — ${prayerSchedule.nextPrayer.time}`
      : 'Jadwal Bimas Islam Kemenag RI'

    const list: AmalItem[] = []

    if (isRamadan) {
      list.push(
        { id: 'puasa', name: 'Puasa', note: 'Puasa wajib Ramadan', icon: 'sun', type: 'checklist' },
        { id: 'sahur', name: 'Sahur', note: prayerSchedule?.timings?.imsak ? `Sebelum imsak — ${prayerSchedule.timings.imsak}` : 'Sebelum imsak', icon: 'bowl', type: 'checklist' }
      )
    }

    list.push({ id: 'sholat', name: 'Sholat 5 waktu', note: nextPrayerNote, icon: 'dome', type: 'checklist' })

    if (isRamadan) {
      list.push(
        { id: 'tarawih', name: 'Tarawih', note: 'Di masjid / rumah', icon: 'moon', type: 'checklist' },
        { id: 'witir', name: 'Witir', note: 'Penutup malam', icon: 'star', type: 'checklist' }
      )
    } else {
      list.push({ id: 'puasa_sunnah', name: 'Puasa Sunnah', note: 'Senin-Kamis / Ayyamul Bidh', icon: 'sun', type: 'checklist' })
    }

    list.push(
      { id: 'tilawah', name: 'Tilawah', note: `Target ${tilawahTarget} halaman`, icon: 'book', type: 'target', unit: 'halaman', target: tilawahTarget },
      { id: 'dzikir', name: 'Dzikir', note: 'Pagi & petang', icon: 'beads', type: 'counter' },
      { id: 'sedekah', name: 'Sedekah', note: 'Harian / infaq', icon: 'gift', type: 'amount' }
    )

    return list
  }, [isRamadan, prayerSchedule?.nextPrayer?.name, prayerSchedule?.nextPrayer?.time, prayerSchedule?.timings?.imsak, tilawahTarget])

  // Hydrate checklist items with today's persisted real log values
  const hydratedItems: AmalItem[] = useMemo(() => {
    return [...baseAmalItems, ...customAmalItems].map((item) => {
      const entry = todayLog[item.id]
      return {
        ...item,
        done: entry?.done ?? false,
        value: entry?.value ?? 0,
      }
    })
  }, [baseAmalItems, customAmalItems, todayLog])

  // Compute real streak and last 7 days activity dots from persisted daily logs
  const { streakDays, last7DaysActive, totalTilawahPages } = useMemo(() => {
    const last7: boolean[] = []
    for (let offset = -6; offset <= 0; offset++) {
      const iso = getLocalIsoDate(offset)
      last7.push(hasCompletedAny(dailyLogs[iso]))
    }

    let streak = 0
    // Count consecutive days ending today (or yesterday if today hasn't started yet)
    const startOffset = hasCompletedAny(dailyLogs[todayIso]) ? 0 : -1
    for (let offset = startOffset; offset >= -365; offset--) {
      const iso = getLocalIsoDate(offset)
      if (hasCompletedAny(dailyLogs[iso])) {
        streak += 1
      } else {
        break
      }
    }

    let totalPages = 0
    for (const dayLog of Object.values(dailyLogs)) {
      totalPages += dayLog?.tilawah?.value || 0
    }

    return { streakDays: streak, last7DaysActive: last7, totalTilawahPages: totalPages }
  }, [dailyLogs, todayIso])

  const pagesReadToday = todayLog.tilawah?.value || 0

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false)
    try {
      localStorage.setItem('mizany_has_seen_onboarding', 'true')
    } catch {}
  }

  const handleToggleCheck = (id: string) => {
    updateTodayEntry(id, (prev) => ({ ...prev, done: !prev.done }))
  }

  const handleIncrementCounter = (id: string, delta: number) => {
    updateTodayEntry(id, (prev) => ({
      ...prev,
      value: Math.max(0, (prev.value || 0) + delta),
    }))
  }

  const handleUpdateValue = (id: string, value: number) => {
    updateTodayEntry(id, (prev) => ({ ...prev, value: Math.max(0, value) }))
  }

  const handleAddCustomAmal = (newItem: Omit<AmalItem, 'id'>) => {
    const item: AmalItem = {
      ...newItem,
      id: `custom_${Date.now()}`,
    }
    const updated = [...customAmalItems, item]
    setCustomAmalItems(updated)
    try {
      localStorage.setItem('mizany_custom_amal', JSON.stringify(updated))
    } catch {}
  }

  const handleDeleteCustomAmal = (id: string) => {
    const updated = customAmalItems.filter((item) => item.id !== id)
    setCustomAmalItems(updated)
    try {
      localStorage.setItem('mizany_custom_amal', JSON.stringify(updated))
    } catch {}
  }

  const handleChangeCity = (newCity: string) => {
    setCity(newCity)
    try {
      localStorage.setItem('mizany_city', newCity)
    } catch {}
  }

  const handleChangeTilawahTarget = (newTarget: number) => {
    setTilawahTarget(newTarget)
    try {
      localStorage.setItem('mizany_tilawah_target', newTarget.toString())
    } catch {}
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-transparent relative">
      {/* Soft blurred background ambient lights */}
      <div className="fixed -top-20 -left-20 w-80 h-80 rounded-full bg-[#8BA0F3]/15 blur-[80px] pointer-events-none" />

      {/* Onboarding Overlay */}
      {showOnboarding && <Onboarding onComplete={handleCompleteOnboarding} />}

      {/* Main Container */}
      <main className="max-w-md mx-auto min-h-screen px-4 pt-2 sm:pt-4 pb-20 relative z-10">
        <div key={activeTab} className="view-enter">
          {/* VIEW: BERANDA */}
          {activeTab === 'beranda' && (
            <div className="space-y-2">
              <HeroPrayer
                city={city}
                gregorianDate={prayerSchedule?.gregorianDate}
                currentTime={prayerSchedule?.currentTime}
                arcProgress={prayerSchedule?.arcProgress}
                nextPrayerName={prayerSchedule?.nextPrayer?.name}
                nextPrayerTime={prayerSchedule?.nextPrayer?.time}
                remainingTime={prayerSchedule?.nextPrayer?.remaining}
                hijriData={hijriData}
                onOpenPrayerDetail={() => setActiveTab('prayer')}
                onOpenCalendar={() => setActiveTab('kalender')}
              />

              <QuickActions
                streakDays={streakDays}
                last7DaysActive={last7DaysActive}
                onNavigate={(tab) => setActiveTab(tab)}
                onScrollToChecklist={() => scrollToSection('checklist-section')}
              />

              <PrayerRow
                city={city}
                prayers={prayerSchedule?.prayers}
                onSelectPrayer={() => setActiveTab('prayer')}
              />

              <AmalChecklist
                items={hydratedItems}
                onToggleCheck={handleToggleCheck}
                onIncrementCounter={handleIncrementCounter}
                onUpdateValue={handleUpdateValue}
                onOpenAddAmal={() => setActiveTab('atur')}
              />
            </div>
          )}

          {/* VIEW: QURAN */}
          {activeTab === 'quran' && (
            <QuranView
              dailyTarget={tilawahTarget}
              pagesReadToday={pagesReadToday}
              totalPagesRead={totalTilawahPages}
              hijriDateLabel={hijriData?.formattedDate}
              onChangePagesToday={(nextPages) => handleUpdateValue('tilawah', nextPages)}
            />
          )}

          {/* VIEW: TASBIH */}
          {activeTab === 'tasbih' && <TasbihView />}

          {/* VIEW: KALENDER */}
          {activeTab === 'kalender' && <KalenderView hijriData={hijriData} />}

          {/* VIEW: ATUR */}
          {activeTab === 'atur' && (
            <AturView
              city={city}
              onChangeCity={handleChangeCity}
              tilawahTarget={tilawahTarget}
              onChangeTilawahTarget={handleChangeTilawahTarget}
              customAmalItems={customAmalItems}
              onAddCustomAmal={handleAddCustomAmal}
              onDeleteCustomAmal={handleDeleteCustomAmal}
              onReplayOnboarding={() => setShowOnboarding(true)}
            />
          )}

          {/* VIEW: PRAYER DETAIL */}
          {activeTab === 'prayer' && (
            <PrayerView
              city={city}
              prayerSchedule={prayerSchedule}
              onBack={() => setActiveTab('beranda')}
            />
          )}
        </div>
      </main>

      {/* Floating Bottom Nav */}
      <BottomNav
        activeTab={activeTab === 'prayer' || activeTab === 'tasbih' ? 'beranda' : activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
      />
    </div>
  )
}
