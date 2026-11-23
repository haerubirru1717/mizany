import React, { useState, useEffect, useRef } from 'react'
import { MosqueSkyline } from './MosqueSkyline'
import { HijriHeroData } from '../services/hijriService'
import { MapPin, Bell, Clock, ChevronRight, RotateCw, CalendarDays } from 'lucide-react'

const ARC_LENGTH = 383.27 // Exact semicircle length for r=122 (Math.PI * 122)

interface HeroPrayerProps {
  city: string
  gregorianDate?: string
  currentTime?: string
  tzLabel?: 'WIB' | 'WITA' | 'WIT'
  arcProgress?: number
  nextPrayerName?: string
  nextPrayerTime?: string
  remainingTime?: string
  hijriData?: HijriHeroData | null
  onOpenPrayerDetail?: () => void
  onOpenCalendar?: () => void
}

export const HeroPrayer: React.FC<HeroPrayerProps> = ({
  city,
  gregorianDate,
  currentTime,
  tzLabel,
  arcProgress,
  nextPrayerName,
  nextPrayerTime,
  remainingTime,
  hijriData,
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

  // One-shot initial entrance sweep & settle timer (React StrictMode-safe, never cancelled by 1s ticks)
  useEffect(() => {
    if (!hasRealProgress) return

    const startTimer = setTimeout(() => {
      setAnimatedOffset(latestTargetOffsetRef.current)
    }, 80)
    const settleTimer = setTimeout(() => {
      setIsSettled(true)
    }, 1480)

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

  const echoMid = Number(Math.max(0, animatedOffset - 3).toFixed(2))
  const echoEnd = Number(Math.max(0, animatedOffset - 22).toFixed(2))
  const showActiveStroke = hasRealProgress && clampedProgress >= 0.002
  const showWave = isSettled && clampedProgress >= 0.015
  const showTipEcho = isSettled && clampedProgress >= 0.015 && animatedOffset >= 1
  const arcTransitionClass = isSettled
    ? 'transition-[stroke-dashoffset] duration-700 ease-out'
    : 'transition-[stroke-dashoffset] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]'

  const fallbackTodayGreg = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const displayHijriDate = hijriData?.formattedDate || 'Memuat tanggal Hijriah...'
  const displayGregorianDate = hijriData?.today?.gregorianLabel || gregorianDate || fallbackTodayGreg
  const displayCurrentTime =
    currentTime ||
    `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`

  return (
    <div className="-mx-4 -mt-2 sm:-mx-6 sm:-mt-4 hero-flip-scene">
      <div className={`hero-flip-inner ${isFlipped ? 'is-flipped' : ''}`}>
        {/* ================= FRONT FACE: PRAYER HERO ================= */}
        <div
          onClick={() => setIsFlipped(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsFlipped(true)
            }
          }}
          className={`hero-flip-face relative overflow-hidden bg-[#1941B5] text-white pt-[calc(18px+env(safe-area-inset-top))] px-5 pb-5 rounded-b-[26px] cursor-pointer shadow-[0_8px_24px_rgba(25,65,181,0.2)] flex flex-col justify-between ${
            isFlipped ? 'pointer-events-none' : ''
          }`}
          aria-label="Hitung mundur sholat berikutnya — ketuk untuk membalik ke Kalender Hijriah"
        >
          {/* Top row: Date & Notification */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="text-[14.5px] font-bold text-white leading-tight">
                {displayHijriDate}
              </div>
              <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-white/85 leading-tight mt-1">
                <span>{displayGregorianDate}</span>
                <span className="text-[#8BA0F3]">•</span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-[#8BA0F3] shrink-0" />
                  <span>{city}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
              }}
              className="w-10 h-10 shrink-0 rounded-xl bg-white/20 border border-white/40 backdrop-blur-md flex items-center justify-center relative shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] hover:bg-white/30 transition-colors cursor-pointer"
              aria-label="Notifikasi"
            >
              <Bell size={18} className="text-white" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#1941B5]" />
            </button>
          </div>

          {/* Mosque Skyline Background */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-40">
            <MosqueSkyline className="w-full h-auto max-h-[140px]" />
          </div>

          {/* Circular Arc Gauge */}
          <div className="relative z-10 -mt-2 sm:mt-0 max-w-[310px] mx-auto w-full">
            <svg
              viewBox="0 0 300 168"
              className="w-full h-auto drop-shadow-sm"
              fill="none"
              style={
                {
                  '--arc-offset': animatedOffset,
                  '--arc-echo-mid': echoMid,
                  '--arc-echo-end': echoEnd,
                } as React.CSSProperties
              }
            >
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0F50BD" />
                  <stop offset="55%" stopColor="#0F50BD" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
                <mask id="arcFillMask">
                  <path
                    d="M28 156 A122 122 0 0 1 272 156"
                    stroke="#FFFFFF"
                    strokeWidth="17"
                    strokeLinecap="round"
                    strokeDasharray={ARC_LENGTH}
                    strokeDashoffset={animatedOffset}
                    className={arcTransitionClass}
                  />
                </mask>
              </defs>
              {/* Base track */}
              <path
                d="M28 156 A122 122 0 0 1 272 156"
                stroke="#FFFFFF"
                strokeWidth="17"
                strokeLinecap="round"
              />
              {/* One-way forward-dissolving echo behind tip — pushes forward into white track and fades out */}
              {showTipEcho && (
                <path
                  d="M28 156 A122 122 0 0 1 272 156"
                  stroke="url(#heroGrad)"
                  strokeWidth="17"
                  strokeLinecap="round"
                  strokeDasharray={ARC_LENGTH}
                  className="arc-tip-echo"
                />
              )}
              {/* Stationary active progress track synced to real elapsed time */}
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
              {/* Synchronized wipe: translucent wash leads, exact heroGrad color sweeps right behind */}
              {showWave && (
                <g mask="url(#arcFillMask)">
                  <path
                    d="M28 156 A122 122 0 0 1 272 156"
                    stroke="rgba(255, 255, 255, 0.34)"
                    strokeWidth="17"
                    strokeLinecap="round"
                    strokeDasharray={ARC_LENGTH}
                    className="arc-wave-transparent"
                  />
                  <path
                    d="M28 156 A122 122 0 0 1 272 156"
                    stroke="url(#heroGrad)"
                    strokeWidth="17.6"
                    strokeLinecap="round"
                    strokeDasharray={ARC_LENGTH}
                    className="arc-wave-color"
                  />
                </g>
              )}
            </svg>

            {/* Text inside arc */}
            <div className="absolute inset-x-0 bottom-1 text-center pointer-events-none flex flex-col items-center">
              <div className="text-3xl font-extrabold tracking-tight leading-tight">
                {nextPrayerName || 'Memuat...'}
              </div>
              <div className="text-xs sm:text-sm font-medium text-white/80 mt-0.5">
                Sisa waktu · pukul <span className="font-semibold">{nextPrayerTime || '--:--'}</span>
              </div>
              <span className="inline-block mt-2 px-3.5 py-1 bg-white/20 border border-white/30 backdrop-blur-md rounded-full text-xs font-bold tracking-wider">
                {remainingTime || '--:--:--'}
              </span>
            </div>
          </div>

          {/* Live Clock Strip & Prayer Detail Trigger */}
          <div className="relative z-10 mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/85">
            <div className="flex items-center gap-1.5">
              <Clock size={15} className="text-[#8BA0F3]" />
              <span className="font-semibold">
                {displayCurrentTime}
                {tzLabel ? ` ${tzLabel}` : ''}
              </span>
              <span className="text-white/40">•</span>
              <span>Kemenag RI</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenPrayerDetail?.()
              }}
              className="flex items-center gap-1 -mr-1.5 px-2 py-1 rounded-lg font-medium text-white/95 hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
            >
              <span>Detail Prayer Time</span>
              <ChevronRight size={13} className="text-[#8BA0F3]" />
            </button>
          </div>
        </div>

        {/* ================= BACK FACE: KALENDER HIJRIAH (MABIMS) ================= */}
        <div
          onClick={() => setIsFlipped(false)}
          role="button"
          tabIndex={isFlipped ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsFlipped(false)
            }
          }}
          className={`hero-flip-face hero-flip-back relative overflow-hidden bg-[#1941B5] text-white pt-[calc(18px+env(safe-area-inset-top))] px-5 pb-5 rounded-b-[26px] cursor-pointer shadow-[0_8px_24px_rgba(25,65,181,0.2)] flex flex-col justify-between ${
            !isFlipped ? 'pointer-events-none' : ''
          }`}
          aria-label="Kalender Hijriah MABIMS — ketuk untuk kembali ke jadwal sholat"
        >
          {/* Top row: Hijri Header & Flip Back Icon */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-1.5 text-[14.5px] font-bold text-white leading-tight">
                <CalendarDays size={15} className="text-[#8BA0F3] shrink-0" />
                <span>Kalender Hijriah</span>
              </div>
              <div className="text-[12.5px] font-medium text-white/85 leading-tight mt-1">
                {hijriData
                  ? `${hijriData.today.monthName} ${hijriData.today.year} H · ${hijriData.monthCount} hari`
                  : displayHijriDate}
              </div>
            </div>

            <div
              className="w-10 h-10 shrink-0 rounded-xl bg-white/20 border border-white/40 backdrop-blur-md flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
              aria-hidden="true"
            >
              <RotateCw size={17} className="text-white" />
            </div>
          </div>

          {/* Mosque Skyline Background */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-35">
            <MosqueSkyline className="w-full h-auto max-h-[140px]" />
          </div>

          {/* Center: Today Hijri Highlight + 7-Day MABIMS Strip + Next Event */}
          <div className="relative z-10 my-auto py-3 flex flex-col items-center text-center">
            {hijriData ? (
              <>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-extrabold tracking-tight leading-none">
                    {hijriData.today.day}
                  </span>
                  <span className="text-lg font-bold text-white/95 leading-none">
                    {hijriData.today.monthName}
                  </span>
                  <span className="text-xs font-semibold text-[#8BA0F3]">
                    {hijriData.today.year} H
                  </span>
                </div>
                <div className="text-xs font-medium text-white/80 mt-1">
                  {hijriData.today.weekday ? `${hijriData.today.weekday}, ` : ''}
                  {hijriData.today.gregorianLabel}
                </div>

                {/* 7-Day Hijri Week Strip */}
                {hijriData.weekStrip.length > 0 && (
                  <div className="grid grid-cols-7 gap-1.5 w-full max-w-[320px] mt-3.5">
                    {hijriData.weekStrip.map((d) => (
                      <div
                        key={d.hijri}
                        className={`py-1.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                          d.isToday
                            ? 'bg-white text-[#0F50BD] shadow-sm font-bold'
                            : 'bg-white/12 text-white/90 border border-white/15'
                        }`}
                      >
                        <span
                          className={`text-[9.5px] font-semibold leading-none ${
                            d.isToday ? 'text-[#0F50BD]/80' : 'text-[#8BA0F3]'
                          }`}
                        >
                          {d.weekdayShort}
                        </span>
                        <span className="text-[13px] font-bold mt-1 leading-none">{d.day}</span>
                        <span
                          className={`w-1 h-1 rounded-full mt-1 ${
                            d.isAyyamulBidh ? 'bg-[#14B8A6]' : 'bg-transparent'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Nearest Islamic Event from MABIMS */}
                {hijriData.nextEvent && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 backdrop-blur-md text-[11.5px] font-semibold text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
                    <span>{hijriData.nextEvent.name}</span>
                    <span className="text-white/50">·</span>
                    <span className="text-[#8BA0F3] font-bold">
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
                <div className="text-xs text-white/75 mt-1">Memuat kalender Neo MABIMS...</div>
              </div>
            )}
          </div>

          {/* Bottom Strip: MABIMS Attribution & Calendar Detail Trigger */}
          <div className="relative z-10 mt-2 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/85">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
              <span>Kemenag RI · MABIMS</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenCalendar?.()
              }}
              className="flex items-center gap-1 -mr-1.5 px-2 py-1 rounded-lg font-medium text-white/95 hover:bg-white/15 active:scale-95 transition-all cursor-pointer"
            >
              <span>Detail Kalender</span>
              <ChevronRight size={13} className="text-[#8BA0F3]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
