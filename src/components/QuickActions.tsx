import React from 'react'
import { TabKey } from '../types'
import { BookOpen, CircleDot, Calendar } from 'lucide-react'
import { AnimatedFlame } from './StreakCelebration'

interface QuickActionsProps {
  streakDays: number
  last7DaysActive: boolean[]
  onNavigate?: (tab: TabKey) => void
  onScrollToChecklist: () => void
  onOpenStreak?: () => void
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  streakDays,
  last7DaysActive,
  onNavigate,
  onScrollToChecklist,
  onOpenStreak,
}) => {
  const isStreakActive = streakDays > 0

  return (
    <div className="space-y-3.5">
      {/* 3 Plush Quick Action Tiles */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onNavigate?.('quran')}
          className="glass-card p-3.5 flex flex-col items-center justify-center gap-2 hover:border-[#0F50BD]/25 transition-all cursor-pointer group active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#0F50BD] flex items-center justify-center group-hover:scale-105 transition-transform">
            <BookOpen size={21} strokeWidth={2} aria-hidden="true" />
          </div>
          <span className="text-xs font-bold text-[#101828]">Qur&apos;an</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('tasbih')}
          className="glass-card p-3.5 flex flex-col items-center justify-center gap-2 hover:border-[#0F50BD]/25 transition-all cursor-pointer group active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#0F50BD] flex items-center justify-center group-hover:scale-105 transition-transform">
            <CircleDot size={21} strokeWidth={2} aria-hidden="true" />
          </div>
          <span className="text-xs font-bold text-[#101828]">Tasbih</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate?.('kalender')}
          className="glass-card p-3.5 flex flex-col items-center justify-center gap-2 hover:border-[#0F50BD]/25 transition-all cursor-pointer group active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#0F50BD] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Calendar size={21} strokeWidth={2} aria-hidden="true" />
          </div>
          <span className="text-xs font-bold text-[#101828]">Kalender</span>
        </button>
      </div>

      {/* Plush Streak Card (no truncation on 390px) */}
      <button
        type="button"
        onClick={() => (isStreakActive && onOpenStreak ? onOpenStreak() : onScrollToChecklist())}
        className={`w-full glass-card p-4 flex items-center gap-3.5 text-left cursor-pointer active:scale-[0.99] transition-all ${
          isStreakActive ? 'border-[#FDE68A]' : 'hover:border-[#0F50BD]/20'
        }`}
        aria-label={
          isStreakActive
            ? `Streak istiqamah ${streakDays} hari beruntun — ketuk untuk melihat detail`
            : 'Mulai streak hari ini — ketuk menuju checklist amal'
        }
      >
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            isStreakActive
              ? 'bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A]/70 ring-1 ring-[#F59E0B]/25'
              : 'bg-[#F1F5F9]'
          }`}
        >
          <AnimatedFlame active={isStreakActive} size={26} showEmbers={isStreakActive} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold text-[#101828] leading-tight">
            {isStreakActive ? `${streakDays} hari beruntun` : 'Mulai hari ini'}
          </div>
          <div className="text-xs text-[#475467] mt-0.5 leading-snug">
            {isStreakActive ? 'Istiqamah tercatat' : 'Centang 1 amal untuk mulai'}
          </div>
        </div>

        {/* 7 dots for the last 7 real days */}
        <div className="flex items-center gap-1.5 shrink-0" aria-label="7 hari terakhir">
          {last7DaysActive.map((active, idx) => {
            const isTodayDot = idx === last7DaysActive.length - 1
            return (
              <span key={idx} className="relative inline-flex items-center justify-center w-2.5 h-2.5">
                {active && isTodayDot && (
                  <span className="streak-dot-pulse absolute inset-0 rounded-full bg-[#0F50BD]" />
                )}
                <span
                  className={`relative w-2.5 h-2.5 rounded-full transition-colors ${
                    active
                      ? isTodayDot
                        ? 'bg-gradient-to-br from-[#0F50BD] to-[#14B8A6] ring-2 ring-[#0F50BD]/25'
                        : 'bg-[#0F50BD]'
                      : isTodayDot
                      ? 'bg-[#CBD5E1] ring-2 ring-[#0F50BD]/20'
                      : 'bg-[#E2E8F0]'
                  }`}
                />
              </span>
            )
          })}
        </div>
      </button>
    </div>
  )
}
