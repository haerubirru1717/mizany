import React, { useEffect, useId } from 'react'
import { Check, X } from 'lucide-react'

interface AnimatedFlameProps {
  active: boolean
  size?: number
  showEmbers?: boolean
  className?: string
}

/**
 * Organic layered flame icon in Mizany's warm amber palette (#F59E0B / #FBBF24 / #FEF3C7).
 * Animates smoothly when active, stays calm when streak is 0.
 */
export const AnimatedFlame: React.FC<AnimatedFlameProps> = ({
  active,
  size = 26,
  showEmbers = true,
  className = '',
}) => {
  const gradId = useId()
  const outerId = `${gradId}-flame-outer`
  const innerId = `${gradId}-flame-inner`

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Subtle rising warm embers when streak is active */}
      {active && showEmbers && (
        <>
          <span
            className="streak-ember pointer-events-none absolute top-1 left-[34%] w-1.5 h-1.5 rounded-full bg-[#F59E0B]"
            style={{ '--ember-x': '-4px' } as React.CSSProperties}
          />
          <span
            className="streak-ember-delay pointer-events-none absolute top-1.5 right-[28%] w-1 h-1 rounded-full bg-[#FBBF24]"
            style={{ '--ember-x': '4px' } as React.CSSProperties}
          />
        </>
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className={active ? 'streak-flame-outer' : ''}
      >
        <defs>
          <linearGradient id={outerId} x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={active ? '#FBBF24' : '#D1D5DB'} />
            <stop offset="55%" stopColor={active ? '#F59E0B' : '#9CA3AF'} />
            <stop offset="100%" stopColor={active ? '#EA580C' : '#9CA3AF'} />
          </linearGradient>
          <linearGradient id={innerId} x1="16" y1="12" x2="16" y2="27" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={active ? '#FEF3C7' : '#E5E7EB'} />
            <stop offset="100%" stopColor={active ? '#FDE68A' : '#D1D5DB'} />
          </linearGradient>
        </defs>

        {/* Outer flame body */}
        <path
          d="M16.6 3.4C16.2 2.8 15.3 3.1 15.2 3.8C14.7 7.6 12.6 9.8 10.6 12.1C8.3 14.7 6.8 17.3 6.8 20.4C6.8 25.3 10.9 29 16 29C21.1 29 25.2 25.3 25.2 20.4C25.2 15.4 22.1 11.4 19.6 8.3C18.4 6.8 17.4 5 16.6 3.4Z"
          fill={`url(#${outerId})`}
        />

        {/* Inner golden core */}
        <path
          className={active ? 'streak-flame-inner' : ''}
          d="M16.1 13.6C15.9 13.2 15.3 13.4 15.2 13.9C14.9 16.1 13.6 17.4 12.6 18.8C11.7 20.1 11.4 21.3 11.4 22.6C11.4 25.3 13.5 27.2 16 27.2C18.5 27.2 20.6 25.3 20.6 22.6C20.6 19.8 18.8 17.6 17.4 15.8C16.9 15.1 16.4 14.3 16.1 13.6Z"
          fill={`url(#${innerId})`}
        />
      </svg>
    </div>
  )
}

interface StreakCelebrationProps {
  isOpen: boolean
  streakDays: number
  last7DaysActive: boolean[]
  onClose: () => void
}

const SPARKS: { x: string; y: string; color: string; size: string }[] = [
  { x: '-46px', y: '-34px', color: '#F59E0B', size: 'w-2 h-2' },
  { x: '48px', y: '-30px', color: '#14B8A6', size: 'w-2 h-2' },
  { x: '-56px', y: '4px', color: '#8BA0F3', size: 'w-1.5 h-1.5' },
  { x: '54px', y: '8px', color: '#FBBF24', size: 'w-1.5 h-1.5' },
  { x: '-26px', y: '-52px', color: '#14B8A6', size: 'w-1.5 h-1.5' },
  { x: '28px', y: '-50px', color: '#F59E0B', size: 'w-2 h-2' },
]

const DAY_SHORTS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function getLast7DayLabels(): string[] {
  const labels: string[] = []
  for (let offset = -6; offset <= 0; offset++) {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    labels.push(DAY_SHORTS[d.getDay()])
  }
  return labels
}

export const StreakCelebration: React.FC<StreakCelebrationProps> = ({
  isOpen,
  streakDays,
  last7DaysActive,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const dayLabels = getLast7DayLabels()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/45 backdrop-blur-[4px] p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Perayaan streak istiqamah"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[340px] bg-white rounded-[28px] p-6 text-center shadow-[0_20px_50px_rgba(16,24,40,0.22)] relative overflow-hidden view-enter"
      >
        {/* Subtle warm ambient tint at top */}
        <div className="absolute -top-16 inset-x-0 h-40 bg-gradient-to-b from-[#F59E0B]/15 to-transparent pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-black/[0.05] text-[#525252] hover:text-[#101828] flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>

        {/* Igniting Flame Emblem with burst ring & sparkles */}
        <div className="relative mx-auto mt-2 w-24 h-24 flex items-center justify-center">
          {/* Expanding ring wave */}
          <span className="streak-ring-burst pointer-events-none absolute inset-1 rounded-full border-2 border-[#F59E0B]/50 opacity-0" />

          {/* Radiating subtle sparkles */}
          {SPARKS.map((sp, i) => (
            <span
              key={i}
              className={`streak-spark pointer-events-none absolute rounded-full opacity-0 ${sp.size}`}
              style={
                {
                  backgroundColor: sp.color,
                  '--spark-x': sp.x,
                  '--spark-y': sp.y,
                } as React.CSSProperties
              }
            />
          ))}

          {/* Soft amber medallion */}
          <div className="streak-ignite w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A]/70 border border-[#F59E0B]/25 shadow-[0_8px_24px_rgba(245,158,11,0.22)] flex items-center justify-center">
            <AnimatedFlame active size={52} showEmbers />
          </div>
        </div>

        {/* Streak Count */}
        <div className="mt-4 streak-count-roll">
          <div className="inline-flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold text-[#101828] tabular-nums leading-none">
              {streakDays}
            </span>
            <span className="text-base font-bold text-[#F59E0B]">hari beruntun</span>
          </div>
          <p className="text-xs font-medium text-[#525252] mt-1.5 leading-relaxed">
            {last7DaysActive[last7DaysActive.length - 1]
              ? 'MasyaAllah, amal hari ini sudah tercatat. Amalan terbaik adalah yang konsisten meski sedikit.'
              : 'Jangan putus rantai kebaikanmu — centang minimal 1 amal hari ini untuk menjaga streak.'}
          </p>
        </div>

        {/* 7-day consistency strip */}
        <div className="mt-5 p-3 rounded-2xl bg-[#F7F9FF] border border-[#0F50BD]/10">
          <div className="grid grid-cols-7 gap-1.5">
            {last7DaysActive.map((active, idx) => {
              const isToday = idx === last7DaysActive.length - 1
              return (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <span
                    className={`text-[10px] font-semibold ${
                      isToday ? 'text-[#0F50BD] font-bold' : 'text-[#525252]/75'
                    }`}
                  >
                    {dayLabels[idx]}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      active
                        ? isToday
                          ? 'bg-gradient-to-br from-[#0F50BD] to-[#14B8A6] text-white shadow-[0_3px_10px_rgba(15,80,189,0.3)] streak-check-pop'
                          : 'bg-[#0F50BD] text-white'
                        : isToday
                        ? 'border-2 border-dashed border-[#0F50BD]/40 bg-white'
                        : 'bg-black/[0.07]'
                    }`}
                  >
                    {active && <Check size={13} strokeWidth={3.2} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 py-3 px-5 rounded-full bg-[#0F50BD] text-white text-sm font-bold hover:bg-[#1941B5] shadow-[0_6px_18px_rgba(15,80,189,0.28)] active:scale-[0.98] transition-all cursor-pointer"
        >
          Alhamdulillah
        </button>
      </div>
    </div>
  )
}
