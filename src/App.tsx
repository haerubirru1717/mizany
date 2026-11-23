import React, { useState, useEffect } from 'react'
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

const DEFAULT_AMAL: AmalItem[] = [
  { id: 'puasa', name: 'Puasa', note: 'Sejak Subuh tadi', icon: 'sun', type: 'checklist', done: true },
  { id: 'sholat', name: 'Sholat 5 waktu', note: 'Isya belum — 19:19', icon: 'dome', type: 'checklist', done: false },
  { id: 'tarawih', name: 'Tarawih', note: 'Di masjid / rumah', icon: 'moon', type: 'checklist', done: false },
  { id: 'witir', name: 'Witir', note: 'Penutup malam', icon: 'star', type: 'checklist', done: false },
  { id: 'tilawah', name: 'Tilawah', note: 'Target 20 halaman', icon: 'book', type: 'target', unit: 'halaman', value: 15, target: 20 },
  { id: 'dzikir', name: 'Dzikir', note: 'Pagi & petang', icon: 'beads', type: 'counter', value: 33 },
  { id: 'sedekah', name: 'Sedekah', note: 'Kotak amal / online', icon: 'gift', type: 'amount', value: 20000 },
  { id: 'sahur', name: 'Sahur', note: 'Sebelum imsak', icon: 'bowl', type: 'checklist', done: true },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('beranda')
  const [city, setCity] = useState<string>('Kota Tangerang')
  const [tilawahTarget, setTilawahTarget] = useState<number>(20)
  const [amalItems, setAmalItems] = useState<AmalItem[]>(DEFAULT_AMAL)
  const [customAmalItems, setCustomAmalItems] = useState<AmalItem[]>([])
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false)
  const [prayerSchedule, setPrayerSchedule] = useState<PrayerSchedule | null>(null)
  const [hijriData, setHijriData] = useState<HijriHeroData | null>(null)

  // Initialize settings from localStorage safely
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
    } catch {
      // Ignore storage errors in sandbox
    }
  }, [])

  // Live Prayer Times & dynamic countdown loop
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

  // Fetch official Kemenag RI (MABIMS) Hijri calendar data
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

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false)
    try {
      localStorage.setItem('mizany_has_seen_onboarding', 'true')
    } catch {}
  }

  const handleToggleCheck = (id: string) => {
    setAmalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
    setCustomAmalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  const handleIncrementCounter = (id: string, delta: number) => {
    setAmalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, value: Math.max(0, (item.value || 0) + delta) } : item
      )
    )
    setCustomAmalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, value: Math.max(0, (item.value || 0) + delta) } : item
      )
    )
  }

  const handleUpdateValue = (id: string, value: number) => {
    setAmalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item))
    )
    setCustomAmalItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item))
    )
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
                hijriDate={prayerSchedule?.hijriDate}
                gregorianDate={prayerSchedule?.gregorianDate}
                nextPrayerName={prayerSchedule?.nextPrayer?.name}
                nextPrayerTime={prayerSchedule?.nextPrayer?.time}
                remainingTime={prayerSchedule?.nextPrayer?.remaining}
                hijriData={hijriData}
                onOpenPrayerDetail={() => setActiveTab('prayer')}
                onOpenCalendar={() => setActiveTab('kalender')}
              />

              <QuickActions
                onNavigate={(tab) => setActiveTab(tab)}
                onScrollToChecklist={() => scrollToSection('checklist-section')}
              />

              <PrayerRow
                city={city}
                prayers={prayerSchedule?.prayers}
                onSelectPrayer={() => setActiveTab('prayer')}
              />

              <AmalChecklist
                items={[...amalItems, ...customAmalItems]}
                onToggleCheck={handleToggleCheck}
                onIncrementCounter={handleIncrementCounter}
                onUpdateValue={handleUpdateValue}
                onOpenAddAmal={() => setActiveTab('atur')}
              />
            </div>
          )}

          {/* VIEW: QURAN */}
          {activeTab === 'quran' && <QuranView dailyTarget={tilawahTarget} />}

          {/* VIEW: TASBIH */}
          {activeTab === 'tasbih' && <TasbihView />}

          {/* VIEW: KALENDER */}
          {activeTab === 'kalender' && <KalenderView />}

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
            <PrayerView city={city} onBack={() => setActiveTab('beranda')} />
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
