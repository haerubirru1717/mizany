import React from 'react'
import { TabKey } from '../types'
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
  onScrollToChecklist,
  onOpenStreak,
}) => {
  const isStreakActive = streakDays > 0

  return (
    <button
      type="button"
      onClick={() => (isStreakActive && onOpenStreak ? onOpenStreak() : onScrollToChecklist())}
      className="w-full glass-card px-3.5 py-3 flex items-center gap-3 text-left cursor-pointer hover:border-[#CBD5E1] active:scale-[0.99] transition-all"
      aria-label={
        isStreakActive
          ? `Streak istiqamah ${streakDays} hari beruntun — ketuk untuk melihat detail`
          : 'Mulai streak hari ini — ketuk menuju checklist amal'
      }
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isStreakActive ? 'bg-[#FEF3C7]' : 'bg-[#F1F5F9]'
        }`}
      >
        <AnimatedFlame active={isStreakActive} size={23} showEmbers={isStreakActive} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-[#101828] leading-tight">
          {isStreakActive ? `${streakDays} hari beruntun` : 'Mulai hari ini'}
        </div>
        <div className="text-xs text-[#475467] mt-0.5 leading-tight">
          {isStreakActive ? 'Istiqamah tercatat' : 'Centang 1 amal untuk mulai'}
        </div>
      </div>

      {/* 7-day consistency dots */}
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
                      ? 'bg-[#0F50BD] ring-2 ring-[#0F50BD]/25'
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
  )
}
