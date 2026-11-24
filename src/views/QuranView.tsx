import React, { useState, useEffect } from 'react'
import { Plus, Minus, Bookmark, Link2, Check } from 'lucide-react'
import { MosqueSkyline } from '../components/MosqueSkyline'

interface QuranViewProps {
  dailyTarget: number
  pagesReadToday: number
  totalPagesRead: number
  hijriDateLabel?: string
  linkedAmalName?: string
  onChangePagesToday: (nextPages: number) => void
  onChangeDailyTarget?: (nextTarget: number) => void
  onAddToChecklist?: () => void
}

const TOTAL_MUSHAF_PAGES = 604
const TARGET_PRESETS = [4, 10, 20]

export const QuranView: React.FC<QuranViewProps> = ({
  dailyTarget,
  pagesReadToday,
  totalPagesRead,
  hijriDateLabel,
  linkedAmalName,
  onChangePagesToday,
  onChangeDailyTarget,
  onAddToChecklist,
}) => {
  const [lastReadNote, setLastReadNote] = useState<string>('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mizany_last_read_quran')
      if (saved) setLastReadNote(saved)
    } catch {}
  }, [])

  const handleSaveLastRead = (value: string) => {
    setLastReadNote(value)
    try {
      localStorage.setItem('mizany_last_read_quran', value)
    } catch {}
  }

  const khatamCycle = Math.floor(totalPagesRead / TOTAL_MUSHAF_PAGES) + 1
  const pagesInCurrentCycle = totalPagesRead % TOTAL_MUSHAF_PAGES
  const displayPages =
    totalPagesRead > 0 && pagesInCurrentCycle === 0 ? TOTAL_MUSHAF_PAGES : pagesInCurrentCycle
  const completedJuz = Number((displayPages / (TOTAL_MUSHAF_PAGES / 30)).toFixed(1))
  const khatamPercent = Math.min(100, Math.round((displayPages / TOTAL_MUSHAF_PAGES) * 100))
  const todayPercent =
    dailyTarget > 0 ? Math.min(100, Math.round((pagesReadToday / dailyTarget) * 100)) : 0
  const reachedTargetToday = pagesReadToday >= dailyTarget

  return (
    <div className="space-y-4 pb-28">
      {/* Page Title */}
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <div>
          <h1 className="text-xl font-extrabold text-[#101828] tracking-tight">
            Qur&apos;an &amp; Tilawah
          </h1>
          <p className="text-xs text-[#475467] mt-0.5">
            Pantau bacaan harian dan progres khatam
          </p>
        </div>
        {hijriDateLabel && (
          <span className="text-xs font-semibold text-[#0F50BD] shrink-0">{hijriDateLabel}</span>
        )}
      </div>

      {/* Rich Tazkirah Blue Khatam Progress Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F50BD] to-[#1941B5] text-white p-5 rounded-[22px] shadow-[0_8px_24px_rgba(25,65,181,0.2)]">
        <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-20">
          <MosqueSkyline className="w-full h-auto max-h-[84px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
              {completedJuz}{' '}
              <span className="text-base font-semibold text-[#DBEAFE]">/ 30 Juz</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/18 border border-white/25 text-white text-xs font-bold tabular-nums">
              {khatamCycle > 1 ? `Khatam ke-${khatamCycle} · ` : ''}
              {khatamPercent}%
            </span>
          </div>

          <p className="text-xs text-[#DBEAFE] font-medium mt-1 tabular-nums">
            {displayPages} dari {TOTAL_MUSHAF_PAGES} halaman Mushaf
          </p>

          <div className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden mt-3.5">
            <div
              className="h-full bg-gradient-to-r from-[#5EEAD4] to-[#14B8A6] rounded-full transition-all duration-300"
              style={{ width: `${khatamPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today's Tilawah Stepper */}
      <div className="glass-card p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-bold text-[#101828]">Tilawah Hari Ini</h2>
          <span className="text-xs font-semibold text-[#475467] tabular-nums">
            Target <span className="text-[#0F50BD] font-bold">{dailyTarget} hal</span> ({todayPercent}%)
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 py-5">
          <button
            type="button"
            onClick={() => onChangePagesToday(Math.max(0, pagesReadToday - 1))}
            disabled={pagesReadToday <= 0}
            className="w-12 h-12 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center text-[#334155] hover:bg-[#EEF2F6] disabled:opacity-35 active:scale-95 transition-all cursor-pointer"
            aria-label="Kurangi 1 halaman"
          >
            <Minus size={20} strokeWidth={2.5} />
          </button>

          <div className="text-center min-w-[110px]">
            <div className="text-4xl font-extrabold text-[#0F50BD] tabular-nums leading-none">
              {pagesReadToday}
            </div>
            <div className="text-xs font-medium text-[#475467] mt-1.5">halaman selesai</div>
          </div>

          <button
            type="button"
            onClick={() => onChangePagesToday(pagesReadToday + 1)}
            className="w-12 h-12 rounded-2xl bg-[#0F50BD] text-white shadow-[0_4px_12px_rgba(15,80,189,0.28)] flex items-center justify-center hover:bg-[#1941B5] active:scale-95 transition-all cursor-pointer"
            aria-label="Tambah 1 halaman"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Quick increment & safe target button */}
        <div className="grid grid-cols-3 gap-2 pt-3.5 border-t border-[#EEF2F6]">
          <button
            type="button"
            onClick={() => onChangePagesToday(pagesReadToday + 5)}
            className="min-h-[40px] py-2 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#334155] hover:bg-[#E2E8F0] cursor-pointer transition-colors"
          >
            +5 Hal
          </button>
          <button
            type="button"
            onClick={() => onChangePagesToday(pagesReadToday + 10)}
            className="min-h-[40px] py-2 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#334155] hover:bg-[#E2E8F0] cursor-pointer transition-colors"
          >
            +10 Hal
          </button>
          <button
            type="button"
            onClick={() => onChangePagesToday(Math.max(pagesReadToday, dailyTarget))}
            disabled={reachedTargetToday}
            className={`min-h-[40px] py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              reachedTargetToday
                ? 'bg-[#ECFDF5] text-[#0F766E] cursor-default'
                : 'bg-[#EFF6FF] text-[#0F50BD] hover:bg-[#DBEAFE]'
            }`}
          >
            {reachedTargetToday && <Check size={14} strokeWidth={2.8} aria-hidden="true" />}
            <span>{reachedTargetToday ? 'Tercapai' : 'Capai Target'}</span>
          </button>
        </div>

        {/* Inline daily target selector */}
        {onChangeDailyTarget && (
          <div className="mt-3.5 pt-3.5 border-t border-[#EEF2F6] flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#475467]">Target harian</span>
            <div className="flex items-center gap-1.5">
              {TARGET_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeDailyTarget(preset)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums cursor-pointer transition-colors ${
                    dailyTarget === preset
                      ? 'bg-[#0F50BD] text-white'
                      : 'bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {preset} hal
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Penanda Terakhir Dibaca */}
      <div className="glass-card p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#0F50BD] flex items-center justify-center shrink-0">
          <Bookmark size={20} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <label htmlFor="last-read-input" className="text-xs font-semibold text-[#475467] block">
            Penanda terakhir dibaca
          </label>
          <input
            id="last-read-input"
            type="text"
            value={lastReadNote}
            onChange={(e) => handleSaveLastRead(e.target.value)}
            placeholder="Mis. Al-Baqarah : 183"
            maxLength={60}
            className="w-full mt-1 text-sm font-bold text-[#101828] bg-transparent border-b border-transparent focus:border-[#0F50BD] focus:outline-none placeholder:font-normal placeholder:text-[#667085]"
          />
        </div>
      </div>

      {/* Checklist link status */}
      {linkedAmalName ? (
        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#0F766E] bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl px-3.5 py-2.5">
          <Link2 size={14} className="shrink-0" aria-hidden="true" />
          <span>
            Tercatat otomatis ke checklist: <b>{linkedAmalName}</b>
          </span>
        </div>
      ) : (
        <div className="glass-card p-4 flex items-center justify-between gap-3">
          <p className="text-xs text-[#475467] leading-relaxed">
            Bacaan otomatis masuk progres khatam &amp; streak. Tampilkan juga di Checklist Beranda?
          </p>
          {onAddToChecklist && (
            <button
              type="button"
              onClick={onAddToChecklist}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#EFF6FF] text-[#0F50BD] text-xs font-bold hover:bg-[#DBEAFE] shrink-0 cursor-pointer transition-colors"
            >
              + Checklist
            </button>
          )}
        </div>
      )}
    </div>
  )
}
