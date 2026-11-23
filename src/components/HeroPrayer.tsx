import React from 'react'
import { MosqueSkyline } from './MosqueSkyline'
import { MapPin, ChevronDown, Bell, CloudSun, ChevronRight } from 'lucide-react'

interface HeroPrayerProps {
  city: string
  hijriDate?: string
  gregorianDate?: string
  nextPrayerName?: string
  nextPrayerTime?: string
  remainingTime?: string
  onOpenPrayerDetail?: () => void
}

export const HeroPrayer: React.FC<HeroPrayerProps> = ({
  city,
  hijriDate = '12 Ramadan 1448 H',
  gregorianDate = '19 Februari 2027',
  nextPrayerName = 'Maghrib',
  nextPrayerTime = '18:07',
  remainingTime = '02:41:09',
  onOpenPrayerDetail,
}) => {
  return (
    <div
      onClick={onOpenPrayerDetail}
      role="button"
      tabIndex={0}
      className="relative overflow-hidden -mx-4 -mt-2 sm:-mx-6 sm:-mt-4 bg-[#1941B5] text-white pt-[calc(18px+env(safe-area-inset-top))] px-5 pb-5 rounded-b-[26px] cursor-pointer shadow-[0_8px_24px_rgba(25,65,181,0.2)] transition-transform active:scale-[0.99]"
      aria-label="Hitung mundur sholat berikutnya — ketuk untuk detail Prayer Time"
    >
      {/* Top row: Date & City & Notification */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <span className="font-bold text-white text-[14.5px] leading-tight">
              {hijriDate}
            </span>
            <span className="hidden sm:inline text-[#8BA0F3] text-xs font-semibold">•</span>
            <span className="text-white/80 text-[12px] font-medium leading-tight">
              {gregorianDate}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-white font-bold text-base mt-1">
            <MapPin size={16} className="text-[#8BA0F3] shrink-0" />
            <span>{city}</span>
            <ChevronDown size={14} className="text-[#8BA0F3]" />
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="w-11 h-11 shrink-0 rounded-xl bg-white/20 border border-white/40 backdrop-blur-md flex items-center justify-center relative shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
          aria-label="Notifikasi"
        >
          <Bell size={19} className="text-white" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500" />
        </button>
      </div>

      {/* Mosque Skyline Background */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-40">
        <MosqueSkyline className="w-full h-auto max-h-[140px]" />
      </div>

      {/* Circular Arc Gauge */}
      <div className="relative z-10 mt-4 max-w-[320px] mx-auto">
        <svg viewBox="0 0 300 168" className="w-full h-auto drop-shadow-sm" fill="none">
          <defs>
            <linearGradient id="heroGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#0F50BD" />
              <stop offset="55%" stopColor="#0F50BD" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>
          </defs>
          {/* Base track */}
          <path
            d="M28 156 A122 122 0 0 1 272 156"
            stroke="#FFFFFF"
            strokeWidth="17"
            strokeLinecap="round"
          />
          {/* Active progress track */}
          <path
            d="M28 156 A122 122 0 0 1 272 156"
            stroke="url(#heroGrad)"
            strokeWidth="17"
            strokeLinecap="round"
            strokeDasharray="260 400"
          />
        </svg>

        {/* Text inside arc */}
        <div className="absolute inset-x-0 bottom-1 text-center pointer-events-none flex flex-col items-center">
          <div className="text-3xl font-extrabold tracking-tight leading-tight">{nextPrayerName}</div>
          <div className="text-xs sm:text-sm font-medium text-white/80 mt-0.5">
            Sisa waktu · pukul <span className="font-semibold">{nextPrayerTime}</span>
          </div>
          <span className="inline-block mt-2 px-3 py-1 bg-white/20 border border-white/30 backdrop-blur-md rounded-full text-xs font-bold tracking-wider">
            {remainingTime}
          </span>
        </div>
      </div>

      {/* Weather Strip & Hint */}
      <div className="relative z-10 mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/85">
        <div className="flex items-center gap-2">
          <CloudSun size={17} className="text-[#8BA0F3]" />
          <span>27°C Cerah</span>
          <span className="text-white/40">•</span>
          <span>10:08</span>
        </div>
        <div className="flex items-center gap-1 font-medium text-white/90">
          <span>Detail Prayer Time</span>
          <ChevronRight size={13} className="text-[#8BA0F3]" />
        </div>
      </div>
    </div>
  )
}
