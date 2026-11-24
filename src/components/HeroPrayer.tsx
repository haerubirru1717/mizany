import React, { useState, useEffect, useRef } from 'react'
import { MosqueSkyline } from './MosqueSkyline'
import { HijriHeroData, toArabicIndic } from '../services/hijriService'
import { MapPin, Clock, ChevronRight, RotateCw, CalendarDays, RefreshCw } from 'lucide-react'

const ARC_LENGTH = 383.27 // Exact semicircle length for r=122 (Math.PI * 122)

interface HeroPrayerProps {
  city: string
  gregorianDate?: string
  currentTime?: string
  tzLabel?: 'WIB' | 'WITA' | 'WIT'
  arcProgress?: number
  currentPrayerName?: string
  currentPrayerTime?: string
  nextPrayerName?: string
  nextPrayerTime?: string
  remainingTime?: string
  hijriData?: HijriHeroData | null
  prayerLoadFailed?: boolean
  onRetryPrayer?: () => void
  onOpenPrayerDetail?: () => void
  onOpenCalendar?: () => void
}

export const HeroPrayer: React.FC<HeroPrayerProps> = ({
  city,
  gregorianDate,
  currentTime,
  tzLabel,
  arcProgress,
  currentPrayerName,
  currentPrayerTime,
  nextPrayerName,
  nextPrayerTime,
  remainingTime,
  hijriData,
  prayerLoadFailed,
  onRetryPrayer,
  onOpenPrayerDetail,
  onOpenCalendar,
}) => {
  const hasRealProgress = typeof arcProgress === 'number'
  const clampedProgress = hasRealProgress ? Math.max(0, Math.min(1, arcProgress)) : 0
  const targetOffset = hasRealProgress
    ? Number((ARC_LENGTH * (1 - clampedProgress)).toFixed(2))
    : ARC_LENGTH
  const [animatedOffset, setAnimatedOffset] = useState(ARC_LENGTH)
  const [isSettled, setIsSettled] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const latestTargetOffsetRef = useRef(targetOffset)
  latestTargetOffsetRef.current = targetOffset

  // One-shot initial entrance sweep & settle timer (React StrictMode-safe)
  useEffect(() => {
    if (!hasRealProgress) return

    const startTimer = setTimeout(() => {
      setAnimatedOffset(latestTargetOffsetRef.current)
    }, 60)
    const settleTimer = setTimeout(() => {
      setIsSettled(true)
    }, 1050)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(settleTimer)
    }
  }, [hasRealProgress])

  // Continuous live tracking after initial sweep completes
  useEffect(() => {
    if (!hasRealProgress || !isSettled) return
    setAnimatedOffset(targetOffset)
  }, [hasRealProgress, isSettled, targetOffset])

  const showActiveStroke = hasRealProgress && clampedProgress >= 0.002
  const arcTransitionClass = isSettled
    ? 'transition-[stroke-dashoffset] duration-700 ease-out'
    : 'transition-[stroke-dashoffset] duration-[950ms] ease-[cubic-bezier(0.22,1,0.36,1)]'

  const fallbackTodayGreg = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const displayHijriDate = hijriData?.formattedDate || 'Kalender Hijriah'
  const displayGregorianDate = hijriData?.today?.gregorianLabel || gregorianDate || fallbackTodayGreg
  const displayCurrentTime =
    currentTime ||
    `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`

  return (
    <section className="hero-flip-scene" aria-label="Ringkasan waktu sholat dan kalender Hijriah">
      <div className={`hero-flip-inner ${isFlipped ? 'is-flipped' : ''}`}>
        {/* ================= FRONT FACE: PRAYER HERO ================= */}
        <div
          aria-hidden={isFlipped}
          className={`hero-flip-face relative overflow-hidden bg-gradient-to-b from-[#1941B5] to-[#0F50BD] text-white px-4 pt-4 pb-3.5 rounded-[22px] shadow-[0_8px_20px_rgba(25,65,181,0.16)] flex flex-col justify-between ${
            isFlipped ? 'pointer-events-none' : ''
          }`}
        >
          {/* Top row: Date/Location & Explicit Hijri Flip Pill */}
          <div className="flex items-start justify-between gap-2 relative z-10">
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-white leading-tight truncate">
                {displayHijriDate}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#DBEAFE] leading-tight mt-1">
                <span className="shrink-0">{displayGregorianDate}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 min-w-0">
                  <MapPin size={12} className="text-[#DBEAFE] shrink-0" aria-hidden="true" />
                  <span className="truncate">{city}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              tabIndex={isFlipped ? -1 : 0}
              onClick={() => setIsFlipped(true)}
              className="shrink-0 min-h-[36px] px-3 py-1.5 rounded-xl bg-white/15 border border-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
              aria-label="Balik kartu ke ringkasan Kalender Hijriah"
            >
              <CalendarDays size={14} aria-hidden="true" />
              <span>Hijriah</span>
            </button>
          </div>

          {/* Subtle mosque horizon accent (Beranda Hero only) */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-[0.12]">
            <MosqueSkyline className="w-full h-auto max-h-[96px]" />
          </div>

          {/* Compact Semicircular Arc Gauge */}
          <div className="relative z-10 mt-1 max-w-[244px] mx-auto w-full">
            <div className="relative">
              <svg
                viewBox="0 0 300 164"
                className="w-full h-auto"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#93C5FD" />
                    <stop offset="55%" stopColor="#2DD4BF" />
                    <stop offset="100%" stopColor="#5EEAD4" />
                  </linearGradient>
                </defs>
                {/* Base empty track */}
                <path
                  d="M28 152 A122 122 0 0 1 272 152"
                  stroke="rgba(255, 255, 255, 0.22)"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Calm live progress track */}
                {showActiveStroke && (
                  <path
                    d="M28 152 A122 122 0 0 1 272 152"
                    stroke="url(#heroGrad)"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={ARC_LENGTH}
                    strokeDashoffset={animatedOffset}
                    className={arcTransitionClass}
                  />
                )}
              </svg>

              {/* Text inside arc */}
              <div className="absolute inset-x-0 bottom-0.5 text-center pointer-events-none flex flex-col items-center">
                <div className="text-[26px] font-extrabold tracking-tight leading-tight text-white">
                  {prayerLoadFailed ? 'Jadwal Offline' : nextPrayerName || 'Memuat...'}
                </div>
                <div className="text-xs font-medium text-[#DBEAFE] mt-0.5 tabular-nums">
                  {prayerLoadFailed ? (
                    'Gagal terhubung ke Kemenag RI'
                  ) : (
                    <>
                      Pukul <span className="font-bold text-white">{nextPrayerTime || '--:--'}</span>
                    </>
                  )}
                </div>
                {prayerLoadFailed && onRetryPrayer ? (
                  <button
                    type="button"
                    tabIndex={isFlipped ? -1 : 0}
                    onClick={onRetryPrayer}
                    className="pointer-events-auto mt-1.5 px-3 py-1 rounded-full bg-white text-[#0F50BD] text-xs font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-blue-50"
                  >
                    <RefreshCw size={12} />
                    <span>Muat Ulang</span>
                  </button>
                ) : (
                  <span className="inline-block mt-1.5 px-3 py-0.5 bg-white/15 border border-white/25 rounded-full text-xs font-bold tracking-wider tabular-nums text-white">
                    {remainingTime || '--:--:--'}
                  </span>
                )}
              </div>
            </div>

            {/* Start -> End cycle endpoints */}
            <div className="mt-1 px-1 flex items-center justify-between text-[11px] leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">{currentPrayerName || '--'}</span>
                <span className="font-medium text-[#DBEAFE] tabular-nums">
                  {currentPrayerTime || '--:--'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">{nextPrayerName || '--'}</span>
                <span className="font-semibold text-[#5EEAD4] tabular-nums">
                  {nextPrayerTime || '--:--'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Clock Strip & Full Schedule Link */}
          <div className="relative z-10 mt-2.5 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-1.5 tabular-nums">
              <Clock size={14} className="text-[#DBEAFE]" aria-hidden="true" />
              <span className="font-semibold">
                {displayCurrentTime}
                {tzLabel ? ` ${tzLabel}` : ''}
              </span>
              <span className="text-[#DBEAFE]/70" aria-hidden="true">·</span>
              <span className="text-[#DBEAFE]">Kemenag RI</span>
            </div>
            <button
              type="button"
              tabIndex={isFlipped ? -1 : 0}
              onClick={() => onOpenPrayerDetail?.()}
              className="inline-flex items-center gap-1 -mr-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
            >
              <span>Jadwal Lengkap</span>
              <ChevronRight size={14} className="text-[#DBEAFE]" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ================= BACK FACE: KALENDER HIJRIAH (MABIMS) ================= */}
        <div
          aria-hidden={!isFlipped}
          className={`hero-flip-face hero-flip-back relative overflow-hidden bg-gradient-to-b from-[#1941B5] to-[#0F50BD] text-white px-4 pt-4 pb-3.5 rounded-[22px] shadow-[0_8px_20px_rgba(25,65,181,0.16)] flex flex-col justify-between ${
            !isFlipped ? 'pointer-events-none' : ''
          }`}
        >
          {/* Top row: Hijri Header & Explicit Flip Back Button */}
          <div className="flex items-start justify-between gap-2 relative z-10">
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-white leading-tight">
                Kalender Hijriah
              </div>
              <div className="text-[12px] font-medium text-[#DBEAFE] leading-tight mt-1 truncate">
                {hijriData
                  ? `${hijriData.today.monthName} ${hijriData.today.year} H · ${hijriData.monthCount} hari`
                  : displayHijriDate}
              </div>
            </div>

            <button
              type="button"
              tabIndex={isFlipped ? 0 : -1}
              onClick={() => setIsFlipped(false)}
              className="shrink-0 min-h-[36px] px-3 py-1.5 rounded-xl bg-white/15 border border-white/25 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
              aria-label="Kembali ke hitung mundur waktu sholat"
            >
              <RotateCw size={14} aria-hidden="true" />
              <span>Jadwal</span>
            </button>
          </div>

          {/* Center: Today Hijri Highlight + 7-Day MABIMS Strip + Next Event */}
          <div className="relative z-10 my-auto py-2 flex flex-col items-center text-center">
            {hijriData ? (
              <>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-3xl font-extrabold tracking-tight leading-none tabular-nums">
                    {hijriData.today.day}
                  </span>
                  <span className="text-base font-bold text-white leading-none">
                    {hijriData.today.monthName}
                  </span>
                  <span className="text-xs font-semibold text-[#DBEAFE]">
                    {hijriData.today.year} H
                  </span>
                </div>
                <div className="text-xs font-medium text-[#DBEAFE] mt-1">
                  {hijriData.today.weekday ? `${hijriData.today.weekday}, ` : ''}
                  {hijriData.today.gregorianLabel}
                </div>

                {/* 7-Day Week Strip (Big Masehi + Arabic-Indic Hijri >=11px) */}
                {hijriData.weekStrip.length > 0 && (
                  <div className="grid grid-cols-7 gap-1 w-full mt-3">
                    {hijriData.weekStrip.map((d) => {
                      const gregDay = Number(String(d.gregorian || '').split('-')[2]) || d.day
                      return (
                        <div
                          key={d.hijri}
                          className={`py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center ${
                            d.isToday
                              ? 'bg-white text-[#0F50BD] font-bold'
                              : 'bg-white/12 text-white border border-white/15'
                          }`}
                        >
                          <span
                            className={`text-[11px] font-semibold leading-none ${
                              d.isToday ? 'text-[#0F50BD]' : 'text-[#DBEAFE]'
                            }`}
                          >
                            {d.weekdayShort}
                          </span>
                          <div className="flex items-baseline justify-center gap-0.5 mt-1 leading-none">
                            <span
                              className={`font-arabic text-[11px] font-semibold ${
                                d.isToday ? 'text-[#0F50BD]' : 'text-[#DBEAFE]'
                              }`}
                            >
                              {toArabicIndic(d.day)}
                            </span>
                            <span className="text-xs font-bold tabular-nums">{gregDay}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Nearest Islamic Event */}
                {hijriData.nextEvent && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-semibold text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5EEAD4]" aria-hidden="true" />
                    <span>{hijriData.nextEvent.name}</span>
                    <span className="text-[#DBEAFE]" aria-hidden="true">·</span>
                    <span className="text-[#5EEAD4] font-bold">
                      {hijriData.nextEvent.daysLeft === 0
                        ? 'Hari ini'
                        : `${hijriData.nextEvent.daysLeft} hari lagi`}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="py-5 text-center">
                <div className="text-xl font-bold">{displayHijriDate}</div>
                <div className="text-xs text-[#DBEAFE] mt-1">Memuat kalender Neo MABIMS...</div>
              </div>
            )}
          </div>

          {/* Bottom Strip */}
          <div className="relative z-10 mt-2 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-1.5 text-[#DBEAFE]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5EEAD4]" aria-hidden="true" />
              <span>Neo MABIMS · Kemenag RI</span>
            </div>
            <button
              type="button"
              tabIndex={isFlipped ? 0 : -1}
              onClick={() => onOpenCalendar?.()}
              className="inline-flex items-center gap-1 -mr-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
            >
              <span>Buka Kalender</span>
              <ChevronRight size={14} className="text-[#DBEAFE]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
