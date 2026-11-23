import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import {
  HijriHeroData,
  HijriDayItem,
  HIJRI_MONTH_NAMES,
  fetchHijriMonth,
} from '../services/hijriService'

interface KalenderViewProps {
  hijriData?: HijriHeroData | null
}

const WEEKDAY_HEADERS = ['Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export const KalenderView: React.FC<KalenderViewProps> = ({ hijriData }) => {
  const [viewYear, setViewYear] = useState<number>(hijriData?.today.year || 1448)
  const [viewMonth, setViewMonth] = useState<number>(hijriData?.today.month || 6)
  const [monthDays, setMonthDays] = useState<HijriDayItem[]>(hijriData?.days || [])
  const [loadingMonth, setLoadingMonth] = useState<boolean>(false)

  // Sync initial view when hijriData arrives
  useEffect(() => {
    if (!hijriData) return
    setViewYear(hijriData.today.year)
    setViewMonth(hijriData.today.month)
    setMonthDays(hijriData.days)
  }, [hijriData])

  const handleShiftMonth = async (delta: number) => {
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

    // Reuse cached current month if jumping back to today's month
    if (
      hijriData &&
      nextYear === hijriData.today.year &&
      nextMonth === hijriData.today.month
    ) {
      setMonthDays(hijriData.days)
      return
    }

    setLoadingMonth(true)
    const todayIso = hijriData?.today.gregorian || new Date().toLocaleDateString('en-CA')
    const result = await fetchHijriMonth(nextYear, nextMonth, todayIso)
    if (result) {
      setMonthDays(result.days)
    }
    setLoadingMonth(false)
  }

  const isViewingRamadan = viewMonth === 9
  const monthTitle = `${HIJRI_MONTH_NAMES[viewMonth] || `Bulan ${viewMonth}`} ${viewYear} H`
  const leadingEmptyCells = monthDays.length > 0 ? monthDays[0].weekdayIndex : 0
  const isCurrentMonth =
    hijriData && viewYear === hijriData.today.year && viewMonth === hijriData.today.month

  return (
    <div className="space-y-4 pb-24">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Kalender Hijriah</h1>
        <p className="text-xs text-[#525252] mt-0.5">
          Kriteria resmi Neo MABIMS · Kementerian Agama RI
        </p>
      </div>

      {/* Today & Nearest Event Banner */}
      <div className="glass-card p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#0F50BD]/10 text-[#0F50BD] flex items-center justify-center shrink-0">
            <CalendarIcon size={22} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#101828] truncate">
              {hijriData ? hijriData.formattedDate : 'Memuat tanggal...'}
            </div>
            <div className="text-xs text-[#525252] truncate">
              {hijriData
                ? `${hijriData.today.weekday}, ${hijriData.today.gregorianLabel}`
                : 'Menghubungkan ke MABIMS...'}
            </div>
          </div>
        </div>
        {hijriData?.nextEvent && (
          <div className="text-right shrink-0">
            <div className="text-[10px] font-semibold text-[#525252]">
              {hijriData.nextEvent.name}
            </div>
            <div className="text-sm font-extrabold text-[#0F50BD]">
              {hijriData.nextEvent.daysLeft === 0
                ? 'Hari ini'
                : `${hijriData.nextEvent.daysLeft} hari`}
            </div>
          </div>
        )}
      </div>

      {/* Real Monthly Hijri Grid */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => handleShiftMonth(-1)}
            className="w-8 h-8 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center text-[#101828] cursor-pointer active:scale-95 transition-all"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={17} />
          </button>

          <div className="text-center">
            <h3 className="text-sm font-bold text-[#101828]">{monthTitle}</h3>
            {!isCurrentMonth && hijriData && (
              <button
                type="button"
                onClick={() => {
                  setViewYear(hijriData.today.year)
                  setViewMonth(hijriData.today.month)
                  setMonthDays(hijriData.days)
                }}
                className="text-[10px] font-semibold text-[#0F50BD] hover:underline cursor-pointer"
              >
                Kembali ke bulan ini
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleShiftMonth(1)}
            className="w-8 h-8 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] flex items-center justify-center text-[#101828] cursor-pointer active:scale-95 transition-all"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={17} />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
          {WEEKDAY_HEADERS.map((wd) => (
            <div key={wd} className="text-[10.5px] font-bold text-[#525252] py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        {loadingMonth || monthDays.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#525252]">
            Memuat kalender {monthTitle}...
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: leadingEmptyCells }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}
            {monthDays.map((d) => {
              const isLailatulQadr = isViewingRamadan && d.day >= 21 && d.day % 2 !== 0
              return (
                <div
                  key={d.hijri}
                  className={`py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center relative transition-all ${
                    d.isToday
                      ? 'bg-[#0F50BD] text-white shadow-[0_4px_12px_rgba(15,80,189,0.3)] ring-2 ring-[#0F50BD]/30 font-bold'
                      : d.isAyyamulBidh
                      ? 'bg-teal-50/90 text-[#101828] border border-teal-200/80 font-semibold'
                      : 'bg-white/75 text-[#101828] border border-black/[0.05]'
                  }`}
                >
                  <span className="text-[13px] font-bold leading-none">{d.day}</span>
                  <span
                    className={`text-[9px] mt-1 leading-none ${
                      d.isToday ? 'text-white/80' : 'text-[#525252]'
                    }`}
                  >
                    {d.gregorianShort}
                  </span>
                  {d.isAyyamulBidh && !isLailatulQadr && (
                    <span
                      className={`w-1 h-1 rounded-full mt-0.5 ${
                        d.isToday ? 'bg-white' : 'bg-[#14B8A6]'
                      }`}
                    />
                  )}
                  {isLailatulQadr && (
                    <span className="absolute -top-1 -right-1 text-[#F59E0B]">
                      <Sparkles size={10} fill="currentColor" />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3.5 pt-3 border-t border-black/[0.06] text-[10.5px] text-[#525252]">
          <span className="flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full bg-[#0F50BD] inline-block" /> Hari ini
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] inline-block" /> Ayyamul Bidh (13–15)
          </span>
          {isViewingRamadan && (
            <span className="flex items-center gap-1 text-[#F59E0B] font-semibold">
              <Sparkles size={10} fill="currentColor" /> Malam Ganjil
            </span>
          )}
        </div>
      </div>

      {/* Real Islamic Events List from MABIMS */}
      {hijriData && hijriData.events.length > 0 && (
        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-sm font-bold text-[#101828] mb-3">
            Hari Besar Islam {hijriData.today.year} H
          </h3>
          <div className="divide-y divide-black/[0.05]">
            {hijriData.events.map((ev) => (
              <div key={`${ev.event}-${ev.hijri}`} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div
                    className={`text-xs font-bold truncate ${
                      ev.isPast ? 'text-[#525252]' : 'text-[#101828]'
                    }`}
                  >
                    {ev.name}
                  </div>
                  <div className="text-[11px] text-[#525252] mt-0.5">
                    {ev.gregorianLabel}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold shrink-0 ${
                    ev.isPast
                      ? 'bg-black/[0.05] text-[#525252]'
                      : ev.daysLeft === 0
                      ? 'bg-[#14B8A6]/15 text-[#0F766E]'
                      : 'bg-[#0F50BD]/10 text-[#0F50BD]'
                  }`}
                >
                  {ev.isPast
                    ? 'Selesai'
                    : ev.daysLeft === 0
                    ? 'Hari ini'
                    : `${ev.daysLeft} hari lagi`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-center text-[#525252]/80 mt-2">
        Sumber resmi: Neo MABIMS · Kementerian Agama RI (via mabims.dev)
      </p>
    </div>
  )
}
