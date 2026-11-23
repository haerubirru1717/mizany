import React from 'react'
import { TabKey } from '../types'
import { BookOpen, Sparkles, Calendar, Flame, ArrowRight } from 'lucide-react'
import { MosqueSkyline } from './MosqueSkyline'

interface QuickActionsProps {
  streakDays: number
  last7DaysActive: boolean[]
  onNavigate: (tab: TabKey) => void
  onScrollToChecklist: () => void
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  streakDays,
  last7DaysActive,
  onNavigate,
  onScrollToChecklist,
}) => {
  return (
    <div className="space-y-4 mt-5">
      {/* 3 Quick Action Tiles */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('quran')}
          className="glass-card p-3.5 flex flex-col items-center justify-center gap-2 hover:bg-white transition-all cursor-pointer group shadow-sm active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#0F50BD]/10 text-[#0F50BD] flex items-center justify-center group-hover:scale-105 transition-transform">
            <BookOpen size={22} strokeWidth={2} />
          </div>
          <span className="text-xs font-bold text-[#101828]">Quran</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('tasbih')}
          className="glass-card p-3.5 flex flex-col items-center justify-center gap-2 hover:bg-white transition-all cursor-pointer group shadow-sm active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#0F50BD]/10 text-[#0F50BD] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles size={22} strokeWidth={2} />
          </div>
          <span className="text-xs font-bold text-[#101828]">Tasbih</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('kalender')}
          className="glass-card p-3.5 flex flex-col items-center justify-center gap-2 hover:bg-white transition-all cursor-pointer group shadow-sm active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#0F50BD]/10 text-[#0F50BD] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Calendar size={22} strokeWidth={2} />
          </div>
          <span className="text-xs font-bold text-[#101828]">Kalender</span>
        </button>
      </div>

      {/* Tracker Call-to-Action Banner */}
      <button
        type="button"
        onClick={onScrollToChecklist}
        className="w-full relative overflow-hidden bg-gradient-to-r from-[#0F50BD] to-[#1941B5] text-white p-4 rounded-2xl flex items-center gap-3.5 text-left shadow-[0_6px_20px_rgba(25,65,181,0.18)] cursor-pointer group active:scale-[0.99] transition-all"
      >
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-20 w-48 h-auto">
          <MosqueSkyline className="w-full h-auto" />
        </div>

        <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center text-[#F59E0B] shrink-0">
          <Sparkles size={20} fill="currentColor" />
        </div>

        <div className="flex-1 relative z-10">
          <div className="text-[14px] font-bold leading-tight">Catat sholatmu setiap hari</div>
          <div className="text-[12px] text-white/80 mt-0.5">Centang checklist amal hari ini di bawah</div>
        </div>

        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0 group-hover:translate-x-1 transition-transform">
          <ArrowRight size={16} strokeWidth={2.5} />
        </div>
      </button>

      {/* Streak Card */}
      <div className="glass-card p-4 flex items-center gap-3.5" aria-label="Streak konsistensi">
        <div className="w-11 h-11 rounded-2xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center shrink-0">
          <Flame size={24} strokeWidth={2.2} />
        </div>

        <div className="flex-1">
          <div className="text-[15px] font-bold text-[#101828] leading-tight">
            {streakDays > 0 ? `${streakDays} hari beruntun` : 'Mulai hari ini'}
          </div>
          <div className="text-[12px] text-[#525252] mt-0.5">
            {streakDays > 0
              ? 'Checklist amal tercatat konsisten'
              : 'Centang minimal 1 amal untuk mulai streak'}
          </div>
        </div>

        {/* 7 dots for the last 7 real days */}
        <div className="flex items-center gap-1.5 shrink-0" aria-label="7 hari terakhir">
          {last7DaysActive.map((active, idx) => {
            const isTodayDot = idx === last7DaysActive.length - 1
            return (
              <span
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  active
                    ? isTodayDot
                      ? 'bg-[#0F50BD] ring-2 ring-[#0F50BD]/30'
                      : 'bg-[#0F50BD]'
                    : isTodayDot
                    ? 'bg-black/15 ring-2 ring-[#0F50BD]/20'
                    : 'bg-black/10'
                }`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
