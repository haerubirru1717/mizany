import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  TabKey,
  AmalItem,
  CustomAmalType,
  MandatoryPrayerKey,
  PrayerChecks,
  DailyLogEntry,
  DailyLogsByDate,
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
import { StreakCelebration } from './components/StreakCelebration'
import {
  CachedPrayerData,
  computePrayerSchedule,
  detectCityFromDeviceGeolocation,
  getDateIsoInTimezone,
  loadCityPrayerData,
  PrayerSchedule,
} from './services/prayerService'
import { fetchHijriHeroData, HijriHeroData } from './services/hijriService'
import {
  PAGES_PER_JUZ,
  diffIsoDays,
  findLinkedQuranAmal,
  getDayTilawahPages,
  getLocalIsoDate,
  hasCompletedAny,
  isJuzUnit,
  isPageUnit,
  linkedEntryToPages,
  pagesToLinkedEntry,
} from './utils/recapStats'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DAILY_LOGS_STORAGE_KEY = 'mizany_daily_logs_v1'
const STREAK_CELEBRATED_KEY = 'mizany_streak_celebrated_date'
const CITY_MODE_STORAGE_KEY = 'mizany_city_mode_v1'
const GEO_DECLINED_STORAGE_KEY = 'mizany_geo_declined_v1'

const EMPTY_PRAYER_CHECKS: PrayerChecks = {
  subuh: false,
  dzuhur: false,
  ashar: false,
  maghrib: false,
  isya: false,
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
  const [todayIso, setTodayIso] = useState<string>(() => getLocalIsoDate(0))

  const [activeTab, setActiveTab] = useState<TabKey>('beranda')
  const [selectedChecklistDate, setSelectedChecklistDate] = useState<string>(() => getLocalIsoDate(0))
  const [city, setCity] = useState<string>('Kota Tangerang')
  const [cityMode, setCityMode] = useState<'auto' | 'manual'>('auto')
  const [isLocatingCity, setIsLocatingCity] = useState<boolean>(false)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState<boolean>(false)

  const [tilawahTarget, setTilawahTarget] = useState<number>(20)
  const [customAmalItems, setCustomAmalItems] = useState<AmalItem[]>([])
  const [dailyLogs, setDailyLogs] = useState<DailyLogsByDate>({})
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false)
  const [prayerSchedule, setPrayerSchedule] = useState<PrayerSchedule | null>(null)
  const [prayerLoadFailed, setPrayerLoadFailed] = useState<boolean>(false)
  const [prayerRetryTick, setPrayerRetryTick] = useState<number>(0)
  const [hijriData, setHijriData] = useState<HijriHeroData | null>(null)

  // PWA Install state
  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false)

  // Modal state for Add / Edit custom amal & Streak celebration
  const [amalModalOpen, setAmalModalOpen] = useState<boolean>(false)
  const [editingAmal, setEditingAmal] = useState<AmalItem | null>(null)
  const [showStreakModal, setShowStreakModal] = useState<boolean>(false)

  const hasAutoLocatedRef = useRef<boolean>(false)
  const prevTodayIsoRef = useRef<string>(todayIso)

  // Initialize persisted settings & real daily logs from localStorage
  useEffect(() => {
    try {
      const storedOnboarding = localStorage.getItem('mizany_has_seen_onboarding')
      if (!storedOnboarding) {
        setShowOnboarding(true)
      }
      const storedCity = localStorage.getItem('mizany_city')
      if (storedCity) setCity(storedCity)

      const storedMode = localStorage.getItem(CITY_MODE_STORAGE_KEY)
      if (storedMode === 'manual' || storedMode === 'auto') {
        setCityMode(storedMode)
      }

      const storedTarget = localStorage.getItem('mizany_tilawah_target')
      if (storedTarget) setTilawahTarget(Number(storedTarget))

      const storedCustom = localStorage.getItem('mizany_custom_amal')
      if (storedCustom) setCustomAmalItems(JSON.parse(storedCustom))

      const storedLogs = localStorage.getItem(DAILY_LOGS_STORAGE_KEY)
      if (storedLogs) setDailyLogs(JSON.parse(storedLogs))
    } catch {
      // Ignore storage errors in sandbox
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Detect installed standalone mode & listen for Android Chrome PWA install prompt
  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    setIsPwaInstalled(Boolean(standalone))

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredInstallPrompt(e as BeforeInstallPromptEvent)
    }
    const onAppInstalled = () => {
      setIsPwaInstalled(true)
      setDeferredInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  // Reusable device Geolocation -> Kemenag RI Kab/Kota detector
  const runDeviceGeolocation = useCallback(async (isManualTrigger: boolean) => {
    setIsLocatingCity(true)
    if (isManualTrigger) {
      setLocationError(null)
      setLocationMessage(null)
    }

    try {
      const detected = await detectCityFromDeviceGeolocation()
      setCity(detected.city)
      setCityMode('auto')
      setLocationError(null)
      if (isManualTrigger) {
        setLocationMessage(`Lokasi terdeteksi: ${detected.city}`)
      }
      try {
        localStorage.setItem('mizany_city', detected.city)
        localStorage.setItem(CITY_MODE_STORAGE_KEY, 'auto')
        localStorage.removeItem(GEO_DECLINED_STORAGE_KEY)
      } catch {}
    } catch (err: any) {
      const msg = err?.message || 'Gagal mendeteksi lokasi perangkat.'
      if (isManualTrigger) {
        setLocationError(msg)
      } else if (/ditolak/i.test(msg)) {
        try {
          localStorage.setItem(GEO_DECLINED_STORAGE_KEY, '1')
        } catch {}
      }
    } finally {
      setIsLocatingCity(false)
    }
  }, [])

  // Auto-detect city via device Geolocation once on startup when in 'auto' mode
  useEffect(() => {
    if (!isHydrated || showOnboarding || cityMode !== 'auto' || hasAutoLocatedRef.current) return
    hasAutoLocatedRef.current = true

    try {
      if (localStorage.getItem(GEO_DECLINED_STORAGE_KEY) === '1') return
    } catch {}

    runDeviceGeolocation(false)
  }, [isHydrated, showOnboarding, cityMode, runDeviceGeolocation])

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
      setPrayerLoadFailed(false)
      loadCityPrayerData(city)
        .then((data) => {
          if (!isMounted) return
          if (data) {
            cachedData = data
            setPrayerLoadFailed(false)
            setPrayerSchedule(computePrayerSchedule(data, new Date()))
          } else if (!cachedData) {
            setPrayerLoadFailed(true)
          }
        })
        .catch(() => {
          if (isMounted && !cachedData) setPrayerLoadFailed(true)
        })
        .finally(() => {
          isRefreshing = false
        })
    }

    refreshCityData()

    const interval = setInterval(() => {
      const now = new Date()
      const currentLocalIso = getLocalIsoDate(0, now)
      if (currentLocalIso !== prevTodayIsoRef.current) {
        const oldToday = prevTodayIsoRef.current
        prevTodayIsoRef.current = currentLocalIso
        setTodayIso(currentLocalIso)
        setSelectedChecklistDate((prev) => (prev === oldToday ? currentLocalIso : prev))
      }

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
  }, [city, prayerRetryTick])

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

  // Helper to update one or more entries for any target date atomically;
  // streak celebration ONLY ignites for today's first completed amal (never past backfill edits)
  const updateDateEntries = (
    targetIso: string,
    updater: (prevDayLog: Record<string, DailyLogEntry>) => Record<string, DailyLogEntry>
  ) => {
    const prevDayLog = dailyLogs[targetIso] || {}
    const wasActive = hasCompletedAny(prevDayLog)
    const nextDayLog = updater(prevDayLog)
    const isNowActive = hasCompletedAny(nextDayLog)

    setDailyLogs((prevLogs) => {
      const dayLog = prevLogs[targetIso] || {}
      const updatedLogs: DailyLogsByDate = {
        ...prevLogs,
        [targetIso]: updater(dayLog),
      }
      try {
        localStorage.setItem(DAILY_LOGS_STORAGE_KEY, JSON.stringify(updatedLogs))
      } catch {}
      return updatedLogs
    })

    if (targetIso === todayIso && !wasActive && isNowActive) {
      try {
        if (localStorage.getItem(STREAK_CELEBRATED_KEY) !== todayIso) {
          localStorage.setItem(STREAK_CELEBRATED_KEY, todayIso)
          setTimeout(() => setShowStreakModal(true), 180)
        }
      } catch {
        setTimeout(() => setShowStreakModal(true), 180)
      }
    }
  }

  const updateTodayEntry = (id: string, updater: (prev: DailyLogEntry) => DailyLogEntry) => {
    updateDateEntries(todayIso, (dayLog) => ({
      ...dayLog,
      [id]: updater(dayLog[id] || {}),
    }))
  }

  // Mode Ramadan aktif otomatis saat bulan Hijriah = 9 (Ramadan) dari MABIMS
  const isRamadan = hijriData?.today?.month === 9

  const todayLog = dailyLogs[todayIso] || {}
  const activeChecklistLog = dailyLogs[selectedChecklistDate] || {}
  const isViewingTodayChecklist = selectedChecklistDate === todayIso

  // Automatically link QuranView with the user's custom Qur'an / Tilawah amal on Beranda (if any)
  const linkedQuranAmal = useMemo(
    () => findLinkedQuranAmal(customAmalItems),
    [customAmalItems]
  )

  const effectiveQuranTarget = useMemo(() => {
    if (linkedQuranAmal?.type === 'target' && linkedQuranAmal.target) {
      if (isJuzUnit(linkedQuranAmal.unit)) {
        return linkedQuranAmal.target * PAGES_PER_JUZ
      }
      if (isPageUnit(linkedQuranAmal.unit)) {
        return linkedQuranAmal.target
      }
    }
    return tilawahTarget
  }, [linkedQuranAmal, tilawahTarget])

  // Default mandatory items ONLY: Sholat 5 Waktu (always locked) + Puasa Ramadan (auto locked in Ramadan)
  const mandatoryAmalItems: AmalItem[] = useMemo(() => {
    const nextPrayerNote = isViewingTodayChecklist
      ? prayerSchedule?.nextPrayer
        ? `Berikutnya: ${prayerSchedule.nextPrayer.name} — ${prayerSchedule.nextPrayer.time}`
        : 'Jadwal Bimas Islam Kemenag RI'
      : 'Catatan sholat 5 waktu pada tanggal terpilih'

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
    isViewingTodayChecklist,
    isRamadan,
    prayerSchedule?.nextPrayer?.name,
    prayerSchedule?.nextPrayer?.time,
    prayerSchedule?.timings?.maghrib,
  ])

  // Hydrate mandatory + custom user amals with selectedChecklistDate's persisted log values
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
      const entry = activeChecklistLog[item.id]
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
  }, [mandatoryAmalItems, customAmalItems, activeChecklistLog])

  // Compute real streak, 7-day dots, and cumulative Quran pages (including previously logged linked amal)
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
      totalPages += getDayTilawahPages(dayLog, linkedQuranAmal, effectiveQuranTarget)
    }

    return { streakDays: streak, last7DaysActive: last7, totalTilawahPages: totalPages }
  }, [dailyLogs, todayIso, linkedQuranAmal, effectiveQuranTarget])

  const pagesReadToday = useMemo(
    () => getDayTilawahPages(todayLog, linkedQuranAmal, effectiveQuranTarget),
    [todayLog, linkedQuranAmal, effectiveQuranTarget]
  )

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false)
    try {
      localStorage.setItem('mizany_has_seen_onboarding', 'true')
    } catch {}
  }

  const handleTogglePrayer = (prayer: MandatoryPrayerKey) => {
    updateDateEntries(selectedChecklistDate, (dayLog) => {
      const prev = dayLog.sholat || {}
      const current = { ...EMPTY_PRAYER_CHECKS, ...(prev.prayers || {}) }
      return {
        ...dayLog,
        sholat: {
          ...prev,
          prayers: {
            ...current,
            [prayer]: !current[prayer],
          },
        },
      }
    })
  }

  const handleToggleCheck = (id: string) => {
    updateDateEntries(selectedChecklistDate, (dayLog) => {
      const prev = dayLog[id] || {}
      const nextEntry: DailyLogEntry = { ...prev, done: !prev.done }
      const nextLog: Record<string, DailyLogEntry> = { ...dayLog, [id]: nextEntry }
      if (linkedQuranAmal && linkedQuranAmal.id === id) {
        nextLog.tilawah = {
          value: linkedEntryToPages(linkedQuranAmal, nextEntry, effectiveQuranTarget),
        }
      }
      return nextLog
    })
  }

  const handleIncrementCounter = (id: string, delta: number) => {
    updateDateEntries(selectedChecklistDate, (dayLog) => {
      const prev = dayLog[id] || {}
      const nextEntry: DailyLogEntry = { ...prev, value: Math.max(0, (prev.value || 0) + delta) }
      const nextLog: Record<string, DailyLogEntry> = { ...dayLog, [id]: nextEntry }
      if (linkedQuranAmal && linkedQuranAmal.id === id) {
        nextLog.tilawah = {
          value: linkedEntryToPages(linkedQuranAmal, nextEntry, effectiveQuranTarget),
        }
      }
      return nextLog
    })
  }

  const handleUpdateValue = (id: string, value: number) => {
    updateDateEntries(selectedChecklistDate, (dayLog) => {
      const prev = dayLog[id] || {}
      const nextEntry: DailyLogEntry = { ...prev, value: Math.max(0, value) }
      const nextLog: Record<string, DailyLogEntry> = { ...dayLog, [id]: nextEntry }
      if (linkedQuranAmal && linkedQuranAmal.id === id) {
        nextLog.tilawah = {
          value: linkedEntryToPages(linkedQuranAmal, nextEntry, effectiveQuranTarget),
        }
      }
      return nextLog
    })
  }

  const handleChangeQuranPages = (nextPages: number) => {
    const safePages = Math.max(0, Math.floor(nextPages))
    updateDateEntries(todayIso, (dayLog) => {
      const nextLog: Record<string, DailyLogEntry> = {
        ...dayLog,
        tilawah: { value: safePages },
      }
      if (linkedQuranAmal) {
        nextLog[linkedQuranAmal.id] = {
          ...(dayLog[linkedQuranAmal.id] || {}),
          ...pagesToLinkedEntry(linkedQuranAmal, safePages, effectiveQuranTarget),
        }
      }
      return nextLog
    })
  }

  const handleAddQuranToChecklist = () => {
    const newItem: AmalItem = {
      id: `custom_${Date.now()}`,
      name: "Baca Qur'an",
      type: 'target',
      target: tilawahTarget,
      unit: 'halaman',
      icon: 'book',
      isCustom: true,
    }
    const updated = [...customAmalItems, newItem]
    setCustomAmalItems(updated)
    try {
      localStorage.setItem('mizany_custom_amal', JSON.stringify(updated))
    } catch {}

    if (pagesReadToday > 0) {
      updateTodayEntry(newItem.id, () => ({ value: pagesReadToday }))
    }
  }

  const handleOpenAddAmal = () => {
    setEditingAmal(null)
    setAmalModalOpen(true)
  }

  const handleOpenEditAmal = (item: AmalItem) => {
    if (item.isLocked || item.type !== 'target') return
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
    if (data.id) {
      // Edit mode: strictly update target number only so historical logs never change meaning/unit
      const nextTarget = Math.max(1, Math.round(data.target || 1))
      const updated = customAmalItems.map((item) =>
        item.id === data.id && item.type === 'target' ? { ...item, target: nextTarget } : item
      )
      setCustomAmalItems(updated)
      try {
        localStorage.setItem('mizany_custom_amal', JSON.stringify(updated))
      } catch {}

      if (linkedQuranAmal?.id === data.id && isPageUnit(linkedQuranAmal.unit)) {
        setTilawahTarget(nextTarget)
        try {
          localStorage.setItem('mizany_tilawah_target', String(nextTarget))
        } catch {}
      }
      return
    }

    const icon = inferAmalIcon(data.name, data.type)
    const newId = `custom_${Date.now()}`
    const newItem: AmalItem = {
      id: newId,
      name: data.name,
      type: data.type,
      target: data.target,
      unit: data.unit,
      icon,
      isCustom: true,
    }

    const updated = [...customAmalItems, newItem]
    setCustomAmalItems(updated)
    try {
      localStorage.setItem('mizany_custom_amal', JSON.stringify(updated))
    } catch {}

    // If user newly created a Qur'an amal while already logging pages in QuranView today, sync it immediately
    if (findLinkedQuranAmal([newItem]) && pagesReadToday > 0) {
      const targetPages =
        newItem.type === 'target' && newItem.target
          ? isJuzUnit(newItem.unit)
            ? newItem.target * PAGES_PER_JUZ
            : isPageUnit(newItem.unit)
            ? newItem.target
            : tilawahTarget
          : tilawahTarget
      updateTodayEntry(newId, () => pagesToLinkedEntry(newItem, pagesReadToday, targetPages))
    }
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
    setCityMode('manual')
    setLocationMessage(null)
    setLocationError(null)
    try {
      localStorage.setItem('mizany_city', newCity)
      localStorage.setItem(CITY_MODE_STORAGE_KEY, 'manual')
    } catch {}
  }

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) return
    try {
      await deferredInstallPrompt.prompt()
      const choice = await deferredInstallPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setIsPwaInstalled(true)
      }
    } catch {
      // Ignore install prompt errors
    } finally {
      setDeferredInstallPrompt(null)
    }
  }

  const handleChangeTilawahTarget = (newTarget: number) => {
    const safeTarget = Math.max(1, Math.round(newTarget))
    setTilawahTarget(safeTarget)
    try {
      localStorage.setItem('mizany_tilawah_target', safeTarget.toString())
    } catch {}

    if (linkedQuranAmal?.type === 'target') {
      if (isPageUnit(linkedQuranAmal.unit)) {
        const updated = customAmalItems.map((item) =>
          item.id === linkedQuranAmal.id ? { ...item, target: safeTarget } : item
        )
        setCustomAmalItems(updated)
        try {
          localStorage.setItem('mizany_custom_amal', JSON.stringify(updated))
        } catch {}
      } else if (isJuzUnit(linkedQuranAmal.unit)) {
        const nextJuz = Math.max(1, Math.round(safeTarget / PAGES_PER_JUZ))
        const updated = customAmalItems.map((item) =>
          item.id === linkedQuranAmal.id ? { ...item, target: nextJuz } : item
        )
        setCustomAmalItems(updated)
        try {
          localStorage.setItem('mizany_custom_amal', JSON.stringify(updated))
        } catch {}
      }
    }
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const handleOpenChecklistForDate = (isoDate: string) => {
    const diff = diffIsoDays(isoDate, todayIso)
    if (diff < 0 || diff > 30) return
    setSelectedChecklistDate(isoDate)
    setActiveTab('beranda')
    setTimeout(() => scrollToSection('checklist-section'), 80)
  }

  return (
    <div className="min-h-screen bg-transparent relative">
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

      {/* Streak Ignition Celebration Modal */}
      <StreakCelebration
        isOpen={showStreakModal}
        streakDays={streakDays}
        last7DaysActive={last7DaysActive}
        onClose={() => setShowStreakModal(false)}
      />

      {/* Full-Screen Tasbih Canvas (mounted outside .view-enter transform so fixed inset-0 covers 100% viewport) */}
      {!showOnboarding && activeTab === 'tasbih' && <TasbihView onBack={() => setActiveTab('beranda')} />}

      {/* Main Container */}
      {!showOnboarding && activeTab !== 'tasbih' && (
        <main className="max-w-md mx-auto min-h-screen px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-28 relative z-10">
          <div key={activeTab} className="view-enter">
            {/* VIEW: BERANDA */}
            {activeTab === 'beranda' && (
              <div className="space-y-4">
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
                  prayerLoadFailed={prayerLoadFailed}
                  onRetryPrayer={() => setPrayerRetryTick((t) => t + 1)}
                  onOpenPrayerDetail={() => setActiveTab('prayer')}
                  onOpenCalendar={() => setActiveTab('kalender')}
                />

                <QuickActions
                  streakDays={streakDays}
                  last7DaysActive={last7DaysActive}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onScrollToChecklist={() => scrollToSection('checklist-section')}
                  onOpenStreak={() => setShowStreakModal(true)}
                />

                <PrayerRow
                  city={city}
                  prayers={prayerSchedule?.prayers}
                  onSelectPrayer={() => setActiveTab('prayer')}
                />

                <AmalChecklist
                  items={hydratedItems}
                  selectedDateIso={selectedChecklistDate}
                  todayIso={todayIso}
                  onChangeDate={setSelectedChecklistDate}
                  onTogglePrayer={handleTogglePrayer}
                  onToggleCheck={handleToggleCheck}
                  onIncrementCounter={handleIncrementCounter}
                  onUpdateValue={handleUpdateValue}
                  onOpenAddAmal={handleOpenAddAmal}
                />
              </div>
            )}

            {/* VIEW: QURAN */}
            {activeTab === 'quran' && (
              <QuranView
                dailyTarget={effectiveQuranTarget}
                pagesReadToday={pagesReadToday}
                totalPagesRead={totalTilawahPages}
                hijriDateLabel={hijriData?.formattedDate}
                linkedAmalName={linkedQuranAmal?.name}
                onChangePagesToday={handleChangeQuranPages}
                onChangeDailyTarget={handleChangeTilawahTarget}
                onAddToChecklist={handleAddQuranToChecklist}
              />
            )}

            {/* VIEW: KALENDER */}
            {activeTab === 'kalender' && (
              <KalenderView
                hijriData={hijriData}
                todayIso={todayIso}
                dailyLogs={dailyLogs}
                customAmalItems={customAmalItems}
                effectiveQuranTarget={effectiveQuranTarget}
                onOpenChecklistForDate={handleOpenChecklistForDate}
              />
            )}

            {/* VIEW: ATUR */}
            {activeTab === 'atur' && (
              <AturView
                city={city}
                cityMode={cityMode}
                isLocatingCity={isLocatingCity}
                locationMessage={locationMessage}
                locationError={locationError}
                onDetectLocation={() => runDeviceGeolocation(true)}
                onChangeCity={handleChangeCity}
                tilawahTarget={effectiveQuranTarget}
                onChangeTilawahTarget={handleChangeTilawahTarget}
                customAmalItems={customAmalItems}
                onOpenAddAmal={handleOpenAddAmal}
                onEditAmal={handleOpenEditAmal}
                onDeleteCustomAmal={handleDeleteCustomAmal}
                onReplayOnboarding={() => setShowOnboarding(true)}
                canInstallPwa={Boolean(deferredInstallPrompt)}
                isPwaInstalled={isPwaInstalled}
                onInstallPwa={handleInstallPwa}
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
      )}

      {/* Bottom Nav (hidden during Onboarding and full-screen Tasbih mode) */}
      {!showOnboarding && activeTab !== 'tasbih' && (
        <BottomNav
          activeTab={activeTab === 'prayer' ? 'beranda' : activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
        />
      )}
    </div>
  )
}
