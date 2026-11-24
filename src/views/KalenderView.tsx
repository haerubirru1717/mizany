import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'
import { AmalItem, DailyLogsByDate, MandatoryPrayerKey } from '../types'
import {
  HijriHeroData,
  GregorianCalendarMonth,
  GregorianCalendarDay,
  GREGORIAN_MONTH_NAMES_ID,
  GREGORIAN_MONTH_SHORT_ID,
  HIJRI_MONTH_NAMES,
  fetchGregorianCalendarMonth,
  getJavanesePasaran,
  getWeekdayNameId,
} from '../services/hijriService'
import {
  computePeriodRecap,
  countDayPrayers,
  diffIsoDays,
  getElapsedDatesInMonth,
  getLast7Dates,
  getLocalIsoDate,
  hasCompletedAny,
} from '../utils/recapStats'

interface KalenderViewProps {
  hijriData?: HijriHeroData | null
  todayIso?: string
  dailyLogs?: DailyLogsByDate
  customAmalItems?: AmalItem[]
  effectiveQuranTarget?: number
  onOpenChecklistForDate?: (isoDate: string) => void
}

const WEEKDAY_HEADERS = [
  { label: 'Ahd', full: 'Ahad', isSunday: true, isFriday: false },
  { label: 'Sen', full: 'Senin', isSunday: false, isFriday: false },
  { label: 'Sel', full: 'Selasa', isSunday: false, isFriday: false },
  { label: 'Rab', full: 'Rabu', isSunday: false, isFriday: false },
  { label: 'Kam', full: 'Kamis', isSunday: false, isFriday: false },
  { label: 'Jum', full: 'Jumat', isSunday: false, isFriday: true },
  { label: 'Sab', full: 'Sabtu', isSunday: false, isFriday: false },
]

const PRAYER_LABELS: { key: MandatoryPrayerKey; label: string }[] = [
  { key: 'subuh', label: 'Subuh' },
  { key: 'dzuhur', label: 'Dzuhur' },
  { key: 'ashar', label: 'Ashar' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isya', label: 'Isya' },
]

const MAX_BACKFILL_DAYS = 30

function formatHijriIsoToLabel(hijriIso: string): string {
  const [y, m, d] = String(hijriIso || '').split('-').map(Number)
  if (!y || !m || !d) return hijriIso
  return `${d} ${HIJRI_MONTH_NAMES[m] || `Bulan ${m}`} ${y} H`
}

function parseIsoParts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return { year: y, month: m, day: d }
}

export const KalenderView: React.FC<KalenderViewProps> = ({
  hijriData,
  todayIso: todayIsoProp,
  dailyLogs = {},
  customAmalItems = [],
  effectiveQuranTarget = 20,
  onOpenChecklistForDate,
}) => {
  const todayIso = useMemo(
    () => todayIsoProp || hijriData?.today?.gregorian || getLocalIsoDate(0),
    [todayIsoProp, hijriData?.today?.gregorian]
  )
  const todayParts = useMemo(() => parseIsoParts(todayIso), [todayIso])

  const [viewYear, setViewYear] = useState<number>(todayParts.year)
  const [viewMonth, setViewMonth] = useState<number>(todayParts.month)
  const [monthData, setMonthData] = useState<GregorianCalendarMonth | null>(null)
  const [loadingMonth, setLoadingMonth] = useState<boolean>(true)
  const [loadFailed, setLoadFailed] = useState<boolean>(false)
  const [selectedIso, setSelectedIso] = useState<string>(todayIso)
  const [activeSubTab, setActiveSubTab] = useState<'rekap' | 'events' | 'puasa'>('rekap')
  const [recapRange, setRecapRange] = useState<'week' | 'month'>('week')

  useEffect(() => {
    setSelectedIso(todayIso)
  }, [todayIso])

  const loadMonth = useCallback(() => {
    let active = true
    setLoadingMonth(true)
    setLoadFailed(false)
    fetchGregorianCalendarMonth(viewYear, viewMonth, todayIso)
      .then((data) => {
        if (!active) return
        if (data) {
          setMonthData(data)
        } else {
          setLoadFailed(true)
        }
        setLoadingMonth(false)
      })
      .catch(() => {
        if (!active) return
        setLoadFailed(true)
        setLoadingMonth(false)
      })
    return () => {
      active = false
    }
  }, [viewYear, viewMonth, todayIso])

  useEffect(() => {
    return loadMonth()
  }, [loadMonth])

  const handleShiftMonth = (delta: number) => {
    let nextMonth = viewMonth + delta
    let nextYear = viewYear
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    } else if (nextMonth < 1) {
      nextMonth = 12
      nextYear -= 1
    }
    setViewYear(nextYear)
    setViewMonth(nextMonth)
  }

  const handleJumpToday = () => {
    setViewYear(todayParts.year)
    setViewMonth(todayParts.month)
    setSelectedIso(todayIso)
  }

  const isCurrentMonth = viewYear === todayParts.year && viewMonth === todayParts.month

  const eventsByDate = useMemo(() => {
    const map = new Map<string, string[]>()
    const list = monthData?.events || hijriData?.events || []
    for (const ev of list) {
      const existing = map.get(ev.gregorian) || []
      existing.push(ev.name)
      map.set(ev.gregorian, existing)
    }
    return map
  }, [monthData?.events, hijriData?.events])

  const { leadingDays, trailingDays } = useMemo(() => {
    if (!monthData) return { leadingDays: [] as number[], trailingDays: [] as number[] }
    const prevMonthDaysCount = new Date(Date.UTC(viewYear, viewMonth - 1, 0)).getUTCDate()
    const leadCount = monthData.firstWeekdayIndex
    const lead: number[] = []
    for (let i = leadCount - 1; i >= 0; i--) {
      lead.push(prevMonthDaysCount - i)
    }

    const totalUsed = lead.length + monthData.days.length
    const trailCount = (7 - (totalUsed % 7)) % 7
    const trail: number[] = []
    for (let i = 1; i <= trailCount; i++) {
      trail.push(i)
    }
    return { leadingDays: lead, trailingDays: trail }
  }, [monthData, viewYear, viewMonth])

  const selectedDay: GregorianCalendarDay | null = useMemo(() => {
    if (!monthData) return null
    return (
      monthData.days.find((d) => d.gregorian === selectedIso) ||
      monthData.days.find((d) => d.isToday) ||
      monthData.days[0] ||
      null
    )
  }, [monthData, selectedIso])

  // Concise formatted date using short month name so it never truncates at 390px
  const headerGregorianLine = useMemo(() => {
    if (selectedDay) {
      const mShort = GREGORIAN_MONTH_SHORT_ID[selectedDay.gregorianMonth] || ''
      return `${selectedDay.weekday} ${selectedDay.pasaran}, ${selectedDay.gregorianDay} ${mShort} ${selectedDay.gregorianYear}`
    }
    const wd = getWeekdayNameId(todayIso)
    const pas = getJavanesePasaran(todayIso)
    const p = parseIsoParts(todayIso)
    return `${wd.name} ${pas}, ${p.day} ${GREGORIAN_MONTH_SHORT_ID[p.month] || ''} ${p.year}`
  }, [selectedDay, todayIso])

  const headerHijriLine = useMemo(() => {
    if (selectedDay) return selectedDay.hijriFullLabel
    return hijriData?.formattedDate || 'Memuat kalender Neo MABIMS...'
  }, [selectedDay, hijriData?.formattedDate])

  const selectedCanEditChecklist = useMemo(() => {
    if (!selectedDay || !onOpenChecklistForDate) return false
    const diff = diffIsoDays(selectedDay.gregorian, todayIso)
    return diff >= 0 && diff <= MAX_BACKFILL_DAYS
  }, [selectedDay, todayIso, onOpenChecklistForDate])

  const selectedDayPrayerCount = selectedDay ? countDayPrayers(dailyLogs[selectedDay.gregorian]) : 0
  const selectedDayHasLogs = selectedDay ? hasCompletedAny(dailyLogs[selectedDay.gregorian]) : false

  const monthPrefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}-`
  const allYearEvents = monthData?.events || hijriData?.events || []
  const monthEvents = useMemo(
    () => allYearEvents.filter((ev) => ev.gregorian.startsWith(monthPrefix)),
    [allYearEvents, monthPrefix]
  )
  const displayedEvents = monthEvents.length > 0 ? monthEvents : allYearEvents

  const sunnahFastingDays = useMemo(() => {
    if (!monthData) return []
    return monthData.days.filter((d) => d.isSunnahFasting || d.isRamadan)
  }, [monthData])

  const hasRamadanDays = useMemo(
    () => Boolean(monthData?.days.some((d) => d.isRamadan)),
    [monthData]
  )

  const recapData = useMemo(() => {
    const dates =
      recapRange === 'week'
        ? getLast7Dates(todayIso)
        : getElapsedDatesInMonth(viewYear, viewMonth, todayIso)
    return computePeriodRecap({
      dates,
      dailyLogs,
      customAmalItems,
      effectiveQuranTarget,
    })
  }, [recapRange, todayIso, viewYear, viewMonth, dailyLogs, customAmalItems, effectiveQuranTarget])

  return (
    <div className="space-y-4 pb-28">
      {/* Top Active Date Banner (rich Tazkirah Blue anchor, zero truncation) */}
      <div className="bg-gradient-to-r from-[#0F50BD] to-[#1941B5] text-white p-4 rounded-[22px] shadow-[0_8px_22px_rgba(25,65,181,0.2)] flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/18 border border-white/25 flex items-center justify-center shrink-0">
            <CalendarIcon size={19} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-white leading-snug">
              {headerGregorianLine}
            </div>
            <div className="text-xs text-[#DBEAFE] font-medium mt-0.5 truncate">
              {headerHijriLine}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedCanEditChecklist && selectedDay && onOpenChecklistForDate && (
            <button
              type="button"
              onClick={() => onOpenChecklistForDate(selectedDay.gregorian)}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white text-[#0F50BD] text-[11px] font-bold inline-flex items-center gap-1 shadow-sm hover:bg-[#EFF6FF] active:scale-95 transition-all cursor-pointer"
            >
              <span>{selectedDayHasLogs ? `Amal ${selectedDayPrayerCount}/5` : 'Isi Amal'}</span>
              <ArrowUpRight size={13} strokeWidth={2.5} aria-hidden="true" />
            </button>
          )}
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={handleJumpToday}
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white/18 border border-white/25 text-[11px] font-bold text-white hover:bg-white/28 cursor-pointer"
            >
              Hari ini
            </button>
          )}
        </div>
      </div>

      {/* NU-Style Gregorian-Primary + Arabic-Indic Hijri Calendar Grid */}
      <div className="glass-card overflow-hidden">
        {/* Month Navigation Header */}
        <div className="px-3.5 py-3 flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={() => handleShiftMonth(-1)}
            className="w-9 h-9 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#0F50BD] cursor-pointer active:scale-95 transition-colors"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="text-center min-w-0 px-2">
            <h1 className="text-base font-extrabold text-[#101828] leading-tight">
              {GREGORIAN_MONTH_NAMES_ID[viewMonth]} {viewYear}
            </h1>
            <p className="text-xs font-medium text-[#475467] mt-0.5 truncate">
              {monthData?.hijriRangeLabel || 'Kalender Neo MABIMS'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleShiftMonth(1)}
            className="w-9 h-9 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#0F50BD] cursor-pointer active:scale-95 transition-colors"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-[#F8FAFC] border-y border-[#EEF2F6] text-center">
          {WEEKDAY_HEADERS.map((wd) => (
            <div
              key={wd.label}
              title={wd.full}
              className={`py-2 text-[11px] font-bold ${
                wd.isSunday
                  ? 'text-red-700'
                  : wd.isFriday
                  ? 'text-[#0F766E]'
                  : 'text-[#475467]'
              }`}
            >
              {wd.label}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loadingMonth ? (
          <div className="py-14 text-center text-xs text-[#475467]">
            Memuat kalender {GREGORIAN_MONTH_NAMES_ID[viewMonth]} {viewYear}...
          </div>
        ) : loadFailed || !monthData ? (
          <div className="py-12 px-4 text-center space-y-2.5">
            <p className="text-xs text-[#475467]">
              Gagal memuat data kalender Neo MABIMS. Periksa koneksi internet.
            </p>
            <button
              type="button"
              onClick={loadMonth}
              className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#0F50BD] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#1941B5] cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Coba Lagi</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-7 bg-white">
            {/* Leading days */}
            {leadingDays.map((dayNum, idx) => (
              <div
                key={`lead-${idx}`}
                className="min-h-[62px] border-r border-b border-[#F1F5F9] flex items-center justify-center text-sm font-semibold text-[#CBD5E1] select-none"
              >
                {dayNum}
              </div>
            ))}

            {/* Current Gregorian month days */}
            {monthData.days.map((d) => {
              const isSunday = d.weekdayIndex === 0
              const isFriday = d.weekdayIndex === 5
              const isSelected = d.gregorian === selectedIso
              const eventNames = eventsByDate.get(d.gregorian)
              const hasEvent = Boolean(eventNames && eventNames.length > 0)
              const hasAmalRecorded = hasCompletedAny(dailyLogs[d.gregorian])

              const dayColorClass = isSunday
                ? 'text-red-700'
                : isFriday
                ? 'text-[#0F766E]'
                : 'text-[#101828]'

              const hijriColorClass = isSunday
                ? 'text-red-700'
                : isFriday
                ? 'text-[#0F766E]'
                : 'text-[#475467]'

              const statusParts: string[] = []
              if (hasAmalRecorded) statusParts.push('Amal tercatat')
              if (hasEvent && eventNames) statusParts.push(`Hari besar: ${eventNames.join(', ')}`)
              if (d.isSunnahFasting) statusParts.push(`Puasa sunnah: ${d.fastingLabels.join(', ')}`)
              const ariaLabel = [
                `${d.weekday} ${d.pasaran}, ${d.gregorianFullLabel}`,
                d.hijriFullLabel,
                ...statusParts,
              ].join('. ')

              return (
                <button
                  key={d.gregorian}
                  type="button"
                  onClick={() => setSelectedIso(d.gregorian)}
                  aria-label={ariaLabel}
                  aria-pressed={isSelected}
                  className={`min-h-[62px] px-0.5 py-1.5 border-r border-b border-[#F1F5F9] flex flex-col items-center justify-between relative cursor-pointer transition-colors ${
                    d.isToday
                      ? 'bg-[#EFF6FF] ring-2 ring-inset ring-[#0F50BD]'
                      : isSelected
                      ? 'bg-[#F0FDFA] ring-2 ring-inset ring-[#0F766E]'
                      : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  {/* Arabic-Indic Hijri (>=11px real Arabic font) + Big Masehi */}
                  <div className="flex items-baseline justify-center gap-0.5 leading-none mt-0.5">
                    <span className={`font-arabic text-[11px] font-semibold ${hijriColorClass}`}>
                      {d.hijriDayArabic}
                    </span>
                    <span className={`text-[15px] font-bold tabular-nums ${dayColorClass}`}>
                      {d.gregorianDay}
                    </span>
                  </div>

                  {/* Javanese Pasaran (>=11px) */}
                  <span className="text-[11px] font-medium text-[#475467] leading-tight mt-0.5 truncate max-w-full">
                    {d.pasaran}
                  </span>

                  {/* Indicator Dots */}
                  <div className="h-2 flex items-center justify-center gap-1 mt-0.5" aria-hidden="true">
                    {hasAmalRecorded && <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />}
                    {hasEvent && <span className="w-1.5 h-1.5 rounded-full bg-[#0F50BD]" />}
                    {d.isSunnahFasting && <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />}
                  </div>

                  {d.isLailatulQadr && (
                    <span className="absolute top-0.5 right-0.5 text-[#B45309]" aria-hidden="true">
                      <Sparkles size={9} fill="currentColor" />
                    </span>
                  )}
                </button>
              )
            })}

            {/* Trailing days */}
            {trailingDays.map((dayNum, idx) => (
              <div
                key={`trail-${idx}`}
                className="min-h-[62px] border-r border-b border-[#F1F5F9] flex items-center justify-center text-sm font-semibold text-[#CBD5E1] select-none"
              >
                {dayNum}
              </div>
            ))}
          </div>
        )}

        {/* Compact Legend (>=11px, WCAG AA contrast) */}
        <div className="px-3 py-2.5 bg-[#F8FAFC] border-t border-[#EEF2F6] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-medium text-[#475467]">
          <span className="flex items-center gap-1.5">
            <i className="w-2 h-2 rounded-full bg-[#0F766E] inline-block" aria-hidden="true" />
            Amal Tercatat
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-2 h-2 rounded-full bg-[#D97706] inline-block" aria-hidden="true" />
            Puasa Sunnah
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-2 h-2 rounded-full bg-[#0F50BD] inline-block" aria-hidden="true" />
            Hari Besar
          </span>
          {hasRamadanDays && (
            <span className="flex items-center gap-1 text-[#B45309] font-semibold">
              <Sparkles size={11} fill="currentColor" aria-hidden="true" />
              Malam Ganjil
            </span>
          )}
        </div>
      </div>

      {/* Bottom 3-Tab Card: Rekap | Hari Besar | Puasa Sunnah (Zero nested cards) */}
      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-3 border-b border-[#EEF2F6] bg-white" role="tablist">
          {(
            [
              { id: 'rekap', label: 'Rekap' },
              { id: 'events', label: 'Hari Besar' },
              { id: 'puasa', label: 'Puasa Sunnah' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeSubTab === tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`min-h-[44px] py-3 text-xs font-bold transition-colors cursor-pointer relative ${
                activeSubTab === tab.id
                  ? 'text-[#0F50BD]'
                  : 'text-[#475467] hover:text-[#101828]'
              }`}
            >
              {tab.label}
              {activeSubTab === tab.id && (
                <span className="absolute bottom-0 inset-x-4 h-[2.5px] rounded-full bg-[#0F50BD]" />
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* TAB 1: REKAP MINGGUAN & BULANAN (Flat, crisp, zero nested cards) */}
          {activeSubTab === 'rekap' && (
            <div className="space-y-5">
              {/* Period switcher */}
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex p-0.5 rounded-xl bg-[#F1F5F9]">
                  <button
                    type="button"
                    onClick={() => setRecapRange('week')}
                    className={`min-h-[34px] px-3 py-1 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                      recapRange === 'week'
                        ? 'bg-white text-[#0F50BD] shadow-sm'
                        : 'text-[#475467] hover:text-[#101828]'
                    }`}
                  >
                    7 Hari Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecapRange('month')}
                    className={`min-h-[34px] px-3 py-1 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                      recapRange === 'month'
                        ? 'bg-white text-[#0F50BD] shadow-sm'
                        : 'text-[#475467] hover:text-[#101828]'
                    }`}
                  >
                    {GREGORIAN_MONTH_SHORT_ID[viewMonth]} {viewYear}
                  </button>
                </div>

                <span className="text-xs font-medium text-[#475467] tabular-nums">
                  {recapData.daysCount > 0 ? `${recapData.daysCount} hari` : 'Belum masuk'}
                </span>
              </div>

              {recapData.daysCount === 0 ? (
                <p className="text-xs text-center text-[#475467] py-6">
                  Bulan {GREGORIAN_MONTH_NAMES_ID[viewMonth]} {viewYear} belum berjalan.
                </p>
              ) : (
                <>
                  {/* Warm Soft-Tinted 3-Column KPI Tiles (borderless so zero nested-card feel) */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl bg-[#F4F7FF] p-3 text-center">
                      <div className="text-lg font-extrabold text-[#0F50BD] tabular-nums leading-tight">
                        {recapData.prayersTotal}
                        <span className="text-xs font-semibold text-[#475467]">
                          /{recapData.prayersPossible}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#475467] mt-1">
                        Sholat ({recapData.prayersPercent}%)
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#FFFBEB] p-3 text-center">
                      <div className="text-lg font-extrabold text-[#B45309] tabular-nums leading-tight">
                        {recapData.activeDays}
                        <span className="text-xs font-semibold text-[#475467]">
                          /{recapData.daysCount}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#475467] mt-1">
                        Hari Aktif
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#F0FDFA] p-3 text-center">
                      <div className="text-lg font-extrabold text-[#0F766E] tabular-nums leading-tight">
                        {recapData.tilawahPages}
                      </div>
                      <div className="text-[11px] font-semibold text-[#475467] mt-1">
                        Hal Tilawah
                      </div>
                    </div>
                  </div>

                  {/* 7-Day Vertical Consistency Bar Chart (flat divider section) */}
                  {recapRange === 'week' && (
                    <div className="pt-4 border-t border-[#EEF2F6]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[#101828]">Grafik 7 Hari</span>
                        <span className="text-[11px] text-[#475467]">Ketuk hari untuk koreksi</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-1">
                        {recapData.dailyBars.map((bar) => {
                          const isBarToday = bar.iso === todayIso
                          const heightPct = Math.max(bar.hasAny ? 16 : 6, bar.overallPercent)
                          return (
                            <button
                              key={bar.iso}
                              type="button"
                              onClick={() => onOpenChecklistForDate?.(bar.iso)}
                              aria-label={`${bar.weekdayShort} ${bar.dayNum}: ${bar.prayerCount} dari 5 sholat (${bar.overallPercent}%)`}
                              className="flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
                            >
                              <span className="text-[11px] font-semibold text-[#475467] tabular-nums">
                                {bar.prayerCount}
                              </span>
                              <div className="w-full max-w-[22px] flex-1 bg-[#F1F5F9] rounded-full overflow-hidden flex items-end">
                                <div
                                  className={`w-full rounded-full transition-all duration-300 ${
                                    bar.hasAny
                                      ? isBarToday
                                        ? 'bg-gradient-to-t from-[#0F50BD] to-[#14B8A6]'
                                        : 'bg-[#0F50BD]/80 group-hover:bg-[#0F50BD]'
                                      : 'bg-[#CBD5E1]'
                                  }`}
                                  style={{ height: `${heightPct}%` }}
                                />
                              </div>
                              <span
                                className={`text-[11px] leading-none ${
                                  isBarToday ? 'font-bold text-[#0F50BD]' : 'font-medium text-[#475467]'
                                }`}
                              >
                                {bar.weekdayShort}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Per-Prayer 5-Waktu Breakdown (spacious flat rows — never cramped) */}
                  <div className="pt-4 border-t border-[#EEF2F6] space-y-2.5">
                    <div className="text-xs font-bold text-[#101828]">Rincian Sholat 5 Waktu</div>
                    <div className="space-y-2">
                      {PRAYER_LABELS.map((p) => {
                        const done = recapData.prayerBreakdown[p.key]
                        const pct =
                          recapData.daysCount > 0
                            ? Math.round((done / recapData.daysCount) * 100)
                            : 0
                        return (
                          <div key={p.key} className="flex items-center gap-3">
                            <span className="w-16 text-xs font-semibold text-[#334155] shrink-0">
                              {p.label}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-[#EEF2F6] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#0F50BD] to-[#14B8A6] transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-xs font-bold text-[#101828] tabular-nums shrink-0">
                              {done}/{recapData.daysCount}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Custom Amals Progress Summary (flat rows) */}
                  {recapData.customAmalStats.length > 0 && (
                    <div className="pt-4 border-t border-[#EEF2F6] space-y-2.5">
                      <div className="text-xs font-bold text-[#101828]">Amal Tambahan</div>
                      <div className="space-y-3">
                        {recapData.customAmalStats.map((stat) => {
                          const pct =
                            recapData.daysCount > 0
                              ? Math.min(100, Math.round((stat.completedDays / recapData.daysCount) * 100))
                              : 0
                          return (
                            <div key={stat.id} className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-bold text-[#101828] truncate">
                                  {stat.name}
                                </span>
                                <span className="text-xs font-semibold text-[#0F50BD] shrink-0 tabular-nums">
                                  {stat.summaryLabel}
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-[#EEF2F6] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#0F50BD] to-[#14B8A6]"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-center text-[#475467] pt-3 border-t border-[#EEF2F6] leading-relaxed">
                    Rekap ini alat bantu muhasabah &amp; menjaga konsistensi, bukan ukuran diterimanya amal.
                  </p>
                </>
              )}
            </div>
          )}

          {/* TAB 2: HARI BESAR ISLAM */}
          {activeSubTab === 'events' &&
            (displayedEvents.length > 0 ? (
              <div className="space-y-2">
                {monthEvents.length === 0 && (
                  <p className="text-xs text-[#475467] mb-1">
                    Tidak ada hari besar Islam di {GREGORIAN_MONTH_NAMES_ID[viewMonth]} {viewYear}. Menampilkan jadwal tahun ini:
                  </p>
                )}
                <div className="divide-y divide-[#EEF2F6]">
                  {displayedEvents.map((ev) => {
                    const p = parseIsoParts(ev.gregorian)
                    const wd = getWeekdayNameId(ev.gregorian)
                    const hijriLabel = formatHijriIsoToLabel(ev.hijri)
                    return (
                      <div
                        key={`${ev.event}-${ev.gregorian}`}
                        className="py-3 first:pt-1 last:pb-1 flex items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex flex-col items-center justify-center shrink-0">
                          <span className="text-[11px] font-semibold text-[#475467] leading-none">
                            {GREGORIAN_MONTH_SHORT_ID[p.month]}
                          </span>
                          <span className="text-sm font-extrabold text-[#0F50BD] leading-tight mt-0.5 tabular-nums">
                            {p.day}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm font-bold leading-snug ${
                              ev.isPast ? 'text-[#475467]' : 'text-[#101828]'
                            }`}
                          >
                            {ev.name}
                          </div>
                          <div className="text-xs text-[#475467] mt-0.5">
                            {wd.name}, {p.day} {GREGORIAN_MONTH_SHORT_ID[p.month]} {p.year} · {hijriLabel}
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                            ev.isPast
                              ? 'bg-[#F1F5F9] text-[#475467]'
                              : ev.daysLeft === 0
                              ? 'bg-[#F0FDFA] text-[#0F766E]'
                              : 'bg-[#EFF6FF] text-[#0F50BD]'
                          }`}
                        >
                          {ev.isPast
                            ? 'Lewat'
                            : ev.daysLeft === 0
                            ? 'Hari ini'
                            : `${ev.daysLeft} hr`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-center text-[#475467] py-4">
                Memuat daftar hari besar Islam...
              </p>
            ))}

          {/* TAB 3: PUASA SUNNAH */}
          {activeSubTab === 'puasa' &&
            (sunnahFastingDays.length > 0 ? (
              <div className="divide-y divide-[#EEF2F6]">
                {sunnahFastingDays.map((d) => (
                  <button
                    key={d.gregorian}
                    type="button"
                    onClick={() => setSelectedIso(d.gregorian)}
                    className="w-full py-3 first:pt-1 last:pb-1 flex items-center gap-3 text-left cursor-pointer hover:bg-[#F8FAFC] rounded-lg transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#FFFBEB] flex flex-col items-center justify-center shrink-0">
                      <span className="text-[11px] font-semibold text-[#475467] leading-none">
                        {GREGORIAN_MONTH_SHORT_ID[d.gregorianMonth]}
                      </span>
                      <span className="text-sm font-extrabold text-[#B45309] leading-tight mt-0.5 tabular-nums">
                        {d.gregorianDay}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#101828] leading-snug">
                        {d.fastingLabels.join(' · ')}
                      </div>
                      <div className="text-xs text-[#475467] mt-0.5">
                        {d.weekday} {d.pasaran}, {d.gregorianDay} {GREGORIAN_MONTH_SHORT_ID[d.gregorianMonth]} · {d.hijriFullLabel}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center text-[#475467] py-4">
                Tidak ada jadwal puasa sunnah di bulan ini.
              </p>
            ))}
        </div>
      </div>

      <p className="text-xs text-center text-[#475467]">
        Sumber resmi: Neo MABIMS · Kementerian Agama RI (mabims.dev)
      </p>
    </div>
  )
}
