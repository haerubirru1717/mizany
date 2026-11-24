import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Flame,
  ArrowUpRight,
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
  { label: 'Ahad', isSunday: true, isFriday: false },
  { label: 'Senin', isSunday: false, isFriday: false },
  { label: 'Selasa', isSunday: false, isFriday: false },
  { label: 'Rabu', isSunday: false, isFriday: false },
  { label: 'Kamis', isSunday: false, isFriday: false },
  { label: 'Jumat', isSunday: false, isFriday: true },
  { label: 'Sabtu', isSunday: false, isFriday: false },
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
  const [selectedIso, setSelectedIso] = useState<string>(todayIso)
  const [activeSubTab, setActiveSubTab] = useState<'rekap' | 'events' | 'puasa'>('rekap')
  const [recapRange, setRecapRange] = useState<'week' | 'month'>('week')

  // Sync today when hijriData updates
  useEffect(() => {
    setSelectedIso(todayIso)
  }, [todayIso])

  // Fetch official Neo MABIMS Gregorian month data whenever viewYear / viewMonth changes
  useEffect(() => {
    let active = true
    setLoadingMonth(true)
    fetchGregorianCalendarMonth(viewYear, viewMonth, todayIso).then((data) => {
      if (!active) return
      setMonthData(data)
      setLoadingMonth(false)
    })
    return () => {
      active = false
    }
  }, [viewYear, viewMonth, todayIso])

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

  // Map Islamic events by gregorian ISO date for fast blue dot rendering
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

  // Leading & trailing muted Gregorian days to form a complete 7-column rectangular calendar grid
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

  // Selected day metadata for the top header bar (defaults to today)
  const selectedDay: GregorianCalendarDay | null = useMemo(() => {
    if (!monthData) return null
    return (
      monthData.days.find((d) => d.gregorian === selectedIso) ||
      monthData.days.find((d) => d.isToday) ||
      monthData.days[0] ||
      null
    )
  }, [monthData, selectedIso])

  const headerGregorianLine = useMemo(() => {
    if (selectedDay) {
      return `${selectedDay.weekday} ${selectedDay.pasaran}, ${selectedDay.gregorianFullLabel}`
    }
    const wd = getWeekdayNameId(todayIso)
    const pas = getJavanesePasaran(todayIso)
    const p = parseIsoParts(todayIso)
    return `${wd.name} ${pas}, ${p.day} ${GREGORIAN_MONTH_NAMES_ID[p.month] || ''} ${p.year}`
  }, [selectedDay, todayIso])

  const headerHijriLine = useMemo(() => {
    if (selectedDay) return selectedDay.hijriFullLabel
    return hijriData?.formattedDate || 'Memuat kalender Neo MABIMS...'
  }, [selectedDay, hijriData?.formattedDate])

  // Check if selected date can be opened for checklist editing (today or up to 30 days back)
  const selectedCanEditChecklist = useMemo(() => {
    if (!selectedDay || !onOpenChecklistForDate) return false
    const diff = diffIsoDays(selectedDay.gregorian, todayIso)
    return diff >= 0 && diff <= MAX_BACKFILL_DAYS
  }, [selectedDay, todayIso, onOpenChecklistForDate])

  const selectedDayPrayerCount = selectedDay ? countDayPrayers(dailyLogs[selectedDay.gregorian]) : 0
  const selectedDayHasLogs = selectedDay ? hasCompletedAny(dailyLogs[selectedDay.gregorian]) : false

  // Events occurring in the currently viewed Gregorian month + full year list
  const monthPrefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}-`
  const allYearEvents = monthData?.events || hijriData?.events || []
  const monthEvents = useMemo(
    () => allYearEvents.filter((ev) => ev.gregorian.startsWith(monthPrefix)),
    [allYearEvents, monthPrefix]
  )
  const displayedEvents = monthEvents.length > 0 ? monthEvents : allYearEvents

  // Sunnah fasting days in the currently viewed Gregorian month
  const sunnahFastingDays = useMemo(() => {
    if (!monthData) return []
    return monthData.days.filter((d) => d.isSunnahFasting || d.isRamadan)
  }, [monthData])

  const hasRamadanDays = useMemo(
    () => Boolean(monthData?.days.some((d) => d.isRamadan)),
    [monthData]
  )

  // Compute Weekly (last 7 days) & Monthly (elapsed days of viewed month) worship recap
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
    <div className="space-y-4 pb-24">
      {/* Top Active Date Banner (in Tazkirah Blue) */}
      <div className="bg-gradient-to-r from-[#0F50BD] to-[#1941B5] text-white p-4 rounded-[20px] shadow-[0_8px_22px_rgba(25,65,181,0.2)] flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
            <CalendarIcon size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[13.5px] font-bold leading-snug truncate">
              {headerGregorianLine}
            </div>
            <div className="text-xs text-white/85 font-medium truncate mt-0.5">
              {headerHijriLine}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedCanEditChecklist && selectedDay && onOpenChecklistForDate && (
            <button
              type="button"
              onClick={() => onOpenChecklistForDate(selectedDay.gregorian)}
              className="px-2.5 py-1.5 rounded-full bg-white text-[#0F50BD] text-[10.5px] font-bold inline-flex items-center gap-1 hover:bg-blue-50 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <span>{selectedDayHasLogs ? `Amal ${selectedDayPrayerCount}/5` : 'Isi Amal'}</span>
              <ArrowUpRight size={12} strokeWidth={2.6} />
            </button>
          )}
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={handleJumpToday}
              className="px-2.5 py-1.5 rounded-full bg-white/20 border border-white/30 text-[10.5px] font-bold text-white hover:bg-white/30 cursor-pointer"
            >
              Hari ini
            </button>
          )}
        </div>
      </div>

      {/* Gregorian-Primary + Small Arabic-Indic Hijri Calendar Card */}
      <div className="glass-card overflow-hidden">
        {/* Month Navigation Header */}
        <div className="px-4 py-3.5 flex items-center justify-between bg-white/80">
          <button
            type="button"
            onClick={() => handleShiftMonth(-1)}
            className="w-8 h-8 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center text-[#0F50BD] cursor-pointer active:scale-95 transition-all"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="text-center min-w-0 px-2">
            <h2 className="text-base font-extrabold text-[#101828] leading-tight">
              {GREGORIAN_MONTH_NAMES_ID[viewMonth]} {viewYear}
            </h2>
            <p className="text-[11.5px] font-medium text-[#525252] mt-0.5 truncate">
              {monthData?.hijriRangeLabel || 'Memuat rentang Hijriah...'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleShiftMonth(1)}
            className="w-8 h-8 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center text-[#0F50BD] cursor-pointer active:scale-95 transition-all"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-[#F7F9FF] border-y border-black/[0.06] text-center">
          {WEEKDAY_HEADERS.map((wd) => (
            <div
              key={wd.label}
              className={`py-2 text-[11px] font-bold ${
                wd.isSunday
                  ? 'text-red-600'
                  : wd.isFriday
                  ? 'text-[#0F766E]'
                  : 'text-[#525252]'
              }`}
            >
              {wd.label}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loadingMonth || !monthData ? (
          <div className="py-14 text-center text-xs text-[#525252]">
            Memuat kalender {GREGORIAN_MONTH_NAMES_ID[viewMonth]} {viewYear}...
          </div>
        ) : (
          <div className="grid grid-cols-7 bg-white">
            {/* Leading days from previous Gregorian month */}
            {leadingDays.map((dayNum, idx) => (
              <div
                key={`lead-${idx}`}
                className="min-h-[60px] border-r border-b border-black/[0.05] flex items-center justify-center text-[15px] font-bold text-black/20 select-none"
              >
                {dayNum}
              </div>
            ))}

            {/* Current Gregorian month days */}
            {monthData.days.map((d) => {
              const isSunday = d.weekdayIndex === 0
              const isFriday = d.weekdayIndex === 5
              const isSelected = d.gregorian === selectedIso
              const hasEvent = eventsByDate.has(d.gregorian)
              const hasAmalRecorded = hasCompletedAny(dailyLogs[d.gregorian])

              const dayColorClass = isSunday
                ? 'text-red-600'
                : isFriday
                ? 'text-[#0F766E]'
                : 'text-[#101828]'

              const hijriColorClass = isSunday
                ? 'text-red-500'
                : isFriday
                ? 'text-[#0F766E]/90'
                : 'text-[#525252]'

              return (
                <button
                  key={d.gregorian}
                  type="button"
                  onClick={() => setSelectedIso(d.gregorian)}
                  aria-label={`${d.weekday} ${d.pasaran}, ${d.gregorianFullLabel}, ${d.hijriFullLabel}`}
                  className={`min-h-[60px] px-0.5 py-1.5 border-r border-b border-black/[0.05] flex flex-col items-center justify-between relative cursor-pointer transition-colors ${
                    d.isToday
                      ? 'bg-[#0F50BD]/[0.09] ring-2 ring-inset ring-[#0F50BD]'
                      : isSelected
                      ? 'bg-[#14B8A6]/[0.08] ring-2 ring-inset ring-[#14B8A6]'
                      : 'hover:bg-[#F7F9FF]'
                  }`}
                >
                  {/* Small Arabic-Indic Hijri on left + Big Masehi on right */}
                  <div className="flex items-baseline justify-center gap-1 leading-none mt-0.5">
                    <span className={`text-[10px] font-semibold ${hijriColorClass}`}>
                      {d.hijriDayArabic}
                    </span>
                    <span className={`text-[16px] font-bold tabular-nums ${dayColorClass}`}>
                      {d.gregorianDay}
                    </span>
                  </div>

                  {/* Javanese Pasaran */}
                  <span className="text-[9.5px] font-medium text-[#525252]/80 leading-tight mt-0.5 truncate max-w-full">
                    {d.pasaran}
                  </span>

                  {/* Indicator Dots (Teal = Amal Tercatat, Blue = Hari Besar Islam, Amber = Puasa Sunnah) */}
                  <div className="h-2 flex items-center justify-center gap-1 mt-0.5">
                    {hasAmalRecorded && <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />}
                    {hasEvent && <span className="w-1.5 h-1.5 rounded-full bg-[#0F50BD]" />}
                    {d.isSunnahFasting && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                    )}
                  </div>

                  {/* Subtle Lailatul Qadr marker on odd nights 21-29 Ramadan */}
                  {d.isLailatulQadr && (
                    <span className="absolute top-0.5 right-0.5 text-[#F59E0B]">
                      <Sparkles size={9} fill="currentColor" />
                    </span>
                  )}
                </button>
              )
            })}

            {/* Trailing days from next Gregorian month */}
            {trailingDays.map((dayNum, idx) => {
              const colIdx = (leadingDays.length + monthData.days.length + idx) % 7
              return (
                <div
                  key={`trail-${idx}`}
                  className={`min-h-[60px] border-r border-b border-black/[0.05] flex items-center justify-center text-[15px] font-bold select-none ${
                    colIdx === 5
                      ? 'text-[#0F766E]/30'
                      : colIdx === 0
                      ? 'text-red-500/25'
                      : 'text-black/20'
                  }`}
                >
                  {dayNum}
                </div>
              )
            })}
          </div>
        )}

        {/* Compact Legend */}
        <div className="px-3 py-2.5 bg-[#F7F9FF]/70 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 text-[10.5px] text-[#525252]">
          <span className="flex items-center gap-1.5">
            <i className="w-2 h-2 rounded-full bg-[#14B8A6] inline-block" /> Amal Tercatat
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" /> Puasa Sunnah
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-2 h-2 rounded-full bg-[#0F50BD] inline-block" /> Hari Besar
          </span>
          {hasRamadanDays && (
            <span className="flex items-center gap-1 text-[#F59E0B] font-semibold">
              <Sparkles size={10} fill="currentColor" /> Malam Ganjil
            </span>
          )}
        </div>
      </div>

      {/* Bottom 3-Tab Info Card: Rekap | Hari Besar | Puasa Sunnah */}
      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-3 border-b border-black/[0.06] bg-white/70">
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
              onClick={() => setActiveSubTab(tab.id)}
              className={`py-3 text-xs font-bold transition-colors cursor-pointer relative ${
                activeSubTab === tab.id
                  ? 'text-[#0F50BD]'
                  : 'text-[#525252] hover:text-[#101828]'
              }`}
            >
              {tab.label}
              {activeSubTab === tab.id && (
                <span className="absolute bottom-0 inset-x-5 h-[2.5px] rounded-full bg-[#0F50BD]" />
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* TAB 1: REKAP MINGGUAN & BULANAN */}
          {activeSubTab === 'rekap' && (
            <div className="space-y-4">
              {/* Period switcher: 7 Hari Terakhir vs Bulan yang Dilihat */}
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex p-0.5 rounded-xl bg-black/[0.04] border border-black/[0.05]">
                  <button
                    type="button"
                    onClick={() => setRecapRange('week')}
                    className={`px-3 py-1.5 rounded-[10px] text-[11px] font-bold transition-all cursor-pointer ${
                      recapRange === 'week'
                        ? 'bg-white text-[#0F50BD] shadow-sm'
                        : 'text-[#525252] hover:text-[#101828]'
                    }`}
                  >
                    7 Hari Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecapRange('month')}
                    className={`px-3 py-1.5 rounded-[10px] text-[11px] font-bold transition-all cursor-pointer ${
                      recapRange === 'month'
                        ? 'bg-white text-[#0F50BD] shadow-sm'
                        : 'text-[#525252] hover:text-[#101828]'
                    }`}
                  >
                    {GREGORIAN_MONTH_SHORT_ID[viewMonth]} {viewYear}
                  </button>
                </div>

                <span className="text-[11px] font-semibold text-[#525252] tabular-nums">
                  {recapData.daysCount > 0 ? `${recapData.daysCount} hari berjalan` : 'Belum masuk'}
                </span>
              </div>

              {recapData.daysCount === 0 ? (
                <p className="text-xs text-center text-[#525252] py-6">
                  Bulan {GREGORIAN_MONTH_NAMES_ID[viewMonth]} {viewYear} belum berjalan.
                </p>
              ) : (
                <>
                  {/* 3 KPI Summary Tiles */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-2xl bg-[#F7F9FF] border border-[#0F50BD]/12 text-center">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#0F50BD]/10 text-[#0F50BD] mb-1">
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="text-base font-extrabold text-[#101828] tabular-nums leading-tight">
                        {recapData.prayersTotal}
                        <span className="text-[11px] font-semibold text-[#525252]">
                          /{recapData.prayersPossible}
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-[#525252] mt-0.5">
                        Sholat ({recapData.prayersPercent}%)
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-center">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#F59E0B]/15 text-[#D97706] mb-1">
                        <Flame size={14} />
                      </div>
                      <div className="text-base font-extrabold text-[#101828] tabular-nums leading-tight">
                        {recapData.activeDays}
                        <span className="text-[11px] font-semibold text-[#525252]">
                          /{recapData.daysCount}
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-[#525252] mt-0.5">
                        Hari Aktif
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-200/60 text-center">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#14B8A6]/15 text-[#0F766E] mb-1">
                        <BookOpen size={14} />
                      </div>
                      <div className="text-base font-extrabold text-[#101828] tabular-nums leading-tight">
                        {recapData.tilawahPages}
                      </div>
                      <div className="text-[10px] font-semibold text-[#525252] mt-0.5">
                        Hal Tilawah
                      </div>
                    </div>
                  </div>

                  {/* 7-Day Vertical Consistency Bar Chart (weekly view) */}
                  {recapRange === 'week' && (
                    <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[#101828]">Grafik 7 Hari Terakhir</span>
                        <span className="text-[10.5px] text-[#525252]">Ketuk batang untuk koreksi</span>
                      </div>
                      <div className="grid grid-cols-7 gap-2 items-end h-24 pt-2">
                        {recapData.dailyBars.map((bar) => {
                          const isBarToday = bar.iso === todayIso
                          const heightPct = Math.max(bar.hasAny ? 14 : 6, bar.overallPercent)
                          return (
                            <button
                              key={bar.iso}
                              type="button"
                              onClick={() => onOpenChecklistForDate?.(bar.iso)}
                              aria-label={`${bar.weekdayShort} ${bar.dayNum}: ${bar.prayerCount} dari 5 sholat (${bar.overallPercent}%)`}
                              className="flex flex-col items-center gap-1 h-full justify-end group cursor-pointer"
                            >
                              <span className="text-[9.5px] font-bold text-[#525252] tabular-nums">
                                {bar.prayerCount}/5
                              </span>
                              <div className="w-full max-w-[24px] flex-1 bg-black/[0.05] rounded-full overflow-hidden flex items-end">
                                <div
                                  className={`w-full rounded-full transition-all duration-300 ${
                                    bar.hasAny
                                      ? isBarToday
                                        ? 'bg-gradient-to-t from-[#0F50BD] to-[#14B8A6]'
                                        : 'bg-[#0F50BD]/80 group-hover:bg-[#0F50BD]'
                                      : 'bg-black/10'
                                  }`}
                                  style={{ height: `${heightPct}%` }}
                                />
                              </div>
                              <span
                                className={`text-[10px] leading-none ${
                                  isBarToday ? 'font-bold text-[#0F50BD]' : 'font-medium text-[#525252]'
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

                  {/* Per-Prayer 5-Waktu Breakdown */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#101828]">Rincian Sholat 5 Waktu</div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {PRAYER_LABELS.map((p) => {
                        const done = recapData.prayerBreakdown[p.key]
                        const pct =
                          recapData.daysCount > 0
                            ? Math.round((done / recapData.daysCount) * 100)
                            : 0
                        return (
                          <div
                            key={p.key}
                            className="p-2 rounded-xl bg-white border border-black/[0.06] text-center"
                          >
                            <div className="text-[10.5px] font-semibold text-[#525252]">
                              {p.label}
                            </div>
                            <div className="text-xs font-extrabold text-[#101828] mt-0.5 tabular-nums">
                              {done}/{recapData.daysCount}
                            </div>
                            <div className="w-full h-1 rounded-full bg-black/[0.06] overflow-hidden mt-1.5">
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

                  {/* Custom Amals Progress Summary */}
                  {recapData.customAmalStats.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-[#101828]">Amal Tambahan</div>
                      <div className="space-y-1.5">
                        {recapData.customAmalStats.map((stat) => {
                          const pct =
                            recapData.daysCount > 0
                              ? Math.min(100, Math.round((stat.completedDays / recapData.daysCount) * 100))
                              : 0
                          return (
                            <div
                              key={stat.id}
                              className="p-2.5 rounded-xl bg-white border border-black/[0.06] space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-bold text-[#101828] truncate">
                                  {stat.name}
                                </span>
                                <span className="text-[11px] font-semibold text-[#0F50BD] shrink-0 tabular-nums">
                                  {stat.summaryLabel}
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-black/[0.05] overflow-hidden">
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

                  <p className="text-[10.5px] text-center text-[#525252]/75 pt-1">
                    Rekap ini alat bantu muhasabah &amp; menjaga konsistensi, bukan ukuran diterimanya amal.
                  </p>
                </>
              )}
            </div>
          )}

          {/* TAB 2: HARI BESAR ISLAM */}
          {activeSubTab === 'events' &&
            (displayedEvents.length > 0 ? (
              <div className="space-y-2.5">
                {monthEvents.length === 0 && (
                  <p className="text-[11px] text-[#525252] mb-1">
                    Tidak ada hari besar Islam di {GREGORIAN_MONTH_NAMES_ID[viewMonth]} {viewYear}. Menampilkan jadwal tahun ini:
                  </p>
                )}
                <div className="divide-y divide-black/[0.05]">
                  {displayedEvents.map((ev) => {
                    const p = parseIsoParts(ev.gregorian)
                    const wd = getWeekdayNameId(ev.gregorian)
                    const hijriLabel = formatHijriIsoToLabel(ev.hijri)
                    return (
                      <div
                        key={`${ev.event}-${ev.gregorian}`}
                        className="py-3 first:pt-1 last:pb-1 flex items-center gap-3"
                      >
                        <div className="w-11 h-12 rounded-xl border border-black/[0.08] bg-[#F7F9FF] flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9.5px] font-semibold text-[#525252] leading-none">
                            {GREGORIAN_MONTH_SHORT_ID[p.month]}
                          </span>
                          <span className="text-[15px] font-extrabold text-[#0F50BD] leading-tight mt-0.5 tabular-nums">
                            {p.day}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-[13px] font-bold leading-snug ${
                              ev.isPast ? 'text-[#525252]' : 'text-[#101828]'
                            }`}
                          >
                            {ev.name}
                          </div>
                          <div className="text-[11px] text-[#525252] mt-0.5">
                            {wd.name}, {p.day} {GREGORIAN_MONTH_NAMES_ID[p.month]} {p.year} / {hijriLabel}
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            ev.isPast
                              ? 'bg-black/[0.05] text-[#525252]'
                              : ev.daysLeft === 0
                              ? 'bg-[#14B8A6]/15 text-[#0F766E]'
                              : 'bg-[#0F50BD]/10 text-[#0F50BD]'
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
              <p className="text-xs text-center text-[#525252] py-4">
                Memuat daftar hari besar Islam...
              </p>
            ))}

          {/* TAB 3: PUASA SUNNAH */}
          {activeSubTab === 'puasa' &&
            (sunnahFastingDays.length > 0 ? (
              <div className="divide-y divide-black/[0.05]">
                {sunnahFastingDays.map((d) => (
                  <button
                    key={d.gregorian}
                    type="button"
                    onClick={() => setSelectedIso(d.gregorian)}
                    className="w-full py-2.5 first:pt-1 last:pb-1 flex items-center gap-3 text-left cursor-pointer hover:bg-black/[0.015] rounded-lg transition-colors"
                  >
                    <div className="w-11 h-12 rounded-xl border border-amber-200/70 bg-amber-50/70 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9.5px] font-semibold text-[#525252] leading-none">
                        {GREGORIAN_MONTH_SHORT_ID[d.gregorianMonth]}
                      </span>
                      <span className="text-[15px] font-extrabold text-[#D97706] leading-tight mt-0.5 tabular-nums">
                        {d.gregorianDay}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#101828] leading-snug">
                        {d.fastingLabels.join(' · ')}
                      </div>
                      <div className="text-[11px] text-[#525252] mt-0.5">
                        {d.weekday} {d.pasaran}, {d.gregorianFullLabel} / {d.hijriFullLabel}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center text-[#525252] py-4">
                Tidak ada jadwal puasa sunnah di bulan ini.
              </p>
            ))}
        </div>
      </div>

      <p className="text-[11px] text-center text-[#525252]/80">
        Sumber resmi: Neo MABIMS · Kementerian Agama RI (via mabims.dev)
      </p>
    </div>
  )
}
