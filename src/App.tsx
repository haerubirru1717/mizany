import React, { useState, useEffect, useMemo } from 'react'
import {
  TabKey,
  AmalItem,
  CustomAmalType,
  MandatoryPrayerKey,
  PrayerChecks,
} from './types'
import { HeroPrayer } from './components/HeroPrayer'
import { PrayerRow } from './components/PrayerRow'
import { QuickActions } from './components/QuickActions'
import { AmalChecklist } from './components/AmalChecklist'
import { AmalFormModal } from './components/AmalFormModal'
import { BottomNav } from './components/BottomNav'
import { QuranView } from './views/QuranView'
import { TasbihView } from './views/TasbihView'
import { KalenderView } from './views/KalenderView'
import { AturView } from './views/AturView'
import { PrayerView } from './views/PrayerView'
import { Onboarding } from './components/Onboarding'
import {
  CachedPrayerData,
  computePrayerSchedule,
  getDateIsoInTimezone,
  loadCityPrayerData,
  PrayerSchedule,
} from './services/prayerService'
import { fetchHijriHeroData, HijriHeroData } from './services/hijriService'

type DailyLogEntry = {
  done?: boolean
  value?: number
  prayers?: PrayerChecks
}
type DailyLogsByDate = Record<string, Record<string, DailyLogEntry>>

const DAILY_LOGS_STORAGE_KEY = 'mizany_daily_logs_v1'

const EMPTY_PRAYER_CHECKS: PrayerChecks = {
  subuh: false,
  dzuhur: false,
  ashar: false,
  maghrib: false,
  isya: false,
}

function getLocalIsoDate(daysOffset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  return d.toLocaleDateString('en-CA')
}

function hasCompletedAny(dayLog?: Record<string, DailyLogEntry>): boolean {
  if (!dayLog) return false
  return Object.values(dayLog).some((entry) => {
    if (entry.done === true || (entry.value || 0) > 0) return true
    if (entry.prayers && Object.values(entry.prayers).some(Boolean)) return true
    return false
  })
}

function inferAmalIcon(name: string, type: CustomAmalType): string {
  const lower = name.toLowerCase()
  if (type === 'amount' || /sedekah|infaq|infak|zakat|wakaf/.test(lower)) return 'gift'
  if (/qur|tilawah|baca|tadarus|hafal|muroja/.test(lower)) return 'book'
  if (/puasa|dhuha|sahur/.test(lower)) return 'sun'
  if (/tarawih|tahajud|witir|qiyam|malam/.test(lower)) return 'moon'
  if (/dzikir|zikir|tasbih|sholawat|salawat|istighfar/.test(lower)) return 'beads'
  return 'star'
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

  // Modal state for Add / Edit custom amal
  const [amalModalOpen, setAmalModalOpen] = useState<boolean>(false)
  const [editingAmal, setEditingAmal] = useState<AmalItem | null>(null)

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

  // Live Prayer Times (Bimas Islam Kemenag RI): fetch once per city/day, tick synchronously every 1s
  useEffect(() => {
    let isMounted = true
    let cachedData: CachedPrayerData | null = null
    let isRefreshing = false
    let lastFetchAttempt = 0

    const refreshCityData = () => {
      if (isRefreshing) return
      isRefreshing = true
      lastFetchAttempt = Date.now()
      loadCityPrayerData(city)
        .then((data) => {
          if (isMounted && data) {
            cachedData = data
            setPrayerSchedule(computePrayerSchedule(data, new Date()))
          }
        })
        .finally(() => {
          isRefreshing = false
        })
    }

    refreshCityData()

    const interval = setInterval(() => {
      const now = new Date()
      if (!cachedData) {
        if (Date.now() - lastFetchAttempt >= 15000) {
          refreshCityData()
        }
        return
      }
      if (getDateIsoInTimezone(now, cachedData.timeZone) !== cachedData.dateIso) {
        refreshCityData()
      }
      setPrayerSchedule(computePrayerSchedule(cachedData, now))
    }, 1000)

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

  // Default mandatory items ONLY: Sholat 5 Waktu (always locked) + Puasa Ramadan (auto locked in Ramadan)
  const mandatoryAmalItems: AmalItem[] = useMemo(() => {
    const nextPrayerNote = prayerSchedule?.nextPrayer
      ? `Berikutnya: ${prayerSchedule.nextPrayer.name} — ${prayerSchedule.nextPrayer.time}`
      : 'Jadwal Bimas Islam Kemenag RI'

    const list: AmalItem[] = [
      {
        id: 'sholat',
        name: 'Sholat 5 Waktu',
        note: nextPrayerNote,
        icon: 'dome',
        type: 'prayers',
        isLocked: true,
      },
    ]

    if (isRamadan) {
      list.push({
        id: 'puasa',
        name: 'Puasa Ramadan',
        note: prayerSchedule?.timings?.maghrib
          ? `Berbuka pukul ${prayerSchedule.timings.maghrib}`
          : 'Puasa wajib Ramadan',
        icon: 'sun',
        type: 'checklist',
        isLocked: true,
      })
    }

    return list
  }, [
    isRamadan,
    prayerSchedule?.nextPrayer?.name,
    prayerSchedule?.nextPrayer?.time,
    prayerSchedule?.timings?.maghrib,
  ])

  // Hydrate mandatory + custom user amals with today's persisted log values
  const hydratedItems: AmalItem[] = useMemo(() => {
    const customWithNotes = customAmalItems.map((item) => ({
      ...item,
      isCustom: true,
      note:
        item.type === 'target'
          ? `Target ${item.target || 1}${item.unit ? ` ${item.unit}` : ''}`
          : item.note,
    }))

    return [...mandatoryAmalItems, ...customWithNotes].map((item) => {
      const entry = todayLog[item.id]
      if (item.type === 'prayers') {
        return {
          ...item,
          prayerChecks: {
            ...EMPTY_PRAYER_CHECKS,
            ...(entry?.prayers || {}),
          },
        }
      }
      return {
        ...item,
        done: entry?.done ?? false,
        value: entry?.value ?? 0,
      }
    })
  }, [mandatoryAmalItems, customAmalItems, todayLog])

  // Compute real streak, 7-day dots, and cumulative Quran pages
  const { streakDays, last7DaysActive, totalTilawahPages } = useMemo(() => {
    const last7: boolean[] = []
    for (let offset = -6; offset <= 0; offset++) {
      const iso = getLocalIsoDate(offset)
      last7.push(hasCompletedAny(dailyLogs[iso]))
    }

    let streak = 0
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

  const handleTogglePrayer = (prayer: MandatoryPrayerKey) => {
    updateTodayEntry('sholat', (prev) => {
      const current = { ...EMPTY_PRAYER_CHECKS, ...(prev.prayers || {}) }
      return {
        ...prev,
        prayers: {
          ...current,
          [prayer]: !current[prayer],
        },
      }
    })
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

  const handleOpenAddAmal = () => {
    setEditingAmal(null)
    setAmalModalOpen(true)
  }

  const handleOpenEditAmal = (item: AmalItem) => {
    if (item.isLocked) return
    setEditingAmal(item)
    setAmalModalOpen(true)
  }

  const handleSaveCustomAmal = (data: {
    id?: string
    name: string
    type: CustomAmalType
    target?: number
    unit?: string
  }) => {
    const icon = inferAmalIcon(data.name, data.type)
    const updated = data.id
      ? customAmalItems.map((item) =>
          item.id === data.id
            ? {
                ...item,
                name: data.name,
                type: data.type,
                target: data.target,
                unit: data.unit,
                icon,
              }
            : item
        )
      : [
          ...customAmalItems,
          {
            id: `custom_${Date.now()}`,
            name: data.name,
            type: data.type,
            target: data.target,
            unit: data.unit,
            icon,
            isCustom: true,
          },
        ]

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

      {/* Add / Edit Amal Modal */}
      <AmalFormModal
        isOpen={amalModalOpen}
        editingItem={editingAmal}
        onClose={() => {
          setAmalModalOpen(false)
          setEditingAmal(null)
        }}
        onSave={handleSaveCustomAmal}
        onDelete={handleDeleteCustomAmal}
      />

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
                tzLabel={prayerSchedule?.tzLabel}
                arcProgress={prayerSchedule?.arcProgress}
                currentPrayerName={prayerSchedule?.currentPrayer?.name}
                currentPrayerTime={prayerSchedule?.currentPrayer?.time}
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
                onTogglePrayer={handleTogglePrayer}
                onToggleCheck={handleToggleCheck}
                onIncrementCounter={handleIncrementCounter}
                onUpdateValue={handleUpdateValue}
                onOpenAddAmal={handleOpenAddAmal}
                onEditAmal={handleOpenEditAmal}
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
              onOpenAddAmal={handleOpenAddAmal}
              onEditAmal={handleOpenEditAmal}
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
