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
    <section
      className="-mx-4 -mt-[calc(12px+env(safe-area-inset-top))] hero-flip-scene"
      aria-label="Ringkasan waktu sholat dan kalender Hijriah"
    >
      <div className={`hero-flip-inner ${isFlipped ? 'is-flipped' : ''}`}>
        {/* ================= FRONT FACE: PRAYER HERO ================= */}
        <div
          aria-hidden={isFlipped}
          className={`hero-flip-face group relative overflow-hidden bg-gradient-to-b from-[#1941B5] to-[#0F50BD] text-white pt-[calc(18px+env(safe-area-inset-top))] px-5 pb-5 rounded-b-[28px] shadow-[0_10px_28px_rgba(25,65,181,0.22)] flex flex-col justify-between ${
            isFlipped ? 'pointer-events-none' : ''
          }`}
        >
          {/* Full-card flip trigger (sibling to inner action buttons — entire card surface flips cleanly) */}
          <button
            type="button"
            tabIndex={isFlipped ? -1 : 0}
            onClick={() => setIsFlipped(true)}
            aria-label="Ketuk kartu untuk melihat ringkasan Kalender Hijriah"
            className="absolute inset-0 z-0 w-full h-full cursor-pointer rounded-b-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80"
          />

          {/* Top row: Date/Location & Hijri Flip Indicator */}
          <div className="flex items-start justify-between gap-2 relative z-10 pointer-events-none">
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-white leading-tight truncate">
                {displayHijriDate}
              </div>
              <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#DBEAFE] leading-tight mt-1">
                <span className="shrink-0">{displayGregorianDate}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 min-w-0">
                  <MapPin size={12} className="text-[#DBEAFE] shrink-0" aria-hidden="true" />
                  <span className="truncate">{city}</span>
                </span>
              </div>
            </div>

            <span
              aria-hidden="true"
              className="shrink-0 min-h-[36px] px-3 py-1.5 rounded-xl bg-white/18 border border-white/30 backdrop-blur-sm text-white text-xs font-semibold inline-flex items-center gap-1.5 group-hover:bg-white/25 transition-colors"
            >
              <CalendarDays size={14} />
              <span>Hijriah</span>
            </span>
          </div>

          {/* Mosque Skyline Horizon */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-30">
            <MosqueSkyline className="w-full h-auto max-h-[135px]" />
          </div>

          {/* Wide Lush Semicircular Arc Gauge */}
          <div className="relative z-10 mt-0.5 max-w-[304px] mx-auto w-full pointer-events-none">
            <div className="relative">
              <svg
                viewBox="0 0 300 168"
                className="w-full h-auto drop-shadow-sm"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#93C5FD" />
                    <stop offset="55%" stopColor="#14B8A6" />
                    <stop offset="100%" stopColor="#5EEAD4" />
                  </linearGradient>
                </defs>
                {/* Base empty track */}
                <path
                  d="M28 156 A122 122 0 0 1 272 156"
                  stroke="rgba(255, 255, 255, 0.22)"
                  strokeWidth="17"
                  strokeLinecap="round"
                />
                {/* Live progress track */}
                {showActiveStroke && (
                  <path
                    d="M28 156 A122 122 0 0 1 272 156"
                    stroke="url(#heroGrad)"
                    strokeWidth="17"
                    strokeLinecap="round"
                    strokeDasharray={ARC_LENGTH}
                    strokeDashoffset={animatedOffset}
                    className={arcTransitionClass}
                  />
                )}
              </svg>

              {/* Text inside arc */}
              <div className="absolute inset-x-0 bottom-1 text-center pointer-events-none flex flex-col items-center">
                <div className="text-3xl font-extrabold tracking-tight leading-tight text-white">
                  {prayerLoadFailed ? 'Jadwal Offline' : nextPrayerName || 'Memuat...'}
                </div>
                <div className="text-xs sm:text-sm font-medium text-[#DBEAFE] mt-0.5 tabular-nums">
                  {prayerLoadFailed ? (
                    'Gagal terhubung ke Kemenag RI'
                  ) : (
                    <>
                      Sisa waktu · pukul{' '}
                      <span className="font-semibold text-white">{nextPrayerTime || '--:--'}</span>
                    </>
                  )}
                </div>
                {prayerLoadFailed && onRetryPrayer ? (
                  <button
                    type="button"
                    tabIndex={isFlipped ? -1 : 0}
                    onClick={onRetryPrayer}
                    className={`relative z-20 mt-2 px-3.5 py-1 rounded-full bg-white text-[#0F50BD] text-xs font-bold inline-flex items-center gap-1 cursor-pointer hover:bg-blue-50 shadow-sm ${
                      isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
                    }`}
                  >
                    <RefreshCw size={12} />
                    <span>Muat Ulang</span>
                  </button>
                ) : (
                  <span className="inline-block mt-2 px-3.5 py-1 bg-white/20 border border-white/30 backdrop-blur-sm rounded-full text-xs font-bold tracking-wider tabular-nums text-white">
                    {remainingTime || '--:--:--'}
                  </span>
                )}
              </div>
            </div>

            {/* Start -> End cycle endpoints */}
            <div className="mt-1.5 px-1.5 flex items-center justify-between text-[11px] leading-tight">
              <div className="flex flex-col items-start">
                <span className="font-semibold text-white">{currentPrayerName || '--'}</span>
                <span className="font-medium text-[#DBEAFE] tabular-nums">
                  {currentPrayerTime || '--:--'}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-semibold text-white">{nextPrayerName || '--'}</span>
                <span className="font-semibold text-[#5EEAD4] tabular-nums">
                  {nextPrayerTime || '--:--'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Clock Strip & Full Schedule Link */}
          <div className="relative z-10 mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white pointer-events-none">
            <div className="flex items-center gap-1.5 tabular-nums">
              <Clock size={15} className="text-[#DBEAFE]" aria-hidden="true" />
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
              className={`relative z-20 inline-flex items-center gap-1 -mr-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer ${
                isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
            >
              <span>Jadwal Lengkap</span>
              <ChevronRight size={14} className="text-[#DBEAFE]" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ================= BACK FACE: KALENDER HIJRIAH (MABIMS) ================= */}
        <div
          aria-hidden={!isFlipped}
          className={`hero-flip-face hero-flip-back group relative overflow-hidden bg-gradient-to-b from-[#1941B5] to-[#0F50BD] text-white pt-[calc(18px+env(safe-area-inset-top))] px-5 pb-5 rounded-b-[28px] shadow-[0_10px_28px_rgba(25,65,181,0.22)] flex flex-col justify-between ${
            !isFlipped ? 'pointer-events-none' : ''
          }`}
        >
          {/* Full-card flip-back trigger */}
          <button
            type="button"
            tabIndex={isFlipped ? 0 : -1}
            onClick={() => setIsFlipped(false)}
            aria-label="Ketuk kartu untuk kembali ke hitung mundur waktu sholat"
            className="absolute inset-0 z-0 w-full h-full cursor-pointer rounded-b-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80"
          />

          {/* Top row: Hijri Header & Flip Back Indicator */}
          <div className="flex items-start justify-between gap-2 relative z-10 pointer-events-none">
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-white leading-tight">
                Kalender Hijriah
              </div>
              <div className="text-[12.5px] font-medium text-[#DBEAFE] leading-tight mt-1 truncate">
                {hijriData
                  ? `${hijriData.today.monthName} ${hijriData.today.year} H · ${hijriData.monthCount} hari`
                  : displayHijriDate}
              </div>
            </div>

            <span
              aria-hidden="true"
              className="shrink-0 min-h-[36px] px-3 py-1.5 rounded-xl bg-white/18 border border-white/30 backdrop-blur-sm text-white text-xs font-semibold inline-flex items-center gap-1.5 group-hover:bg-white/25 transition-colors"
            >
              <RotateCw size={14} />
              <span>Jadwal</span>
            </span>
          </div>

          {/* Mosque Skyline Horizon */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-25">
            <MosqueSkyline className="w-full h-auto max-h-[135px]" />
          </div>

          {/* Center: Today Hijri Highlight + 7-Day MABIMS Strip + Next Event */}
          <div className="relative z-10 my-auto py-3 flex flex-col items-center text-center pointer-events-none">
            {hijriData ? (
              <>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-extrabold tracking-tight leading-none tabular-nums">
                    {hijriData.today.day}
                  </span>
                  <span className="text-lg font-bold text-white leading-none">
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
                  <div className="grid grid-cols-7 gap-1.5 w-full max-w-[330px] mt-3.5">
                    {hijriData.weekStrip.map((d) => {
                      const gregDay = Number(String(d.gregorian || '').split('-')[2]) || d.day
                      return (
                        <div
                          key={d.hijri}
                          className={`py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center ${
                            d.isToday
                              ? 'bg-white text-[#0F50BD] shadow-sm font-bold'
                              : 'bg-white/14 text-white border border-white/18'
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
                            <span className="text-[13px] font-bold tabular-nums">{gregDay}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Nearest Islamic Event */}
                {hijriData.nextEvent && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/18 border border-white/25 text-xs font-semibold text-white">
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
              <div className="py-6 text-center">
                <div className="text-2xl font-extrabold">{displayHijriDate}</div>
                <div className="text-xs text-[#DBEAFE] mt-1">Memuat kalender Neo MABIMS...</div>
              </div>
            )}
          </div>

          {/* Bottom Strip */}
          <div className="relative z-10 mt-2 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white pointer-events-none">
            <div className="flex items-center gap-1.5 text-[#DBEAFE]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5EEAD4]" aria-hidden="true" />
              <span>Neo MABIMS · Kemenag RI</span>
            </div>
            <button
              type="button"
              tabIndex={isFlipped ? 0 : -1}
              onClick={() => onOpenCalendar?.()}
              className={`relative z-20 inline-flex items-center gap-1 -mr-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-white/15 active:scale-95 transition-all cursor-pointer ${
                isFlipped ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
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
